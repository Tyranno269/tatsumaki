import type { TableModel } from "./schemaParser.js";

export function formatModelDefinition(model: TableModel): string {
  const tableComment = model.comment ? `  /** ${model.comment} */\n` : "";
  const fields = model.fields
    .map((field) => {
      const fieldDescription = field.description ? `    /** ${field.description} */\n` : "";
      const fieldType = field.nullable ? `${field.type} | null` : field.type;
      const metadataComment = field.metadata ? ` // ${field.metadata}` : "";
      const fieldLine = `    ${field.name}: ${fieldType};${metadataComment}`;
      return fieldDescription + fieldLine;
    })
    .join("\n");

  return `${tableComment}  model ${model.name} {\n${fields}\n  }`;
}

export function formatModelDefinitions(models: TableModel[]): string {
  return models.map(formatModelDefinition).join("\n\n");
}
