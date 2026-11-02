// Component names are a development aid: every build an app makes for
// development carries each part's name, and a production build carries none
// (decision 128).
//
// Each part's name is set in its source, `X.displayName = "X"` (or a read of
// the Radix part it wraps). The library's build gates those assignments on
// `process.env.NODE_ENV !== "production"` and leaves the variable for the app's
// bundler to replace (packages/react/vite-plugins/shakable-components.mjs).
// This reads the names back from what an app runs, and holds each to its
// source: the unbundled ES files as Node imports them (no NODE_ENV set) and
// the whole package bundled for development must carry the source's name; the
// package bundled for production must carry none of them.
//
// Needs a built @kozmos-ds/react: `pnpm --filter "@kozmos-ds/react..." build`.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const react = path.join(root, "packages/react");
const src = path.join(react, "src");
const requireFromReact = createRequire(path.join(react, "package.json"));
const requireFromVite = createRequire(
  requireFromReact.resolve("vite/package.json"),
);
const esbuild = requireFromVite("esbuild");

// What the source names each exported part: `X.displayName = <value>` at a
// module's top level, keyed by the binding, then by what index.ts exports.
function sourceNames() {
  const names = new Map();
  const files = fs
    .readdirSync(src, { recursive: true })
    .filter(
      (file) =>
        /\.tsx?$/.test(file) &&
        !/\.(test|stories|figma|spec)\.tsx?$/.test(file) &&
        !file.endsWith(".d.ts"),
    );
  for (const file of files) {
    const code = fs.readFileSync(path.join(src, file), "utf8");
    for (const match of code.matchAll(
      /^([A-Za-z_$][\w$]*)\.displayName\s*=\s*([\s\S]*?);\s*$/gm,
    )) {
      const value = match[2].trim();
      const literal = /^(["'`])([^"'`]*)\1$/.exec(value);
      names.set(match[1], literal ? { literal: literal[2] } : { read: value });
    }
  }
  return names;
}

async function load(entry, label) {
  const module = await import(pathToFileURL(entry).href + `?${label}`);
  const found = new Map();
  for (const [name, value] of Object.entries(module))
    if (value && (typeof value === "object" || typeof value === "function"))
      found.set(name, value.displayName);
  return found;
}

async function bundled(mode) {
  const work = fs.mkdtempSync(path.join(react, ".names-"));
  try {
    const out = path.join(work, `kozmos-${mode}.mjs`);
    await esbuild.build({
      entryPoints: [path.join(react, "dist/kozmos-react.mjs")],
      bundle: true,
      format: "esm",
      platform: "node",
      outfile: out,
      // Everything an app installs with Kozmos is bundled with it; React is
      // the app's own copy.
      external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client"],
      define: { "process.env.NODE_ENV": JSON.stringify(mode) },
      // CommonJS dependencies (react-remove-scroll) require React.
      banner: {
        js: 'import { createRequire as __kozmosRequire } from "node:module"; const require = __kozmosRequire(import.meta.url);',
      },
      minify: mode === "production",
      logLevel: "silent",
    });
    return await load(out, mode);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

const expected = sourceNames();
const builds = {
  "the unbundled ES files": {
    names: await load(path.join(react, "dist/kozmos-react.mjs"), "esm"),
    named: true,
  },
  "a development bundle": { names: await bundled("development"), named: true },
  "a production bundle": { names: await bundled("production"), named: false },
};

let checked = 0;
const failures = [];
const reference = builds["a development bundle"].names;
for (const [name, value] of reference) {
  const source = expected.get(name);
  if (!source) continue;
  checked += 1;
  // A read of the Radix part is its name, which has to be there to compare.
  const want = source.literal ?? value;
  if (source.read && (typeof want !== "string" || !want))
    failures.push(
      `${name}: its source reads ${source.read}, which is ${String(want)} in development`,
    );
  for (const [build, { names, named }] of Object.entries(builds)) {
    const got = names.get(name);
    if (named && got !== want)
      failures.push(
        `${name} in ${build}: ${JSON.stringify(got)}, its source says ${JSON.stringify(want)}`,
      );
    if (!named && got !== undefined)
      failures.push(
        `${name} in ${build}: carries the name ${JSON.stringify(got)}`,
      );
  }
}
assert.ok(
  checked > 100,
  `only ${checked} named exports were found; the check reads nothing`,
);
if (failures.length) {
  console.error(
    `❌ ${failures.length} component names are not what they should be:`,
  );
  for (const failure of failures.slice(0, 20)) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(
  `✅ ${checked} exported components carry the names their source gives them unbundled and in a development bundle, and none in a production bundle.`,
);
