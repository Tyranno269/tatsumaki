import type { TableModel } from "./schemaParser.js";

export function formatModelDefinition(model: TableModel): string {
  const comment = model.comment ? `  // ${model.comment}\n` : "";
  const fields = model.fields
    .map((field) => {
      const fieldComment = field.comment ? ` // ${field.comment}` : "";
      const optional = field.nullable ? "?" : "";
      return `    ${field.name}${optional}: ${field.type};${fieldComment}`;
    })
    .join("\n");

  return `${comment}  model ${model.name} {\n${fields}\n  }`;
}

export function formatModelDefinitions(models: TableModel[]): string {
  return models.map(formatModelDefinition).join("\n\n");
}
