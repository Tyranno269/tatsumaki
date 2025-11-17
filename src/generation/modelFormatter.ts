import { getEnumType } from "./enumGenerator.js";
import type { EnumDefinition } from "../parsing/enumParser.js";
import type { TableModel } from "../parsing/schemaParser.js";

export function formatModelDefinition(model: TableModel, enums: EnumDefinition[] = []): string {
  const tableComment = model.comment ? `  /** ${model.comment} */\n` : "";
  const fields = model.fields
    .map((field) => {
      const fieldDescription = field.description ? `    /** ${field.description} */\n` : "";

      // Check if field has enum type
      const enumType = getEnumType(field.name, model.name, enums);
      const baseType = enumType || field.type;
      const fieldType = field.nullable ? `${baseType} | null` : baseType;

      const metadataComment = field.metadata ? ` // ${field.metadata}` : "";
      const fieldLine = `    ${field.name}: ${fieldType};${metadataComment}`;
      return fieldDescription + fieldLine;
    })
    .join("\n");

  return `${tableComment}  model ${model.name} {\n${fields}\n  }`;
}

export function formatModelDefinitions(models: TableModel[], enums: EnumDefinition[] = []): string {
  return models.map((model) => formatModelDefinition(model, enums)).join("\n\n");
}
