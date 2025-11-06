export function buildColumnComment(
  baseComment?: string,
  defaultValue?: string | number | boolean,
  precision?: string,
  scale?: string,
  limit?: string,
  refTable?: string,
): string | undefined {
  let comment = baseComment;

  if (precision || scale) {
    const p = precision || "10";
    const s = scale || "0";
    const precisionInfo = `precision: ${p}, scale: ${s}`;
    comment = comment ? `${comment} (${precisionInfo})` : precisionInfo;
  }

  if (limit) {
    const limitInfo = `limit: ${limit}`;
    comment = comment ? `${comment} (${limitInfo})` : limitInfo;
  }

  if (defaultValue !== undefined) {
    const defaultInfo = `default: ${JSON.stringify(defaultValue)}`;
    comment = comment ? `${comment} (${defaultInfo})` : defaultInfo;
  }

  if (refTable) {
    const refInfo = `ref: ${refTable}`;
    comment = comment ? `${comment}; ${refInfo}` : refInfo;
  }

  return comment;
}
