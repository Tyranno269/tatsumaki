import fg from "fast-glob";
import { readFileSync, existsSync } from "fs";

import { parseRailsEnums, getModelNameFromPath, type EnumDefinition } from "./enumParser.js";
import { singularize } from "./railsInflector.js";
import { toPascal } from "./stringUtils.js";

/**
 * Convert table name to model name
 */
const getModelNameFromTable = (tableName: string): string => {
  return toPascal(singularize(tableName));
};

/**
 * Find Rails model files in the project
 */
export const findRailsModels = async (projectRoot: string): Promise<string[]> => {
  const patterns = [
    "app/models/**/*.rb",
    "backend/app/models/**/*.rb",
    "server/app/models/**/*.rb",
    "**/app/models/**/*.rb",
  ];

  const files: string[] = [];

  for (const pattern of patterns) {
    try {
      const matches = await fg(pattern, {
        cwd: projectRoot,
        absolute: true,
        ignore: ["**/concerns/**", "**/application_record.rb"],
      });
      files.push(...matches);
    } catch {
      // Continue if pattern fails
    }
  }

  return [...new Set(files)]; // Remove duplicates
};

/**
 * Parse Rails model files for enum definitions, filtered by table names
 */
export const parseRelevantRailsEnums = async (
  projectRoot: string,
  tableNames: string[],
): Promise<EnumDefinition[]> => {
  const modelFiles = await findRailsModels(projectRoot);
  const relevantModels = new Set(tableNames.map(getModelNameFromTable));

  const allEnums: EnumDefinition[] = [];

  for (const filePath of modelFiles) {
    try {
      if (existsSync(filePath)) {
        const modelName = getModelNameFromPath(filePath);

        // Only parse models that correspond to tables in schema.rb
        if (relevantModels.has(modelName)) {
          const content = readFileSync(filePath, "utf-8");
          const enums = parseRailsEnums(content, modelName);
          allEnums.push(...enums);
        }
      }
    } catch {
      // Skip files that can't be read
      console.warn(`Warning: Could not parse model file ${filePath}`);
    }
  }

  return allEnums;
};

/**
 * Parse all Rails model files for enum definitions (legacy function)
 * @deprecated Use parseRelevantRailsEnums instead
 */
export const parseAllRailsEnums = async (projectRoot: string): Promise<EnumDefinition[]> => {
  const modelFiles = await findRailsModels(projectRoot);
  const allEnums: EnumDefinition[] = [];

  for (const filePath of modelFiles) {
    try {
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, "utf-8");
        const modelName = getModelNameFromPath(filePath);
        const enums = parseRailsEnums(content, modelName);
        allEnums.push(...enums);
      }
    } catch {
      // Skip files that can't be read
      console.warn(`Warning: Could not parse model file ${filePath}`);
    }
  }

  return allEnums;
};
