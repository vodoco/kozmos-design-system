// @vitest-environment jsdom
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, type App, type Component } from "vue";
import * as KozmosVue from "../../src/index";
import { PORTS, REACT_SOURCE, type Port } from "../ports";
import { reactSides } from "../contract/read-contract";
import { readStoryArgs, type StoryArgs } from "./story-args";

/**
 * Where an app's listeners land, which a server render never shows: each
 * port is mounted in both frameworks with a click listener and a marker
 * attribute added, as an app adds them, and the element that carries the
 * marker, anywhere in the document (a portalled part's is in the body), is
 * clicked. React's and Vue's must carry the marker on the same element, fire
 * alike, and fire on that element (`currentTarget`), not on a wrapper around
 * it. A part React gives DOM attributes must carry the marker; one that
 * takes none, as ThemeProvider, carries neither in either.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let vueApp: App | undefined;
afterEach(() => {
  act(() => reactRoot?.unmount());
  vueApp?.unmount();
  reactRoot = undefined;
  vueApp = undefined;
  document.body.replaceChildren();
});

// What React's parts take, read once: reading React's declarations takes
// seconds, more than a test's own time on CI.
let takesAttributes: (react: string) => boolean;
beforeAll(() => {
  const side = reactSides();
  takesAttributes = (react) => side(react).reactAttributes.length > 0;
}, 120_000);
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

/** A sample's args without `children`: the outer part draws the port as its child. */
const withoutChildren = (args: StoryArgs) =>
  Object.fromEntries(
    Object.entries(args).filter(([key]) => key !== "children"),
  ) as StoryArgs;

const lookup = (exports: object, name: string) =>
  (exports as Record<string, unknown>)[name];

/** The args a port is drawn with: its first args story's, or its sample. */
function argsOf(port: Port): StoryArgs | undefined {
  const story = port.stories
    ? readStoryArgs(path.join(REACT_SOURCE, port.stories)).stories.find(
        (candidate) =>
          !candidate.unread.length && !port.elsewhere?.[candidate.name],
      )
    : undefined;
  return story?.args ?? port.sample;
}

function host() {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

/** What a click on the marked element reaches, in one framework. */
async function clicks(
  mount: (onClick: (event: Event) => void) => Promise<HTMLElement>,
) {
  const landed: string[] = [];
  let marked: HTMLElement | null = null;
  await mount((event) =>
    landed.push(
      event.currentTarget === marked
        ? "on the marked element"
        : `on ${(event.currentTarget as Element | null)?.localName ?? "nothing"}`,
    ),
  );
  marked = document.querySelector<HTMLElement>("[data-parity]");
  // A click as the pointer makes one: an <svg> (Icon's) has no click().
  marked?.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true }),
  );
  await nextTick();
  return { marked: marked?.localName ?? null, landed };
}

/** The port a compound's part draws inside (`Port.within`), with its sample. */
const outerOf = (port: Port) => {
  const outer = port.within
    ? PORTS.find((candidate) => candidate.react === port.within)
    : undefined;
  const sample = withoutChildren(outer?.sample ?? {});
  return outer ? { outer, sample } : undefined;
};

const asReact = (
  port: Port,
  args: StoryArgs,
  onClick: (event: Event) => void,
) => {
  const { children, ...props } = args;
  const drawn = React.createElement(
    lookup(KozmosReact, port.react) as React.ElementType,
    { ...props, "data-parity": "listener", onClick },
    children === undefined || children === null ? undefined : String(children),
  );
  const around = outerOf(port);
  const part = around
    ? React.createElement(
        lookup(KozmosReact, around.outer.react) as React.ElementType,
        around.sample,
        drawn,
      )
    : drawn;
  return port.react === "ThemeProvider"
    ? part
    : React.createElement(KozmosReact.ThemeProvider, null, part);
};

const asVue = (
  port: Port,
  args: StoryArgs,
  onClick: (event: Event) => void,
) => {
  const { children, ...props } = args;
  const drawn = () =>
    h(
      lookup(KozmosVue, port.vue) as Component,
      { ...props, "data-parity": "listener", onClick },
      children === undefined || children === null
        ? undefined
        : { default: () => String(children) },
    );
  const around = outerOf(port);
  const part = around
    ? () =>
        h(lookup(KozmosVue, around.outer.vue) as Component, around.sample, {
          default: drawn,
        })
    : drawn;
  return port.react === "ThemeProvider"
    ? part()
    : h(KozmosVue.KozmosThemeProvider, null, { default: part });
};

describe("an app's listeners land where React's land", () => {
  for (const port of PORTS)
    it(port.vue, async () => {
      const args = argsOf(port);
      expect(
        args,
        `${port.vue} has no args story: give it a sample`,
      ).toBeTruthy();
      const react = await clicks(async (onClick) => {
        const element = host();
        reactRoot = createRoot(element);
        await act(async () => reactRoot!.render(asReact(port, args!, onClick)));
        return element;
      });
      // Each framework has the document to itself: a marker is looked for
      // anywhere in it.
      act(() => reactRoot?.unmount());
      reactRoot = undefined;
      document.body.replaceChildren();
      const vue = await clicks(async (onClick) => {
        const element = host();
        vueApp = createApp({ render: () => asVue(port, args!, onClick) });
        vueApp.mount(element);
        await nextTick();
        return element;
      });
      expect(vue).toEqual(react);
      // A part React gives DOM attributes carries the app's, somewhere,
      // unless it draws no element in a test's document in either
      // (`Port.unmarked`, drawn where it does by the spec it names).
      if (port.unmarked) expect(react.marked).toBeNull();
      else if (takesAttributes(port.react))
        expect(
          react.marked,
          `React's ${port.react} drew no element with the app's attributes`,
        ).not.toBeNull();
    });
});
