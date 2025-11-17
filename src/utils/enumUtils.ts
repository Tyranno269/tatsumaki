/**
 * Convert snake_case to PascalCase
 */
export const toPascalCase = (str: string): string => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

/**
 * Parse hash content like "disabled: 0, enabled: 1, suspended: 9"
 */
export const parseHashContent = (content: string): string[] => {
  return content
    .split(",")
    .map((pair) => pair.trim().split(":")[0].trim())
    .filter((key) => key.length > 0);
};

/**
 * Parse array content like ":active, :archived" or "online, offline"
 */
export const parseArrayContent = (content: string): string[] => {
  return content
    .split(",")
    .map((item) => item.trim().replace(/^:/, ""))
    .filter((item) => item.length > 0);
};
