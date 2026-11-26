// @vitest-environment jsdom
import path from "node:path";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createApp, h, nextTick, type Component } from "vue";
import { ThemeProvider } from "../../../react/src/components/ThemeProvider/ThemeProvider";
import { KozmosThemeProvider } from "../../src/index";
import { PORTS } from "../ports";
import { normalizeHtml } from "./normalize-html";

/**
 * Each Vue story, as the Vue Storybook draws it, against React's story of
 * the same name, as React's Storybook draws it: the story's own render (or
 * its meta's, or the part drawn from its args), in each framework's theme
 * provider, mounted and normalised, text node by text node. The other parity specs draw
 * what a story shows in both from one description; this holds the stories
 * themselves to each other, so a Vue story set up apart from React's (a
 * template's stray whitespace, a missing parameter) is seen before its
 * Visual Review baseline is. Kbd's InAHint drew " Press … feature. " with
 * the template's spaces, where React's drew "Press … feature.", and its
 * baseline differed from React's at the sentence's end (PR #610).
 *
 * Stories this cannot draw in both are named in NOT_DRAWN, with why.
 */
const NOT_DRAWN: Record<string, string> = {
  // A provider with buttons that call useTheme, and a density demo whose
  // other controls are not ported: mounted.parity.spec.ts and
  // provider-and-scope.parity.spec.ts draw what they show.
  "ThemeProvider/Default": "its render reads React's own hooks",
  "ThemeProvider/Density": "draws parts not yet ported to Vue",
};

/**
 * What Storybook gives a story's render beside its args: the toolbar's
 * globals at their first values (apps/docs/.storybook/preview.tsx's
 * initialGlobals). Link's ExternalRightToLeft reads the theme from them.
 */
const context = (args: Record<string, unknown>) => ({
  args,
  globals: { theme: "light", density: "touch" },
});

type Story = {
  args?: Record<string, unknown>;
  render?: (args: Record<string, unknown>, context: object) => unknown;
  parameters?: { layout?: string };
};
type Meta = Story & { component?: unknown; title?: string };
type StoriesModule = Record<string, unknown> & { default: Meta };

const reactStories = import.meta.glob<StoriesModule>(
  "../../../react/src/components/*/*.stories.tsx",
);
const vueStories = import.meta.glob<StoriesModule>(
  "../../src/components/*/*.stories.ts",
);

const storiesOf = (module: StoriesModule) =>
  Object.entries(module).filter(
    ([name, value]) =>
      name !== "default" && typeof value === "object" && value !== null,
  ) as [string, Story][];

/** The story's layout, as Storybook decides it: the story's, the meta's, or padded. */
const layoutOf = (meta: Meta, story: Story) =>
  story.parameters?.layout ?? meta.parameters?.layout ?? "padded";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => document.body.replaceChildren());

/**
 * Waits that start within 500 ms are one announcement (GAP-159), and both
 * frameworks' bars count them in the one shared recipe
 * (recipes/progress.ts): each drawing starts on a clock a minute past the
 * last, as Progress's own tests do, so React's waiting bar is not heard as
 * a second bar in the wait Vue's drawing opened.
 */
let clock = 0;
const nextDrawing = () => void (clock += 60_000);
beforeAll(() => vi.spyOn(Date, "now").mockImplementation(() => clock));
// jsdom has no ResizeObserver, which Radix's Slider measures its thumbs
// with (and KozmosSlider as it does): a stand-in that never reports, in
// both.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterAll(() => vi.restoreAllMocks());

/**
 * What a story drew, mounted: its markup normalised, with each text node
 * kept as the browser lays it out, one node to one ⟦…⟧, and the anchors
 * each framework leaves (comments, Vue's empty text nodes) left out. A
 * server render joins adjacent text, so it cannot see a story that draws
 * React's words in other text nodes, which Chromium lays out differently.
 */
function drawn(mounted: HTMLElement) {
  // A copy: the frameworks' anchors stay in the page they unmount from.
  const host = mounted.cloneNode(true) as HTMLElement;
  const nodes = document.createTreeWalker(host, NodeFilter.SHOW_ALL);
  const text: Text[] = [];
  const gone: Node[] = [];
  for (let node = nodes.nextNode(); node; node = nodes.nextNode())
    if (node.nodeType === Node.COMMENT_NODE) gone.push(node);
    else if (node.nodeType === Node.TEXT_NODE)
      ((node as Text).data ? text : gone).push(node as Text);
  for (const node of gone) node.parentNode?.removeChild(node);
  for (const node of text) node.data = `⟦${node.data}⟧`;
  return normalizeHtml(host.innerHTML);
}

const host = () => document.body.appendChild(document.createElement("div"));

async function drawReact(meta: Meta, story: Story) {
  nextDrawing();
  const args = { ...meta.args, ...story.args };
  const render =
    story.render ??
    meta.render ??
    ((all: Record<string, unknown>) =>
      React.createElement(meta.component as React.ElementType, all));
  const Story = () => render(args, context(args)) as React.ReactElement;
  const element = host();
  const root = createRoot(element);
  await act(async () =>
    root.render(
      React.createElement(ThemeProvider, null, React.createElement(Story)),
    ),
  );
  const html = drawn(element);
  act(() => root.unmount());
  return html;
}

async function drawVue(meta: Meta, story: Story) {
  nextDrawing();
  const args = { ...meta.args, ...story.args };
  const render = story.render ?? meta.render!;
  const story_ = render(args, context(args)) as Component;
  const element = host();
  const app = createApp({
    render: () => h(KozmosThemeProvider, null, { default: () => h(story_) }),
  });
  app.mount(element);
  await nextTick();
  const html = drawn(element);
  app.unmount();
  return html;
}

/**
 * What a port's stories file says differently from React's: a missing
 * file, a story React lacks or has and Vue does not, another layout, or
 * another drawing, each as `<Vue part>:<what>`.
 */
async function findings(port: (typeof PORTS)[number]) {
  const part = path.basename(path.dirname(port.stories!));
  const reactFile = `../../../react/src/${port.stories}`;
  const vueFile = `../../src/components/${part}/${part}.stories.ts`;
  const found: string[] = [];
  if (!reactStories[reactFile] || !vueStories[vueFile])
    return [`${port.vue}:stories file`];
  const react = await reactStories[reactFile]();
  const vue = await vueStories[vueFile]();
  const vueNames = storiesOf(vue).map(([name]) => name);
  const reactNames = storiesOf(react).map(([name]) => name);
  for (const name of vueNames)
    if (!reactNames.includes(name))
      found.push(`${port.vue}:${name} not React's`);
  for (const [name, story] of storiesOf(react)) {
    const own = vue[name] as Story | undefined;
    if (!own) {
      found.push(`${port.vue}:${name} missing`);
      continue;
    }
    if (layoutOf(vue.default, own) !== layoutOf(react.default, story))
      found.push(`${port.vue}:${name} layout`);
    if (`${part}/${name}` in NOT_DRAWN) continue;
    if (
      (await drawVue(vue.default, own)) !==
      (await drawReact(react.default, story))
    )
      found.push(`${port.vue}:${name} drawing`);
  }
  return found;
}

/**
 * Differences in ports made before this check (PR #610), each with what
 * it is. Each is the port's to settle, and an entry that no longer occurs
 * fails, so the list only shrinks. A port made since has none.
 */
const EARLIER: Record<string, string> = {
  "KozmosThemeProvider:stories file":
    "Vue's ThemeProvider has no stories file until wave V2: React's Density story draws Input, Select, Combobox, MultiSelect, NumberInput and PasswordInput, V2's form controls; mounted.parity.spec.ts draws React's stories' behaviour",
};

describe("each Vue story draws what React's story of its name draws", () => {
  for (const port of PORTS.filter((p) => p.stories))
    it(`${port.vue}: React's stories, by name and layout, each drawn alike`, async () => {
      const found = await findings(port);
      const all = `${port.vue}:*` in EARLIER;
      expect(found.filter((finding) => !all && !(finding in EARLIER))).toEqual(
        [],
      );
      const earlier = Object.keys(EARLIER).filter((key) =>
        key.startsWith(`${port.vue}:`),
      );
      // An excused difference that no longer occurs leaves the list.
      expect(
        earlier.filter((key) =>
          key.endsWith(":*") ? !found.length : !found.includes(key),
        ),
      ).toEqual([]);
    });

  it("names in NOT_DRAWN only stories that exist", async () => {
    for (const key of Object.keys(NOT_DRAWN)) {
      const [part, name] = key.split("/");
      const file = `../../../react/src/components/${part}/${part}.stories.tsx`;
      expect((await reactStories[file]())[name], key).toBeTruthy();
    }
  });

  it("names in EARLIER only ports that exist", () => {
    for (const key of Object.keys(EARLIER))
      expect(
        PORTS.some((port) => key.startsWith(`${port.vue}:`)),
        key,
      ).toBe(true);
  });
});
