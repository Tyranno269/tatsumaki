export interface TableModel {
  name: string;
  comment?: string;
  primaryKey?: string;
  fields: Field[];
}

export interface Field {
  name: string;
  type: string;
  nullable: boolean;
  comment?: string;
  default?: string | number | boolean;
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

    // Handle primary key
    const idDisabled = /\bid:\s*false\b/.test(attrs);
    const customPrimaryKey = /primary_key:\s*"([^"]+)"/.exec(attrs)?.[1];
    const pkTypeInAttrs = /id:\s*:(\w+)/.exec(attrs)?.[1];
    const pkType = pkTypeInAttrs ?? "bigint";

    let primaryKey: string | undefined;

    if (!idDisabled) {
      if (customPrimaryKey) {
        // Custom single primary key
        primaryKey = customPrimaryKey;
        if (!fields.some((f) => f.name === customPrimaryKey)) {
          fields.unshift({
            name: customPrimaryKey,
            type: mapRailsType(pkType),
            nullable: false,
          });
        }
      } else if (!fields.some((f) => f.name === "id")) {
        // Default id primary key
        primaryKey = "id";
        fields.unshift({
          name: "id",
          type: mapRailsType(pkType),
          nullable: false,
        });
      }
    }

    models.push({
      name: modelName,
      comment: comment || undefined,
      primaryKey,
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

  // Check for to_table in foreign_key option
  const toTableMatch = /foreign_key:\s*{[^}]*to_table:\s*:(\w+)/.exec(rest);
  const refTable = toTableMatch?.[1] || name;

  const comment = baseComment ? `${baseComment}; ref: ${refTable}` : `ref: ${refTable}`;

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

  // Parse default values (primitive types only)
  let defaultValue: string | number | boolean | undefined;
  const defaultMatch = /default:\s*([^,\s]+)/.exec(rest);
  if (defaultMatch) {
    const defaultStr = defaultMatch[1].trim();
    if (defaultStr.startsWith('"') && defaultStr.endsWith('"')) {
      // String default
      defaultValue = defaultStr.slice(1, -1);
    } else if (defaultStr === "true" || defaultStr === "false") {
      // Boolean default
      defaultValue = defaultStr === "true";
    } else if (/^\d+(\.\d+)?$/.test(defaultStr)) {
      // Number default
      defaultValue = parseFloat(defaultStr);
    }
    // Ignore complex defaults (functions, expressions)
  }

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

  // Add default info to comment if present
  if (defaultValue !== undefined) {
    const defaultInfo = `default: ${JSON.stringify(defaultValue)}`;
    comment = comment ? `${comment} (${defaultInfo})` : defaultInfo;
  }

  return {
    name,
    type: mapRailsType(type),
    nullable,
    comment,
    default: defaultValue,
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
