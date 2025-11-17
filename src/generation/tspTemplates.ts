import { generateEnumNamespaces } from "./enumGenerator.js";
import { formatModelDefinitions } from "./modelFormatter.js";
import type { EnumDefinition } from "../parsing/enumParser.js";
import type { TableModel } from "../parsing/schemaParser.js";

export function defaultRailsTspTemplate(
  models: TableModel[] = [],
  enums: EnumDefinition[] = [],
): string {
  const enumNamespaces = generateEnumNamespaces(enums);
  const modelDefinitions = formatModelDefinitions(models, enums);

  return `import "@typespec/http";
import "@typespec/openapi3";
using TypeSpec.Http;

@service(#{ title: "Rails API" })
@server("http://localhost:3000", "api")
@route("/api/v1")
namespace Api {
${enumNamespaces}${models.length > 0 ? modelDefinitions : "  // TODO: Extend this file in future."}
}
`;
}
