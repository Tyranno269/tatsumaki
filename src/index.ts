#!/usr/bin/env node
import { generateRailsTsp } from "./commands/generate.js";

async function main(): Promise<void> {
  const cwd = process.cwd();
  try {
    await generateRailsTsp({ cwd });
  } catch (e: unknown) {
    const msg =
      e instanceof Error
        ? e.message
        : e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : String(e);
    console.error?.(msg);
    process.exit(1);
  }
}

void main().catch((e: unknown) => {
  const msg =
    e instanceof Error
      ? e.message
      : e && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : String(e);
  console.error?.(msg);
  process.exit(1);
});
