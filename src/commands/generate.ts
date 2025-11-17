import fg from "fast-glob";
import { promises as fs } from "fs";

import { parseRelevantRailsEnums } from "../discovery/modelFinder.js";
import { formatModelDefinitions } from "../generation/modelFormatter.js";
import { defaultRailsTspTemplate } from "../generation/tspTemplates.js";
import type { EnumDefinition } from "../parsing/enumParser.js";
import { parseSchema, type TableModel } from "../parsing/schemaParser.js";
import { ensureDir, fileExists, writeFileSafe, readFile } from "../utils/fs.js";
import { resolvePath } from "../utils/path.js";

type GenerateOptions = {
  cwd: string;
  force?: boolean;
  append?: boolean;
  out?: string;
};

export async function generateRailsTsp({
  cwd,
  force = false,
  append = false,
  out = "rails.tsp",
}: GenerateOptions) {
  const targetPath = resolvePath(cwd, out);

  await ensureDir(cwd);

  const exists = await fileExists(targetPath);

  // Handle existing file based on options
  if (exists && !force && !append) {
    throw new Error("Output file already exists. Use --force to overwrite or --append to append.");
  }

  // Find schema.rb
  const schemaPath = await findSchemaRb(cwd);
  if (!schemaPath) {
    throw new Error("rails schema.rb not found");
  }

  const schemaContent = await readFile(schemaPath);
  const models = parseSchema(schemaContent);

  // Extract table names from schema.rb
  const tableNames = models.map((model) => model.tableName);

  // Parse Rails model files for enum definitions (only for relevant tables)
  const projectRoot = schemaPath.replace(/\/db\/schema\.rb$/, "");
  const enums = await parseRelevantRailsEnums(projectRoot, tableNames);

  // Sort models alphabetically for stable output
  models.sort((a, b) => a.name.localeCompare(b.name));

  if (append && exists) {
    await appendToFile(targetPath, models, enums);
  } else {
    const content = defaultRailsTspTemplate(models, enums);
    if (force || !exists) {
      await fs.writeFile(targetPath, content, "utf-8");
      console.log?.(`${force && exists ? "Overwritten" : "Created"} rails.tsp at: ${targetPath}`);
    } else {
      await writeFileSafe(targetPath, content);
      console.log?.(`Created rails.tsp at: ${targetPath}`);
    }
  }
}

async function appendToFile(targetPath: string, models: TableModel[], enums: EnumDefinition[]) {
  const existing = await fs.readFile(targetPath, "utf-8");

  const existingModels = extractExistingModels(existing);
  const newModels = models.filter((model) => !existingModels.has(model.name));

  if (newModels.length === 0) {
    console.log?.("No new models to append.");
    return;
  }

  const appendContent = generateAppendContent(newModels, enums);
  const updatedContent = existing.replace(/(}\s*)$/, appendContent + "\n$1");

  await fs.writeFile(targetPath, updatedContent, "utf-8");
  console.log?.(`Appended ${newModels.length} models to: ${targetPath}`);
}

function extractExistingModels(content: string): Set<string> {
  const existingModels = new Set<string>();
  const modelRegex = /model\s+(\w+)\s*{/g;
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    existingModels.add(match[1]);
  }
  return existingModels;
}

function generateAppendContent(models: TableModel[], enums: EnumDefinition[]): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const separator = `\n  // ---- appended at ${timestamp} ----`;
  const modelDefinitions = formatModelDefinitions(models, enums);

  return separator + "\n\n" + modelDefinitions;
}

async function findSchemaRb(cwd: string): Promise<string | null> {
  // Priority paths
  const priorityPaths = ["../backend/db/schema.rb", "../api/db/schema.rb"];

  for (const path of priorityPaths) {
    const fullPath = resolvePath(cwd, path);
    if (await fileExists(fullPath)) {
      return fullPath;
    }
  }

  // Glob search
  const patterns = ["../**/db/schema.rb", "../../**/db/schema.rb"];

  for (const pattern of patterns) {
    const matches = await fg(pattern, {
      cwd,
      ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"],
      absolute: true,
    });

    if (matches.length > 0) {
      return matches[0];
    }
  }

  return null;
}
