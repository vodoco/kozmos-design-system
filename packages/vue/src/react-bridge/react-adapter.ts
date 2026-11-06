import {
  h,
  callWithAsyncErrorHandling,
  camelize,
  defineComponent,
  ErrorCodes,
  getCurrentInstance,
  nextTick,
  normalizeStyle,
  onMounted,
  onBeforeUnmount,
  ref,
  toRaw,
  watch,
  warn,
} from "vue";
import { createRoot, type Root } from "react-dom/client";
import React, { useLayoutEffect, useRef } from "react";

/*
 * How a bridged wrapper hands Vue's attributes, listeners and models to the
 * React part it mounts (`createVueWrapper`). The wrapper draws two boxes of
 * its own (`display: contents`), the second React's root, and React draws a
 * third inside it, round the part (the host). None of them draws anything,
 * and nothing Vue is given is written on them, but the listeners below.
 *
 * Listeners. Vue names `@keydown` `onKeydown`, and React knows only
 * `onKeyDown`, so each listener is routed by its name (`routeListener`):
 * - a DOM event React synthesises (REACT_DOM_EVENTS, held to @types/react's
 *   DOMAttributes; REACT_UNTYPED_EVENTS, which React 18 and 19 handle and
 *   @types/react 18 does not declare) goes to the part by React's name, in
 *   any spelling (`onKeydown`, `onKeyDown`, `onDblclick`), so the part puts
 *   it where it puts that prop. React also hears it on the host, so it runs
 *   for anything the part draws, in place or in a portal (an open Dialog's
 *   content), even a part that draws no element of its own (Dialog, Select,
 *   AnalyticsProvider). The host takes the events an element hears from
 *   inside: those that bubble, and `mouseenter`, `mouseleave`,
 *   `pointerenter` and `pointerleave`, which reach every element entered.
 *   One that reaches only its target (`focus`, `blur`, `scroll`, `load`, the
 *   media events, TARGET_ONLY_EVENTS) is the part's alone, unless it is
 *   listened to with `.capture`;
 * - `.capture` is React's `…Capture`, on the part and on the host; `.once`
 *   runs once; `.passive`, which React cannot take, is a native listener on
 *   the wrapper's own box, as is `.capture` on the four events React has no
 *   capture phase for (`mouseenter`, `mouseleave`, `pointerenter`,
 *   `pointerleave`);
 * - a callback of the part named like a DOM event (SearchBar's
 *   `onChange(text)`, CategoryTile's `onSelect(id)`) is the part's alone: a
 *   model's callback is one, and the wrapper names the others (`callbacks`).
 *   It is never heard as that DOM event from what the part draws;
 * - the events only React 19 handles (REACT_19_EVENTS: `scrollend`,
 *   `beforetoggle`, `transitionrun`, `transitionstart`, `transitioncancel`)
 *   are native listeners on the box, under React 18 and 19 alike, and never
 *   given to React, which under 18 would ignore them and say so. The box
 *   listens to `scrollend` and `beforetoggle`, which do not bubble, in the
 *   capture phase, so it hears them from any element the part draws in
 *   place;
 * - `focusin` and `focusout`, which React does not synthesise, are native
 *   listeners on the box: they bubble, so the box hears them from inside;
 * - any other name is a React callback of the part (`onClose`, `onZoomIn`
 *   from `@zoom-in`, `onValueChange`) or a DOM event React does not know
 *   (a custom event): it goes to the part by its name and is bound natively
 *   on the box as well, as Vue does with an event a component does not
 *   declare. A part's callback never reaches the box as a DOM event, and
 *   React never hears a custom event, so each runs once. If the part hands
 *   an unknown name on to its element, React says so in development
 *   ("Unknown event handler property"); the native listener still hears it.
 *   With `.capture` or `.passive`, which only a DOM event has, it is native
 *   only.
 * A listener runs once for one native event, wherever it hears it first:
 * the part's element before the host, and the host before the box, in the
 * bubble phase; with `.capture`, the host before the part. It is given the
 * native event (`instanceof KeyboardEvent`); for one React makes from
 * another, the one it was made from (`onChange` from a field's `input`,
 * `onMouseEnter` from `mouseover`, `onFocus` from `focusin`). While it runs
 * on React's side, the event's `currentTarget` is the element React calls
 * it on, so `.self` means that element, and what it does to the event
 * (`.stop`, `.prevent`) is done to React's event as well. Key modifiers
 * (`.enter`) are compiled into the handler and read the native event. Each
 * handler is called as Vue calls a listener: an array is each of its
 * handlers, and an error goes to the app's errorHandler. The other
 * attributes go to React as they are, `class` as `className` and `style` as
 * one object.
 *
 * What is not heard: a native listener on the box hears nothing a part
 * draws in a portal (Radix's content, in document.body), and no event that
 * does not bubble unless it listens in the capture phase; React's host does
 * not hear what the part does not draw (a slot it does not take, which Vue
 * still draws in the box).
 *
 * Models (`ModelBinding`). Each wrapper names its `v-model`s, and declares
 * each, with its modifiers and its listeners, as props: Vue then reads every
 * spelling (`modelValue`, `model-value`, `onUpdate:model-value`) and keeps
 * them out of the attributes React is given. They are props, not `emits`: a
 * declared event's listener is left out of the props Vue compares, so a
 * listener added or removed after mount would never redraw React; a prop's
 * change does. `v-model:open` and `v-model:checked` are models of every
 * wrapper that declares no model of that name (RADIX_MODELS).
 *
 * A model is bound as Vue's `defineModel` binds one: when the parent passes
 * both the value (even null) and a listener, React's part is controlled,
 * and given the model's `empty` while the value is null; with a listener
 * alone it keeps a value of its own and reports each change; with the value
 * alone React is given it, and no callback. A change is reported through
 * Vue's `emit`, which applies `.trim` and `.number`, calls the listener and
 * a `.once` one, and tells Vue DevTools and @vue/test-utils'
 * `wrapper.emitted()`. Vue's `emit` misses one listener: a `.once` one given
 * alone (`@update:model-value.once` is `onUpdate:modelValueOnce`, and `emit`
 * looks for `onUpdate:model-valueOnce` when nothing else listens); the
 * bridge calls that one itself, once. The field keeps what was typed while
 * the model holds the trimmed or numeric value, as `v-model` on an `<input>`
 * does, and shows the model's when the field commits its change (`change`)
 * or the parent sets another. `.lazy` is passed on to the component, as Vue
 * passes it on to any component's `v-model`, and Vue does nothing with it:
 * the model is still updated on each change.
 *
 * A wrapper with no `v-model` of a name gives React neither the value nor
 * the listener, and says so once in development: for `modelValue`, React
 * takes the value by its own prop (`<KozmosProgress :value="40">`), and for
 * a named model, React's own callback reports the change.
 *
 * The parent's model wins. A change React reports is drawn at once, inside
 * React's event, and Vue is asked for the model; after Vue's render React
 * is given what Vue holds, so a parent that refuses a value or changes it
 * is shown. A parent that updates its model later (a debounce, a fetch)
 * has not taken the change by then, so the field shows the model it still
 * holds and the typed character is lost: such a parent keeps its own value
 * for the field and debounces what it does with it, not the model.
 */

// Internal React Bridge Component physically transplanting Vue DOM nodes dynamically into the React VDOM
const VueSlotBridge = ({ slotWrapper }: { slotWrapper: HTMLElement }) => {
  const bridgeRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (bridgeRef.current && slotWrapper) {
      bridgeRef.current.appendChild(slotWrapper);
    }
  }, [slotWrapper]);
  return React.createElement("div", {
    ref: bridgeRef,
    style: { display: "contents" },
  });
};

// --------------------------------------------------------------------------
// React DOM's events
// --------------------------------------------------------------------------

type DomAttributeKey = Exclude<
  keyof React.DOMAttributes<Element>,
  "children" | "dangerouslySetInnerHTML"
>;
/** React's capture variants: `onClickCapture`, beside `onClick`. */
type CaptureVariant = {
  [K in DomAttributeKey]: K extends `${infer Event}Capture`
    ? Event extends DomAttributeKey
      ? K
      : never
    : never;
}[DomAttributeKey];
/** React DOM's synthetic events, by React's name. */
export type ReactDomEvent = Exclude<DomAttributeKey, CaptureVariant>;
/** The events React gives no capture variant. */
type CapturelessEvent = {
  [K in ReactDomEvent]: `${K}Capture` extends DomAttributeKey ? never : K;
}[ReactDomEvent];

/**
 * React DOM's synthetic events, by React's name, with the DOM event each
 * stands for (what Vue's `@` names it). Held to @types/react's
 * `DOMAttributes` twice: `satisfies` fails `vue-tsc` when one has an event
 * the other lacks, and Listeners.spec.ts reads the declarations and fails
 * the same way.
 */
export const REACT_DOM_EVENTS = {
  // Clipboard
  onCopy: "copy",
  onCut: "cut",
  onPaste: "paste",
  // Composition
  onCompositionEnd: "compositionend",
  onCompositionStart: "compositionstart",
  onCompositionUpdate: "compositionupdate",
  // Focus: React's listen for focusin and focusout, so they bubble in React
  onFocus: "focus",
  onBlur: "blur",
  // Form
  onChange: "change",
  onBeforeInput: "beforeinput",
  onInput: "input",
  onReset: "reset",
  onSubmit: "submit",
  onInvalid: "invalid",
  // Image
  onLoad: "load",
  onError: "error",
  // Keyboard
  onKeyDown: "keydown",
  onKeyPress: "keypress",
  onKeyUp: "keyup",
  // Media
  onAbort: "abort",
  onCanPlay: "canplay",
  onCanPlayThrough: "canplaythrough",
  onDurationChange: "durationchange",
  onEmptied: "emptied",
  onEncrypted: "encrypted",
  onEnded: "ended",
  onLoadedData: "loadeddata",
  onLoadedMetadata: "loadedmetadata",
  onLoadStart: "loadstart",
  onPause: "pause",
  onPlay: "play",
  onPlaying: "playing",
  onProgress: "progress",
  onRateChange: "ratechange",
  onSeeked: "seeked",
  onSeeking: "seeking",
  onStalled: "stalled",
  onSuspend: "suspend",
  onTimeUpdate: "timeupdate",
  onVolumeChange: "volumechange",
  onWaiting: "waiting",
  // Mouse
  onAuxClick: "auxclick",
  onClick: "click",
  onContextMenu: "contextmenu",
  onDoubleClick: "dblclick",
  onDrag: "drag",
  onDragEnd: "dragend",
  onDragEnter: "dragenter",
  onDragExit: "dragexit",
  onDragLeave: "dragleave",
  onDragOver: "dragover",
  onDragStart: "dragstart",
  onDrop: "drop",
  onMouseDown: "mousedown",
  onMouseEnter: "mouseenter",
  onMouseLeave: "mouseleave",
  onMouseMove: "mousemove",
  onMouseOut: "mouseout",
  onMouseOver: "mouseover",
  onMouseUp: "mouseup",
  // Selection
  onSelect: "select",
  // Touch
  onTouchCancel: "touchcancel",
  onTouchEnd: "touchend",
  onTouchMove: "touchmove",
  onTouchStart: "touchstart",
  // Pointer
  onPointerDown: "pointerdown",
  onPointerMove: "pointermove",
  onPointerUp: "pointerup",
  onPointerCancel: "pointercancel",
  onPointerEnter: "pointerenter",
  onPointerLeave: "pointerleave",
  onPointerOver: "pointerover",
  onPointerOut: "pointerout",
  onGotPointerCapture: "gotpointercapture",
  onLostPointerCapture: "lostpointercapture",
  // UI
  onScroll: "scroll",
  // Wheel
  onWheel: "wheel",
  // Animation
  onAnimationStart: "animationstart",
  onAnimationEnd: "animationend",
  onAnimationIteration: "animationiteration",
  // Transition
  onTransitionEnd: "transitionend",
} as const satisfies Record<ReactDomEvent, string>;

/**
 * DOM events React DOM 18 and 19 both synthesise, which @types/react 18's
 * `DOMAttributes` does not declare: routed as REACT_DOM_EVENTS are.
 * Listeners.spec.ts holds this, and REACT_19_EVENTS, to the events React DOM
 * itself knows.
 */
export const REACT_UNTYPED_EVENTS = {
  onToggle: "toggle",
  onClose: "close",
  onCancel: "cancel",
  onResize: "resize",
} as const;

/**
 * DOM events only React DOM 19 synthesises. React 18 would ignore them, and
 * say so, so they are native listeners on the wrapper's box under both,
 * never given to React.
 */
export const REACT_19_EVENTS = {
  onScrollEnd: "scrollend",
  onBeforeToggle: "beforetoggle",
  onTransitionRun: "transitionrun",
  onTransitionStart: "transitionstart",
  onTransitionCancel: "transitioncancel",
} as const;

/** The events React has no `…Capture` for: `.capture` on them is native. */
export const REACT_CAPTURELESS_EVENTS = {
  onMouseEnter: true,
  onMouseLeave: true,
  onPointerEnter: true,
  onPointerLeave: true,
} as const satisfies Record<CapturelessEvent, true>;

/**
 * DOM events React does not synthesise, bound natively on the wrapper's box
 * and never handed to React. Both bubble, so the box hears them from any
 * element inside; React's `onFocus` and `onBlur` are the same events, heard
 * where the part puts them.
 */
export const NATIVE_DOM_EVENTS: ReadonlySet<string> = new Set([
  "focusin",
  "focusout",
]);

/**
 * DOM events an element never hears from inside in its bubble phase: they
 * do not bubble, and fire on their target alone. React's host does not take
 * them, but with `.capture`; the box listens to the React 19 ones among them
 * in the capture phase.
 */
export const TARGET_ONLY_EVENTS: ReadonlySet<string> = new Set(
  [
    "focus blur scroll scrollend load error abort invalid",
    "toggle beforetoggle close cancel resize",
    // Media
    "canplay canplaythrough durationchange emptied encrypted ended",
    "loadeddata loadedmetadata loadstart pause play playing progress",
    "ratechange seeked seeking stalled suspend timeupdate volumechange waiting",
  ]
    .join(" ")
    .split(" "),
);

/** Every DOM event React synthesises under 18 and 19, by React's name. */
const REACT_KNOWN: Readonly<Record<string, string>> = {
  ...REACT_DOM_EVENTS,
  ...REACT_UNTYPED_EVENTS,
};

/** React's name for each event, by every spelling: React's in any case, and Vue's (`onKeydown`, `onDblclick`). */
const bySpelling = (events: Readonly<Record<string, string>>) =>
  new Map<string, string>(
    Object.entries(events).flatMap(([react, dom]) => [
      [react.toLowerCase(), react],
      [`on${dom}`, react],
    ]),
  );
const REACT_EVENT_BY_SPELLING = bySpelling(REACT_KNOWN);
const REACT_19_EVENT_BY_SPELLING = bySpelling(REACT_19_EVENTS);

/** Vue's `on…` key, as Vue's `isOn` reads one. */
const isListenerKey = (key: string) => /^on[^a-z]/.test(key);
const hyphenate = (name: string) =>
  name.replace(/\B([A-Z])/g, "-$1").toLowerCase();

interface ParsedListener {
  /** React's name, for a DOM event React 18 and 19 synthesise; null for any other. */
  react: string | null;
  /** React's name, for a DOM event only React 19 synthesises; null for any other. */
  react19: string | null;
  /** The key without Vue's suffixes: `onPoiClick` for `onPoiClickOnce`. */
  base: string;
  once: boolean;
  capture: boolean;
  passive: boolean;
}

/**
 * A listener's key, read as Vue's runtime reads it: `Once`, `Passive` and
 * `Capture` at its end are `.once`, `.passive` and `.capture`. A React
 * event that ends in `Capture` (`onGotPointerCapture`) is its name.
 */
export function parseListener(key: string): ParsedListener {
  const parsed = { base: key, once: false, capture: false, passive: false };
  for (;;) {
    const spelling = parsed.base.toLowerCase();
    const react = REACT_EVENT_BY_SPELLING.get(spelling) ?? null;
    const react19 = REACT_19_EVENT_BY_SPELLING.get(spelling) ?? null;
    if (react || react19) return { ...parsed, react, react19 };
    const suffix = /(Once|Passive|Capture)$/.exec(parsed.base)?.[1];
    if (!suffix || suffix.length + 2 >= parsed.base.length)
      return { ...parsed, react: null, react19: null };
    parsed.base = parsed.base.slice(0, -suffix.length);
    if (suffix === "Once") parsed.once = true;
    else if (suffix === "Capture") parsed.capture = true;
    else parsed.passive = true;
  }
}

/**
 * A Vue key for a native listener on `event`, which Vue's runtime binds to
 * it: `onKeydown` for `keydown`. `.once` is never in it: the bridge runs a
 * `.once` listener once itself, wherever it hears it. (Spelled out, not
 * Vue's helper: the stylesheet's Tailwind reads this file, and would make a
 * utility of its name.)
 */
const nativeKey = (event: string, capture: boolean, passive: boolean) =>
  `on${event[0].toUpperCase()}${event.slice(1)}${capture ? "Capture" : ""}${
    passive ? "Passive" : ""
  }`;

/** Where one listener goes: the part, React's host round it, the wrapper's box. */
export interface ListenerRoute {
  /** React's prop for it on the part, or null. */
  react: string | null;
  /** React's prop for it on the host round the part, or null. */
  host: string | null;
  /** The key Vue binds natively on the box, without `Once`, or null. */
  native: string | null;
  once: boolean;
}

const NO_CALLBACKS: ReadonlySet<string> = new Set();

/**
 * Where one listener goes (the header says why). `callbacks` are the part's
 * own callbacks named like a DOM event, which are the part's alone.
 */
export function routeListener(
  key: string,
  callbacks: ReadonlySet<string> = NO_CALLBACKS,
): ListenerRoute {
  const parsed = parseListener(key);
  const { once, capture, passive } = parsed;
  const native = (event: string, inCapture = capture) => ({
    react: null,
    host: null,
    native: nativeKey(event, inCapture, passive),
    once,
  });
  // `on:click`: Vue's own spelling of a native, case-kept event.
  if (key.startsWith("on:"))
    return {
      react: null,
      host: null,
      native: `${parsed.base}${capture ? "Capture" : ""}${passive ? "Passive" : ""}`,
      once,
    };
  const callback = parsed.react ?? parsed.react19 ?? parsed.base;
  if (callbacks.has(callback) && !passive)
    return {
      react: capture ? `${callback}Capture` : callback,
      host: null,
      native: null,
      once,
    };
  if (parsed.react) {
    const dom = REACT_KNOWN[parsed.react];
    if (passive || (capture && parsed.react in REACT_CAPTURELESS_EVENTS))
      return native(dom);
    const name = capture ? `${parsed.react}Capture` : parsed.react;
    return {
      react: name,
      host: capture || !TARGET_ONLY_EVENTS.has(dom) ? name : null,
      native: null,
      once,
    };
  }
  if (parsed.react19) {
    const dom = REACT_19_EVENTS[parsed.react19 as keyof typeof REACT_19_EVENTS];
    return native(dom, capture || TARGET_ONLY_EVENTS.has(dom));
  }
  const event = parsed.base.slice(2).toLowerCase();
  if (NATIVE_DOM_EVENTS.has(event)) return native(event);
  if (capture || passive)
    return {
      react: null,
      host: null,
      native: `${parsed.base}${capture ? "Capture" : ""}${passive ? "Passive" : ""}`,
      once,
    };
  return { react: parsed.base, host: null, native: parsed.base, once };
}

/** A React synthetic event: what React hands a DOM event's handler. */
interface SyntheticEvent {
  nativeEvent: Event;
  currentTarget: EventTarget | null;
  isDefaultPrevented(): boolean;
  isPropagationStopped(): boolean;
  preventDefault(): void;
  stopPropagation(): void;
}
const isSynthetic = (value: unknown): value is SyntheticEvent =>
  typeof value === "object" &&
  value !== null &&
  "nativeEvent" in value &&
  typeof (value as SyntheticEvent).isPropagationStopped === "function" &&
  typeof (value as SyntheticEvent).nativeEvent?.stopPropagation === "function";

// --------------------------------------------------------------------------
// Models
// --------------------------------------------------------------------------

type AnyFunction = (...args: any[]) => any;
/** The props of `P` that are callbacks. */
type CallbackOf<P> = {
  [K in keyof P & string]-?: NonNullable<P[K]> extends AnyFunction ? K : never;
}[keyof P & string];
/**
 * `T`, which TypeScript does not infer from where it is used: what the
 * intrinsic TypeScript 5.4 added for this does, written so the declarations
 * read on any TypeScript 5 (the version Kozmos's consumer check installs).
 */
type Deferred<T> = [T][T extends unknown ? 0 : never];

interface LooseModelBinding {
  prop: string;
  callback: string;
  read?: (...args: any[]) => unknown;
  empty: unknown;
}

/**
 * How one `v-model` of a wrapper reaches its React part: React is given the
 * model's value as `prop`, and, while the parent listens, a `callback` that
 * reports what `read` takes from its arguments.
 */
export type ModelBinding<P = Record<string, unknown>> = string extends keyof P
  ? LooseModelBinding
  : {
      [C in CallbackOf<P>]: {
        /** The React prop that carries the value: `value`, `checked`, `selectedFloor`. */
        prop: keyof P & string;
        /** The React callback that reports a change: `onValueChange`, `onCheckedChange`, `onChange`. */
        callback: C;
        /**
         * The new value, read from the callback's arguments, which it is
         * typed by. Unset, the first argument.
         */
        read?: (
          ...args: Parameters<Extract<NonNullable<P[C]>, AnyFunction>>
        ) => unknown;
        /**
         * What React is given while the model is bound and null or
         * undefined: what the part shows when nothing is chosen, so it stays
         * controlled (`""`, `[]`, `false`). A function is given React's
         * props, for a part whose nothing depends on them (Listbox's
         * `multiple`). `undefined` only for a part with no value of its own
         * (FloorSelector), which shows nothing with it.
         */
        empty: Empty<P>;
      };
    }[CallbackOf<P>];

/** A model's `empty`: a value, or one read from React's props. */
type Empty<P> =
  | ((props: P) => unknown)
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly unknown[]
  | { readonly [key: string]: unknown };

/**
 * A wrapper's models, by Vue's name for each: `modelValue` is `v-model`,
 * `originValue` is `v-model:originValue`.
 */
export type ModelBindings<P = Record<string, unknown>> = Record<
  string,
  ModelBinding<P>
>;

/** What else a wrapper says of its React part. */
export interface WrapperOptions<P = Record<string, unknown>> {
  /**
   * The part's own callbacks named like a DOM event React knows
   * (CategoryTile's `onSelect(id)`): given to the part alone, never heard as
   * that event from what the part draws. A model's callback is one already.
   */
  callbacks?: readonly (string extends keyof P ? string : CallbackOf<P>)[];
}

/** A DOM change event's value: what an `<input>`'s `onChange` reports. */
export const eventValue = (event: { target: { value: string } }) =>
  event.target.value;

/**
 * `v-model:open` and `v-model:checked` on any wrapper that declares no model
 * of that name, as Radix's controlled pairs. They are not declared, so they
 * arrive in `attrs`, and are read from there by the same names.
 */
export const RADIX_MODELS: Record<string, LooseModelBinding> = {
  open: { prop: "open", callback: "onOpenChange", empty: false },
  checked: { prop: "checked", callback: "onCheckedChange", empty: false },
};

/** The modifiers' prop of a model, as Vue's compiler names it. */
const modifiersOf = (name: string) =>
  name === "modelValue" ? "modelModifiers" : `${name}Modifiers`;

/** Every key a model may arrive under, as Vue's `emit` and `useModel` read them. */
function modelKeys(name: string) {
  const kebab = hyphenate(name);
  return {
    value: [name, kebab],
    modifiers:
      name === "modelValue"
        ? ["modelModifiers"]
        : [modifiersOf(name), modifiersOf(kebab)],
    listener: [`onUpdate:${name}`, `onUpdate:${kebab}`],
    once: [`onUpdate:${name}Once`, `onUpdate:${kebab}Once`],
  };
}

/** The declared props of a wrapper's models. */
type ModelProps<N extends string> = Record<
  | N
  | (N extends "modelValue" ? "modelModifiers" : `${N}Modifiers`)
  | `onUpdate:${N}`
  | `onUpdate:${N}Once`,
  null
>;

const hasOwn = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key);
const first = (source: Record<string, unknown>, keys: string[]) => {
  const key = keys.find((name) => source[name] != null);
  return key === undefined ? undefined : source[key];
};

/** `.trim` and `.number`, as Vue's `emit` applies them. */
function applyModifiers(
  value: unknown,
  modifiers: Record<string, boolean> | undefined,
) {
  let next = value;
  if (modifiers?.trim && typeof next === "string") next = next.trim();
  if (modifiers?.number) {
    const number = parseFloat(next as string);
    if (!Number.isNaN(number)) next = number;
  }
  return next;
}

/** A model as one render reads it. */
interface BoundModel {
  name: string;
  binding: LooseModelBinding;
  /** The parent passes the value (even null) and listens: React is controlled. */
  controlled: boolean;
  listening: boolean;
  value: unknown;
}

/** One listener the parent gave, as the bridge calls it. */
interface Entry {
  /** The key the parent gave it under: one listener, wherever it is heard. */
  key: string;
  handler: unknown;
  once: boolean;
}

/** What `createVueWrapper` made a wrapper of. */
export interface Bridged {
  /** The React component it mounts. */
  part: unknown;
  /** Its models, by Vue's name for each. */
  models: Readonly<Record<string, Readonly<LooseModelBinding>>>;
  /** The part's own callbacks named like a DOM event, its models' among them. */
  callbacks: ReadonlySet<string>;
}

const bridged = new WeakMap<object, Bridged>();

/**
 * What a wrapper made by `createVueWrapper` mounts and binds, or undefined
 * for any other component. `v-model:open` and `v-model:checked`
 * (RADIX_MODELS) are not among its models.
 */
export function bridgeOf(wrapper: object): Bridged | undefined {
  return bridged.get(wrapper);
}

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

const IMPORTANT = /\s*!important\s*$/i;

/**
 * Vue's `style`, a string, an object or an array of both, as React takes it:
 * one object, its names camelCase but for custom properties (`--gap`).
 * `!important` is dropped and the declaration kept: React sets each
 * property as `style[name] = value`, which takes no priority, and a value
 * with `!important` in it is refused, so the whole declaration was lost.
 * An inline declaration already wins over every stylesheet rule but an
 * `!important` one; to beat one, use a class.
 */
function toReactStyle(
  style: unknown,
  dropped: (name: string) => void,
): Record<string, unknown> {
  const merged = normalizeStyle([style]) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(merged ?? {}).map(([name, value]) => {
      let given = value;
      if (typeof given === "string" && IMPORTANT.test(given)) {
        given = given.replace(IMPORTANT, "");
        dropped(name);
      }
      return [name.startsWith("--") ? name : camelize(name), given];
    }),
  );
}

/** The host's style: it draws no box of its own. */
const HOST_STYLE = { display: "contents" } as const;

/**
 * Creates a native Vue 3 wrapper component for a Kozmos React component.
 * This directly mounts the React VDOM inside a Vue node, completely bypassing Web Component serialization constraints.
 *
 * @param ReactComponent The Kozmos React component to wrap
 * @param models Each `v-model` the wrapper takes, and how it reaches React
 *   (`{ modelValue: { prop: "value", callback: "onValueChange", empty: "" } }`)
 * @param options The part's own callbacks named like a DOM event
 *   (`{ callbacks: ["onSelect"] }`)
 */
export function createVueWrapper<P extends object, N extends string = never>(
  ReactComponent: React.ElementType<P>,
  models: Record<N, ModelBinding<Deferred<P>>> = {} as Record<
    N,
    ModelBinding<Deferred<P>>
  >,
  options: WrapperOptions<Deferred<P>> = {},
) {
  const bindings = models as Record<string, LooseModelBinding>;
  const callbacks: ReadonlySet<string> = new Set([
    ...((options.callbacks ?? []) as readonly string[]),
    ...Object.values(bindings).map((binding) => binding.callback),
  ]);
  const declared = Object.fromEntries(
    Object.keys(bindings).flatMap((name) => [
      [name, null],
      [modifiersOf(name), null],
      [`onUpdate:${name}`, null],
      [`onUpdate:${name}Once`, null],
    ]),
  ) as ModelProps<N>;
  const label =
    (ReactComponent as any).displayName ||
    (ReactComponent as any).name ||
    "KozmosReactWrapper";
  const wrapper = defineComponent({
    name: label,
    // Each model, its modifiers and its listeners. Vue reads every
    // spelling of each, and keeps them out of attrs.
    props: declared,
    // The attrs are React's alone. Vue would also write each onto the
    // wrapper's own box: an id twice in the page, an aria-label on a box
    // that draws nothing, and a listener (`@click`) on that box as well as on
    // React's element, so it ran twice for one click. The listeners React
    // does not take are bound on the box by its render, below.
    inheritAttrs: false,
    setup(props, { attrs, slots, emit }) {
      const instance = getCurrentInstance()!;
      const containerRef = ref<HTMLElement | null>(null);
      const slotRefs: Record<string, { value: HTMLElement | null }> = {};
      /**
       * A change React has just reported, by model, while the parent holds
       * the model: what the field shows (as typed), what the model was given
       * (after `.trim` and `.number`), and whether Vue has rendered since.
       */
      const typed = new Map<
        string,
        { shown: unknown; value: unknown; settled: boolean }
      >();
      /** `.once` listeners that have run, by the key each was given under. */
      const onceRan = new Set<string>();
      /** The `.once` model listeners Vue's `emit` misses that have run. */
      const modelOnceRan = new Set<string>();
      /** The listeners each native event has run, by key: one run per event. */
      const heard = new WeakMap<Event, Set<string>>();
      const warned = new Set<string>();
      let root: Root | null = null;

      const warnOnce = (message: string) => {
        if (warned.has(message)) return;
        warned.add(message);
        warn(message);
      };

      /** Calls a handler (or an array of them) as Vue calls a listener. */
      const call = (handler: unknown, args: unknown[], type: ErrorCodes) =>
        callWithAsyncErrorHandling(
          handler as AnyFunction | AnyFunction[],
          instance,
          type,
          args,
        );

      /**
       * Whether a listener runs now: once for one native event, wherever it
       * hears it first, and a `.once` one once.
       */
      const claim = (entry: Entry, event: Event | null) => {
        if (entry.once && onceRan.has(entry.key)) return false;
        if (event) {
          let ran = heard.get(event);
          if (!ran) heard.set(event, (ran = new Set()));
          if (ran.has(entry.key)) return false;
          ran.add(entry.key);
        }
        if (entry.once) onceRan.add(entry.key);
        return true;
      };

      /**
       * A DOM event's listener, called from React with the native event:
       * while it runs, `currentTarget` is the element React calls it on, and
       * what it does to the event is done to React's as well.
       */
      const callWithNative = (handler: unknown, event: SyntheticEvent) => {
        const native = event.nativeEvent;
        const stopped = native.cancelBubble;
        let shadowed = false;
        try {
          Object.defineProperty(native, "currentTarget", {
            configurable: true,
            value: event.currentTarget,
          });
          shadowed = true;
        } catch {
          // An event that takes no property of its own keeps its own.
        }
        try {
          return call(handler, [native], ErrorCodes.NATIVE_EVENT_HANDLER);
        } finally {
          if (shadowed)
            delete (native as { currentTarget?: unknown }).currentTarget;
          if (native.defaultPrevented && !event.isDefaultPrevented())
            event.preventDefault();
          if (!stopped && native.cancelBubble && !event.isPropagationStopped())
            event.stopPropagation();
        }
      };

      /** React's handler for the listeners given one React name. */
      const fromReact =
        (entries: Entry[]) =>
        (...args: unknown[]) => {
          const event = isSynthetic(args[0]) ? args[0] : null;
          let result: unknown;
          for (const entry of entries) {
            if (!claim(entry, event?.nativeEvent ?? null)) continue;
            result = event
              ? callWithNative(entry.handler, event)
              : call(entry.handler, args, ErrorCodes.COMPONENT_EVENT_HANDLER);
          }
          return result;
        };

      /** The box's native listener for the listeners given one key. */
      const fromBox = (entries: Entry[]) => (event: Event) => {
        for (const entry of entries)
          if (claim(entry, event))
            call(entry.handler, [event], ErrorCodes.NATIVE_EVENT_HANDLER);
      };

      /** The props Vue gave the wrapper, as its vnode holds them. */
      const given = () =>
        (instance.vnode.props ?? {}) as Record<string, unknown>;

      /**
       * What the parent gave, sorted: each bound model, the listeners the
       * part, the host and the box take, and the rest of the attrs.
       */
      const sort = () => {
        const raw = given();
        const rest: Record<string, unknown> = { ...attrs, ...props };
        const bound: BoundModel[] = [];
        const read = (name: string, binding: LooseModelBinding) => {
          const keys = modelKeys(name);
          const present = keys.value.some((key) => hasOwn(raw, key));
          const listening =
            first(raw, keys.listener) != null || first(raw, keys.once) != null;
          const value = hasOwn(raw, name) ? raw[name] : raw[keys.value[1]];
          for (const key of Object.values(keys).flat()) delete rest[key];
          if (present || listening)
            bound.push({
              name,
              binding,
              controlled: present && listening,
              listening,
              value,
            });
        };
        for (const [name, binding] of Object.entries(bindings))
          read(name, binding);
        for (const [name, binding] of Object.entries(RADIX_MODELS))
          if (!(name in bindings)) read(name, binding);

        // A v-model the wrapper does not take: its listener and modifiers
        // never reach React, and neither does `modelValue`, which no React
        // part takes. Said once, in development.
        const noModel = (name: string) =>
          warnOnce(
            name === "modelValue"
              ? `${label} has no v-model: modelValue and its listener are not given to React. Give React's own prop instead, such as :value.`
              : `${label} has no v-model:${name}: its listener is not given to React. Listen to the part's own change callback instead.`,
          );
        for (const key of Object.keys(rest)) {
          const model = /^onUpdate:(.+?)(?:Once)?$/.exec(key)?.[1];
          if (!model) continue;
          delete rest[key];
          const name = camelize(model);
          for (const modifiers of modelKeys(name).modifiers)
            delete rest[modifiers];
          noModel(name);
        }
        if (!("modelValue" in bindings))
          for (const key of ["modelValue", "model-value", "modelModifiers"])
            if (hasOwn(rest, key)) {
              delete rest[key];
              noModel("modelValue");
            }

        const react: Record<string, Entry[]> = {};
        const host = new Set<string>();
        const native: Record<string, Entry[]> = {};
        for (const key of Object.keys(rest)) {
          if (!isListenerKey(key)) continue;
          const handler = rest[key];
          delete rest[key];
          if (handler == null) continue;
          const route = routeListener(key, callbacks);
          const entry = { key, handler, once: route.once };
          if (route.native) (native[route.native] ??= []).push(entry);
          if (route.react) (react[route.react] ??= []).push(entry);
          if (route.host) host.add(route.host);
        }
        return { bound, react, host, native, rest };
      };

      const renderReact = () => {
        if (!containerRef.value) return;

        // Initialize the React root once
        if (!root) {
          root = createRoot(containerRef.value);
        }

        const sorted = sort();
        const reactProps = sorted.rest as Record<string, any>;
        const hostProps: Record<string, unknown> = { style: HOST_STYLE };

        // Force Vue's native HTML 'class' payload into React's JSX 'className' expectation
        if (reactProps.class !== undefined) {
          reactProps.className = reactProps.className
            ? `${reactProps.className} ${reactProps.class}`
            : reactProps.class;
          delete reactProps.class;
        }
        if (reactProps.style != null)
          reactProps.style = toReactStyle(reactProps.style, (name) =>
            warnOnce(
              `${label}'s style ${name} is given to React without !important: React's style prop takes no priority.`,
            ),
          );

        // The listeners React takes, by React's name: on the part, and on
        // the host those it hears from inside.
        for (const [name, entries] of Object.entries(sorted.react)) {
          const handler = fromReact(entries);
          reactProps[name] = handler;
          if (sorted.host.has(name)) hostProps[name] = handler;
        }
        // A `.once` listener taken away and given again runs once more, as
        // Vue's native one does.
        const live = new Set(
          [...Object.values(sorted.react), ...Object.values(sorted.native)]
            .flat()
            .map((entry) => entry.key),
        );
        for (const key of onceRan) if (!live.has(key)) onceRan.delete(key);

        // Each model: its value as React's `prop`, and, while the parent
        // listens, React's `callback` reporting it, after any handler of
        // that name the user gave. A change to a model the parent no longer
        // binds is forgotten.
        for (const name of typed.keys())
          if (!sorted.bound.some((model) => model.name === name))
            typed.delete(name);
        for (const model of sorted.bound) {
          const { name, binding } = model;
          const shown = typed.get(name);
          if (shown && !model.controlled) typed.delete(name);
          else if (
            shown?.settled &&
            !Object.is(toRaw(model.value), toRaw(shown.value))
          )
            // The parent refused the change, or set another value: its wins.
            typed.delete(name);
          const pending = typed.get(name);
          const value = pending ? pending.shown : model.value;
          if (value != null) reactProps[binding.prop] = value;
          else if (model.controlled)
            reactProps[binding.prop] =
              typeof binding.empty === "function"
                ? binding.empty(reactProps)
                : binding.empty;
          if (!model.listening) continue;
          const own = reactProps[binding.callback];
          const report = (...args: unknown[]) => {
            const value = binding.read ? binding.read(...args) : args[0];
            emitModel(name, value, model.controlled);
          };
          reactProps[binding.callback] =
            typeof own === "function"
              ? (...args: unknown[]) => {
                  const result = own(...args);
                  report(...args);
                  return result;
                }
              : report;
        }

        // Bridge ALL named Vue slots explicitly into their respective React Node props (e.g. #actions -> reactProps.actions)
        for (const slotName of Object.keys(slots)) {
          if (slotRefs[slotName]?.value) {
            const reactPropName =
              slotName === "default" ? "children" : slotName;
            reactProps[reactPropName] = React.createElement(VueSlotBridge, {
              slotWrapper: slotRefs[slotName].value as HTMLElement,
            });
          }
        }

        // Mount the React tree, inside the host that hears its events.
        root.render(
          React.createElement(
            "div",
            hostProps,
            React.createElement(ReactComponent, reactProps as any),
          ),
        );
      };

      /**
       * Reports a model's change to the parent through Vue's `emit`, which
       * applies `.trim` and `.number`, calls the listener and the `.once`
       * one it finds, and tells Vue DevTools and @vue/test-utils. `emit`
       * looks for the `.once` listener beside the listener it found, and
       * when there is none, under the kebab-case name: so a `.once` one given
       * alone in camelCase (`@update:model-value.once` is
       * `onUpdate:modelValueOnce`) is missed, and the bridge calls it.
       */
      const emitModel = (name: string, shown: unknown, controlled: boolean) => {
        const raw = given();
        const keys = modelKeys(name);
        const value = applyModifiers(
          shown,
          first(raw, keys.modifiers) as Record<string, boolean> | undefined,
        );
        if (controlled) typed.set(name, { shown, value, settled: false });
        emit(`update:${name}`, shown);
        const found = `${raw[keys.listener[0]] ? keys.listener[0] : keys.listener[1]}Once`;
        for (const key of new Set(keys.once))
          if (key !== found && raw[key] != null && !modelOnceRan.has(key)) {
            modelOnceRan.add(key);
            call(raw[key], [value], ErrorCodes.COMPONENT_EVENT_HANDLER);
          }
        if (!controlled) return;
        // Drawn now, inside React's event: when it ends, React puts a
        // controlled field back to the value it was last given, and Vue's
        // render comes a tick later, so the field showed its old value for a
        // moment and lost its caret. After Vue's render, React is given what
        // Vue holds, whether the parent took the value or not.
        renderReact();
        void nextTick(settle);
      };

      /** After Vue's render: the parent's model decides what React shows. */
      const settle = () => {
        if (!typed.size) return;
        for (const change of typed.values()) change.settled = true;
        renderReact();
      };

      /**
       * A field commits its change (`change`, on blur or Enter): it shows the
       * model's value, trimmed or numeric, as `v-model` on an `<input>` does.
       */
      const commit = () => {
        let changed = false;
        for (const change of typed.values())
          if (!Object.is(change.shown, change.value)) {
            change.shown = change.value;
            changed = true;
          }
        if (changed) renderReact();
      };

      onMounted(() => {
        renderReact();
        // After React's own listener on the same element, which reports the
        // change first.
        containerRef.value?.addEventListener("change", commit);
      });

      // Synchronize Vue reactivity into the React Engine silently
      watch(
        () => ({ ...props, ...attrs }),
        () => {
          // Vue's render has the parent's models now.
          for (const change of typed.values()) change.settled = true;
          renderReact();
        },
        { deep: true },
      );

      // Cleanly unmount the React Virtual DOM when the Vue Component is destroyed
      onBeforeUnmount(() => {
        containerRef.value?.removeEventListener("change", commit);
        if (root) {
          root.unmount();
        }
      });

      // Render a style-neutral transport container ensuring flex/grid cascades natively.
      // Construct unique Virtual DOM containers for every configured slot dynamically natively bridging arrays.
      return () => {
        const slotVNodes = Object.entries(slots).map(([name, slotFn]) => {
          if (!slotRefs[name]) slotRefs[name] = { value: null };
          return h(
            "div",
            {
              ref: (el: any) => {
                if (el) slotRefs[name].value = el as HTMLElement;
              },
              style: { display: "contents" },
              key: name,
            },
            slotFn ? slotFn() : [],
          );
        });

        // The listeners the box takes, as Vue binds a listener on an
        // element: `.capture` and `.passive` included, `.once` the bridge's.
        const native = Object.fromEntries(
          Object.entries(sort().native).map(([key, entries]) => [
            key,
            fromBox(entries),
          ]),
        );
        return h("div", { style: { display: "contents" }, ...native }, [
          h("div", { ref: containerRef, style: { display: "contents" } }),
          ...slotVNodes,
        ]);
      };
    },
  });
  bridged.set(wrapper, {
    part: ReactComponent,
    models: Object.fromEntries(
      Object.entries(bindings).map(([name, binding]) => [
        name,
        Object.freeze({ ...binding }),
      ]),
    ),
    callbacks,
  });
  return wrapper;
}
