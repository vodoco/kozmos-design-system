import path from "node:path";
import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import * as KozmosVue from "../../src/index";
import { PORTS, REACT_SOURCE, type Port } from "../ports";
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
 * Each part is drawn once more with attributes added, as an app adds them:
 * they land where React's land, or nowhere when React's takes none.
 */

/** React's DOM spelling of an attribute, as Vue writes it. */
const VUE_ATTRIBUTE: Record<string, string> = {
  className: "class",
  htmlFor: "for",
};

const lookup = (exports: object, name: string) =>
  (exports as Record<string, unknown>)[name];

/** Whether the Vue part declares a prop, as `modelValue`. */
const declares = (port: Port, prop: string) => {
  const props = (lookup(KozmosVue, port.vue) as { props?: object }).props;
  return Array.isArray(props) ? props.includes(prop) : !!props && prop in props;
};

/**
 * A port drawn from story args: `children` is its default slot's text, and
 * React's `value` is `modelValue` where the Vue part takes `v-model`.
 */
export function drawn(port: Port, { children, ...args }: StoryArgs): Drawn {
  const vueProps = Object.fromEntries(
    Object.entries(args).map(([key, value]) => [
      key === "value" && declares(port, "modelValue")
        ? "modelValue"
        : (VUE_ATTRIBUTE[key] ?? key),
      value,
    ]),
  );
  return {
    react: lookup(KozmosReact, port.react) as Drawn["react"],
    vue: lookup(KozmosVue, port.vue) as Drawn["vue"],
    props: args,
    vueProps,
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
        // Something was drawn: two empty renders are equal too.
        expect(react).toMatch(/^<\w/m);
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
          }),
        ),
      );
      expect(vue).toBe(react);
    });
  });
}
