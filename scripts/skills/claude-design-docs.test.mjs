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
import {
  describeComponent,
  originOf,
  readPublishedApi,
} from "./claude-design-api.mjs";
import { CARDS_DIR, OUT_DIR } from "./claude-design-docs.mjs";
import { compileModules } from "./claude-design-typescript.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const api = readPublishedApi(root);

test("result API cards distinguish SDK numbering from legacy precedence", () => {
  for (const name of ["POIResultCard", "POIResultGroup", "POIResultList"]) {
    const text = fs.readFileSync(
      path.join(root, "docs/claude-design/components", `${name}.md`),
      "utf8",
    );
    const contract = text.split("interface POIResultPresentation {")[1];
    assert.ok(contract, `${name}: embedded result contract is present`);
    const numbering = contract.split("resultIndex: number;")[0];
    assert.match(numbering, /SDK/, `${name}: document the default numbering`);
    assert.match(numbering, /legacy/i, `${name}: scope the old precedence`);
    assert.doesNotMatch(numbering, /number is never drawn/);
    const badge = contract
      .split("badge?:")[0]
      .split("unavailableReason?: string;")[1];
    assert.match(
      badge,
      /SDK/,
      `${name}: numbered SDK badges retain their label`,
    );
    assert.match(
      badge,
      /legacy/i,
      `${name}: scope badge replacement to legacy`,
    );
  }
});

test("numbered list guidance documents combined tabs before legacy migration", () => {
  const text = fs.readFileSync(
    path.join(
      root,
      "packages/react/src/components/POIResultList/POIResultList.mdx",
    ),
    "utf8",
  );
  const numbered = text.split("## Numbered results: quick access")[1];
  assert.ok(numbered, "the numbered list guide exists");
  const [defaults, legacy] = numbered.split("**Legacy migration:**");
  assert.ok(legacy, "old precedence must be explicitly scoped to legacy");
  assert.match(defaults, /1234 ★ Featured/);
  assert.match(defaults, /1234 Alternative/);
  assert.doesNotMatch(
    defaults,
    /shows no number|number takes the place of a badge/i,
  );
  assert.doesNotMatch(text, /featured ones show their logo and no number/);
});

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

test("a part whose props are a union lists each member's type for a prop", () => {
  // Calendar's props are its single or its range props; the card gave only
  // the first one's types, so it told a reader that mode takes "single" and
  // value a string, and never the range (21 Oct 2026).
  const props = cards.get("Calendar")?.parts.get("Calendar");
  assert.ok(props, "the Calendar card or its section is missing");
  assert.match(props.get("mode"), /`"single" \| "range"`/);
  assert.match(props.get("value"), /`string \| null \| DateRangeValue`/);
  assert.match(
    props.get("onValueChange"),
    /`\(\(value: string\) => void\) \| \(\(value: DateRangeValue\) => void\)`/,
  );
});

test("a part whose props are a union lists every member's props, and which member takes each", () => {
  // RouteSummary's estimate and navigation layouts, Accordion's single and
  // multiple: the cards listed only what every member shares, so
  // RouteSummary's gave neither etaText nor the navigation layout's props,
  // Accordion's no collapsible, and a Radix prop only its first member's
  // type (5 Nov 2026). Read here from the checker, member by member, not
  // through describeComponent.
  const unlisted = new Set();
  for (const entry of api.entries.values()) {
    if (!entry.component?.propsType.isUnion()) continue;
    const listed = partsListed.get(entry.name)?.props;
    for (const member of entry.component.propsType.types)
      for (const symbol of api.checker.getPropertiesOfType(member)) {
        const file = symbol.declarations?.[0]?.getSourceFile().fileName;
        const origin = file ? originOf(file) : null;
        if (["key", "ref"].includes(symbol.name)) continue;
        if (origin === "react" || origin === "motion") continue;
        if (!listed?.has(symbol.name))
          unlisted.add(`${entry.name} does not list ${symbol.name}`);
      }
  }
  assert.deepEqual([...unlisted], []);
  const route = cards.get("RouteSummary")?.text ?? "";
  assert.match(
    route,
    /- `etaText`: `string`, optional\.\n\n {2}Only in `RouteSummaryEstimateProps`, where it is \*\*required\*\*\./,
  );
  assert.match(
    route,
    /- `destination`: `string`, optional\.\n\n {2}Only in `RouteSummaryNavigationProps`, where it is \*\*required\*\*\./,
  );
  assert.match(
    route,
    /- `distanceText`: `string`, optional\.\n\n {2}\*\*Required\*\* in `RouteSummaryEstimateProps`; optional in `RouteSummaryNavigationProps`\./,
  );
  const accordion = cards.get("Accordion");
  const props = accordion?.parts.get("Accordion");
  assert.ok(props, "the Accordion card or its section is missing");
  assert.match(
    props.get("type"),
    /^`'single' \| 'multiple'`, \*\*required\*\*/,
  );
  assert.match(props.get("value"), /^`string \| string\[\]`/);
  assert.match(
    accordion.text,
    /- `collapsible`: `boolean`, optional, default `false`\.\n\n {2}Only in `AccordionPrimitive\.AccordionSingleProps`\./,
  );
});

test("a union of props: Calendar's card says which member takes which type, and gives DateRangeValue", () => {
  const calendar = cards.get("Calendar")?.text ?? "";
  assert.match(
    calendar,
    /- `mode`: `"single" \| "range"`, optional, default `"single"`\.\n\n {2}\*\*Required\*\* in `CalendarRangeProps`; optional in `CalendarSingleProps`\. `"single"` in `CalendarSingleProps`; `"range"` in `CalendarRangeProps`\./,
  );
  assert.match(
    calendar,
    /`string \| null` in `CalendarSingleProps`; `DateRangeValue` in `CalendarRangeProps`\./,
  );
  // A type only a later member takes is shown with the others.
  assert.match(calendar, /### DateRangeValue\n\nFrom `@kozmos-ds\/react`\./);
});

test("describeComponent reads every member of a union of props as the compiler does", () => {
  // Cases no part has yet, each a way the first union reader went wrong
  // (independent review, 5 Nov 2026).
  const file = path.join(
    root,
    "packages/react/.claude-design-fixture/index.d.ts",
  );
  const text = `
import * as React from "react";
interface PlainA extends React.HTMLAttributes<HTMLDivElement> { kind: "a"; }
interface OwnTitleB extends React.HTMLAttributes<HTMLDivElement> {
  kind: "b";
  /** Kozmos's own title. */
  title: string;
}
export declare const OriginCase: React.ForwardRefExoticComponent<(PlainA | OwnTitleB) & React.RefAttributes<HTMLDivElement>>;
export interface OptProps { label: string; size?: "s" | "m"; }
export declare function OptionalParam(props?: OptProps): React.JSX.Element;
interface Base { shared?: string; }
export declare const Anon: React.ForwardRefExoticComponent<Base & ({ mode: "a"; v?: "x" | "y" } | { mode: "b"; w?: string[] })>;
interface DepA {
  kind: "a";
  /** @deprecated use other */
  old?: string;
}
interface DepB { kind: "b"; old?: string; }
export declare const DepCase: React.ForwardRefExoticComponent<DepA | DepB>;
interface ReqUndefA { kind: "a"; foo: undefined; }
interface ReqUndefB { kind: "b"; foo?: string; }
export declare const ReqUndef: React.ForwardRefExoticComponent<ReqUndefA | ReqUndefB>;
interface ForbidA { kind: "a"; bar?: undefined; }
interface ForbidB { kind: "b"; bar: string; }
export declare const Forbid: React.ForwardRefExoticComponent<ForbidA | ForbidB>;
interface DefA {
  kind: "a";
  /** @default "s" */
  size?: string;
}
interface DefB { kind: "b"; size?: string; }
export declare const DefCase: React.ForwardRefExoticComponent<DefA | DefB>;
export interface FnProps { getLabel?: (x: string) => string | undefined; }
export declare function FnPart(props: FnProps): React.JSX.Element;
interface DupA { kind: "a"; r: string | undefined; }
interface DupB { kind: "b"; r?: string; }
export declare const Dup: React.ForwardRefExoticComponent<DupA | DupB>;
interface GoneA {
  kind: "a";
  /** @deprecated use one */
  gone?: string;
}
interface GoneB {
  kind: "b";
  /** @deprecated use two */
  gone?: string;
}
export declare const Gone: React.ForwardRefExoticComponent<GoneA | GoneB>;
`;
  const fixture = readPublishedApi(root, {
    declarations: file,
    virtual: new Map([[file, text]]),
  });
  const prop = (part, name) => {
    const described = describeComponent(fixture, part);
    return {
      ...described.props.find((p) => p.name === name),
      inherited: described.summarised.react.includes(name),
    };
  };
  // Kozmos's own in one member, React's attribute in the other: listed.
  const title = prop("OriginCase", "title");
  assert.equal(title.inherited, false);
  assert.equal(title.origin, "kozmos");
  assert.equal(title.type, "string");
  assert.equal(
    title.where,
    "**Required** in `OwnTitleB`; optional in `PlainA`.",
  );
  // `props?: P` is P: its required prop stays required, with no note.
  const label = prop("OptionalParam", "label");
  assert.equal(label.required, true);
  assert.equal(label.where, null);
  // A member with no name is named by its discriminant.
  assert.equal(prop("Anon", "v").where, 'Only in `{ mode: "a" }`.');
  // One member's deprecation is that member's.
  const old = prop("DepCase", "old");
  assert.equal(old.deprecated, null);
  assert.equal(old.where, "**Deprecated** in `DepA`: use other");
  // A required `undefined` is taken; an optional one forbids the prop.
  assert.match(
    prop("ReqUndef", "foo").where,
    /^\*\*Required\*\* in `ReqUndefA`/,
  );
  const bar = prop("Forbid", "bar");
  assert.equal(bar.type, "string");
  assert.equal(bar.where, "Only in `ForbidB`, where it is **required**.");
  // A @default only one member gives is that member's.
  const size = prop("DefCase", "size");
  assert.equal(size.default, null);
  assert.match(size.where, /Defaults to `"s"` in `DefA`\./);
  // A function's own `| undefined` is its return type's.
  assert.equal(
    prop("FnPart", "getLabel").type,
    "(x: string) => string | undefined",
  );
  // Each member type once.
  assert.equal(prop("Dup", "r").type, "string");
  // Every member's deprecation, by member, when their words differ.
  assert.equal(
    prop("Gone", "gone").deprecated,
    "In `GoneA`: use one In `GoneB`: use two",
  );
});

test("a function prop keeps the undefined its return type takes", () => {
  // BrowseCategoriesPanel's tint returns a CategoryTint or undefined; the
  // card dropped the undefined, as if it were the prop's own (5 Nov 2026).
  assert.match(
    cards
      .get("BrowseCategoriesPanel")
      ?.parts.get("BrowseCategoriesPanel")
      ?.get("tint") ?? "",
    /^`\(category: CategoryPresentation\) => CategoryTint \| undefined`, optional/,
  );
  // A union's members' words differ: each is named.
  assert.match(
    cards.get("Accordion")?.text ?? "",
    /In `AccordionPrimitive\.AccordionMultipleProps`: The controlled stateful value of the accordion items/,
  );
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

test("the consuming page carries the rules a design session gets wrong", () => {
  const text = fs.readFileSync(path.join(root, OUT_DIR, "README.md"), "utf8");
  for (const [rule, phrase] of [
    ["icons are named imports (decision 121)", "<Icon icon={HelpCircle} />"],
    [
      "a Home tile is Navbar's logo",
      "A Home tile goes in Navbar's `logo` slot",
    ],
    ["parts read the semantic radius roles", "`--semantics-radius-control` ("],
    [
      "the primitive radii do nothing",
      "No part reads `--primitives-radius-button`",
    ],
    ["Select is modal (decision 120)", "Select is modal (decision 120)"],
    ["a disabled menu item says why (decision 123)", "(decision 123)"],
  ])
    assert.ok(text.includes(phrase), `the consuming page does not say ${rule}`);
});
