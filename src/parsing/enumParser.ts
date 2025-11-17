import { parseHashContent, parseArrayContent, toPascalCase } from "../utils/enumUtils.js";

export interface EnumDefinition {
  fieldName: string;
  values: string[];
  modelName: string;
}

export interface EnumField {
  name: string;
  enumType: string;
  modelName: string;
}

/**
 * Extract enum values from hash format (with do block support)
 */
const extractHashEnum = (line: string, lines: string[], startIndex: number): string[] => {
  let content = line;
  let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

  let i = startIndex + 1;
  while (braceCount > 0 && i < lines.length) {
    const nextLine = lines[i];
    content += " " + nextLine.trim();
    braceCount += (nextLine.match(/\{/g) || []).length - (nextLine.match(/\}/g) || []).length;

    if (nextLine.includes("} do")) {
      break;
    }
    i++;
  }

  const hashMatch = content.match(/\{([^}]+)\}/);
  return hashMatch ? parseHashContent(hashMatch[1]) : [];
};

/**
 * Extract enum values from array format
 */
const extractArrayEnum = (line: string, lines: string[], startIndex: number): string[] => {
  let content = line;
  let bracketCount = (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;

  let i = startIndex + 1;
  while (bracketCount > 0 && i < lines.length) {
    const nextLine = lines[i];
    content += " " + nextLine.trim();
    bracketCount += (nextLine.match(/\[/g) || []).length - (nextLine.match(/\]/g) || []).length;
    i++;
  }

  const arrayMatch = content.match(/\[([^\]]+)\]/);
  return arrayMatch ? parseArrayContent(arrayMatch[1]) : [];
};

/**
 * Extract enum values from %i format
 */
const extractPercentIEnum = (line: string): string[] => {
  const match = line.match(/%i\(([^)]+)\)/);
  if (!match) return [];

  return match[1]
    .trim()
    .split(/\s+/)
    .filter((item) => item.length > 0);
};

/**
 * Extract enum values from keyword argument format
 */
const extractKeywordEnum = (line: string): string[] => {
  const afterComma = line.split(",").slice(1).join(",").trim();

  if (afterComma.includes("{") || afterComma.includes("[") || afterComma.includes("%i(")) {
    return [];
  }

  return parseHashContent(afterComma);
};

/**
 * Extract enum values based on format
 */
const extractEnumValues = (line: string, lines: string[], startIndex: number): string[] => {
  if (line.includes("{")) {
    return extractHashEnum(line, lines, startIndex);
  }
  if (line.includes("[")) {
    return extractArrayEnum(line, lines, startIndex);
  }
  if (line.includes("%i(")) {
    return extractPercentIEnum(line);
  }
  return extractKeywordEnum(line);
};

/**
 * Parse Rails model content for enum definitions
 */
export const parseRailsEnums = (modelContent: string, modelName: string): EnumDefinition[] => {
  const lines = modelContent.split("\n");
  const enums: EnumDefinition[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const enumMatch = line.match(/enum\s+:(\w+),\s*/);

    if (enumMatch) {
      const fieldName = enumMatch[1];
      const values = extractEnumValues(line, lines, i);

      if (values.length > 0) {
        enums.push({ fieldName, values, modelName });
      }
    }
  }

  return enums;
};

/**
 * Get model name from file path
 */
export const getModelNameFromPath = (filePath: string): string => {
  const fileName = filePath.split("/").pop() || "";
  const baseName = fileName.replace(".rb", "");
  return toPascalCase(baseName);
};
