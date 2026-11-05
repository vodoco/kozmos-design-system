import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import * as KozmosVue from "../../src/index";
import { PORTS, REACT_SOURCE, type Port } from "../ports";
import { isNode, planOf, reactSides } from "../contract/read-contract";
import { readStoryArgs, type StoryArgs } from "./story-args";
import { renderBoth, type Drawn } from "./render";

/**
 * Vue 3 Phase 0, P0.4: every story of a ported part that is drawn from its
 * args, read from React's own stories file, is drawn in both frameworks
 * inside a ThemeProvider, and the two server renders normalise to the same
 * tree (`normalize-html.ts`): the same tags, roles, ARIA, data attributes,
 * classes, styles and text. A story added to React's file is drawn here with
 * no change. A story the reader cannot draw from its args (its own render,
 * or args it cannot read) is named in `ports.ts` with the spec that draws
 * it; `coverage.spec.ts` holds that list.
 *
 * Each part is drawn once more with attributes added, as an app adds them
 * (an id, ARIA, data, a class and a style): they land where React's land,
 * or nowhere when React's takes none. Listeners are not in a server render:
 * `listeners.parity.spec.ts` mounts each part to see where they land.
 */

/**
 * React's style properties that take a bare number; every other number React
 * writes in px, which a Vue app writes itself.
 */
const UNITLESS = new Set([
  "animationIterationCount",
  "aspectRatio",
  "columnCount",
  "flex",
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "gridColumn",
  "gridRow",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "scale",
  "widows",
  "zIndex",
  "zoom",
]);
const vueStyle = (style: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(style).map(([name, value]) => [
      name,
      typeof value === "number" && value !== 0 && !UNITLESS.has(name)
        ? `${value}px`
        : value,
    ]),
  );

/** React's DOM spelling of an attribute, as Vue writes it. */
const VUE_ATTRIBUTE: Record<string, string> = {
  className: "class",
  htmlFor: "for",
};

const lookup = (exports: object, name: string) =>
  (exports as Record<string, unknown>)[name];

/** How each port's React props are said in Vue, read as the contract reads them. */
let sayings: Map<
  string,
  { vueName: (react: string) => string; nodes: Set<string> }
>;
beforeAll(() => {
  const side = reactSides();
  sayings = new Map(
    PORTS.map((port) => {
      const reactSide = side(port.react);
      const plan = planOf({
        port,
        vueProps: [],
        vueEmits: [],
        vueSlots: [],
        ...reactSide,
      });
      return [
        port.vue,
        {
          vueName: plan.vueName,
          nodes: new Set(
            reactSide.react
              .filter((m) => isNode(m) && m.name !== "children")
              .map((m) => m.name),
          ),
        },
      ];
    }),
  );
}, 120_000);

/**
 * A port drawn from story args, each said as the contract says it: React's
 * `children` is the default slot's text, a node prop (Badge's `counter`) a
 * named slot's, a controlled `value` is `modelValue`, `className` is
 * `class`.
 */
export function drawn(port: Port, { children, ...args }: StoryArgs): Drawn {
  const saying = sayings.get(port.vue)!;
  const vueProps: Record<string, unknown> = {};
  const vueSlots: Record<string, string> = {};
  for (const [key, value] of Object.entries(args)) {
    if (saying.nodes.has(key)) {
      if (value !== null && value !== undefined) vueSlots[key] = String(value);
      continue;
    }
    vueProps[VUE_ATTRIBUTE[key] ?? saying.vueName(key)] =
      key === "style" &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
        ? vueStyle(value as Record<string, unknown>)
        : value;
  }
  return {
    react: lookup(KozmosReact, port.react) as Drawn["react"],
    vue: lookup(KozmosVue, port.vue) as Drawn["vue"],
    props: args,
    vueProps,
    vueSlots,
    children:
      children === undefined || children === null ? [] : [String(children)],
  };
}

const inTheme = (port: Port, node: Drawn): Drawn =>
  port.react === "ThemeProvider"
    ? node
    : {
        react: KozmosReact.ThemeProvider,
        vue: KozmosVue.KozmosThemeProvider,
        props: {},
        children: [node],
      };

const storiesOf = (port: Port) =>
  port.stories
    ? readStoryArgs(path.join(REACT_SOURCE, port.stories)).stories.filter(
        (story) => !port.elsewhere?.[story.name],
      )
    : [];

for (const port of PORTS) {
  const stories = storiesOf(port);
  describe(`${port.vue} draws what React's ${port.react} draws`, () => {
    for (const story of stories)
      it(`${story.name}: ${JSON.stringify(story.args)}`, async () => {
        // Drawing less than the story would compare less than it shows.
        expect(story.unread).toEqual([]);
        const { react, vue } = await renderBoth(
          inTheme(port, drawn(port, story.args)),
        );
        expect(vue).toBe(react);
        // The part drew something inside its provider: two empty renders
        // are equal too. A part React portals (Dialog's, Popover's,
        // Select's content) draws nothing in a server render; such a story
        // is named in `elsewhere`, with the mounted spec that draws it.
        expect(
          port.react === "ThemeProvider"
            ? react
            : react.split("\n").slice(1).join("\n"),
          `${port.react} drew nothing in a server render: name ${story.name} in ports.ts' elsewhere, with a mounted spec`,
        ).toMatch(/^\s*<\w/m);
      });

    it("puts an app's attributes where React's puts them", async () => {
      const args = stories[0]?.args ?? port.sample;
      expect(
        args,
        `${port.vue} has no args story: give it a sample`,
      ).toBeTruthy();
      const { react, vue } = await renderBoth(
        inTheme(
          port,
          drawn(port, {
            ...args,
            id: "kozmos-parity",
            "aria-describedby": "kozmos-parity-note",
            "data-parity": "attribute",
            // Classes that meet a recipe's (Button's padding and corners):
            // React's merges them over the recipe's, and Vue's must too.
            className: "kozmos-parity p-0 rounded-none",
            style: { marginTop: 1 },
          }),
        ),
        // The app's ids land as written, or the comparison would not see
        // one that never lands.
        { keepIds: ["kozmos-parity", "kozmos-parity-note"] },
      );
      expect(vue).toBe(react);
    });
  });
}
