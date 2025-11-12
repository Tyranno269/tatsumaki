import { buildColumnComment, buildReferenceComment } from "./columnOptionProcessor.js";
import { mapRailsType } from "./railsTypeMapper.js";

export interface Field {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
  metadata?: string;
  default?: string | number | boolean;
}

export function parseColumns(tableBody: string): Field[] {
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
    {
      name: "created_at",
      type: "utcDateTime",
      nullable,
      description: undefined,
      metadata: undefined,
    },
    {
      name: "updated_at",
      type: "utcDateTime",
      nullable,
      description: undefined,
      metadata: undefined,
    },
  ];
}

function parseReference(name: string, rest: string): Field {
  const nullable = /null:\s*false/.test(rest) ? false : true;
  const refType = /type:\s*:(\w+)/.exec(rest)?.[1];
  const fieldType = refType ? mapRailsType(refType) : mapRailsType("references");
  const baseComment = /comment:\s*"([^"]*)"/.exec(rest)?.[1];
  const toTableMatch = /foreign_key:\s*{[^}]*to_table:\s*:(\w+)/.exec(rest);
  const refTable = toTableMatch?.[1] || name;

  const commentData = buildReferenceComment(baseComment, refTable);

  return {
    name: `${name}_id`,
    type: fieldType,
    nullable,
    description: commentData.description,
    metadata: commentData.metadata,
  };
}

function parseColumn(type: string, name: string, rest: string): Field {
  const nullable = /null:\s*false/.test(rest) ? false : true;
  const baseComment = /comment:\s*"([^"]*)"/.exec(rest)?.[1];

  let defaultValue: string | number | boolean | undefined;
  const defaultMatch = /default:\s*([^,\s]+)/.exec(rest);
  if (defaultMatch) {
    const defaultStr = defaultMatch[1].trim();
    if (defaultStr.startsWith('"') && defaultStr.endsWith('"')) {
      defaultValue = defaultStr.slice(1, -1);
    } else if (defaultStr === "true" || defaultStr === "false") {
      defaultValue = defaultStr === "true";
    } else if (/^\d+(\.\d+)?$/.test(defaultStr)) {
      defaultValue = parseFloat(defaultStr);
    }
  }

  const precision = /precision:\s*(\d+)/.exec(rest)?.[1];
  const scale = /scale:\s*(\d+)/.exec(rest)?.[1];
  const limit = /limit:\s*(\d+)/.exec(rest)?.[1];

  const commentData = buildColumnComment(baseComment, defaultValue, precision, scale, limit);

  const field: Field = {
    name,
    type: mapRailsType(type),
    nullable,
    description: commentData.description,
    metadata: commentData.metadata,
  };

  if (defaultValue !== undefined) {
    field.default = defaultValue;
  }

  return field;
}
