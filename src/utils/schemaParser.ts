import { parseColumns } from "./columnParser.js";
import type { Field } from "./columnParser.js";
import { singularize } from "./railsInflector.js";
import { mapRailsType } from "./railsTypeMapper.js";
import { toPascal } from "./stringUtils.js";

export interface TableModel {
  name: string;
  comment?: string;
  primaryKey?: string;
  fields: Field[];
}

export type { Field };

export function parseSchema(content: string): TableModel[] {
  const models: TableModel[] = [];
  const tableRegex = /create_table\s+"([^"]+)"([\s\S]*?)do\s*\|t\|([\s\S]*?)end/gm;

  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const [, tableName, attrs, tableBody] = match;
    const comment = /comment:\s*"([^"]*)"/.exec(attrs)?.[1];
    const modelName = toPascal(singularize(tableName));

    const fields = parseColumns(tableBody);

    const idDisabled = /\bid:\s*false\b/.test(attrs);
    const customPrimaryKey = /primary_key:\s*"([^"]+)"/.exec(attrs)?.[1];
    const pkTypeInAttrs = /id:\s*:(\w+)/.exec(attrs)?.[1];
    const pkType = pkTypeInAttrs ?? "bigint";

    let primaryKey: string | undefined;

    if (!idDisabled) {
      if (customPrimaryKey) {
        primaryKey = customPrimaryKey;
        if (!fields.some((f) => f.name === customPrimaryKey)) {
          fields.unshift({
            name: customPrimaryKey,
            type: mapRailsType(pkType),
            nullable: false,
          });
        }
      } else if (!fields.some((f) => f.name === "id")) {
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
