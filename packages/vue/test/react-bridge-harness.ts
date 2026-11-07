import { afterEach, beforeAll, beforeEach, expect, vi } from "vitest";
import { createApp, h, type App, type Component } from "vue";
import * as KozmosReact from "@kozmos-ds/react";
import * as Bridge from "../src/react-bridge/index";
import { bridgeOf, type Bridged } from "../src/react-bridge/react-adapter";

/**
 * What the React bridge's specs (`src/react-bridge/*.spec.ts`) share: jsdom's
 * missing pieces, a mount that is torn down after each test, a visitor's
 * typing and clicking, and a console that fails the test on anything React,
 * Radix or Vue says to it that the test did not expect.
 */

beforeAll(() => {
  // Radix measures through ResizeObserver, scrolls an open Select's option
  // into view and asks for pointer capture: jsdom has none of them.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= function scrollIntoView() {};
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
});

export async function until<T>(read: () => T | null | undefined | false) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = read();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("timed out");
}

/** Lets React and Vue finish what a change started. */
export const settle = () => new Promise((resolve) => setTimeout(resolve, 40));

/** Types into a field React controls, as a browser's input event does. */
export function type(
  field: HTMLInputElement | HTMLTextAreaElement,
  text: string,
) {
  const { set } = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(field),
    "value",
  )!;
  set!.call(field, text);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

/** A field commits what was typed, as a browser does on blur or Enter. */
export const commit = (field: Element) =>
  field.dispatchEvent(new Event("change", { bubbles: true }));

/** Chooses files in a file input, as the browser's picker does. */
export function choose(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", { value: files, configurable: true });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Chooses an option of a native `<select>`. */
export function select(element: HTMLSelectElement, value: string) {
  element.value = value;
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export const press = (element: Element, key: string) =>
  element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

export const $ = <E extends Element = HTMLElement>(selector: string) =>
  document.querySelector<E>(selector);
export const $$ = <E extends Element = HTMLElement>(selector: string) => [
  ...document.querySelectorAll<E>(selector),
];
export const byText = (selector: string, text: string) =>
  $$(selector).find((element) => element.textContent?.trim() === text);
export const texts = (selector: string) =>
  $$(selector).map((element) => element.textContent?.trim());

// Whatever React, Radix or Vue says fails the test that made it say it: an
// unknown event handler on a DOM element, a field switching between
// controlled and uncontrolled, a value React cannot take. One thing is said
// that is not about the bridge:
const UNRELATED = [
  // Analytics with no provider, once per run, at the first tracked change.
  /No <AnalyticsProvider> found/,
];
let said: string[] = [];
beforeEach(() => {
  said = [];
  for (const level of ["error", "warn"] as const)
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      const text = `console.${level}: ${args.map(String).join(" ")}`;
      if (!UNRELATED.some((pattern) => pattern.test(text))) said.push(text);
    });
});

/**
 * Takes what the console was told so far, for a test that expects it: the
 * test asserts it, and the check after the test sees only what follows.
 */
export function heard(): string[] {
  const taken = said;
  said = [];
  return taken;
}

let app: App | null = null;
afterEach(() => {
  app?.unmount();
  app = null;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  expect(said).toEqual([]);
});

/** Mounts a render function, or a component (a template's), in the page. */
export function mount(render: (() => ReturnType<typeof h>) | Component) {
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp(
    typeof render === "function" ? { setup: () => render } : render,
  );
  app.mount(host);
  return host;
}

/** Unmounts what `mount` mounted, before the test ends. */
export function unmount() {
  app?.unmount();
  app = null;
  document.body.replaceChildren();
}

/** What React part each adapter in index.ts draws, by the adapter's name. */
const ADAPTERS: Record<string, string> = {
  AvatarAdapter: "Avatar",
  AlertAdapter: "Alert",
  BackdropAdapter: "Backdrop",
  TourStepAdapter: "TourStep",
  AnchoredPopoverAdapter: "Popover",
};

/** One `Kozmos*` export of the bridge, as `createVueWrapper` made it. */
export interface BridgedPart {
  /** The export's name. */
  name: string;
  component: Component;
  /** What `createVueWrapper` recorded, or null for a component it did not make. */
  bridge: Bridged | null;
  /** The React export it mounts, or an adapter's part; null when neither is known. */
  react: string | null;
}

/**
 * Every `Kozmos*` export of the bridge, read from the wrappers themselves:
 * `createVueWrapper` records what it made each of, however index.ts calls it
 * (an alias, a helper), so no wrapper escapes a check by how it is written.
 * The React part is named by the React export it is, or the adapter it is.
 */
export function bridgedParts(): BridgedPart[] {
  const reactNames = new Map<unknown, string>();
  for (const [name, value] of Object.entries(KozmosReact))
    if (!reactNames.has(value)) reactNames.set(value, name);
  return Object.entries(Bridge)
    .filter(([name]) => name.startsWith("Kozmos"))
    .map(([name, component]) => {
      const bridge = bridgeOf(component as object) ?? null;
      const part = bridge?.part as { name?: string } | undefined;
      return {
        name,
        component: component as Component,
        bridge,
        react: part
          ? (reactNames.get(part) ?? ADAPTERS[part.name ?? ""] ?? null)
          : null,
      };
    });
}
