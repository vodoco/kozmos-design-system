import { afterEach, beforeAll } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString as reactToString } from "react-dom/server";
import * as KozmosReact from "@kozmos-ds/react";
import {
  createApp,
  createSSRApp,
  h,
  nextTick,
  type App,
  type VNode,
} from "vue";
import { renderToString as vueToString } from "vue/server-renderer";
import { KozmosAnalyticsProvider } from "../../src/components/AnalyticsProvider/AnalyticsProvider";
import { KozmosThemeProvider } from "../../src/components/ThemeProvider/ThemeProvider";
import type { KozmosAnalyticsEvent } from "../../src/theme/injection";
import { normalizeHtml } from "./normalize-html";

/**
 * What the overlay parity specs share (Dialog, Drawer, BottomSheet,
 * Popover, Tooltip, and Select and Combobox inside them): each tree drawn in
 * its framework's theme provider, on the server or mounted in jsdom, one
 * framework at a time, with the analytics each sends; and the document as
 * each draws it, with Radix's and Reka's own spellings of the same thing
 * made one (`alike`).
 */
export const e = React.createElement;

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

/** Server renders of both, normalised. */
export async function serverBoth(
  react: React.ReactElement,
  vue: () => VNode | VNode[],
) {
  const reactHtml = reactToString(e(KozmosReact.ThemeProvider, null, react));
  const vueHtml = await vueToString(
    createSSRApp({
      render: () => h(KozmosThemeProvider, null, { default: vue }),
    }),
  );
  return { react: alike(reactHtml), vue: alike(vueHtml) };
}

/**
 * The document as each draws it, with what is Radix's and Reka's own
 * spelling of the same thing made one: their attribute prefixes
 * (`data-radix-*`, `data-reka-*`) and custom properties (`--radix-*`,
 * `--reka-*`, each declaration kept once, the declarations sorted), Reka's
 * layer mark (`data-dismissable-layer`, which its layers read), Vue's app
 * mark, `<style>` elements, and Radix's focus guards at the body's edges,
 * which Reka's Dialog does not draw (its FocusScope holds Tab in the
 * content without them; PORTING.md's Radix → Reka notes).
 */
export function alike(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  document
    .querySelectorAll(
      "style, [data-radix-focus-guard], [data-reka-focus-guard]",
    )
    .forEach((node) => node.remove());
  // What Reka's popper draws that Radix's does not, none of it seen by an
  // app beyond the attribute: its trigger's grace-area mark (which its
  // hoverable content reads), its writing direction written on the popper
  // and the content (inherited from the provider in both), and a tip at x 0
  // given no `left` or `top` (jsdom places everything at 0; a browser, the tip's x).
  // Its hidden copy for a screen reader holds the words alone, clipped as
  // well by clip-path, where Radix's holds the content's elements: both
  // read the same words (PORTING.md's Radix → Reka notes).
  for (const element of document.querySelectorAll("[data-grace-area-trigger]"))
    element.removeAttribute("data-grace-area-trigger");
  for (const wrapper of document.querySelectorAll(
    "[data-radix-popper-content-wrapper], [data-reka-popper-content-wrapper]",
  )) {
    wrapper.removeAttribute("dir");
    wrapper.firstElementChild?.removeAttribute("dir");
  }
  for (const tip of document.querySelectorAll("span:has(> svg > polygon)")) {
    const style = (tip.getAttribute("style") ?? "")
      .split(";")
      .filter((part) => !/^\s*(left|top):\s*0px\s*$/.test(part));
    tip.setAttribute("style", style.join(";"));
  }
  for (const copy of document.querySelectorAll('span[role="tooltip"]')) {
    copy.removeAttribute("style");
    const words = copy.textContent;
    copy.textContent = words;
  }
  for (const element of document.body.querySelectorAll("*")) {
    for (const { name, value } of [...element.attributes]) {
      if (name === "data-v-app" || name === "data-dismissable-layer")
        element.removeAttribute(name);
      else if (name.startsWith("data-reka-")) {
        element.removeAttribute(name);
        element.setAttribute(name.replace("data-reka-", "data-radix-"), value);
      }
    }
    const style = element.getAttribute("style");
    if (style) {
      const seen = new Set<string>();
      const declarations = style
        .replace(/--reka-/g, "--radix-")
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => {
          const name = part.slice(0, part.indexOf(":")).trim();
          if (seen.has(name)) return false;
          seen.add(name);
          return true;
        })
        .sort();
      if (declarations.length)
        element.setAttribute("style", declarations.join(";"));
      else element.removeAttribute("style");
    }
  }
  return normalizeHtml(document.body.innerHTML);
}

export const body = () => alike(document.body.innerHTML);

/** A few ticks and timers: Reka's and Radix's layers listen a task later. */
export async function wait() {
  for (let i = 0; i < 4; i++) {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

let reactRoot: Root | undefined;
let vueApp: App | undefined;
/** While React is drawn, each wait is an act of its own. */
let inReact = false;
export const settle = () => (inReact ? act(wait) : wait());

/** What jsdom lacks and the primitives call; and a clean page after each. */
export function useOverlayPage() {
  beforeAll(() => {
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    Element.prototype.scrollIntoView ??= function () {};
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.releasePointerCapture ??= () => {};
    // jsdom's PointerEvent is missing in older versions.
    globalThis.PointerEvent ??= class extends MouseEvent {
      pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerType = init.pointerType ?? "mouse";
      }
    } as unknown as typeof PointerEvent;
  });
  afterEach(() => unmountAll());
}

export function unmountAll() {
  if (reactRoot) act(() => reactRoot!.unmount());
  vueApp?.unmount();
  reactRoot = undefined;
  vueApp = undefined;
  inReact = false;
  document.body.replaceChildren();
  document.body.removeAttribute("style");
  document.body.removeAttribute("data-scroll-locked");
}

/** React's tree, mounted alone in the page in its theme, with its analytics. */
export async function mountReact(
  tree: React.ReactElement | (() => React.ReactElement),
  events: KozmosAnalyticsEvent[] = [],
) {
  unmountAll();
  inReact = true;
  const host = document.body.appendChild(document.createElement("div"));
  reactRoot = createRoot(host);
  const Tree = typeof tree === "function" ? tree : () => tree;
  await act(async () =>
    reactRoot!.render(
      e(
        KozmosReact.AnalyticsProvider,
        {
          batchDelayMs: 0,
          onDispatch: (sent: KozmosAnalyticsEvent[]) => events.push(...sent),
        },
        e(KozmosReact.ThemeProvider, null, e(Tree)),
      ),
    ),
  );
  await settle();
  return body();
}

/** Vue's tree, mounted alone in the page in its theme, with its analytics. */
export async function mountVue(
  tree: () => VNode | VNode[],
  events: KozmosAnalyticsEvent[] = [],
) {
  unmountAll();
  const host = document.body.appendChild(document.createElement("div"));
  vueApp = createApp({
    render: () =>
      h(
        KozmosAnalyticsProvider,
        {
          batchDelayMs: 0,
          onDispatch: (sent: KozmosAnalyticsEvent[]) => events.push(...sent),
        },
        () => h(KozmosThemeProvider, null, { default: tree }),
      ),
  });
  vueApp.mount(host);
  await settle();
  return body();
}

/** Each event as heard, without its time. */
export const read = (events: KozmosAnalyticsEvent[]) =>
  events.map(({ timestamp: _timestamp, ...event }) => event);

/** A key pressed at `target`, bubbling, as a keyboard does. */
export function key(target: Element | Window, name: string) {
  const event = new KeyboardEvent("keydown", {
    key: name,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

/**
 * A press: pointerdown, mousedown (focusing what it lands on unless
 * prevented), pointerup, mouseup and click, as a mouse does. A browser runs
 * the page's microtasks between them, as each listener returns, so Vue's
 * updates land between events as they do there: awaited here too.
 */
export async function press(target: Element) {
  const between = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };
  const init = { bubbles: true, cancelable: true, button: 0 };
  target.dispatchEvent(
    new PointerEvent("pointerdown", { ...init, pointerType: "mouse" }),
  );
  await between();
  const down = new MouseEvent("mousedown", init);
  target.dispatchEvent(down);
  if (!down.defaultPrevented && target instanceof HTMLElement) {
    const focusable = target.closest<HTMLElement>(
      "button, input, [tabindex], a[href], select, textarea",
    );
    focusable?.focus();
  }
  await between();
  target.dispatchEvent(
    new PointerEvent("pointerup", { ...init, pointerType: "mouse" }),
  );
  await between();
  target.dispatchEvent(new MouseEvent("mouseup", init));
  target.dispatchEvent(new MouseEvent("click", init));
  await between();
}

/** The element focus is on, named. */
export const focused = () => {
  const active = document.activeElement;
  if (!active || active === document.body) return "the page";
  return (
    active.getAttribute("aria-label") ||
    active.textContent?.trim() ||
    active.tagName
  );
};

/** Whether the element with this text, of this role, is in the page. */
export const byRole = (role: string) => [
  ...document.querySelectorAll(`[role="${role}"]`),
];
export const button = (name: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => (b.getAttribute("aria-label") ?? b.textContent?.trim()) === name,
  );
