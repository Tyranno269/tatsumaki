import type { EnumDefinition } from "./enumParser.js";
import { toPascalCase } from "./enumUtils.js";

/**
 * Group enums by model name
 */
const groupEnumsByModel = (enums: EnumDefinition[]): Record<string, EnumDefinition[]> => {
  return enums.reduce(
    (acc, enumDef) => {
      if (!acc[enumDef.modelName]) {
        acc[enumDef.modelName] = [];
      }
      acc[enumDef.modelName].push(enumDef);
      return acc;
    },
    {} as Record<string, EnumDefinition[]>,
  );
};

/**
 * Generate TypeSpec enum definition
 */
const generateEnum = (enumDef: EnumDefinition): string => {
  const enumName = toPascalCase(enumDef.fieldName);
  const values = enumDef.values.map((value) => `      ${value},`).join("\n");

  return `    enum ${enumName} {
${values}
    }`;
};

/**
 * Generate TypeSpec namespace with enums for a model
 */
const generateEnumNamespace = (modelName: string, enums: EnumDefinition[]): string => {
  const enumDefinitions = enums.map(generateEnum).join("\n\n");

  return `  namespace ${modelName}Enums {
${enumDefinitions}
  }`;
};

/**
 * Generate all enum namespaces for TypeSpec
 */
export const generateEnumNamespaces = (enums: EnumDefinition[]): string => {
  if (enums.length === 0) {
    return "";
  }

  const groupedEnums = groupEnumsByModel(enums);
  const namespaces = Object.entries(groupedEnums)
    .map(([modelName, modelEnums]) => generateEnumNamespace(modelName, modelEnums))
    .join("\n\n");

  return namespaces + "\n";
};

/**
 * Get enum type for a field
 */
export const getEnumType = (
  fieldName: string,
  modelName: string,
  enums: EnumDefinition[],
): string | null => {
  const enumDef = enums.find((e) => e.modelName === modelName && e.fieldName === fieldName);

  return enumDef ? `${modelName}Enums.${toPascalCase(enumDef.fieldName)}` : null;
};
