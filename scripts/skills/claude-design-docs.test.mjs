/**
 * The Claude Design docs, held to what they promise (decision 52; the gap
 * register's GAP-089 and GAP-090).
 *
 * These read the committed files in docs/claude-design, not the generator's
 * output, so they fail on a repository that has no cards, or cards that stop
 * a few props in as the artifact's did (POIResultCard showed 3 of its props;
 * AdaptiveMapShell stopped at onPanelDetentChange). `pnpm skills:check` runs
 * them after it has checked that the files are the generator's own.
 *
 * They need the built declarations: `pnpm --filter "@kozmos-ds/react..." build`.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { describeComponent, readPublishedApi } from "./claude-design-api.mjs";
import { CARDS_DIR, OUT_DIR } from "./claude-design-docs.mjs";
import { compileModules } from "./claude-design-typescript.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const api = readPublishedApi(root);

test("component pages do not retain the generic generated description placeholder", () => {
  const directory = path.join(root, "packages/react/src/components");
  const placeholders = [];
  for (const name of fs.readdirSync(directory)) {
    const file = path.join(directory, name, `${name}.mdx`);
    if (!fs.existsSync(file)) continue;
    if (
      /Displays the .+ interface topology natively\./.test(
        fs.readFileSync(file, "utf8"),
      )
    ) {
      placeholders.push(name);
    }
  }
  assert.deepEqual(
    placeholders,
    [],
    "Describe the component's actual purpose instead of boilerplate",
  );
});

test("the API changelog directs 0.x upgrades to release migration notes", () => {
  const text = fs.readFileSync(
    path.join(root, ".ai-skills/api-changelog.md"),
    "utf8",
  );
  const preamble = text.split(/^## /m)[0].replace(/\s+/g, " ");
  // A pre-1.0 version is not evidence that an upgrade needs no migration:
  // exhaustive switches and changed defaults already require consumer work.
  assert.doesNotMatch(
    preamble,
    /nothing to migrate|no breaking-change migration/i,
    "0.x must not be presented as a guarantee that migrations are unnecessary",
  );
  assert.match(preamble, /follow each release's migration notes/i);
  assert.match(preamble, /0\.x releases can change APIs and behaviour/i);
  assert.match(preamble, /automated codemods are not guaranteed/i);
});

/** The sections of a card that are not one of its parts. */
const NOT_PARTS = new Set([
  "Example",
  "Types these props take",
  "Also exported",
]);

/** Each card: its title, its parts with the props each lists, its code blocks. */
function readCards() {
  const dir = path.join(root, CARDS_DIR);
  const cards = new Map();
  if (!fs.existsSync(dir)) return cards;
  for (const file of fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()) {
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    const parts = new Map();
    let part = null;
    for (const line of text.split("\n")) {
      const heading = line.match(/^## (.+)$/);
      if (heading) {
        part = NOT_PARTS.has(heading[1]) ? null : heading[1];
        if (part) parts.set(part, new Map());
        continue;
      }
      const prop = line.match(/^- `([^`]+)`: (.*)$/);
      if (part && prop) parts.get(part).set(prop[1], prop[2]);
    }
    cards.set(file.replace(/\.md$/, ""), {
      text,
      title: text.match(/^# (.+)$/m)?.[1],
      parts,
      tsx: [...text.matchAll(/^```tsx\n([\s\S]*?)^```$/gm)].map((m) => m[1]),
    });
  }
  return cards;
}

const cards = readCards();
const partsListed = new Map(
  [...cards].flatMap(([card, { parts }]) =>
    [...parts].map(([name, props]) => [name, { card, props }]),
  ),
);

test("every component @kozmos-ds/react exports has a part in a card", () => {
  const components = [...api.entries.values()]
    .filter((e) => e.component)
    .map((e) => e.name);
  assert.ok(
    components.length > 200,
    `only ${components.length} component exports were read`,
  );
  const missing = components.filter((name) => !partsListed.has(name));
  assert.deepEqual(
    missing,
    [],
    `${missing.length} of ${components.length} component exports have no card`,
  );
});

test("every part lists every prop the built declarations give it", () => {
  assert.ok(partsListed.size > 0, "no card lists a part");
  const short = [];
  for (const [name, { card, props }] of partsListed) {
    if (!api.entries.get(name)?.component) {
      short.push(
        `${card}.md has a part ${name}, which the package does not export as a component`,
      );
      continue;
    }
    for (const prop of describeComponent(api, name).props)
      if (!props.has(prop.name))
        short.push(`${card}.md: ${name} does not list ${prop.name}`);
  }
  assert.deepEqual(short, []);
});

test("POIResultCard's card lists its whole API, the contract fields its props take and their defaults", () => {
  const card = cards.get("POIResultCard");
  assert.ok(card, "docs/claude-design/components/POIResultCard.md is missing");
  const props = card.parts.get("POIResultCard");
  assert.ok(props, "the card has no POIResultCard section");
  // The set this card must carry, known ahead of the build: the artifact's
  // card showed three of them.
  for (const name of [
    "poi",
    "result",
    "onSelect",
    "onAction",
    "featuredLabel",
    "selectionLabel",
    "actionsLabel",
    "currentFloorId",
    "appearance",
  ])
    assert.ok(props.has(name), `POIResultCard's card does not list ${name}`);
  for (const required of ["poi", "result", "onSelect"])
    assert.match(
      props.get(required),
      /\*\*required\*\*/,
      `${required} is not marked required`,
    );
  assert.match(
    props.get("appearance"),
    /^`"card" \| "row"`, optional, default `"card"`\./,
  );
  assert.match(props.get("featuredLabel"), /default `"Featured"`/);
  // What a result says (unitLabel, summary, its actions) is the result's:
  // the card shows the contract its `result` prop takes, field by field.
  const contract = card.text.split("### POIResultPresentation")[1] ?? "";
  for (const field of [
    "unitLabel",
    "summary",
    "actions",
    "badge",
    "match",
    "selected",
    "featured",
    "travelEstimate",
  ])
    assert.match(
      contract,
      new RegExp(`\\b${field}\\??:`),
      `POIResultPresentation.${field} is not in the card`,
    );
  assert.equal(card.tsx.length, 1, "the card should carry exactly one example");
  const element = card.tsx[0].match(/<POIResultCard\b[\s\S]*?\/>/)?.[0] ?? "";
  for (const required of ["poi", "result", "onSelect"])
    assert.match(
      element,
      new RegExp(`\\b${required}=`),
      `the example leaves out ${required}`,
    );
});

test("AdaptiveMapShell's card goes on past onPanelDetentChange, to the last prop", () => {
  const props = cards.get("AdaptiveMapShell")?.parts.get("AdaptiveMapShell");
  assert.ok(props, "the AdaptiveMapShell card or its section is missing");
  const names = [...props.keys()];
  const at = names.indexOf("onPanelDetentChange");
  assert.ok(at !== -1, "onPanelDetentChange is not listed");
  for (const name of [
    "panelFraction",
    "panelSizing",
    "panelSurface",
    "collisionInsets",
    "safeAreaInsets",
    "deviceSafeAreaInsets",
    "controlsPadCamera",
    "usableRegions",
    "onCollisionInsetsChange",
    "onLayoutChange",
  ])
    assert.ok(
      names.indexOf(name) > at,
      `${name} is not listed after onPanelDetentChange`,
    );
  assert.match(props.get("map"), /\*\*required\*\*/);
});

test("no card counts the attributes it inherits from React or framer-motion", () => {
  // Those counts are facts about whichever @types/react and framer-motion a
  // machine resolves, not about Kozmos: on 2026-09-29 one tree gave
  // DynamicIsland 258 of React's attributes on a pull request's run and 272
  // on main's, so the freshness check failed on main with nothing changed.
  // The cards name what a part inherits; they do not count it.
  const counted = [];
  for (const file of fs.readdirSync(path.join(root, CARDS_DIR)))
    if (file.endsWith(".md")) {
      const text = fs.readFileSync(path.join(root, CARDS_DIR, file), "utf8");
      for (const match of text.matchAll(
        /the \d+ (attributes React's DOM types give it|animation props)/g,
      ))
        counted.push(`${file}: ${match[0]}`);
    }
  assert.deepEqual(counted, []);
});

test("every card carries one example, in a ThemeProvider, that renders its component", () => {
  const problems = [];
  for (const [name, card] of cards) {
    if (card.title !== name)
      problems.push(`${name}.md is titled ${card.title}`);
    if (card.tsx.length !== 1)
      problems.push(`${name}.md has ${card.tsx.length} examples`);
    const [example = ""] = card.tsx;
    const parts = [...card.parts.keys()];
    if (!parts.some((part) => new RegExp(`<${part}[\\s>/]`).test(example)))
      problems.push(`${name}.md's example renders none of its parts`);
    if (!/<(ThemeProvider|DesignConfigProvider|KozmosTheme)[\s>]/.test(example))
      problems.push(`${name}.md's example is outside a ThemeProvider`);
  }
  assert.ok(cards.size > 0, "there are no cards");
  assert.deepEqual(problems, []);
});

test("every example in the docs compiles against the built declarations", () => {
  const modules = new Map();
  for (const [name, card] of cards)
    card.tsx.forEach((code, i) => modules.set(`${name}.${i}`, code));
  const readme = path.join(root, OUT_DIR, "README.md");
  const readmeText = fs.existsSync(readme)
    ? fs.readFileSync(readme, "utf8")
    : "";
  [...readmeText.matchAll(/^```tsx\n([\s\S]*?)^```$/gm)].forEach((m, i) =>
    modules.set(`README.${i}`, m[1]),
  );
  assert.ok(
    modules.size > cards.size,
    `only ${modules.size} examples to compile`,
  );
  const failing = [...compileModules(root, modules)].filter(
    ([, diagnostics]) => diagnostics.length,
  );
  assert.deepEqual(
    failing.map(([name, diagnostics]) => `${name}: ${diagnostics.join(" / ")}`),
    [],
  );
});

test("the compile check fails an example that is wrong", () => {
  // A missing export, a prop value the component does not take, a required
  // prop left out: each must be an error, or a pass above proves nothing.
  const results = compileModules(
    root,
    new Map([
      [
        "missing-export",
        `import { NotAKozmosPart } from "@kozmos-ds/react";\nexport const a = <NotAKozmosPart />;\n`,
      ],
      [
        "bad-value",
        `import { POIResultCard } from "@kozmos-ds/react";\nexport const b = <POIResultCard appearance="tile" poi={{ id: "a", name: "A", media: [], actions: [] }} result={{ poiId: "a", resultIndex: 0, selected: false, featured: false }} onSelect={() => {}} />;\n`,
      ],
      [
        "missing-prop",
        `import { AdaptiveMapShell } from "@kozmos-ds/react";\nexport const c = <AdaptiveMapShell />;\n`,
      ],
    ]),
  );
  assert.match(results.get("missing-export").join(" "), /TS2305/);
  assert.match(results.get("bad-value").join(" "), /TS2322/);
  assert.match(results.get("missing-prop").join(" "), /TS2741/);
});

test("the consuming page names the global, the files, the provider, the cards and the types", () => {
  const readme = path.join(root, OUT_DIR, "README.md");
  assert.ok(fs.existsSync(readme), `${OUT_DIR}/README.md is missing`);
  const text = fs.readFileSync(readme, "utf8");
  assert.match(text, /^## Consuming this system$/m);
  for (const phrase of [
    "window.Kozmos",
    "components/bundle.css",
    "components/bundle.js",
    "React 18",
    "ThemeProvider",
    "@kozmos-ds/react/style.css",
    "index.d.ts",
    "components/<Name>.md",
    "x-import",
  ])
    assert.ok(
      text.includes(phrase),
      `the consuming page does not mention ${phrase}`,
    );
  // The bundle comes after the stylesheet and the page's React, in that order.
  const order = [
    "components/bundle.css",
    "React 18",
    "components/bundle.js",
  ].map((p) => text.indexOf(p, text.indexOf("The load order")));
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
    "the load order is not stylesheet, React, bundle",
  );
  for (const [name] of cards)
    assert.ok(
      text.includes(`(components/${name}.md)`),
      `the index does not link ${name}`,
    );
});
