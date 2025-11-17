export function buildColumnComment(
  baseComment?: string,
  defaultValue?: string | number | boolean,
  precision?: string,
  scale?: string,
  limit?: string,
): { description?: string; metadata?: string } {
  const metadataParts: string[] = [];

  if (precision || scale) {
    const p = precision || "10";
    const s = scale || "0";
    metadataParts.push(`precision: ${p}, scale: ${s}`);
  }

  if (limit) {
    metadataParts.push(`limit: ${limit}`);
  }

  if (defaultValue !== undefined) {
    metadataParts.push(`default: ${JSON.stringify(defaultValue)}`);
  }

  return {
    description: baseComment,
    metadata: metadataParts.length > 0 ? metadataParts.join(", ") : undefined,
  };
}

export function buildReferenceComment(
  baseComment?: string,
  refTable?: string,
): { description?: string; metadata?: string } {
  const metadataParts: string[] = [];

  if (refTable) {
    metadataParts.push(`ref: ${refTable}`);
  }

  return {
    description: baseComment,
    metadata: metadataParts.length > 0 ? metadataParts.join(", ") : undefined,
  };
}
