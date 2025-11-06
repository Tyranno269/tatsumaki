import { formatModelDefinitions } from "./modelFormatter.js";
import type { TableModel } from "./schemaParser.js";

export function defaultRailsTspTemplate(models: TableModel[] = []): string {
  const modelDefinitions = formatModelDefinitions(models);

  return `import "@typespec/http";
import "@typespec/openapi3";
using TypeSpec.Http;

@service(#{ title: "Rails API" })
@server("http://localhost:3000", "api")
@route("/api/v1")
namespace Api {
${models.length > 0 ? modelDefinitions : "  // TODO: Extend this file in future."}
}
`;
}
