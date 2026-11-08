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
  onUpdated,
  ref,
  shallowRef,
  toRaw,
  watch,
  warn,
} from "vue";
import { createRoot, type Root } from "react-dom/client";
import React, { useLayoutEffect, useRef } from "react";

/*
 * How a bridged wrapper hands Vue's attributes, listeners and models to the
 * React part it mounts (`createVueWrapper`). The wrapper's own boxes
 * (`display: contents`) draw nothing, and nothing Vue is given is written on
 * them, but the native listeners below.
 *
 * Listeners. Each listener goes to one place, by one rule:
 * - if the part takes its prop, it is the part's alone. Vue names `@keydown`
 *   `onKeydown`, and React knows only `onKeyDown`, so a DOM event React
 *   synthesises is given by React's name, in any spelling (`onKeydown`,
 *   `onKeyDown`, `onDblclick`), and `.capture` as React's `…Capture`. The
 *   part decides what runs it, as it does for a React caller: LocationPin
 *   runs `onClick` for one tap of a double tap, and a disabled
 *   NavigationItem never;
 * - if the part does not take it, it is a native listener on the wrapper's
 *   own box, as Vue binds a listener a component does not declare on the
 *   component's root element. It hears what the part draws in place, and,
 *   as a listener on a component never hears what the component teleports,
 *   nothing the part draws in a portal (an open Dialog's content).
 * Which props a part takes is read from React's types: part-takes.ts, which
 * scripts/bridge-takes.mjs writes, and Listeners.spec.ts holds to them.
 * Dialog, Select, Menu, Drawer, Popover, BottomSheet, Tooltip and the
 * providers take no DOM event, so their listeners are the box's; a part
 * whose props carry React's DOM attributes takes every DOM event they
 * declare, and its own callbacks (SearchBar's `onChange(text)`). A part
 * `createVueWrapper` has no description of takes every React DOM event and
 * every other name, as React's props contract has it, but those its
 * `notTaken` names. `focusin`, `focusout` and the events only React 19 knows
 * are never React's. The box hears the events that do not bubble (`focus`,
 * `blur`, `scroll`, `scrollend`, `toggle`, the media events:
 * HEARD_ON_THE_WAY_DOWN) from what the part draws in place: it listens to
 * them in the capture phase, since the box is never focused or scrolled
 * itself. `focusin` and `focusout` are focus's and blur's bubbling forms.
 *
 * The part's listener is given the native event when it is of the
 * listener's own type (`click` for `onClick`), and React's event otherwise:
 * React makes `onMouseEnter` from `mouseover`, `onFocus` from `focusin` and
 * a field's `onChange` from `input`, and its own event says `mouseenter`,
 * `focus` and `change`. Given the native event, its `currentTarget` is the
 * element React calls the listener on while it runs, so `.self` means that
 * element, and `.stop` and `.prevent` are done to React's event as well. On
 * the box, `.self` never runs: the box draws no box (`display: contents`),
 * so it is never an event's target.
 * Key modifiers (`.enter`) are compiled into the handler and read either
 * event. `.once` runs once; `.passive`, which React cannot take, is dropped
 * on the part (React's own touch and wheel listeners are passive), and kept
 * on the box. Each handler is called as Vue calls a listener: an array is
 * each of its handlers, and an error goes to the app's errorHandler. The
 * other attributes go to React as they are, `class` as `className`, `style`
 * as one object, and a boolean prop's as below.
 *
 * Booleans. Vue gives a bare attribute (`<KozmosNavigationItem disabled>`)
 * as "", which React reads as false, so the part was not disabled. A part's
 * boolean prop is read by its kind, from React's types:
 * - a flag (`disabled: boolean`) as Vue reads a declared Boolean prop: ""
 *   (bare, or bound to "") or its own name (`disabled="disabled"`) is
 *   `true`, and so, as the bridge's own extension, is its name in small
 *   letters (`readonly="readonly"`);
 * - a union with literals only (`aria-hidden: boolean | "true" | "false"`,
 *   Checkbox's `checked: boolean | "indeterminate"`) as Vue reads a
 *   `[Boolean, String]` prop, Boolean first: the same, so
 *   `checked="checked"` is `true` and `checked="indeterminate"` its string;
 * - a union with free text, a number or an object (`error: boolean |
 *   string`, motion's `animate`) as Vue reads a `[String, Boolean]` prop:
 *   "" and its own name are its strings, never cast. A bare `error`, or
 *   `:error="msg"` while `msg` is "", is "" and sets no error; `:error="true"`
 *   sets one with no message, and `error="error"` is the message "error".
 * Any other value, bound or not, is React's as it is (`:disabled="false"`,
 * `:error="'Required'"`); absent, React is not given the prop, and its own
 * default applies (Combobox stays clearable). Vue keeps an attribute as the
 * template spells it, so each spelling is React's prop: `readOnly` (an
 * SFC's), `readonly` (an in-DOM template's, which the browser writes in
 * small letters; the bridge's own extension) and `read-only`. React's own
 * wins when two are given; of two others, the last. A model whose React
 * prop is a boolean is read the same way, by the model's name: bare
 * `<KozmosToggleButton pressed>`, `<KozmosSwitch checked>` and
 * `<KozmosCheckbox model-value>` are `true`. Which props are booleans, and
 * of which kind, is read from React's types, as listeners' props are:
 * part-takes.ts, which Booleans.spec.ts holds to them. A prop that takes any
 * ReactNode is a slot, not a boolean. A part `createVueWrapper` has no
 * description of names its own (`options.booleans`); unnamed, its
 * attributes reach React as Vue gives them.
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
 * React DOM's synthetic events, by React's name. Held to @types/react's
 * `DOMAttributes` twice: `satisfies` and `EveryEventListed` fail `vue-tsc`
 * when one has an event the other lacks, and Listeners.spec.ts reads the
 * declarations and fails the same way.
 */
const REACT_DOM_EVENT_NAMES = [
  // Clipboard
  "onCopy",
  "onCut",
  "onPaste",
  // Composition
  "onCompositionEnd",
  "onCompositionStart",
  "onCompositionUpdate",
  // Focus: React's listen for focusin and focusout, so they bubble in React
  "onFocus",
  "onBlur",
  // Form
  "onChange",
  "onBeforeInput",
  "onInput",
  "onReset",
  "onSubmit",
  "onInvalid",
  // Image
  "onLoad",
  "onError",
  // Keyboard
  "onKeyDown",
  "onKeyPress",
  "onKeyUp",
  // Media
  "onAbort",
  "onCanPlay",
  "onCanPlayThrough",
  "onDurationChange",
  "onEmptied",
  "onEncrypted",
  "onEnded",
  "onLoadedData",
  "onLoadedMetadata",
  "onLoadStart",
  "onPause",
  "onPlay",
  "onPlaying",
  "onProgress",
  "onRateChange",
  "onSeeked",
  "onSeeking",
  "onStalled",
  "onSuspend",
  "onTimeUpdate",
  "onVolumeChange",
  "onWaiting",
  // Mouse
  "onAuxClick",
  "onClick",
  "onContextMenu",
  "onDoubleClick",
  "onDrag",
  "onDragEnd",
  "onDragEnter",
  "onDragExit",
  "onDragLeave",
  "onDragOver",
  "onDragStart",
  "onDrop",
  "onMouseDown",
  "onMouseEnter",
  "onMouseLeave",
  "onMouseMove",
  "onMouseOut",
  "onMouseOver",
  "onMouseUp",
  // Selection
  "onSelect",
  // Touch
  "onTouchCancel",
  "onTouchEnd",
  "onTouchMove",
  "onTouchStart",
  // Pointer
  "onPointerDown",
  "onPointerMove",
  "onPointerUp",
  "onPointerCancel",
  "onPointerEnter",
  "onPointerLeave",
  "onPointerOver",
  "onPointerOut",
  "onGotPointerCapture",
  "onLostPointerCapture",
  // UI
  "onScroll",
  // Wheel
  "onWheel",
  // Animation
  "onAnimationStart",
  "onAnimationEnd",
  "onAnimationIteration",
  // Transition
  "onTransitionEnd",
] as const satisfies readonly ReactDomEvent[];
/** Fails `vue-tsc` with the name of any event @types/react declares that the list lacks. */
type Listed<Missing extends never> = Missing;
export type EveryEventListed = Listed<
  Exclude<ReactDomEvent, (typeof REACT_DOM_EVENT_NAMES)[number]>
>;

/**
 * Each React event name with the DOM event it stands for (what Vue's `@`
 * names it): its name after `on`, in small letters, but `onDoubleClick`'s
 * `dblclick`.
 */
const withDomNames = <N extends string>(names: readonly N[]) =>
  Object.fromEntries(
    names.map((name) => [
      name,
      name === "onDoubleClick" ? "dblclick" : name.slice(2).toLowerCase(),
    ]),
  ) as Readonly<Record<N, string>>;

/** React DOM's synthetic events, by React's name, with the DOM event each stands for. */
export const REACT_DOM_EVENTS = withDomNames(REACT_DOM_EVENT_NAMES);

/**
 * DOM events React DOM 18 and 19 both synthesise, which @types/react 18's
 * `DOMAttributes` does not declare. A part takes one only if its props
 * declare it (WayfindingCard's `onClose`). Listeners.spec.ts holds this, and
 * REACT_19_EVENTS, to the events React DOM itself knows.
 */
export const REACT_UNTYPED_EVENTS = withDomNames([
  "onToggle",
  "onClose",
  "onCancel",
  "onResize",
] as const);

/**
 * DOM events only React DOM 19 synthesises. No part's types declare them
 * (React's are @types/react 18's), so their listeners are native listeners
 * on the wrapper's box, under React 18 and 19 alike.
 */
export const REACT_19_EVENTS = withDomNames([
  "onScrollEnd",
  "onBeforeToggle",
  "onTransitionRun",
  "onTransitionStart",
  "onTransitionCancel",
] as const);

/** The events React has no `…Capture` for: `.capture` on them is native. */
export const REACT_CAPTURELESS_EVENTS = {
  onMouseEnter: true,
  onMouseLeave: true,
  onPointerEnter: true,
  onPointerLeave: true,
} as const satisfies Record<CapturelessEvent, true>;

/**
 * DOM events React does not synthesise: a listener of theirs is always a
 * native listener on the wrapper's box. Both bubble, so the box hears them
 * from what the part draws in place.
 */
export const NATIVE_DOM_EVENTS: ReadonlySet<string> = new Set([
  "focusin",
  "focusout",
]);

/**
 * The DOM events that do not bubble, which the wrapper's box listens to on
 * their way down, in the capture phase: a box (`display: contents`) is never
 * focused, scrolled or loaded itself, so a plain listener there could never
 * run, and in the capture phase it hears the elements the part draws in
 * place. `focusin` and `focusout` are focus's and blur's bubbling forms.
 * Not the mouse's and the pointer's enter and leave: the box is entered and
 * left itself, and hears its own.
 */
export const HEARD_ON_THE_WAY_DOWN: ReadonlySet<string> = new Set(
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

/**
 * React's DOM event props, as @types/react 18's `DOMAttributes` declares
 * them: each event, and its `…Capture` but for the capture-less four. What a
 * part's `dom` stands for in part-takes.ts.
 */
export const REACT_DOM_PROPS: ReadonlySet<string> = new Set(
  Object.keys(REACT_DOM_EVENTS).flatMap((name) =>
    name in REACT_CAPTURELESS_EVENTS ? [name] : [name, `${name}Capture`],
  ),
);

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
 * it, `.once`, `.capture` and `.passive` included: `onKeydown` for
 * `keydown`. (Spelled out, not Vue's helper: the stylesheet's Tailwind reads
 * this file, and would make a utility of its name.)
 */
const nativeKey = (event: string, parsed: ParsedListener, capture: boolean) =>
  `on${event[0].toUpperCase()}${event.slice(1)}${capture ? "Capture" : ""}${
    parsed.once ? "Once" : ""
  }${parsed.passive ? "Passive" : ""}`;

/**
 * Which `on…` props a React part takes (part-takes.ts, generated from
 * React's types): every React DOM event prop (`dom`, REACT_DOM_PROPS) but
 * those in `except`, and its own (`own`).
 */
export interface Takes {
  dom: boolean;
  except?: readonly string[];
  own: readonly string[];
}

/** Whether a part described by `takes` takes the prop `prop`. */
export const takesProp = (takes: Takes, prop: string) =>
  takes.own.includes(prop) ||
  (takes.dom && REACT_DOM_PROPS.has(prop) && !takes.except?.includes(prop));

// --------------------------------------------------------------------------
// Boolean props
// --------------------------------------------------------------------------

/**
 * Which of a React part's props are booleans (part-takes.ts, generated from
 * React's types): `flags`, whose type is `boolean`; `unions`, boolean in a
 * union with literals only (`boolean | "true" | "false"`); and `texts`,
 * boolean in a union with free text, a number or an object (`error:
 * boolean | string`). A prop that takes any ReactNode is a slot, and none.
 */
export interface Booleans {
  flags: readonly string[];
  unions: readonly string[];
  texts: readonly string[];
}

/** One boolean prop, as an attribute names it. */
interface BooleanProp {
  /** React's name for it. */
  prop: string;
  /** A flag's or a literal union's: "" and its name are `true`. */
  cast: boolean;
}

const spelt = new WeakMap<Booleans, ReadonlyMap<string, BooleanProp>>();

/**
 * A part's boolean props, by every spelling Vue may give one's attribute:
 * React's name (`readOnly`, as an SFC keeps it), in small letters
 * (`readonly`, as an in-DOM template has it) and in kebab-case
 * (`read-only`). The generator fails on a spelling two props would share.
 */
function spellings(booleans: Booleans) {
  let byKey = spelt.get(booleans);
  if (!byKey) {
    const map = new Map<string, BooleanProp>();
    for (const [props, cast] of [
      [booleans.flags, true],
      [booleans.unions, true],
      [booleans.texts, false],
    ] as const)
      for (const prop of props)
        for (const key of [prop.toLowerCase(), hyphenate(prop), prop])
          map.set(key, { prop, cast });
    spelt.set(booleans, (byKey = map));
  }
  return byKey;
}

/** A part's boolean prop by React's name, if it is one. */
const booleanProp = (booleans: Booleans, prop: string) => {
  const found = spellings(booleans).get(prop);
  return found?.prop === prop ? found : undefined;
};

/**
 * A boolean prop's value as React takes it. A flag's or a literal union's
 * "" (a bare attribute, or one bound to "") and own name, kebab-case or in
 * small letters (`disabled="disabled"`, `read-only="read-only"`,
 * `readonly="readonly"`, `checked="checked"`), are `true`. A text's are its
 * strings. Any other value is React's as it is (`:disabled="false"`,
 * `checked="indeterminate"`). `name` is the name it was given under:
 * React's prop for an attribute, the model's for a model.
 */
const asBoolean = (value: unknown, name: string, { cast }: BooleanProp) =>
  cast &&
  (value === "" || value === hyphenate(name) || value === name.toLowerCase())
    ? true
    : value;

/**
 * `attrs` (a copy), with each boolean prop's attribute under React's name
 * and as `asBoolean` reads it. React's own spelling wins over another
 * given beside it; of two others, the last. An absent prop stays absent: React's default applies.
 */
export function withBooleans(
  attrs: Record<string, unknown>,
  booleans: Booleans,
): Record<string, unknown> {
  const byKey = spellings(booleans);
  const given: Record<string, unknown> = { ...attrs };
  for (const [key, value] of Object.entries(attrs)) {
    const boolean = byKey.get(key);
    if (!boolean) continue;
    const { prop } = boolean;
    if (key !== prop) {
      delete given[key];
      if (hasOwn(attrs, prop)) continue;
    }
    given[prop] = asBoolean(value, prop, boolean);
  }
  return given;
}

/**
 * A part `createVueWrapper` has no description of (one of a consumer's):
 * React's contract, every React DOM event (React 18's and the four React
 * also synthesises) and every other name, as its props, but the DOM events
 * React 18 does not synthesise (`focusin`, React 19's), the `.capture` of
 * the four React has none for (`mouseenter`), and those named in
 * `notTaken`.
 */
function takesByContract(notTaken: readonly string[] = []) {
  return (prop: string) => {
    if (notTaken.includes(prop)) return false;
    const parsed = parseListener(prop);
    if (parsed.react19) return false;
    // React has no `…Capture` for these.
    if (
      parsed.capture &&
      parsed.react &&
      parsed.react in REACT_CAPTURELESS_EVENTS
    )
      return false;
    return !NATIVE_DOM_EVENTS.has(parsed.base.slice(2).toLowerCase());
  };
}

/** Where one listener goes: the part, or the wrapper's box. */
export interface ListenerRoute {
  /** React's prop for it on the part, or null. */
  react: string | null;
  /** The key Vue binds natively on the box, or null. */
  native: string | null;
  /** A `.once` listener on the part, which the bridge runs once. */
  once: boolean;
}

/**
 * Where one listener goes: to the part, when the part takes its prop
 * (`takes`), and only there; else natively to the wrapper's box, as Vue
 * binds a listener a component does not declare on its root element.
 */
export function routeListener(
  key: string,
  takes: (prop: string) => boolean = takesByContract(),
): ListenerRoute {
  // `on:click`: Vue's own spelling of a native, case-kept event.
  if (key.startsWith("on:")) return { react: null, native: key, once: false };
  const parsed = parseListener(key);
  const name = parsed.react ?? parsed.react19 ?? parsed.base;
  const prop = parsed.capture ? `${name}Capture` : name;
  // `.passive`, which React cannot take, is dropped: React's own touch and
  // wheel listeners are passive.
  if (takes(prop)) return { react: prop, native: null, once: parsed.once };
  const dom = parsed.react
    ? REACT_KNOWN[parsed.react]
    : parsed.react19
      ? REACT_19_EVENTS[parsed.react19 as keyof typeof REACT_19_EVENTS]
      : NATIVE_DOM_EVENTS.has(parsed.base.slice(2).toLowerCase())
        ? parsed.base.slice(2).toLowerCase()
        : null;
  if (!dom) return { react: null, native: key, once: false };
  return {
    react: null,
    native: nativeKey(
      dom,
      parsed,
      parsed.capture || HEARD_ON_THE_WAY_DOWN.has(dom),
    ),
    once: false,
  };
}

/** A React synthetic event: what React hands a DOM event's handler. */
interface SyntheticEvent {
  type: string;
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

/** A React DOM event prop: `onClick`, `onClickCapture`. */
type ReactDomProp = DomAttributeKey;

/** The props `P` names, each given or not: no string or number index signature's. */
type Named<P> = {
  [K in keyof P as string extends K
    ? never
    : number extends K
      ? never
      : K]-?: NonNullable<P[K]>;
};
/** The props of `P` whose type is `boolean` (or `true`). */
export type FlagProp<P> = {
  [K in keyof Named<P>]: true extends Named<P>[K]
    ? [Named<P>[K]] extends [boolean]
      ? K
      : never
    : never;
}[keyof Named<P>] &
  string;
/** What `P`'s prop `K` takes besides a boolean. */
type Besides<P, K extends keyof Named<P>> = Exclude<Named<P>[K], boolean>;
/** Whether `T` holds free text, a number or an object, not literals only. */
type Free<T> = string extends T
  ? true
  : number extends T
    ? true
    : [Extract<T, object>] extends [never]
      ? false
      : true;
/** The props of `P` boolean in a union with literals only (`boolean | "auto"`). */
export type UnionProp<P> = {
  [K in keyof Named<P>]: true extends Named<P>[K]
    ? [Named<P>[K]] extends [boolean]
      ? never
      : Free<Besides<P, K>> extends true
        ? never
        : K
    : never;
}[keyof Named<P>] &
  string;
/**
 * The props of `P` boolean in a union with free text, a number or an object
 * (`error: boolean | string`), but a slot's (one that takes any ReactNode).
 */
export type TextProp<P> = {
  [K in keyof Named<P>]: true extends Named<P>[K]
    ? [Named<P>[K]] extends [boolean]
      ? never
      : NonNullable<React.ReactNode> extends Named<P>[K]
        ? never
        : Free<Besides<P, K>> extends true
          ? K
          : never
    : never;
}[keyof Named<P>] &
  string;

/** What else a wrapper says of its React part. */
export interface WrapperOptions<P = Record<string, unknown>> {
  /**
   * The React DOM event props the part does not take, though React's
   * contract has every part take them: their listeners are native listeners
   * on the wrapper's own box, as Vue binds a listener a component does not
   * declare. Kozmos's own parts are described exactly by part-takes.ts, and
   * this does not apply to them.
   */
  notTaken?: readonly ReactDomProp[];
  /**
   * The part's boolean props, which nothing at runtime can read from its
   * types, each in any spelling (`readonly`, `read-only`, `readOnly`).
   * `flags` are props whose type is `boolean`, and `unions` are boolean in a
   * union with literals only (`boolean | "auto"`): "" (a bare attribute, or
   * one bound to "") and the prop's own name (`loading="loading"`) are
   * `true`. `texts` are boolean in a union with free text, a number or an
   * object (`error: boolean | string`): "" and the name are its strings. Any
   * other value, bound or not, is React's as it is (`:loading="false"`), and
   * an absent one is not given, so React's default applies. Unnamed, a
   * prop's attribute reaches React as Vue gives it. Kozmos's own parts are
   * described exactly by part-takes.ts, and this does not apply to them.
   */
  booleans?: {
    flags?: readonly FlagProp<P>[];
    unions?: readonly UnionProp<P>[];
    texts?: readonly TextProp<P>[];
  };
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

/** A vnode's own keys, which Vue never gives a component: `key`, `ref`, `onVnode*`. */
const isReservedKey = (key: string) =>
  key === "key" ||
  key === "ref" ||
  key === "ref_for" ||
  key === "ref_key" ||
  key.startsWith("onVnode");

/** Whether two vnodes' props give a component the same, key by key. */
function sameProps(a: Record<string, unknown>, b: Record<string, unknown>) {
  const keys = (props: Record<string, unknown>) =>
    Object.keys(props).filter((key) => !isReservedKey(key));
  const given = keys(a);
  return (
    given.length === keys(b).length &&
    given.every((key) => hasOwn(b, key) && Object.is(a[key], b[key]))
  );
}

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

/** One listener the part takes, as the bridge calls it. */
interface Entry {
  /** The key the parent gave it under. */
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
  /** Which `on…` props the part takes: part-takes.ts's entry, or null for React's contract. */
  readonly takes: Takes | null;
  /** Its boolean props: part-takes.ts's entry, else what its wrapper's options name. */
  readonly booleans: Booleans;
}

const bridged = new WeakMap<object, Bridged>();

/** Kozmos's parts, each with the `on…` props it takes (part-takes.ts). */
const described = new WeakMap<object, Takes>();

/** Kozmos's parts, each with its boolean props (part-takes.ts). */
const describedBooleans = new WeakMap<object, Booleans>();

/**
 * Says which `on…` props each React part takes: part-takes.ts's table, and
 * index.ts's adapters. Read when a wrapper mounts.
 */
export function describeParts(
  parts: Iterable<readonly [unknown, Takes]>,
): void {
  for (const [part, takes] of parts) described.set(part as object, takes);
}

/**
 * Says which props of each React part are booleans: part-takes.ts's table,
 * and index.ts's adapters. Read when a wrapper renders.
 */
export function describeBooleans(
  parts: Iterable<readonly [unknown, Booleans]>,
): void {
  for (const [part, booleans] of parts)
    describedBooleans.set(part as object, booleans);
}

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

/**
 * Creates a native Vue 3 wrapper component for a Kozmos React component.
 * This directly mounts the React VDOM inside a Vue node, completely bypassing Web Component serialization constraints.
 *
 * @param ReactComponent The Kozmos React component to wrap
 * @param models Each `v-model` the wrapper takes, and how it reaches React
 *   (`{ modelValue: { prop: "value", callback: "onValueChange", empty: "" } }`)
 * @param options For a part of your own: the React DOM event props it does
 *   not take (`{ notTaken: ["onClick"] }`), and its boolean props
 *   (`{ booleans: { flags: ["disabled"], unions: ["error"] } }`)
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
  const byContract = takesByContract(options.notTaken);
  /** Whether the part takes a prop: its description, else React's contract. */
  const takes = (prop: string) => {
    const description = described.get(ReactComponent as object);
    return description ? takesProp(description, prop) : byContract(prop);
  };
  const named: Booleans = {
    flags: options.booleans?.flags ?? [],
    unions: options.booleans?.unions ?? [],
    texts: options.booleans?.texts ?? [],
  };
  /** The part's boolean props: its description, else what the options name. */
  const booleans = () =>
    describedBooleans.get(ReactComponent as object) ?? named;
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
      /** The part's `.once` listeners that have run, by the key each was given under. */
      const onceRan = new Set<string>();
      /** The `.once` model listeners Vue's `emit` misses that have run. */
      const modelOnceRan = new Set<string>();
      const warned = new Set<string>();
      let root: Root | null = null;
      /**
       * What the wrapper was given when React was last drawn: its vnode's
       * props, and the names of its slots, each a prop of React's.
       */
      let drawnFrom: Record<string, unknown> = {};
      let drawnSlots = "";
      const slotNames = () => Object.keys(slots).join("\n");

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

      /**
       * The part's handler for the listeners given one React prop. A DOM
       * event's listener is given the native event when it is of the
       * listener's own type (`click` for `onClick`), and React's otherwise:
       * React makes `onMouseEnter` from `mouseover`, `onFocus` from
       * `focusin`, `onChange` from `input`, and its own event says
       * `mouseenter`, `focus`, `change`, with the target React gives it. A
       * callback's arguments are the part's.
       */
      const fromReact =
        (prop: string, entries: Entry[]) =>
        (...args: unknown[]) => {
          const event = isSynthetic(args[0]) ? args[0] : null;
          // `onGotPointerCapture` is an event's own name; its `.capture` is
          // `onGotPointerCaptureCapture`.
          const own =
            REACT_KNOWN[prop] ?? REACT_KNOWN[prop.replace(/Capture$/, "")];
          let result: unknown;
          for (const { key, handler, once } of entries) {
            if (once) {
              if (onceRan.has(key)) continue;
              onceRan.add(key);
            }
            result = !event
              ? call(handler, args, ErrorCodes.COMPONENT_EVENT_HANDLER)
              : own && event.nativeEvent.type === own
                ? callWithNative(handler, event)
                : call(handler, [event], ErrorCodes.NATIVE_EVENT_HANDLER);
          }
          return result;
        };

      /** The props Vue gave the wrapper, as its vnode holds them. */
      const given = () =>
        (instance.vnode.props ?? {}) as Record<string, unknown>;

      /**
       * What the parent gave, sorted: each bound model, the listeners the
       * part takes and those the box takes, and the rest of the attrs.
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
          const held = hasOwn(raw, name) ? raw[name] : raw[keys.value[1]];
          // A model whose React prop is a boolean is read as a boolean
          // attribute is, by its own name: bare `pressed`, `step-free` or
          // `model-value` is true.
          const boolean = booleanProp(booleans(), binding.prop);
          const value = boolean ? asBoolean(held, name, boolean) : held;
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

        // Each listener goes to one place: the part, when it takes its
        // prop, else the box.
        const react: Record<string, Entry[]> = {};
        const native: Record<string, unknown[]> = {};
        for (const key of Object.keys(rest)) {
          if (!isListenerKey(key)) continue;
          const handler = rest[key];
          delete rest[key];
          if (handler == null) continue;
          const route = routeListener(key, takes);
          if (route.react)
            (react[route.react] ??= []).push({
              key,
              handler,
              once: route.once,
            });
          else if (route.native)
            (native[route.native] ??= []).push(
              ...(Array.isArray(handler) ? handler : [handler]),
            );
        }
        return { bound, react, native, rest: withBooleans(rest, booleans()) };
      };

      const renderReact = () => {
        if (!containerRef.value) return;
        drawnFrom = { ...given() };
        drawnSlots = slotNames();

        // Initialize the React root once
        if (!root) {
          root = createRoot(containerRef.value);
        }

        const sorted = sort();
        const reactProps = sorted.rest as Record<string, any>;

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

        // The listeners the part takes, by React's name.
        for (const [prop, entries] of Object.entries(sorted.react))
          reactProps[prop] = fromReact(prop, entries);
        // A `.once` listener taken away and given again runs once more, as
        // Vue's native one does.
        const live = new Set(
          Object.values(sorted.react)
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

        // Mount the React tree
        root.render(React.createElement(ReactComponent, reactProps as any));
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

      /**
       * After Vue's render: the parent's model decides what React shows.
       * When the parent took the change, Vue rendered the wrapper, and
       * `onUpdated` has settled it and drawn React already; drawn again,
       * React was given what it had.
       */
      const settle = () => {
        let drawn = true;
        for (const change of typed.values())
          if (!change.settled) {
            change.settled = true;
            drawn = false;
          }
        if (!drawn) renderReact();
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

      /*
       * React is drawn again when what the wrapper was given changes, once a
       * tick however many ways it changed, and not otherwise. Two things say
       * it changed:
       *
       * - `onUpdated`, for what the parent gives: an attribute, a listener
       *   or a model added, removed or changed. Vue renders the wrapper
       *   again when its parent renders a vnode whose props differ from the
       *   last (`shouldUpdateComponent`; with no `emits` declared, listeners
       *   and models are among the props it compares, and `inheritAttrs:
       *   false` changes nothing here), and calls `onUpdated` after. It
       *   renders it again too when its slots are not stable (a render
       *   function's `{ default: () => … }`, given anew each time) or what a
       *   slot reads changes: then, when the props and the slots' names are
       *   what React was drawn from (`drawnFrom`, `drawnSlots`), React,
       *   given the same slot boxes, is not drawn. A slot given or taken
       *   away is a prop of React's given or taken away, and is drawn.
       * - a deep watch of the props, for a reactive object or array the
       *   parent changes in place (`items.push(…)`), which no render of the
       *   parent's or the wrapper's sees. It walks the values only when they
       *   change, never in a render: a slot showing `{{ query }}` beside a
       *   list of 10,000 rows costs no walk of the rows.
       *
       * It was a watch of `{ ...props, ...attrs }`: a spread reads only the
       * attributes that are there, so a wrapper given none tracked none, and
       * an attribute or a listener given to it later never reached React.
       *
       * The models: `emitModel` draws React itself, inside React's event,
       * and `settle` after Vue's render, should the parent take nothing.
       */
      let pending = false;
      let unmounted = false;
      /** Draws React once, after this tick's renders, for each change in it. */
      const redraw = () => {
        // Vue's render has the parent's models now.
        for (const change of typed.values()) change.settled = true;
        if (pending) return;
        pending = true;
        void nextTick(() => {
          pending = false;
          if (!unmounted) renderReact();
        });
      };
      /** The props the wrapper's vnode holds, for the deep watch. */
      const givenNow = shallowRef(given());
      onUpdated(() => {
        const now = given();
        if (sameProps(now, drawnFrom) && slotNames() === drawnSlots) return;
        givenNow.value = now;
        redraw();
      });
      watch(givenNow, redraw, { deep: true });

      // Cleanly unmount the React Virtual DOM when the Vue Component is destroyed
      onBeforeUnmount(() => {
        unmounted = true;
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

        // The listeners the part does not take, as Vue binds a listener a
        // component does not declare on its root element: modifiers,
        // `.once`, `.capture` and `.passive` included.
        const native = Object.fromEntries(
          Object.entries(sort().native).map(([key, handlers]) => [
            key,
            handlers.length === 1 ? handlers[0] : handlers,
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
    get takes() {
      return described.get(ReactComponent as object) ?? null;
    },
    get booleans() {
      return booleans();
    },
  });
  return wrapper;
}
