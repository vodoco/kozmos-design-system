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
import semver from "semver";
import { writeCandidate } from "./release/candidate.mjs";
import { unexpectedFiles } from "./release/tarball-files.mjs";
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

// What a package may contain at all, by kind: release/tarball-files.mjs.

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
    // npm packs a listed file only if it is there, and says nothing if not.
    ...(manifest.files ?? [])
      .filter((entry) => entry === "THIRD-PARTY-NOTICES")
      .map((entry) => `package/${entry}`),
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
  const unexpected = unexpectedFiles(files, manifest);
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
// The subpaths CommonJS can ask for too: those whose entry has a `require`
// condition, such as `@kozmos-ds/icons/vue`. Each must resolve through it as
// well as through `import`.
const requireSpecifiers = [];
for (const { manifest, files } of packed) {
  for (const [key, target] of Object.entries(manifest.exports ?? {})) {
    if (!key.includes("*")) {
      const specifier =
        key === "." ? manifest.name : `${manifest.name}${key.slice(1)}`;
      specifiers.push(specifier);
      if (target && typeof target === "object" && target.require) {
        requireSpecifiers.push(specifier);
      }
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
// A README's `vue` blocks are single-file components: the Vue-only consumer
// below type-checks them with vue-tsc, strict templates on.
const vueSamples = [];
for (const { manifest } of packed) {
  const short = manifest.name.split("/")[1];
  const readme = fs.readFileSync(
    path.join(PACKAGES, short, "README.md"),
    "utf8",
  );
  for (const block of readme.matchAll(/```vue\n([\s\S]*?)```/g)) {
    vueSamples.push({
      file: `Readme${short.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}${vueSamples.length + 1}.vue`,
      body: block[1],
    });
  }
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
for (const spec of ${JSON.stringify(requireSpecifiers)}) {
  try {
    results.push([fs.existsSync(require.resolve(spec)), "require.resolve(" + spec + ")"]);
  } catch (error) {
    results.push([false, "require.resolve(" + spec + ") — " + error.message]);
  }
}

// The contracts' runtime API is the travel-time rule (decision 50) and nothing
// else: a new runtime export is a decision, and this list is where it shows.
const contractsRuntime = "travelTimeBand,travelTimeTone";
for (const name of ${JSON.stringify(requirable)}) {
  try {
    const exports = require(name);
    results.push([name === "@kozmos-ds/product-contracts" ? Object.keys(exports).sort().join() === contractsRuntime : Object.keys(exports).length > 0, "require(" + name + ") returns its exports (contracts: " + contractsRuntime + " only)"]);
  } catch (error) {
    results.push([false, "require(" + name + ") — " + error.message]);
  }
}
try {
  const required = require("@kozmos-ds/product-contracts");
  const imported = await import("@kozmos-ds/product-contracts");
  results.push([
    [required, imported].every((contracts) =>
      contracts.travelTimeBand(45) === "nearby" &&
      contracts.travelTimeBand(120) === "oneToTwoMinutes" &&
      contracts.travelTimeBand(121) === "twoToFiveMinutes" &&
      contracts.travelTimeBand(Number.NaN) === undefined &&
      contracts.travelTimeTone("nearby") === "success" &&
      contracts.travelTimeTone("moreThanTenMinutes") === "neutral"),
    "the installed contracts band a walk, as require() and import() alike",
  ]);
} catch (error) {
  results.push([false, "the installed contracts band a walk — " + error.message]);
}

console.warn = () => {};
const kozmos = await import("@kozmos-ds/react");
const html = renderToStaticMarkup(
  createElement(kozmos.Button, { emotion: "success" }, createElement(kozmos.Icon, { name: "check" }), "Save"),
);
results.push([html.includes("<button") && html.includes("Save") && html.includes("<svg"), "renders a Button with an Icon on the server"]);

// React prints its server-render warnings, such as a layout effect's under
// React 18 (0.13.0's Calendar), through console.error.
const serverErrors = [];
const consoleError = console.error;
console.error = (...args) => serverErrors.push(String(args[0]).split("\\n")[0]);
const calendar = renderToStaticMarkup(
  createElement(kozmos.Calendar, { defaultMonth: "2026-10", locale: "en-GB" }),
);
console.error = consoleError;
results.push([
  calendar.includes('role="grid"') && calendar.includes("October 2026") && serverErrors.length === 0,
  "renders a Calendar on the server without a warning" + (serverErrors.length ? " — " + serverErrors[0] : ""),
]);

// toast() and Toaster (GAP-167): a module's state on a server is every
// request's, so a call there queues nothing, and a Toaster renders, in a
// ThemeProvider and out of one, with no warning and no toast.
serverErrors.length = 0;
console.error = (...args) => serverErrors.push(String(args[0]).split("\\n")[0]);
try {
  let dismissed = 0;
  const id = kozmos.toast("From a request", { onDismiss: () => (dismissed += 1) });
  kozmos.toast.dismiss();
  const toaster =
    renderToStaticMarkup(createElement(kozmos.ThemeProvider, { theme: "light" }, createElement(kozmos.Toaster))) +
    renderToStaticMarkup(createElement(kozmos.Toaster));
  results.push([
    typeof id === "string" && dismissed === 0 && !toaster.includes("From a request") && serverErrors.length === 0,
    "renders a Toaster on the server without a warning, and toast() there queues nothing" +
      (serverErrors.length ? " — " + serverErrors[0] : dismissed ? " — a server call was queued" : ""),
  ]);
} catch (error) {
  results.push([false, "renders a Toaster on the server — " + error.message]);
}
console.error = consoleError;

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
        `React ${major}: installs, ${specifiers.length} export(s) resolve, ${requireSpecifiers.length} through require too, ${requirable.length} CommonJS entr(y/ies) load, a Button, a Calendar and a Toaster render on the server, with no warning`,
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

// ---- a Vue-only consumer: @kozmos-ds/icons/vue with no React installed ----
//
// The icons tarball and Vue, nothing else: React is an optional peer of
// icons, so it must not arrive. Vue is the version the repository's lockfile
// resolves for icons, and the packages under it are held to the lockfile's
// versions too, so the install reads only what the pnpm store already holds:
// offline here, preferring the store on CI, whose install step reaches the
// registry anyway. Then the Vue entry is imported and required and an icon
// rendered on the server, and vue-tsc, strict templates on, checks the
// README's `vue` blocks and a component passing the attributes an icon takes
// beside its props.

const iconsPacked = packed.find(
  ({ manifest }) => manifest.name === "@kozmos-ds/icons",
);
if (iconsPacked && iconsPacked.manifest.exports?.["./vue"]) {
  checkVueOnlyConsumer(iconsPacked);
}

function lockedTree(name, from) {
  // Every package under `name`, at the version installed for `from`.
  const versions = {};
  const visit = (pkg, dir) => {
    let real;
    for (let at = dir; ; at = path.dirname(at)) {
      const candidate = path.join(at, "node_modules", pkg);
      if (fs.existsSync(path.join(candidate, "package.json"))) {
        real = fs.realpathSync(candidate);
        break;
      }
      if (path.dirname(at) === at) return;
    }
    const manifest = JSON.parse(
      fs.readFileSync(path.join(real, "package.json"), "utf8"),
    );
    if (versions[manifest.name] === manifest.version) return;
    versions[manifest.name] = manifest.version;
    for (const dep of Object.keys(manifest.dependencies ?? {})) {
      visit(dep, real);
    }
  };
  visit(name, from);
  return versions;
}

function checkVueOnlyConsumer({ tarball, manifest }) {
  // The real folder: in the release fixture `packages` is a symlink, and the
  // repository's own pnpm (its packageManager) and store are found from here.
  const iconsDir = fs.realpathSync(path.join(PACKAGES, "icons"));
  const tree = lockedTree("vue", iconsDir);
  const { vue: vueVersion, ...under } = tree;
  if (!vueVersion) {
    fail("Vue only: vue is not installed for packages/icons; run pnpm install");
    return;
  }
  // The peer range promises what this check tests: its floor is the minor
  // installed here. Until 5 Nov it said ^3.4.0 while only 3.5.44 had run.
  const floor = semver.minVersion(manifest.peerDependencies?.vue ?? "*");
  if (
    !floor ||
    semver.major(floor) !== semver.major(vueVersion) ||
    semver.minor(floor) !== semver.minor(vueVersion)
  ) {
    fail(
      `Vue only: icons' vue peer (${manifest.peerDependencies?.vue}) starts at ${floor}, but the version tested is ${vueVersion}`,
    );
  }
  const app = path.join(work, "vue-only");
  fs.mkdirSync(app);
  const rootManifest = JSON.parse(
    fs.readFileSync(path.join(iconsDir, "..", "..", "package.json"), "utf8"),
  );
  fs.writeFileSync(
    path.join(app, "package.json"),
    JSON.stringify(
      {
        name: "kozmos-install-check-vue-only",
        private: true,
        type: "module",
        packageManager: rootManifest.packageManager,
        dependencies: { "@kozmos-ds/icons": `file:${tarball}`, vue: vueVersion },
        pnpm: { overrides: under },
      },
      null,
      2,
    ),
  );
  let store;
  try {
    store = path.dirname(run("pnpm", ["store", "path"], iconsDir).trim());
    run(
      "pnpm",
      [
        "install",
        process.env.CI ? "--prefer-offline" : "--offline",
        "--ignore-scripts",
        "--config.auto-install-peers=true",
        "--store-dir",
        store,
      ],
      app,
    );
  } catch (error) {
    // pnpm writes its ERR_ line to stdout.
    const said = `${error.stdout ?? ""}\n${error.stderr ?? ""}`
      .split("\n")
      .filter((line) => /ERR_PNPM|error/i.test(line))
      .slice(0, 3);
    fail(
      `Vue only: pnpm install failed: ${said.join(" / ") || String(error).split("\n")[0]}`,
    );
    return;
  }

  const installed = fs.readdirSync(path.join(app, "node_modules", ".pnpm"));
  const reactInstalled = installed.filter((dir) =>
    /^(react|react-dom)@/.test(dir),
  );
  if (fs.existsSync(path.join(app, "node_modules", "react")) || reactInstalled.length) {
    fail(`Vue only: React was installed with icons: ${reactInstalled.join(", ")}`);
  }

  fs.writeFileSync(
    path.join(app, "probe.mjs"),
    `import { createRequire } from "node:module";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { Calendar } from "@kozmos-ds/icons/vue";

const require = createRequire(import.meta.url);
const results = [];
const render = async (Icon) =>
  renderToString(createSSRApp({ render: () => h(Icon, { size: 20, class: "icon", "aria-label": "Calendar" }) }));
const svg = /^<svg [^>]*width="20"[^>]*class="icon"[^>]*aria-label="Calendar"[^>]*>.*<path d="[^"]+"/;
results.push([svg.test(await render(Calendar)), "import { Calendar } from @kozmos-ds/icons/vue renders an <svg> on the server"]);
const cjs = require("@kozmos-ds/icons/vue");
results.push([svg.test(await render(cjs.Calendar)), "require(@kozmos-ds/icons/vue).Calendar renders the same"]);
results.push([Object.keys(cjs).length === Object.keys(await import("@kozmos-ds/icons/vue")).length, "require() and import() give the same exports"]);
try {
  await import("react");
  results.push([false, "react is importable"]);
} catch (error) {
  results.push([error.code === "ERR_MODULE_NOT_FOUND", "react is not importable (" + error.code + ")"]);
}
process.stdout.write(JSON.stringify(results));
`,
  );
  try {
    const results = JSON.parse(run("node", ["probe.mjs"], app));
    const failed = results.filter(([passed]) => !passed);
    for (const [, what] of failed) fail(`Vue only: ${what}`);
    if (failed.length === 0) {
      ok(
        `Vue only: icons and vue ${vueVersion} install with no React; @kozmos-ds/icons/vue imports, requires and renders on the server`,
      );
    }
  } catch (error) {
    fail(
      `Vue only: the probe crashed: ${String(error.stderr || error)
        .trim()
        .split("\n")
        .slice(0, 3)
        .join(" / ")}`,
    );
  }

  // vue-tsc, strict templates on: the README's vue blocks, and a component
  // giving an icon the attributes it takes beside its props, which must
  // type-check; and a negative control, which must not.
  for (const { file, body } of vueSamples) {
    fs.writeFileSync(path.join(app, file), body);
  }
  fs.writeFileSync(
    path.join(app, "IconAttributes.vue"),
    `<script setup lang="ts">
import { Calendar, Heart, getIconComponent } from "@kozmos-ds/icons/vue";

const Back = getIconComponent("back");
</script>

<template>
  <Calendar :size="20" aria-label="Calendar" role="img" class="icon" />
  <Heart aria-hidden="true" :stroke-width="1.5" color="red" style="vertical-align: middle" />
  <component :is="Back" :size="24" aria-describedby="hint" />
</template>
`,
  );
  const tsconfig = (include) =>
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        jsx: "preserve",
        types: [],
      },
      vueCompilerOptions: { strictTemplates: true },
      include,
    });
  fs.writeFileSync(
    path.join(app, "tsconfig.json"),
    tsconfig(["IconAttributes.vue", ...vueSamples.map(({ file }) => file)]),
  );
  fs.writeFileSync(
    path.join(app, "NegativeControl.vue"),
    `<script setup lang="ts">
import { Calendar } from "@kozmos-ds/icons/vue";
</script>

<template>
  <Calendar :size="{ width: 20 }" />
</template>
`,
  );
  fs.writeFileSync(
    path.join(app, "tsconfig.negative.json"),
    tsconfig(["NegativeControl.vue"]),
  );
  const vueTsc = path.join(
    path.dirname(
      fs.realpathSync(
        path.join(PACKAGES, "vue", "node_modules", "vue-tsc", "package.json"),
      ),
    ),
    "bin",
    "vue-tsc.js",
  );
  let negativeRejected = false;
  try {
    run("node", [vueTsc, "-p", "tsconfig.negative.json"], app);
  } catch (error) {
    negativeRejected = /error TS/.test(String(error.stdout || error.stderr));
  }
  if (!negativeRejected) {
    fail("Vue only: vue-tsc accepted a negative control it must reject");
  }
  try {
    run("node", [vueTsc, "-p", "tsconfig.json"], app);
    if (negativeRejected) {
      ok(
        `Vue only: vue-tsc (strict templates) accepts ${vueSamples.length} README vue sample(s) and an icon's attributes, and rejects a negative control`,
      );
    }
  } catch (error) {
    const lines = String(error.stdout || error.stderr || error)
      .trim()
      .split("\n")
      .filter((line) => line.includes("error TS"))
      .slice(0, 5);
    fail(
      `Vue only: README vue samples or an icon's attributes do not type-check:\n          ${lines.join("\n          ")}`,
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
