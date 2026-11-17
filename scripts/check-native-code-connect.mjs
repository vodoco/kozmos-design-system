// node scripts/check-native-code-connect.mjs <ios|android> [--from <parse.json>]
//
// Checks what Figma's native Code Connect parsers made of the SwiftUI and
// Compose files: the snippets Dev Mode shows. `figma connect parse` only says
// a file is well formed; it does not say the snippet names real code.
//
// Compose: every `com.kozmos…` import a snippet shows must name a top-level
// declaration in the Android sources. On 17 Nov 2026 the twelve note-only
// icon connections (#561) showed
// `import com.kozmos.components.feedbackcard.ComponentExample` in Figma, a
// class that does not exist, and every check passed.
//
// SwiftUI: every snippet's component must be a type or function declared in
// the iOS sources, as `let component = X.self` names it.
//
// Without --from it runs the parse itself (scripts/figma-connect-native.mjs),
// which needs no Figma token.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  kotlinDeclarations,
  nativeCodeConnectProblems,
  swiftDeclarations,
} from "./lib/native-code-connect.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [platform, ...rest] = process.argv.slice(2);
if (!["ios", "android"].includes(platform)) {
  console.error(
    "Usage: node scripts/check-native-code-connect.mjs <ios|android> [--from <parse.json>]",
  );
  process.exit(2);
}
const fromIndex = rest.indexOf("--from");
let parsePath = fromIndex >= 0 ? rest[fromIndex + 1] : null;
if (!parsePath) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-native-cc-"));
  parsePath = path.join(dir, `${platform}.json`);
  execFileSync(
    process.execPath,
    [
      path.join(root, "scripts/figma-connect-native.mjs"),
      platform,
      "parse",
      "--outFile",
      parsePath,
    ],
    { cwd: root, stdio: ["ignore", "inherit", "inherit"] },
  );
}
const docs = JSON.parse(fs.readFileSync(parsePath, "utf8"));
if (!Array.isArray(docs) || docs.length === 0) {
  console.error(`${parsePath} holds no Code Connect docs`);
  process.exit(1);
}

const walk = (dir, ext) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, ext);
    return entry.name.endsWith(ext) && !entry.name.includes(".figma.")
      ? [full]
      : [];
  });

const declared = new Set();
if (platform === "android") {
  // The library's own sources and the generated tokens it compiles with.
  for (const dir of [
    "packages/android/src/main/java",
    "packages/tokens/dist/android/src/main/java",
  ]) {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) continue;
    for (const file of walk(full, ".kt"))
      for (const name of kotlinDeclarations(fs.readFileSync(file, "utf8")))
        declared.add(name);
  }
} else {
  for (const file of walk(path.join(root, "packages/ios/Sources"), ".swift"))
    for (const name of swiftDeclarations(fs.readFileSync(file, "utf8")))
      declared.add(name);
}

// The Figma node, and the file when the parser records it (Compose does,
// SwiftUI does not).
const where = (doc) => {
  const node = `node ${doc.figmaNode.replace(/^.*node-id=/, "")}`;
  const file = doc._codeConnectFilePath || doc.source;
  return file ? `${node}, ${path.relative(root, file)}` : node;
};

const label = platform === "android" ? "Compose" : "SwiftUI";
const problems = nativeCodeConnectProblems(platform, docs, declared);
if (problems.length) {
  console.error(
    `${problems.length} of ${docs.length} ${label} Code Connect snippets name code that does not exist:`,
  );
  for (const { doc, message } of problems)
    console.error(`  ${doc.component} (${where(doc)}): ${message}`);
  process.exit(1);
}
console.log(
  platform === "android"
    ? `${docs.length} Compose Code Connect snippets: every Kozmos import names a declaration`
    : `${docs.length} SwiftUI Code Connect snippets: every component is declared in packages/ios/Sources`,
);
