import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const PLUGIN_MAIN = path.join(ROOT, "figma/foundations-importer/code.js");
const PLUGIN_UI = path.join(ROOT, "figma/foundations-importer/ui.html");

const syntaxCheck = spawnSync(process.execPath, ["--check", PLUGIN_MAIN], {
  stdio: "inherit",
});

if (syntaxCheck.status !== 0) {
  process.exit(syntaxCheck.status || 1);
}

const code = fs.readFileSync(PLUGIN_MAIN, "utf8");

function maskStringsAndComments(source) {
  let result = "";
  let index = 0;
  let state = "code";

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (state === "code") {
      if (char === "/" && next === "/") {
        result += "  ";
        index += 2;
        state = "line-comment";
        continue;
      }
      if (char === "/" && next === "*") {
        result += "  ";
        index += 2;
        state = "block-comment";
        continue;
      }
      if (char === '"' || char === "'" || char === "`") {
        result += " ";
        index += 1;
        state = char;
        continue;
      }
      result += char;
      index += 1;
      continue;
    }

    if (state === "line-comment") {
      result += char === "\n" ? "\n" : " ";
      index += 1;
      if (char === "\n") state = "code";
      continue;
    }

    if (state === "block-comment") {
      result += char === "\n" ? "\n" : " ";
      if (char === "*" && next === "/") {
        result += " ";
        index += 2;
        state = "code";
      } else {
        index += 1;
      }
      continue;
    }

    result += char === "\n" ? "\n" : " ";
    if (char === "\\") {
      if (next) {
        result += next === "\n" ? "\n" : " ";
        index += 2;
      } else {
        index += 1;
      }
      continue;
    }
    if (char === state) state = "code";
    index += 1;
  }

  return result;
}

const syntaxOnlyCode = maskStringsAndComments(code);
const unsupportedPatterns = [
  {
    label: "object/rest spread",
    pattern: /\.\.\./,
    reason:
      "Figma plugin sandbox parsing rejected spread syntax in this project.",
  },
  {
    label: "optional chaining",
    pattern: /\?\./,
    reason:
      "Avoid newer syntax in plugin main code; Figma uses its own parser.",
  },
  {
    label: "nullish coalescing",
    pattern: /\?\?/,
    reason:
      "Avoid newer syntax in plugin main code; Figma uses its own parser.",
  },
];

const failures = unsupportedPatterns.filter(({ pattern }) =>
  pattern.test(syntaxOnlyCode),
);

if (failures.length > 0) {
  console.error("Figma plugin compatibility check failed:");
  for (const failure of failures) {
    console.error(`- ${failure.label}: ${failure.reason}`);
  }
  process.exit(1);
}

/**
 * Every component a person can pick must be one the plugin knows how to build,
 * and every component it knows how to build must be pickable.
 *
 * `ui.html` says the same thing twice: a `<select>` of `<option>` values, and a
 * registry keyed by the same names carrying each one's build, update and
 * rebuild messages. MetaStrip's painter landed in the registry and not in the
 * select, so it was fully wired, stamped, verified — and absent from the only
 * menu that can start it. Nothing caught that, because everything else checks
 * the half that was right.
 */
const ui = fs.readFileSync(PLUGIN_UI, "utf8");

/**
 * The panel's own code lives in `ui.html`'s inline <script>, and nothing else
 * parses it: a registry entry that lost its closing `},` left the whole panel
 * dead (no menu, no buttons) while every other check stayed green. Parse each
 * inline script as the panel's browser would, and name the line that fails.
 */
const inlineScripts = [
  ...ui.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g),
].filter((match) => !/\ssrc\s*=/.test(match[1] || ""));
if (inlineScripts.length === 0) {
  console.error("Figma plugin UI check failed: ui.html has no inline <script> to parse.");
  process.exit(1);
}
for (const match of inlineScripts) {
  const startLine = ui.slice(0, match.index + match[0].indexOf(">") + 1).split("\n").length;
  try {
    // Parse only: a vm.Script compiles the source and runs nothing.
    new vm.Script(match[2], { filename: "ui.html", lineOffset: startLine - 1 });
  } catch (error) {
    const where = String(error.stack || "").split("\n")[0];
    console.error(`Figma plugin UI check failed: the inline <script> at ui.html:${startLine} does not parse.`);
    console.error(`- ${where}: ${error.message}`);
    process.exit(1);
  }
}

const optionKeys = new Set(
  [...ui.matchAll(/<option value="([A-Za-z0-9]+)"/g)].map((match) => match[1]),
);
const registryKeys = new Set(
  [...ui.matchAll(/([A-Za-z][A-Za-z0-9]*):\s*\{\s*\n\s*label:[^\n]*\n\s*build:/g)].map(
    (match) => match[1],
  ),
);

const notPickable = [...registryKeys].filter((key) => !optionKeys.has(key));
const notBuildable = [...optionKeys].filter((key) => !registryKeys.has(key));

if (notPickable.length > 0 || notBuildable.length > 0) {
  console.error("Figma plugin menu check failed:");
  for (const key of notPickable) {
    console.error(`- ${key}: has build/update/rebuild actions but no <option>, so nobody can select it.`);
  }
  for (const key of notBuildable) {
    console.error(`- ${key}: is in the dropdown but has no actions behind it.`);
  }
  process.exit(1);
}

// Network access: Figma reads manifest.json's networkAccess.allowedDomains
// as the only origins a plugin may fetch from, so it lists exactly the
// origins the plugin reads at Build and Update (SpriteIcon's atlas, decision
// 219), with a reason. Every https origin named in code.js or ui.html is one
// it may fetch, except the few that are only words in it: the SVG namespace
// and the Avatar set's placeholder Image URL, never fetched.
const MANIFEST = path.join(ROOT, "figma/foundations-importer/manifest.json");
const NEVER_FETCHED = new Set(["http://www.w3.org", "https://example.com"]);
{
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const uiSource = fs.readFileSync(PLUGIN_UI, "utf8");
  const named = new Set(
    [...(code + "\n" + uiSource).matchAll(/\bhttps?:\/\/[A-Za-z0-9.-]+/g)]
      .map((match) => match[0])
      .filter((origin) => !NEVER_FETCHED.has(origin)),
  );
  const access = manifest.networkAccess;
  const allowed = new Set((access && access.allowedDomains) || []);
  const problems = [];
  if (named.size > 0 && !access)
    problems.push(`manifest.json declares no networkAccess, and the plugin names ${[...named].join(", ")}.`);
  for (const origin of named)
    if (!allowed.has(origin))
      problems.push(`${origin} is named in the plugin but not in networkAccess.allowedDomains.`);
  for (const origin of allowed)
    if (!named.has(origin))
      problems.push(`${origin} is allowed but the plugin names no URL there: list exactly the origins it reads.`);
  if (access && !(typeof access.reasoning === "string" && access.reasoning.trim()))
    problems.push("networkAccess has no reasoning: say what the plugin reads there.");
  if (problems.length > 0) {
    console.error("Figma plugin network access check failed:");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
}

console.log(
  "Figma plugin compatibility ok (network access: exactly the origins the plugin names are allowed)",
);
