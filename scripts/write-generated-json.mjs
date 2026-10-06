/**
 * Write a generated JSON file the way lint-staged would commit it.
 *
 * The generators wrote JSON.stringify's output and left the pre-commit hook to
 * prettify it, so a checked-in file never matched what its generator wrote:
 * every regeneration reflowed thousands of lines of short arrays before the
 * real change could be seen — 3,331 lines for the library manifest on
 * 2026-09-13, of which 24 mappings and 22 tokens were the change. Formatting
 * here, with the repository's own Prettier configuration, makes a regeneration
 * a content-only diff, and lets a check compare the checked-in file with what
 * the generator produces.
 *
 * `volatileKeys` finishes that job for the files carrying a `generatedAt`. A
 * timestamp that moves on every run makes the diff meaningless again — the
 * reader cannot tell a regeneration from a change — so when the only
 * difference from the file on disk is in those keys, the file is left alone.
 * The timestamp then answers "when did this content last change", which is the
 * question someone reading it actually has.
 */
import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";

async function formatJson(filePath, value) {
  const config = (await prettier.resolveConfig(filePath)) || {};
  return prettier.format(JSON.stringify(value, null, 2), {
    ...config,
    filepath: filePath,
  });
}

/** True when `next` and `previous` differ only in the named top-level keys. */
function differsOnlyInVolatileKeys(previous, next, volatileKeys) {
  if (previous === null) return false;
  const blank = (o) =>
    JSON.stringify(
      Object.fromEntries(
        Object.entries(o).map(([k, v]) => [
          k,
          volatileKeys.includes(k) ? null : v,
        ]),
      ),
    );
  try {
    return blank(previous) === blank(next);
  } catch {
    return false;
  }
}

export async function writeGeneratedJson(filePath, value, options = {}) {
  const volatileKeys = options.volatileKeys || [];
  const formatted = await formatJson(filePath, value);

  if (volatileKeys.length && fs.existsSync(filePath)) {
    let previous = null;
    try {
      previous = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      previous = null;
    }
    if (
      previous &&
      typeof previous === "object" &&
      !Array.isArray(previous) &&
      differsOnlyInVolatileKeys(previous, value, volatileKeys)
    ) {
      return { written: false, path: filePath };
    }
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, formatted);
  return { written: true, path: filePath };
}

/**
 * True when the file on disk holds `value`, apart from `volatileKeys`: what a
 * `--check` asks, without writing.
 */
export function generatedJsonIsCurrent(filePath, value, options = {}) {
  if (!fs.existsSync(filePath)) return false;
  let previous;
  try {
    previous = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return false;
  }
  const volatileKeys = options.volatileKeys || [];
  return (
    JSON.stringify(previous) === JSON.stringify(value) ||
    differsOnlyInVolatileKeys(previous, value, volatileKeys)
  );
}
