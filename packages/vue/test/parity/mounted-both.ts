import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App, type Component } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";

/**
 * A field part mounted in both, each alone in the document, in an
 * analytics provider and a theme provider, its models held by an owner as
 * an app holds them: the steps run on React's, then on Vue's, and the
 * document after each step, what each model heard and the events each
 * reported are returned for the spec to compare. Shared by the chip
 * fields' specs (MultiSelect, ChipInput).
 */
export interface Model {
  /** React's prop and callback (`value`, `onValueChange`). */
  prop: string;
  callback: string;
  /** Vue's prop and its listener (`modelValue`, `onUpdate:modelValue`). */
  vueProp: string;
  listener: string;
  start: unknown;
  /** The part holds it: the owner hears it and passes nothing back. */
  own?: boolean;
}

export interface Heard {
  models: Record<string, unknown[][]>;
  events: Omit<KozmosAnalyticsEvent, "timestamp">[];
  other: Record<string, number>;
}

/**
 * The document as each draws it, each style's declarations sorted. The
 * popper's geometry is compared as drawn: both place it with floating-ui,
 * Radix's options in each (Combobox/fieldPopper.ts). Vue's layer mark is
 * taken off, as Radix's layers draw none.
 */
export function alike(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  for (const element of document.body.querySelectorAll("[style]")) {
    const declarations = element
      .getAttribute("style")!
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .sort();
    element.setAttribute("style", declarations.join(";"));
  }
  for (const element of document.body.querySelectorAll("[data-v-app]"))
    element.removeAttribute("data-v-app");
  // A field's popup is a layer of the overlays' stack in both: React's a
  // Radix DismissableLayer, which marks nothing; Vue's carries the mark
  // Reka's layers read (shared/layers.ts, joinLayers).
  for (const element of document.body.querySelectorAll(
    "[data-dismissable-layer]",
  ))
    element.removeAttribute("data-dismissable-layer");
  return normalizeHtml(document.body.innerHTML);
}

const wait = async () => {
  for (let i = 0; i < 4; i++) {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

let reactRoot: Root | undefined;
let vueApp: App | undefined;
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

/** Takes both down and empties the document. */
export function unmountBoth() {
  act(() => reactRoot?.unmount());
  vueApp?.unmount();
  reactRoot = undefined;
  vueApp = undefined;
  document.body.replaceChildren();
}

/** Stand-ins for what jsdom lacks: ResizeObserver and scrollIntoView. */
export function standIns() {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= function () {};
}

/**
 * A laid-out page for a field's popup, in jsdom, which lays nothing out: a
 * window of `view`, the field (every box holding its combobox input, short
 * of the body) at `field`, and the popper's wrapper `popup` in size, so
 * floating-ui's offset, shift, flip and size act on both frameworks' popups
 * as in a browser. Returns what takes it down.
 */
export function layOut({
  view = { width: 1024, height: 768 },
  field,
  popup,
}: {
  view?: { width: number; height: number };
  field: { x: number; y: number; width: number; height: number };
  popup: { width: number; height: number };
}) {
  const html = document.documentElement;
  const rect = Element.prototype.getBoundingClientRect;
  const width = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetWidth",
  )!;
  const height = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetHeight",
  )!;
  const wrapper = (element: Element) =>
    element.hasAttribute("data-radix-popper-content-wrapper");
  Object.defineProperty(html, "clientWidth", {
    configurable: true,
    value: view.width,
  });
  Object.defineProperty(html, "clientHeight", {
    configurable: true,
    value: view.height,
  });
  Element.prototype.getBoundingClientRect = function (this: Element) {
    if (
      this !== html &&
      this !== document.body &&
      this.querySelector("input[role=combobox]")
    ) {
      const { x, y, width: w, height: h } = field;
      return DOMRect.fromRect({ x, y, width: w, height: h });
    }
    return rect.call(this);
  };
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return wrapper(this) ? popup.width : width.get!.call(this);
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return wrapper(this) ? popup.height : height.get!.call(this);
    },
  });
  return () => {
    delete (html as unknown as Record<string, unknown>).clientWidth;
    delete (html as unknown as Record<string, unknown>).clientHeight;
    Element.prototype.getBoundingClientRect = rect;
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", width);
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", height);
  };
}

/** Where floating-ui's popper is placed, and the room it writes. */
export function placement() {
  const wrapper = document.querySelector<HTMLElement>(
    "[data-radix-popper-content-wrapper]",
  );
  const content = wrapper?.firstElementChild;
  return {
    transform: wrapper?.style.transform,
    side: content?.getAttribute("data-side"),
    align: content?.getAttribute("data-align"),
    availableHeight: wrapper?.style.getPropertyValue(
      "--radix-popper-available-height",
    ),
    anchorWidth: wrapper?.style.getPropertyValue("--radix-popper-anchor-width"),
    origin: wrapper?.style.getPropertyValue("--radix-popper-transform-origin"),
  };
}

let moves = 0;
/**
 * The pointer moved last, as nothing has touched a fresh page: each
 * framework's copy of the input-modality store (recipes/input-modality.ts)
 * keeps listening once a list subscribed, so a key pressed in React's run
 * would otherwise start Vue's on the keyboard.
 */
export function pointerMovedLast() {
  moves += 1;
  document.dispatchEvent(
    new MouseEvent("pointermove", { clientX: moves, clientY: moves }),
  );
}

/** Through the element's own setter, as typing sets it, then `input`. */
export function typeInto(field: HTMLInputElement, text: string) {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!.call(field, text);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

/** A keydown on an element, bubbling and cancelable. */
export function keyOn(
  target: Element,
  key: string,
  init: KeyboardEventInit = {},
) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

export async function inBoth({
  react,
  vue,
  props,
  vueProps,
  models,
  listeners = [],
  steps,
  setLater = {},
}: {
  react: React.ElementType;
  vue: Component;
  props: Record<string, unknown>;
  vueProps: Record<string, unknown>;
  models: Model[];
  /** Other callbacks, by React's name and Vue's listener, counted. */
  listeners?: [string, string][];
  steps: (() => unknown)[];
  /** What the app does to its props after a step: by step, React's and Vue's. */
  setLater?: Record<
    number,
    { react: Record<string, unknown>; vue: Record<string, unknown> }
  >;
}) {
  unmountBoth();
  const hearing = (): Heard => ({
    models: Object.fromEntries(models.map((m) => [m.prop, []])),
    events: [],
    other: Object.fromEntries(listeners.map(([name]) => [name, 0])),
  });
  const heard = { react: hearing(), vue: hearing() };
  const shots = { react: [] as string[], vue: [] as string[] };
  const body = () => alike(document.body.innerHTML);
  let setReact: (next: Record<string, unknown>) => void = () => {};

  function Owner() {
    const [held, setHeld] = React.useState<Record<string, unknown>>(() =>
      Object.fromEntries(models.map((m) => [m.prop, m.start])),
    );
    const [extra, setExtra] = React.useState<Record<string, unknown>>({});
    setReact = (next) => setExtra((current) => ({ ...current, ...next }));
    const own: Record<string, unknown> = { ...props };
    for (const m of models) {
      if (!m.own) own[m.prop] = held[m.prop];
      own[m.callback] = (...args: unknown[]) => {
        heard.react.models[m.prop].push(args);
        setHeld((current) => ({ ...current, [m.prop]: args[0] }));
      };
    }
    for (const [name] of listeners)
      own[name] = () => {
        heard.react.other[name] += 1;
      };
    return React.createElement(react, { ...own, ...extra });
  }
  pointerMovedLast();
  let host = document.body.appendChild(document.createElement("div"));
  reactRoot = createRoot(host);
  await act(async () =>
    reactRoot!.render(
      React.createElement(
        KozmosReact.AnalyticsProvider,
        {
          batchDelayMs: 0,
          onDispatch: (events: KozmosAnalyticsEvent[]) =>
            heard.react.events.push(
              ...events.map(({ timestamp: _t, ...event }) => event),
            ),
        },
        React.createElement(
          KozmosReact.ThemeProvider,
          null,
          React.createElement(Owner),
        ),
      ),
    ),
  );
  await act(wait);
  shots.react.push(body());
  for (const [index, step] of steps.entries()) {
    await act(async () => {
      await step();
    });
    await act(wait);
    if (setLater[index]) {
      await act(async () => setReact(setLater[index].react));
      await act(wait);
    }
    shots.react.push(body());
  }
  act(() => reactRoot?.unmount());
  reactRoot = undefined;
  document.body.replaceChildren();

  const held = ref<Record<string, unknown>>(
    Object.fromEntries(models.map((m) => [m.vueProp, m.start])),
  );
  const extra = ref<Record<string, unknown>>({});
  pointerMovedLast();
  host = document.body.appendChild(document.createElement("div"));
  vueApp = createApp({
    render: () =>
      h(
        KozmosAnalyticsProvider,
        {
          batchDelayMs: 0,
          onDispatch: (events: KozmosAnalyticsEvent[]) =>
            heard.vue.events.push(
              ...events.map(({ timestamp: _t, ...event }) => event),
            ),
        },
        () =>
          h(KozmosThemeProvider, null, () => {
            const own: Record<string, unknown> = { ...vueProps };
            for (const m of models) {
              if (!m.own) own[m.vueProp] = held.value[m.vueProp];
              own[m.listener] = (...args: unknown[]) => {
                heard.vue.models[m.prop].push(args);
                held.value = { ...held.value, [m.vueProp]: args[0] };
              };
            }
            for (const [name, listener] of listeners)
              own[listener] = () => {
                heard.vue.other[name] += 1;
              };
            return h(vue, { ...own, ...extra.value });
          }),
      ),
  });
  vueApp.mount(host);
  await wait();
  shots.vue.push(body());
  for (const [index, step] of steps.entries()) {
    await step();
    await wait();
    if (setLater[index]) {
      extra.value = { ...extra.value, ...setLater[index].vue };
      await wait();
    }
    shots.vue.push(body());
  }
  return { heard, shots };
}
