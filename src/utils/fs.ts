import { promises as fs } from "fs";
import * as path from "path";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const st = await fs.stat(filePath);
    return st.isFile();
  } catch {
    return false;
  }
}

export async function writeFileSafe(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, { encoding: "utf-8", flag: "wx" });
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}
