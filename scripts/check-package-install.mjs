/**
 * Install every published package the way a stranger would, and use it.
 *
 * Nothing else here tests what npm will actually hand people. The build can
 * pass, the types can check and every gate can be green while the tarball is
 * wrong: #27 put 92 `*.figma.d.ts` files into @kozmos-ds/react's dist, and
 * `files: ["dist"]` would have published them — found only by counting dist.
 * An `exports` map is sharper still: a path it does not list simply stops
 * resolving, for everyone outside the repo and for nobody inside it.
 *
 * So this packs each package with pnpm, which rewrites `workspace:*` to real
 * versions exactly as a publish does, and reads what is in each tarball. It
 * installs all of them together into an empty project with plain npm, then
 * resolves every export, requires every CommonJS entry, renders a component on
 * the server, and type-checks every code sample in every README against the
 * installed types — so a README cannot promise an import that does not work.
 *
 * It reads packages/* for anything not marked private rather than naming
 * packages, so a new one is checked the day it appears, and one that must not
 * ship has to say so in its own package.json.
 *
 * It needs built packages and the network: run
 * `pnpm --filter "@kozmos-ds/react..." build` first.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  collectSnippets,
  writeReactSnippetFixtures,
  writeSnippetNegativeControl,
} from "./lib/doc-snippets.mjs";
import { parseArgs } from "node:util";
import { writeCandidate } from "./release/candidate.mjs";
import { readPlan } from "./release/verify-request.mjs";

const { values: releaseOptions } = parseArgs({
  options: {
    "release-output": { type: "string" },
    "release-sha": { type: "string" },
  },
});
if (
  Boolean(releaseOptions["release-output"]) !==
  Boolean(releaseOptions["release-sha"])
) {
  throw new Error(
    "--release-output and --release-sha must be supplied together",
  );
}
const releasePlan = releaseOptions["release-output"] ? readPlan() : null;
if (releasePlan) {
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  if (releaseOptions["release-sha"] !== head)
    throw new Error("Release SHA differs from checkout");
  if (fs.existsSync(releaseOptions["release-output"]))
    throw new Error("Release output already exists");
}
const ROOT = process.cwd();
const docSnippets = collectSnippets(ROOT);
const PACKAGES = path.join(ROOT, "packages");
const problems = [];
const ok = (m) => console.log(`  ok    ${m}`);
const fail = (m) => {
  problems.push(m);
  console.log(`  FAIL  ${m}`);
};

// A tarball is what strangers get. None of these belong in it.
const FORBIDDEN = [
  [/\.figma\.[cm]?[jt]sx?$|\.figma\.d\.ts$/, "a Code Connect file"],
  [/\.(test|spec)\.[cm]?[jt]sx?$|\.(test|spec)\.d\.ts$/, "a test"],
  [/\.stories\.[cm]?[jt]sx?$|\.stories\.d\.ts$/, "a story"],
  [/^package\/src\//, "source"],
  [/__tests__\//, "a test directory"],
  [/(^|\/)\.env/, "an env file"],
  [/(^|\/)tsconfig[^/]*\.json$/, "a tsconfig"],
];

// What a package may contain at all, by kind. FORBIDDEN names the leaks we know
// about; this catches the ones nobody thought to name — a stats.html from a
// bundle analyser, a stray .ts source, an image.
const ALLOWED =
  /^package\/(package\.json|README\.md|LICENSE)$|\.(d\.ts|d\.mts|d\.cts|mjs|cjs|js|map|css|swift|kt|xml)$/;

// All package declarations now match their ESM/CJS runtime format. Keep this
// zero baseline: any new resolver problem fails publication checks.
const ATTW = "@arethetypeswrong/cli@0.18.5";
const KNOWN_TYPE_PROBLEMS = new Set();

// Every React major the packages' peer ranges accept.
const REACT_MAJORS = [18, 19];

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, npm_config_update_notifier: "false" },
  });
}

function finish() {
  console.log(
    `\n${problems.length === 0 ? "ok    every package installs and works from its tarball" : `${problems.length} problem(s)`}`,
  );
  process.exit(problems.length === 0 ? 0 : 1);
}

console.log("Packages, installed from their tarballs\n");

const publishable = fs
  .readdirSync(PACKAGES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(PACKAGES, entry.name))
  .filter((dir) => fs.existsSync(path.join(dir, "package.json")))
  .map((dir) => ({
    dir,
    manifest: JSON.parse(
      fs.readFileSync(path.join(dir, "package.json"), "utf8"),
    ),
  }))
  .filter(({ manifest }) => manifest.name && manifest.private !== true);

ok(
  `publishable: ${publishable.map(({ manifest }) => manifest.name).join(", ")}`,
);

// ---- before packing: what npm copies from the package directory itself ----

const rootLicense = path.join(ROOT, "LICENSE");
const licenseText = fs.existsSync(rootLicense)
  ? fs.readFileSync(rootLicense, "utf8")
  : null;
if (!licenseText) {
  fail(
    "there is no LICENSE at the repository root to hold the packages' copies to",
  );
}

for (const { dir, manifest } of publishable) {
  const name = manifest.name;
  if (!fs.existsSync(path.join(dir, "dist"))) {
    fail(`${name} has no dist — build before running this check`);
  }
  if (manifest.license !== "MIT") {
    fail(
      `${name} declares license ${JSON.stringify(manifest.license)}, not "MIT"`,
    );
  }
  if (!fs.existsSync(path.join(dir, "README.md"))) {
    fail(`${name} has no README.md, so its npm page would be blank`);
  }
  // npm includes a LICENSE from the package's own directory, never from the
  // monorepo root, so without a copy here the tarball carries no licence text.
  const own = path.join(dir, "LICENSE");
  if (!fs.existsSync(own)) {
    fail(
      `${name} has no LICENSE of its own, so its tarball would ship without one`,
    );
  } else if (licenseText && fs.readFileSync(own, "utf8") !== licenseText) {
    fail(`${name}/LICENSE differs from the root LICENSE`);
  }
}

if (problems.length > 0) finish();

// ---- pack ----

const work = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-install-"));
const tarballs = path.join(work, "tarballs");
fs.mkdirSync(tarballs);

const packed = [];
for (const { dir, manifest } of publishable) {
  const before = new Set(fs.readdirSync(tarballs));
  try {
    run("pnpm", ["pack", "--pack-destination", tarballs], dir);
  } catch (error) {
    fail(
      `${manifest.name} did not pack: ${String(error.stderr || error)
        .trim()
        .split("\n")
        .pop()}`,
    );
    continue;
  }
  const problemsBefore = problems.length;
  const file = fs.readdirSync(tarballs).find((f) => !before.has(f));
  const tarball = path.join(tarballs, file);
  const files = run("tar", ["-tzf", tarball], work).split("\n").filter(Boolean);

  for (const required of [
    "package/package.json",
    "package/README.md",
    "package/LICENSE",
  ]) {
    if (!files.includes(required)) {
      fail(
        `${manifest.name}'s tarball has no ${required.slice("package/".length)}`,
      );
    }
  }
  const leaked = [];
  for (const entry of files) {
    for (const [pattern, what] of FORBIDDEN) {
      if (pattern.test(entry)) leaked.push(`${entry} (${what})`);
    }
  }
  if (leaked.length > 0) {
    fail(
      `${manifest.name}'s tarball carries ${leaked.length} file(s) that should not ship, e.g. ${leaked.slice(0, 3).join(", ")}`,
    );
  }
  const unexpected = files.filter((entry) => !ALLOWED.test(entry));
  if (unexpected.length > 0) {
    fail(
      `${manifest.name}'s tarball carries ${unexpected.length} file(s) of a kind no package ships, e.g. ${unexpected.slice(0, 3).join(", ")}`,
    );
  }
  const packedManifest = run(
    "tar",
    ["-xzOf", tarball, "package/package.json"],
    work,
  );
  if (packedManifest.includes("workspace:")) {
    fail(
      `${manifest.name}'s packed package.json still says workspace:, which npm cannot install`,
    );
  }
  packed.push({ manifest, tarball, files });
  if (problems.length === problemsBefore) {
    ok(
      `${manifest.name} packs: ${files.length} file(s), nothing that should not ship`,
    );
  }
}

if (problems.length > 0) finish();

// ---- types: each entry's declarations match the code it resolves to ----

const typeProblems = new Set();
const unreported = new Set();
for (const { manifest, tarball } of packed) {
  // Written to a file, not read through a pipe: the tool exits before a large
  // report has drained, which cut @kozmos-ds/react's off at exactly 65,536 bytes
  // and left JSON that would not parse.
  const reportPath = path.join(work, `${path.basename(tarball)}.types.json`);
  const reportFile = fs.openSync(reportPath, "w");
  try {
    execFileSync("npx", ["--yes", ATTW, tarball, "--format", "json"], {
      cwd: work,
      stdio: ["ignore", reportFile, "pipe"],
      env: { ...process.env, npm_config_update_notifier: "false" },
    });
  } catch {
    // It exits non-zero when it finds a problem; the report is in the file.
  } finally {
    fs.closeSync(reportFile);
  }
  const report = fs.readFileSync(reportPath, "utf8");
  let analysis;
  try {
    ({ analysis } = JSON.parse(report));
  } catch {
    fail(`${ATTW} produced no report for ${manifest.name}`);
    unreported.add(manifest.name);
    continue;
  }
  for (const problem of analysis.problems ?? []) {
    // A stylesheet has neither types nor JavaScript, so "no resolution" for a
    // CSS subpath is the tool's blind spot rather than a defect. Node resolves
    // those files for real in the install stage below.
    const target = manifest.exports?.[problem.entrypoint];
    if (
      problem.kind === "NoResolution" &&
      typeof target === "string" &&
      target.endsWith(".css")
    ) {
      continue;
    }
    typeProblems.add(`${manifest.name} ${problem.kind}`);
  }
}
const newTypeProblems = [...typeProblems].filter(
  (problem) => !KNOWN_TYPE_PROBLEMS.has(problem),
);
// A package with no report has not fixed anything; silence is not a pass.
const fixedTypeProblems = [...KNOWN_TYPE_PROBLEMS].filter(
  (problem) =>
    !typeProblems.has(problem) && !unreported.has(problem.split(" ")[0]),
);
if (newTypeProblems.length > 0) {
  fail(
    `types resolve wrongly in a way they did not before: ${newTypeProblems.join(", ")}. Run npx ${ATTW} --pack packages/<name> for the table.`,
  );
}
if (fixedTypeProblems.length > 0) {
  fail(
    `fixed since the baseline — delete from KNOWN_TYPE_PROBLEMS to lock it in: ${fixedTypeProblems.join(", ")}`,
  );
}
if (newTypeProblems.length === 0 && fixedTypeProblems.length === 0) {
  ok(
    `types resolve as recorded: ${KNOWN_TYPE_PROBLEMS.size} known problem(s), none new, none fixed`,
  );
}

// ---- what a consumer's code will ask for ----

const specifiers = [];
for (const { manifest, files } of packed) {
  for (const [key, target] of Object.entries(manifest.exports ?? {})) {
    if (!key.includes("*")) {
      specifiers.push(
        key === "." ? manifest.name : `${manifest.name}${key.slice(1)}`,
      );
      continue;
    }
    // A pattern export: prove it with a real file it should reach.
    const targetPrefix = `package/${String(target).replace(/^\.\//, "").split("*")[0]}`;
    const sample = files.find((f) => f.startsWith(targetPrefix));
    if (sample) {
      const rest = sample.slice(targetPrefix.length);
      specifiers.push(`${manifest.name}${key.slice(1).replace("*", rest)}`);
    }
  }
}

// Whatever a README tells people to import, which the map must also reach: a
// README promising `@kozmos-ds/react/style.css` after the map dropped it would
// otherwise pass, because a `*.css` declaration types any CSS import at all.
const samples = [];
for (const { manifest } of packed) {
  const short = manifest.name.split("/")[1];
  const readme = fs.readFileSync(
    path.join(PACKAGES, short, "README.md"),
    "utf8",
  );
  for (const block of readme.matchAll(/```(tsx|ts|css)\n([\s\S]*?)```/g)) {
    for (const found of block[2].matchAll(
      /(?:from\s+|import\s+|@import\s+)["'](@kozmos-ds\/[^"']+)["']/g,
    )) {
      if (!specifiers.includes(found[1])) specifiers.push(found[1]);
    }
    if (block[1] !== "css") {
      samples.push({
        file: `${short}-${samples.length + 1}.${block[1]}`,
        body: block[2],
      });
    }
  }
}

// Rich POI details must also typecheck as a real installed-package consumer,
// without widening legacy action labels or importing workspace source.
samples.push({
  file: "poi-details.tsx",
  body: `import { POIDetailPanel } from "@kozmos-ds/react";
import type { POIDetailsPresentation, POIPresentation } from "@kozmos-ds/product-contracts";
const poi: POIPresentation = { id: "entry", name: "Entrance", floorId: "1", floorLabel: "Floor 1", media: [], actions: ["navigate"] };
const details: POIDetailsPresentation = {
  summary: [{ id: "access", kind: "property", label: "Accessibility", value: "Step-free", tone: "success", iconUrl: "/access.png", iconMonochrome: true }, { id: "price", kind: "price", label: "Price", value: "3 of 4", priceLevel: 3 }],
  groups: [{ id: "amenities", heading: "Amenities", items: [{ id: "wifi", label: "WiFi", iconName: "wifi", iconUrl: "/wifi.png", iconMonochrome: true }] }],
  tags: [{ id: "pay", label: "Payment", iconUrl: "/payment.png" }],
  supplementaryActions: [{ action: "call", label: "Call" }],
};
export function Example() {
  return <POIDetailPanel poi={poi} details={details}
    actionLabels={{ navigate: "Go", favourite: "Favourite", bookmark: "Bookmark", share: "Share", order: "Order" }}
    onAction={() => undefined} onSupplementaryAction={(action, id) => { console.log(action, id); }} />;
}`,
});

const requirable = packed
  .filter(({ manifest }) => manifest.exports?.["."]?.require)
  .map(({ manifest }) => manifest.name);

const probe = `import fs from "node:fs";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const results = [];

if (typeof import.meta.resolve !== "function") {
  results.push([false, "this Node cannot resolve package exports from a script (needs 20.6 or later)"]);
} else {
  for (const spec of ${JSON.stringify(specifiers)}) {
    try {
      results.push([fs.existsSync(new URL(import.meta.resolve(spec))), "resolves " + spec]);
    } catch (error) {
      results.push([false, "resolves " + spec + " — " + error.message]);
    }
  }
}

for (const name of ${JSON.stringify(requirable)}) {
  try {
    const exports = require(name);
    results.push([name === "@kozmos-ds/product-contracts" ? Object.keys(exports).length === 0 : Object.keys(exports).length > 0, "require(" + name + ") returns its exports (contracts intentionally has no runtime API)"]);
  } catch (error) {
    results.push([false, "require(" + name + ") — " + error.message]);
  }
}

console.warn = () => {};
const kozmos = await import("@kozmos-ds/react");
const html = renderToStaticMarkup(
  createElement(kozmos.Button, { emotion: "success" }, createElement(kozmos.Icon, { name: "check" }), "Save"),
);
results.push([html.includes("<button") && html.includes("Save") && html.includes("<svg"), "renders a Button with an Icon on the server"]);

process.stdout.write(JSON.stringify(results));
`;

// Until 2026-09-24 this installed lucide-react alongside the tarballs, at the
// version @kozmos-ds/react asked for. It asks for nothing now: the last icon
// that needed it, the wheelchair, is drawn by this estate. A consumer installs
// the four packages and React, and that is all.

// ---- install, use and type-check, once per React major ----

for (const major of REACT_MAJORS) {
  const app = path.join(work, `react-${major}`);
  fs.mkdirSync(app);
  fs.writeFileSync(
    path.join(app, "package.json"),
    JSON.stringify(
      {
        name: `kozmos-install-check-react-${major}`,
        private: true,
        type: "module",
      },
      null,
      2,
    ),
  );

  try {
    run(
      "npm",
      [
        "install",
        "--no-audit",
        "--no-fund",
        "--ignore-scripts",
        "--loglevel=error",
        ...packed.map(({ tarball }) => tarball),
        `react@${major}`,
        `react-dom@${major}`,
        "typescript@5",
        `@types/react@${major}`,
        `@types/react-dom@${major}`,
      ],
      app,
    );
  } catch (error) {
    fail(
      `React ${major}: npm install failed: ${String(error.stderr || error)
        .trim()
        .split("\n")
        .slice(-3)
        .join(" / ")}`,
    );
    continue;
  }

  fs.writeFileSync(path.join(app, "probe.mjs"), probe);
  try {
    const results = JSON.parse(run("node", ["probe.mjs"], app));
    const failed = results.filter(([passed]) => !passed);
    for (const [, what] of failed) fail(`React ${major}: ${what}`);
    if (failed.length === 0) {
      ok(
        `React ${major}: installs, ${specifiers.length} export(s) resolve, ${requirable.length} CommonJS entr(y/ies) load, a Button renders on the server`,
      );
    }
  } catch (error) {
    fail(
      `React ${major}: the probe crashed: ${String(error.stderr || error)
        .trim()
        .split("\n")
        .slice(0, 3)
        .join(" / ")}`,
    );
  }

  const snippetMapping = writeReactSnippetFixtures(app, docSnippets);
  writeSnippetNegativeControl(app);
  let negativeOutput = "";
  try {
    run(
      path.join(app, "node_modules/.bin/tsc"),
      ["-p", "tsconfig.doc-snippets-negative.json"],
      app,
    );
  } catch (error) {
    negativeOutput = String(error.stdout || error.stderr || error);
  }
  if (
    ["TS2305", "TS2322", "TS2304"].every((code) =>
      negativeOutput.includes(code),
    )
  ) {
    ok(
      `React ${major}: negative control rejects missing exports, invalid props and undeclared application state`,
    );
  } else {
    fail(
      `React ${major}: snippet compiler negative control did not reject all expected errors:\n${negativeOutput}`,
    );
  }
  try {
    run(
      path.join(app, "node_modules/.bin/tsc"),
      ["-p", "tsconfig.doc-snippets.json"],
      app,
    );
    ok(
      `React ${major}: all ${Object.keys(snippetMapping).length} exact Docs recipes compile against installed tarballs (strict NodeNext; library checking enabled)`,
    );
  } catch (error) {
    fail(
      `React ${major}: Docs recipes fail:\n${String(error.stdout || error.stderr || error).trim()}\nSource mapping: ${path.join(app, "doc-snippets-map.json")}`,
    );
  }

  const readmeDir = path.join(app, "readme");
  const modesDir = path.join(app, "module-modes");
  fs.mkdirSync(modesDir);
  const modesFixture = fs.readFileSync(
    path.join(PACKAGES, "react/tests/types/package-modes.ts"),
    "utf8",
  );
  for (const extension of ["mts", "cts"]) {
    fs.writeFileSync(
      path.join(modesDir, `consumer.${extension}`),
      modesFixture,
    );
  }
  for (const moduleMode of ["node16", "nodenext"]) {
    try {
      run(
        path.join(app, "node_modules/.bin/tsc"),
        [
          "--noEmit",
          "--strict",
          "--esModuleInterop",
          "--target",
          "es2022",
          "--module",
          moduleMode,
          "--moduleResolution",
          moduleMode,
          "module-modes/consumer.mts",
          "module-modes/consumer.cts",
        ],
        app,
      );
      ok(
        `React ${major}: strict ${moduleMode} ESM and CJS consumers (library checking enabled)`,
      );
    } catch (error) {
      fail(
        `React ${major}: ${moduleMode} declarations fail:\n${String(error.stdout || error.stderr || error).trim()}`,
      );
    }
  }
  fs.mkdirSync(readmeDir);
  for (const { file, body } of samples) {
    // Every sample is its own module, as it would be in an app.
    fs.writeFileSync(path.join(readmeDir, file), `${body}\nexport {};\n`);
  }
  // Positive AND negative public API assertions against the actual installed
  // declarations, under each supported React major (not source aliases).
  fs.copyFileSync(
    path.join(PACKAGES, "react/tests/types/native-button.tsx"),
    path.join(readmeDir, "native-button-contract.tsx"),
  );
  // What a README sample leaves to the reader — the app it wraps, where
  // analytics events go — and what a bundler provides: a type for CSS imports.
  fs.writeFileSync(
    path.join(readmeDir, "reader.d.ts"),
    `declare const app: import("react").ReactNode;
declare function send(events: unknown[]): void;
declare module "*.css";
`,
  );
  fs.writeFileSync(
    path.join(app, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          noEmit: true,
          jsx: "react-jsx",
          module: "esnext",
          moduleResolution: "bundler",
          target: "es2022",
          skipLibCheck: true,
        },
        include: ["readme"],
      },
      null,
      2,
    ),
  );
  try {
    run(
      path.join(app, "node_modules", ".bin", "tsc"),
      ["-p", "tsconfig.json"],
      app,
    );
    ok(
      `React ${major}: ${samples.length} README code sample(s) and the native Button API contract type-check against the installed packages`,
    );
  } catch (error) {
    const lines = String(error.stdout || error.stderr || error)
      .trim()
      .split("\n")
      .filter((line) => line.includes("error TS"))
      .slice(0, 5);
    fail(
      `React ${major}: README samples or native Button API contract do not type-check:\n          ${lines.join("\n          ")}`,
    );
  }
}

if (problems.length === 0) {
  if (releasePlan) {
    writeCandidate(
      releaseOptions["release-output"],
      releaseOptions["release-sha"],
      releasePlan,
      packed,
    );
    ok(
      `tested release candidate retained at ${releaseOptions["release-output"]}`,
    );
  }
  fs.rmSync(work, { recursive: true, force: true });
} else {
  console.log(`\n  The install is kept for inspection at ${work}`);
}
finish();
