import { ensureDir, fileExists, writeFileSafe } from "../utils/fs.js";
import { resolvePath } from "../utils/path.js";
import { defaultRailsTspTemplate } from "../utils/tsp-templates.js";

type GenerateOptions = {
  cwd: string;
};

export async function generateRailsTsp({ cwd }: GenerateOptions) {
  const targetPath = resolvePath(cwd, "rails.tsp");

  await ensureDir(cwd);

  const exists = await fileExists(targetPath);
  if (exists) {
    console.warn?.(`rails.tsp already exists. Skipped: ${targetPath}`);
    return;
  }

  const content = defaultRailsTspTemplate();
  await writeFileSafe(targetPath, content);

  console.log?.(`Created rails.tsp at: ${targetPath}`);
}
