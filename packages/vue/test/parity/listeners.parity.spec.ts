// @vitest-environment jsdom
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, type App, type Component } from "vue";
import * as KozmosVue from "../../src/index";
import { PORTS, REACT_SOURCE, type Port } from "../ports";
import { readStoryArgs, type StoryArgs } from "./story-args";

/**
 * Where an app's listeners land, which a server render never shows: each
 * port is mounted in both frameworks with a click listener and a marker
 * attribute added, as an app adds them, and the element that carries the
 * marker is clicked. React's and Vue's must land on the same element and
 * fire alike; a part that takes no attributes, as ThemeProvider, takes
 * neither in either.
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
async function clicks(mount: (onClick: () => void) => Promise<HTMLElement>) {
  let count = 0;
  const root = await mount(() => count++);
  const marked = root.querySelector<HTMLElement>("[data-parity]");
  marked?.click();
  await nextTick();
  return { marked: marked?.localName ?? null, count };
}

const asReact = (port: Port, args: StoryArgs, onClick: () => void) => {
  const { children, ...props } = args;
  const part = React.createElement(
    lookup(KozmosReact, port.react) as React.ElementType,
    { ...props, "data-parity": "listener", onClick },
    children === undefined || children === null ? undefined : String(children),
  );
  return port.react === "ThemeProvider"
    ? part
    : React.createElement(KozmosReact.ThemeProvider, null, part);
};

const asVue = (port: Port, args: StoryArgs, onClick: () => void) => {
  const { children, ...props } = args;
  const part = () =>
    h(
      lookup(KozmosVue, port.vue) as Component,
      { ...props, "data-parity": "listener", onClick },
      children === undefined || children === null
        ? undefined
        : { default: () => String(children) },
    );
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
      const vue = await clicks(async (onClick) => {
        const element = host();
        vueApp = createApp({ render: () => asVue(port, args!, onClick) });
        vueApp.mount(element);
        await nextTick();
        return element;
      });
      expect(vue).toEqual(react);
    });
});
