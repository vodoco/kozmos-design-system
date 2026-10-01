#!/usr/bin/env node
/**
 * Generates the site's component data from the design system's own sources,
 * so the site never restates by hand what the repository already says:
 *
 *  - every component, its lane, and where it exists — React, SwiftUI,
 *    Compose, and Figma through Code Connect — from the status script,
 *    scripts/skills/check-completion.ts, the one that writes the
 *    repository's status report, run with `--json`;
 *  - each component's description: the first paragraph of its .mdx docs,
 *    or failing that the doc comment on the component itself;
 *  - where its page is in Storybook, which is the component reference
 *    (decision 44): the docs page its .mdx attaches to its stories
 *    (`<Meta of={…} />`), named as Storybook names it, or its first story
 *    when it has no docs page.
 *
 * Output (gitignored, rebuilt by `pnpm generate` before dev, build and
 * typecheck): src/generated/components.json, and a copy of the tokens
 * package's contrast contract.
 *
 *   node scripts/generate-reference.mjs            # write
 *   node scripts/generate-reference.mjs --check    # fail if the output would change
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const SITE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPO_ROOT = path.resolve(SITE_ROOT, "..", "..");
const COMPONENTS_DIR = path.join(REPO_ROOT, "packages/react/src/components");
const STATUS_SCRIPT = path.join(
  REPO_ROOT,
  "scripts/skills/check-completion.ts",
);
const CONTRAST_CONTRACT = path.join(
  REPO_ROOT,
  "packages/tokens/src/contrast-contract.json",
);
const OUT_DIR = path.join(SITE_ROOT, "src/generated");

/** The lanes' names as the site writes them, in sentence case. */
export const LANES = {
  core: "Core",
  "code-only": "Code-only / utility",
  "product-sdk": "Product / SDK",
  "platform-form-factor": "Platform / form factor",
};

/** PascalCase to kebab-case, keeping acronyms whole: POIDetailPanel → poi-detail-panel. */
export function slugOf(name) {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

// ---- Where each component exists --------------------------------------------

/**
 * The status script's own report, as JSON: its lanes and, per component,
 * which files it found on each platform. Run through tsx, as the repository
 * runs it everywhere else.
 */
export function readStatusReport() {
  const require = createRequire(import.meta.url);
  const output = execFileSync(
    process.execPath,
    [require.resolve("tsx/cli"), STATUS_SCRIPT, "--json"],
    { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  return JSON.parse(output);
}

/**
 * What exists, platform by platform, from one component's status.
 *
 *  - React, SwiftUI, Compose: `implemented` where the platform's library has
 *    the component's source (React's must also be exported by the package),
 *    otherwise `not-yet`.
 *  - Figma: `linked` where a Code Connect mapping ties the component to a
 *    real node in the Figma library; `not-expected` where the status script
 *    says a component has no Figma component set by design (a provider, a
 *    typography primitive, a nonvisual utility); otherwise `not-yet`.
 *
 * Nothing says a component will never reach SwiftUI or Compose, so those are
 * never `not-expected`: the status script would have to say so first.
 */
export function platformsOf(status) {
  return {
    react:
      status.web.component && status.web.exported ? "implemented" : "not-yet",
    swiftui: status.ios.component ? "implemented" : "not-yet",
    compose: status.android.component ? "implemented" : "not-yet",
    figma: !status.codeConnectApplicable
      ? "not-expected"
      : status.web.codeConnect ||
          status.ios.codeConnect ||
          status.android.codeConnect
        ? "linked"
        : "not-yet",
  };
}

// ---- What each component is ---------------------------------------------------

/**
 * The former placeholder introduction (GAPS.md, GAP-81). Keep rejecting it
 * if it returns: it says nothing, so it counts as no description.
 */
const PLACEHOLDER = /^Displays the \S+ interface topology natively\.$/;

/**
 * The first paragraph after the mdx's title: prose, not an import, a JSX
 * block or a heading. Markdown emphasis is dropped; inline code is kept.
 * A placeholder is no description.
 */
export function readDescription(mdx) {
  const lines = mdx.split("\n");
  const title = lines.findIndex((line) => /^#\s+\S/.test(line));
  const paragraph = [];
  for (const line of lines.slice(title + 1)) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (paragraph.length) break;
      continue;
    }
    if (/^(import |<|#|export )/.test(trimmed)) {
      if (paragraph.length) break;
      continue;
    }
    paragraph.push(trimmed);
  }
  const text = paragraph
    .join(" ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2");
  return PLACEHOLDER.test(text) ? "" : text;
}

/**
 * The first paragraph of the doc comment on the declaration named `name` in
 * a component's source: `const Name = …`, `function Name`, `class Name`.
 */
export function readDocComment(source, name) {
  const file = ts.createSourceFile(
    "component.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  for (const statement of file.statements) {
    const named =
      (ts.isVariableStatement(statement) &&
        statement.declarationList.declarations.some(
          (declaration) =>
            ts.isIdentifier(declaration.name) && declaration.name.text === name,
        )) ||
      ((ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement)) &&
        statement.name?.text === name);
    if (!named) continue;
    const text = ts
      .getJSDocCommentsAndTags(statement)
      .filter((doc) => ts.isJSDoc(doc))
      .map((doc) =>
        typeof doc.comment === "string"
          ? doc.comment
          : ts.getTextOfJSDocComment(doc.comment),
      )
      .filter(Boolean)
      .join("\n")
      .trim();
    return text.split("\n\n")[0].replace(/\s*\n\s*/g, " ");
  }
  return "";
}

// ---- Where each component is in Storybook ----------------------------------

/** Storybook's own `sanitize` (storybook/internal/csf): a title or a name as part of an id. */
export function sanitize(string) {
  return string
    .toLowerCase()
    .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/** Storybook's `storyNameFromExport`: `InTheSearchRow` → `In The Search Row`. */
export function storyNameFromExport(key) {
  return key
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\./g, " ")
    .replace(/([^\n])([A-Z])([a-z])/g, (_, a, b, c) => `${a} ${b}${c}`)
    .replace(/([a-z])([A-Z])/g, (_, a, b) => `${a} ${b}`)
    .replace(/([a-z])([0-9])/gi, (_, a, b) => `${a} ${b}`)
    .replace(/([0-9])([a-z])/gi, (_, a, b) => `${a} ${b}`)
    .replace(/(\s|^)(\w)/g, (_, a, b) => `${a}${b.toUpperCase()}`)
    .replace(/ +/g, " ")
    .trim();
}

/** The stories file a component's docs attach to, from `<Meta of={X} />` and X's import. */
export function attachedStories(mdx) {
  const of = mdx.match(/<Meta\s+of=\{(\w+)\}/)?.[1];
  if (!of) return null;
  const from = mdx.match(
    new RegExp(`import\\s+\\*\\s+as\\s+${of}\\s+from\\s+["']([^"']+)["']`),
  )?.[1];
  return from ?? null;
}

/**
 * A stories file's title and its first story's export. The title is the
 * meta's `title: "Group/Name"`; a file without one written out cannot be
 * linked, and says so rather than linking somewhere wrong.
 */
export function readStories(source, file) {
  const title = source.match(/\btitle:\s*(["'])([^"'\n]+\/[^"'\n]+)\1/)?.[2];
  if (!title) throw new Error(`${file}: no "Group/Name" title in its meta`);
  const first = source.match(/^export const (\w+)/m)?.[1] ?? null;
  return { title, first };
}

/**
 * The `path` Storybook's address takes for a component: its docs page,
 * `/docs/<title>--docs`, when its .mdx attaches to its stories; otherwise its
 * first story, `/story/<title>--<story>`; `null` when it has no stories,
 * which only a component that is not on the web yet can lack.
 */
export function storybookPathOf(name) {
  const directory = path.join(COMPONENTS_DIR, name);
  const mdxPath = path.join(directory, `${name}.mdx`);
  const mdx = fs.existsSync(mdxPath) ? fs.readFileSync(mdxPath, "utf8") : "";
  const attached = attachedStories(mdx);
  const storiesPath = attached
    ? path.resolve(
        directory,
        attached.endsWith(".tsx") ? attached : `${attached}.tsx`,
      )
    : path.join(directory, `${name}.stories.tsx`);
  if (!fs.existsSync(storiesPath)) {
    // Docs that attach to a file that is not there are broken docs.
    if (attached) {
      throw new Error(
        `${name}: its docs attach to ${path.relative(REPO_ROOT, storiesPath)}, which does not exist`,
      );
    }
    return null;
  }
  const { title, first } = readStories(
    fs.readFileSync(storiesPath, "utf8"),
    path.relative(REPO_ROOT, storiesPath),
  );
  if (attached) return `/docs/${sanitize(title)}--docs`;
  if (!first) return null;
  return `/story/${sanitize(title)}--${sanitize(storyNameFromExport(first))}`;
}

// ---- The whole index ------------------------------------------------------

export function generate(report = readStatusReport()) {
  const known = new Set(Object.keys(LANES));
  const unknown = report.lanes.filter((lane) => !known.has(lane.id));
  if (unknown.length) {
    throw new Error(
      `The status script has lanes the site does not name: ${unknown.map((lane) => lane.id).join(", ")}`,
    );
  }
  const components = [...report.components]
    // One fixed locale, so every machine writes the same order.
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .map((status) => {
      // A component found only on a native platform has no React folder,
      // so no docs and no stories: its page says where it is, and no more.
      const directory = path.join(COMPONENTS_DIR, status.name);
      const onTheWeb = fs.existsSync(directory);
      const read = (file) =>
        fs.existsSync(path.join(directory, file))
          ? fs.readFileSync(path.join(directory, file), "utf8")
          : "";
      return {
        name: status.name,
        slug: slugOf(status.name),
        lane: status.lane,
        description:
          readDescription(read(`${status.name}.mdx`)) ||
          readDocComment(read(`${status.name}.tsx`), status.name),
        storybook: onTheWeb ? storybookPathOf(status.name) : null,
        platforms: platformsOf(status),
      };
    });
  return {
    lanes: Object.fromEntries(
      report.lanes.map((lane) => [
        lane.id,
        { title: LANES[lane.id], description: lane.description },
      ]),
    ),
    components,
  };
}

function writeIfChanged(file, content, check) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current === content) return false;
  if (check) return true;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return true;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const check = process.argv.includes("--check");
  const index = generate();
  const changed = [];
  const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
  if (
    writeIfChanged(path.join(OUT_DIR, "components.json"), json(index), check)
  ) {
    changed.push("components.json");
  }
  // The contrast contract, as CI checks it, for the colour page to measure.
  const contract = JSON.parse(fs.readFileSync(CONTRAST_CONTRACT, "utf8"));
  if (
    writeIfChanged(
      path.join(OUT_DIR, "contrast-contract.json"),
      json(contract),
      check,
    )
  ) {
    changed.push("contrast-contract.json");
  }
  // One file per component was the reference's; the index is all there is.
  const componentsDir = path.join(OUT_DIR, "components");
  if (fs.existsSync(componentsDir)) {
    if (!check) fs.rmSync(componentsDir, { recursive: true });
    changed.push("- components/");
  }
  if (check && changed.length) {
    console.error(
      `generate-reference: ${changed.length} file(s) out of date: ${changed.join(", ")}`,
    );
    process.exit(1);
  }
  const counts = Object.entries(
    index.components.reduce((totals, component) => {
      for (const [platform, state] of Object.entries(component.platforms)) {
        if (state === "implemented" || state === "linked")
          totals[platform] = (totals[platform] ?? 0) + 1;
      }
      return totals;
    }, {}),
  )
    .map(([platform, count]) => `${platform} ${count}`)
    .join(", ");
  console.log(
    `generate-reference: ${index.components.length} components (${counts})${changed.length ? `, ${changed.length} file(s) written` : ", unchanged"}.`,
  );
}
