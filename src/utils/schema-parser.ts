export interface TableModel {
  name: string;
  comment?: string;
  fields: Field[];
}

export interface Field {
  name: string;
  type: string;
  nullable: boolean;
  comment?: string;
}

export function parseSchema(content: string): TableModel[] {
  const models: TableModel[] = [];
  const tableRegex = /create_table\s+"([^"]+)"([\s\S]*?)do\s*\|t\|([\s\S]*?)end/gm;

  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const [, tableName, attrs, tableBody] = match;
    const comment = /comment:\s*"([^"]*)"/.exec(attrs)?.[1];
    const modelName = toPascal(singularize(tableName));

    const fields = parseFields(tableBody);

    // Add implicit primary key if not disabled
    const idDisabled = /\bid:\s*false\b/.test(attrs);
    const pkTypeInAttrs = /id:\s*:(\w+)/.exec(attrs)?.[1];
    const pkType = pkTypeInAttrs ?? "bigint";

    if (!idDisabled && !fields.some((f) => f.name === "id")) {
      fields.unshift({
        name: "id",
        type: mapRailsType(pkType),
        nullable: false,
      });
    }

    models.push({
      name: modelName,
      comment: comment || undefined,
      fields,
    });
  }

  return models;
}

function parseFields(tableBody: string): Field[] {
  const fields: Field[] = [];
  const lines = tableBody.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (/t\.timestamps\b/.test(trimmed)) {
      fields.push(...parseTimestamps(trimmed));
      continue;
    }

    const fieldMatch = /t\.(\w+)\s+"([^"]+)"(.*)/.exec(trimmed);
    if (!fieldMatch) continue;

    const [, type, name, rest] = fieldMatch;

    if (type === "references" || type === "belongs_to") {
      fields.push(parseReference(name, rest));
    } else {
      fields.push(parseColumn(type, name, rest));
    }
  }

  return fields;
}

function parseTimestamps(line: string): Field[] {
  const nullable = /null:\s*false/.test(line) ? false : true;
  return [
    { name: "created_at", type: "utcDateTime", nullable },
    { name: "updated_at", type: "utcDateTime", nullable },
  ];
}

function parseReference(name: string, rest: string): Field {
  const nullMatch = /null:\s*(true|false)/.exec(rest);
  const nullable = nullMatch ? nullMatch[1] === "true" : true;

  const refType = /type:\s*:(\w+)/.exec(rest)?.[1];
  const fieldType = refType ? mapRailsType(refType) : mapRailsType("references");

  const commentMatch = /comment:\s*"([^"]*)"/.exec(rest);
  const baseComment = commentMatch?.[1];
  const comment = baseComment ? `${baseComment}; ref: ${name}` : `ref: ${name}`;

  return {
    name: `${name}_id`,
    type: fieldType,
    nullable,
    comment,
  };
}

function parseColumn(type: string, name: string, rest: string): Field {
  const nullMatch = /null:\s*(true|false)/.exec(rest);
  const nullable = nullMatch ? nullMatch[1] === "true" : true;

  const commentMatch = /comment:\s*"([^"]*)"/.exec(rest);
  let comment = commentMatch?.[1];

  // Add precision/scale for decimal
  if (type === "decimal") {
    const precisionMatch = /precision:\s*(\d+)/.exec(rest);
    const scaleMatch = /scale:\s*(\d+)/.exec(rest);
    if (precisionMatch || scaleMatch) {
      const precision = precisionMatch?.[1] || "10";
      const scale = scaleMatch?.[1] || "0";
      const precisionInfo = `precision: ${precision}, scale: ${scale}`;
      comment = comment ? `${comment} (${precisionInfo})` : precisionInfo;
    }
  }

  // Add limit info
  const limitMatch = /limit:\s*(\d+)/.exec(rest);
  if (limitMatch) {
    const limitInfo = `limit: ${limitMatch[1]}`;
    comment = comment ? `${comment} (${limitInfo})` : limitInfo;
  }

  return {
    name,
    type: mapRailsType(type),
    nullable,
    comment,
  };
}

function mapRailsType(railsType: string): string {
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

  return typeMap[railsType] || "string";
}

function singularize(word: string): string {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("sses")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function toPascal(s: string): string {
  return s
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join("");
}
