/**
 * Every `@type/name` in the Android library's resources, and in the token
 * build's Android resources when they are built, names a resource of that
 * type.
 *
 * The library's own build never links its resources, so it passes with a
 * reference to nothing, and the first to find out is an app built against
 * it. The deciding is in `scripts/lib/android-resource-references.mjs`, and
 * `scripts/lib/android-resource-references.test.mjs` holds its controls.
 *
 *   pnpm tokens:android:refs:check
 */
import fs from "node:fs";
import path from "node:path";
import { unresolvedReferences } from "./lib/android-resource-references.mjs";

const ROOT = process.cwd();
const RES_DIRS = [
  { res: "packages/android/src/main/res", required: true },
  { res: "packages/tokens/dist/android/src/main/res", required: false },
];

let failed = 0;
let checked = 0;
for (const { res, required } of RES_DIRS) {
  const dir = path.join(ROOT, res);
  if (!fs.existsSync(dir)) {
    if (required) {
      console.error(`  FAIL  ${res} is missing`);
      failed++;
    } else {
      console.log(`  skip  ${res}: not built (pnpm tokens:build)`);
    }
    continue;
  }
  const files = {};
  for (const folder of fs.readdirSync(dir).filter((name) => /^values(-|$)/.test(name)).sort()) {
    files[folder] = fs
      .readdirSync(path.join(dir, folder))
      .filter((name) => name.endsWith(".xml"))
      .sort()
      .map((name) => {
        const file = path.join(res, folder, name);
        return { file, xml: fs.readFileSync(path.join(ROOT, file), "utf8") };
      });
  }
  const count = Object.values(files).reduce((sum, texts) => sum + texts.length, 0);
  if (!count) {
    console.error(`  FAIL  ${res} holds no values XML`);
    failed++;
    continue;
  }
  checked += count;
  const missing = unresolvedReferences(files);
  for (const { file, line, ref } of missing) {
    console.error(`  FAIL  ${file}:${line} @${ref} names no ${ref.split("/")[0]}`);
  }
  failed += missing.length;
  if (!missing.length) console.log(`  ok    ${res}: ${count} file(s), every reference resolves`);
}

if (failed) {
  console.error(`\n${failed} Android resource reference problem(s)`);
  process.exit(1);
}
console.log(`\n${checked} Android resource file(s): every reference names a resource of its type`);
