import fg from "fast-glob";
import { promises as fs } from "fs";

import { ensureDir, fileExists, writeFileSafe, readFile } from "../utils/fs.js";
import { resolvePath } from "../utils/path.js";
import { parseSchema, type TableModel } from "../utils/schema-parser.js";
import { defaultRailsTspTemplate } from "../utils/tsp-templates.js";

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

  // Sort models alphabetically for stable output
  models.sort((a, b) => a.name.localeCompare(b.name));

  if (append && exists) {
    await appendToFile(targetPath, models);
  } else {
    const content = defaultRailsTspTemplate(models);
    if (force || !exists) {
      await fs.writeFile(targetPath, content, "utf-8");
      console.log?.(`${force && exists ? "Overwritten" : "Created"} rails.tsp at: ${targetPath}`);
    } else {
      await writeFileSafe(targetPath, content);
      console.log?.(`Created rails.tsp at: ${targetPath}`);
    }
  }
}

async function appendToFile(targetPath: string, models: TableModel[]) {
  const existing = await fs.readFile(targetPath, "utf-8");

  // Extract existing model names to avoid duplicates
  const existingModels = new Set<string>();
  const modelRegex = /model\s+(\w+)\s*{/g;
  let match;
  while ((match = modelRegex.exec(existing)) !== null) {
    existingModels.add(match[1]);
  }

  // Filter out duplicate models
  const newModels = models.filter((model) => !existingModels.has(model.name));

  if (newModels.length === 0) {
    console.log?.("No new models to append.");
    return;
  }

  // Generate append content
  const timestamp = new Date().toISOString().split("T")[0];
  const separator = `\n  // ---- appended at ${timestamp} ----`;

  const modelDefinitions = newModels
    .map((model) => {
      const comment = model.comment ? `  // ${model.comment}\n` : "";
      const fields = model.fields
        .map((field) => {
          const fieldComment = field.comment ? ` // ${field.comment}` : "";
          const optional = field.nullable ? "?" : "";
          return `    ${field.name}${optional}: ${field.type};${fieldComment}`;
        })
        .join("\n");

      return `${comment}  model ${model.name} {\n${fields}\n  }`;
    })
    .join("\n\n");

  // Insert before closing brace of namespace
  const appendContent = separator + "\n\n" + modelDefinitions;
  const updatedContent = existing.replace(/(}\s*)$/, appendContent + "\n$1");

  await fs.writeFile(targetPath, updatedContent, "utf-8");
  console.log?.(`Appended ${newModels.length} models to: ${targetPath}`);
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
