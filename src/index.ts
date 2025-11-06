#!/usr/bin/env node
import minimist from "minimist";

import { generateRailsTsp } from "./commands/generate.js";

async function main(): Promise<void> {
  const args = minimist(process.argv.slice(2));
  const cwd = process.cwd();

  const options = {
    cwd,
    force: args.force || false,
    append: args.append || false,
    out: args.out || "rails.tsp",
  };

  try {
    await generateRailsTsp(options);
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
