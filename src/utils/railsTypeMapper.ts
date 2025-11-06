const typeMap: Record<string, string> = {
  string: "string",
  integer: "int32",
  bigint: "int64",
  smallint: "int32",
  decimal: "string",
  float: "float64",
  boolean: "boolean",
  datetime: "utcDateTime",
  timestamp: "utcDateTime",
  date: "plainDate",
  time: "plainTime",
  text: "string",
  json: "unknown",
  jsonb: "unknown",
  binary: "bytes",
  uuid: "string",
  inet: "string",
  cidr: "string",
  macaddr: "string",
  references: "int64",
  belongs_to: "int64",
};

export function mapRailsType(railsType: string): string {
  return typeMap[railsType] || "string";
}
