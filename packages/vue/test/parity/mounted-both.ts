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

const GEOMETRY = /^(transform|left|top|z-index|--radix-popper-[\w-]+)$/;

/**
 * The document as each draws it, with the popper's geometry made one:
 * where Radix's floating-ui and the port's placement put the popup in
 * jsdom, which lays nothing out, differs, so each geometric declaration is
 * kept by name; and the declarations sorted.
 */
export function alike(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  for (const element of document.body.querySelectorAll("[style]")) {
    const declarations = element
      .getAttribute("style")!
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const name = part.slice(0, part.indexOf(":")).trim();
        return GEOMETRY.test(name) ? `${name}:*` : part;
      })
      .sort();
    element.setAttribute("style", declarations.join(";"));
  }
  for (const element of document.body.querySelectorAll("[data-v-app]"))
    element.removeAttribute("data-v-app");
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
