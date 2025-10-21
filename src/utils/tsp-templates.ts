export function defaultRailsTspTemplate(): string {
  return `import "@typespec/http";
import "@typespec/openapi3";
using TypeSpec.Http;

@service({ title: "Rails API" })
@server("http://localhost:3000", "api")
@route("/api/v1")
namespace Api {
  // TODO: Extend this file in future.
}
`;
}
