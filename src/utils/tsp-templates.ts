import type { TableModel } from "./schema-parser.js";

export function defaultRailsTspTemplate(models: TableModel[] = []): string {
  const modelDefinitions = models
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

  return `import "@typespec/http";
import "@typespec/openapi3";
using TypeSpec.Http;

@service({ title: "Rails API" })
@server("http://localhost:3000", "api")
@route("/api/v1")
namespace Api {
${models.length > 0 ? modelDefinitions : "  // TODO: Extend this file in future."}
}
`;
}
