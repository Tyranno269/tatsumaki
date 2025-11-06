import * as path from "path";

export function resolvePath(...parts: string[]): string {
  return path.resolve(...parts);
}
