// @vitest-environment jsdom
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref, type Component } from "vue";
import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import ts from "typescript";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  PopoverContent,
} from "@kozmos-ds/react";
import * as Bridge from "./index";
import {
  NATIVE_DOM_EVENTS,
  REACT_19_EVENTS,
  REACT_CAPTURELESS_EVENTS,
  REACT_DOM_EVENTS,
  REACT_UNTYPED_EVENTS,
  TARGET_ONLY_EVENTS,
  createVueWrapper,
  routeListener,
} from "./react-adapter";
import {
  $,
  $$,
  bridgedParts,
  heard,
  mount,
  press,
  select,
  settle,
  type,
  unmount,
  until,
} from "../../test/react-bridge-harness";
import { reactSides } from "../../test/contract/read-contract";

// Listeners through the React bridge (react-adapter.ts). Vue names `@keydown`
// `onKeydown` and `@dblclick` `onDblclick`; React knows only `onKeyDown` and
// `onDoubleClick`, and dropped the others ("Invalid event handler property
// onKeydown"). Before the wrapper's attributes were React's alone, Vue also
// bound each listener natively on the wrapper's own box, so those fired
// there, and a `@click` fired twice. Now each listener is routed by its
// name: a DOM event React synthesises to the part, by React's name, and to
// the host React draws round the part, so it is heard from anything the part
// draws, in place or in a portal, even a part with no element of its own;
// focusin, focusout, `.passive`, React's capture-less events and the events
// only React 19 knows to the box; and any other name, a React callback of
// the part or a custom DOM event, to both the part and the box, where only
// one of the two can ever hear it. A listener runs once for one native
// event, and is given that event.

/** A template, compiled at runtime as an SFC's is at build. */
const page = (template: string, state: Record<string, unknown> = {}) =>
  defineComponent({
    components: Bridge as Record<string, Component>,
    setup: () => state,
    template,
  });
const e = React.createElement;
const noop = () => {};

// --------------------------------------------------------------------------
// React DOM's events, as @types/react declares them and react-dom knows them.
// --------------------------------------------------------------------------

/** The keys of a type, as the compiler reads `text`'s `Keys` with the DOM's and React's declarations. */
function typeKeys(text: string) {
  const file = path.join(__dirname, "react-dom-events.probe.ts");
  const options: ts.CompilerOptions = {
    moduleResolution: ts.ModuleResolutionKind.Node10,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    lib: ["lib.esnext.d.ts", "lib.dom.d.ts"],
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  };
  const host = ts.createCompilerHost(options);
  const read = host.getSourceFile.bind(host);
  host.getSourceFile = (name, version, ...rest) =>
    name === file
      ? ts.createSourceFile(name, text, version)
      : read(name, version, ...rest);
  host.fileExists = (
    (exists) => (name: string) =>
      name === file || exists(name)
  )(host.fileExists.bind(host));
  const program = ts.createProgram({ rootNames: [file], options, host });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file)!;
  const alias = source.statements.find(ts.isTypeAliasDeclaration)!;
  const keys = checker.getTypeAtLocation(alias.type);
  return (keys.isUnion() ? keys.types : [keys]).map(
    (type) => (type as ts.StringLiteralType).value,
  );
}

/** `DOMAttributes`' keys, as the adapter's own import of React reads them. */
const domAttributes = () =>
  typeKeys(
    `import type { DOMAttributes } from "react";\nexport type Keys = keyof DOMAttributes<Element>;\n`,
  );

/** Every DOM event TypeScript's lib.dom names, on elements, media, the document and the window. */
const libDomEvents = () =>
  typeKeys(
    `export type Keys = keyof HTMLElementEventMap | keyof HTMLMediaElementEventMap | keyof HTMLVideoElementEventMap | keyof SVGElementEventMap | keyof DocumentEventMap | keyof WindowEventMap;\n`,
  );

/**
 * The React name react-dom gives each DOM event it synthesises, as its
 * development build reads a misspelt prop: `onkeydown` is "Did you mean
 * `onKeyDown`?", and a name it does not know is "Unknown event handler
 * property".
 */
function reactDomKnows(events: Iterable<string>) {
  const container = document.createElement("div");
  const root = createRoot(container);
  const known: Record<string, string> = {};
  heard();
  for (const event of events) {
    flushSync(() => root.render(e("div", { [`on${event}`]: noop })));
    const said = heard().join(" ");
    const suggested = /Did you mean `%s`\?\S*\s+\S+\s+(on\w+)/.exec(said)?.[1];
    if (suggested) known[event] = suggested;
  }
  root.unmount();
  return known;
}

describe("React DOM's events", () => {
  it("REACT_DOM_EVENTS lists every event @types/react declares, and no other", () => {
    const keys = new Set(domAttributes());
    expect(keys.size).toBeGreaterThan(100);
    keys.delete("children");
    keys.delete("dangerouslySetInnerHTML");
    const events = [...keys].filter(
      (key) => !(key.endsWith("Capture") && keys.has(key.slice(0, -7))),
    );
    expect(Object.keys(REACT_DOM_EVENTS).sort()).toEqual(events.sort());
    expect(Object.keys(REACT_CAPTURELESS_EVENTS).sort()).toEqual(
      events.filter((event) => !keys.has(`${event}Capture`)).sort(),
    );
  });

  it("with REACT_UNTYPED_EVENTS and REACT_19_EVENTS, lists every DOM event react-dom 19 synthesises, by React's name", () => {
    expect(React.version).toMatch(/^19\./);
    const tables = {
      ...REACT_DOM_EVENTS,
      ...REACT_UNTYPED_EVENTS,
      ...REACT_19_EVENTS,
    };
    const listed = Object.fromEntries(
      Object.entries(tables).map(([react, dom]) => [dom, react]),
    );
    const known = reactDomKnows(
      new Set([...libDomEvents(), ...Object.values(tables)]),
    );
    // React's own `focusin` and `focusout` are its onFocus and onBlur.
    delete known.focusin;
    delete known.focusout;
    expect(known).toEqual(listed);
  });

  it("names each DOM event once, and none React also takes natively", () => {
    const dom = [
      ...Object.values(REACT_DOM_EVENTS),
      ...Object.values(REACT_UNTYPED_EVENTS),
      ...Object.values(REACT_19_EVENTS),
    ];
    expect(new Set(dom).size).toBe(dom.length);
    for (const event of NATIVE_DOM_EVENTS) expect(dom).not.toContain(event);
    for (const event of TARGET_ONLY_EVENTS) expect(dom).toContain(event);
  });
});

// --------------------------------------------------------------------------
// Where each spelling of a listener goes.
// --------------------------------------------------------------------------

describe("routeListener", () => {
  it.each([
    // A DOM event React synthesises: React's name, from Vue's or React's, on
    // the part and on the host.
    ["onClick", "onClick", "onClick", null, false],
    ["onKeydown", "onKeyDown", "onKeyDown", null, false],
    ["onKeyDown", "onKeyDown", "onKeyDown", null, false],
    ["onDblclick", "onDoubleClick", "onDoubleClick", null, false],
    ["onContextmenu", "onContextMenu", "onContextMenu", null, false],
    ["onPointerdown", "onPointerDown", "onPointerDown", null, false],
    ["onMouseenter", "onMouseEnter", "onMouseEnter", null, false],
    [
      "onGotpointercapture",
      "onGotPointerCapture",
      "onGotPointerCapture",
      null,
      false,
    ],
    // One only its target hears: the part's alone.
    ["onFocus", "onFocus", null, null, false],
    ["onScroll", "onScroll", null, null, false],
    ["onLoad", "onLoad", null, null, false],
    // React 18 and 19 synthesise these, though @types/react 18 lacks them.
    ["onToggle", "onToggle", null, null, false],
    ["onClose", "onClose", null, null, false],
    // `.capture` is React's capture variant, on the part and the host.
    ["onClickCapture", "onClickCapture", "onClickCapture", null, false],
    ["onKeydownCapture", "onKeyDownCapture", "onKeyDownCapture", null, false],
    ["onFocusCapture", "onFocusCapture", "onFocusCapture", null, false],
    [
      "onGotPointerCaptureCapture",
      "onGotPointerCaptureCapture",
      "onGotPointerCaptureCapture",
      null,
      false,
    ],
    // `.once` runs once.
    ["onClickOnce", "onClick", "onClick", null, true],
    [
      "onKeydownCaptureOnce",
      "onKeyDownCapture",
      "onKeyDownCapture",
      null,
      true,
    ],
    // Only React 19 synthesises these: the box, in the capture phase for
    // the two that do not bubble.
    ["onScrollend", null, null, "onScrollendCapture", false],
    ["onScrollEnd", null, null, "onScrollendCapture", false],
    ["onBeforetoggle", null, null, "onBeforetoggleCapture", false],
    ["onTransitionrun", null, null, "onTransitionrun", false],
    ["onTransitionStartOnce", null, null, "onTransitionstart", true],
    // `.passive`, and capture on an event React has no capture for: native.
    ["onTouchstartPassive", null, null, "onTouchstartPassive", false],
    ["onWheelCapturePassive", null, null, "onWheelCapturePassive", false],
    ["onMouseenterCapture", null, null, "onMouseenterCapture", false],
    // DOM events React does not synthesise: native, by their DOM name.
    ["onFocusin", null, null, "onFocusin", false],
    ["onFocusIn", null, null, "onFocusin", false],
    ["onFocusoutOnce", null, null, "onFocusout", true],
    ["on:my-event", null, null, "on:my-event", false],
    // Any other name: a React callback of the part, or a custom DOM event.
    ["onPoiClick", "onPoiClick", null, "onPoiClick", false],
    ["onValueChange", "onValueChange", null, "onValueChange", false],
    ["onPoiClickOnce", "onPoiClick", null, "onPoiClick", true],
    // `.capture` and `.passive` only a DOM event has.
    ["onKozmosPingCapture", null, null, "onKozmosPingCapture", false],
  ] as const)(
    "%s: part %s, host %s, box %s, once %s",
    (key, react, host, native, once) => {
      expect(routeListener(key)).toEqual({ react, host, native, once });
    },
  );

  it("gives a callback of the part named like a DOM event to the part alone", () => {
    const callbacks = new Set(["onSelect", "onClose", "onScrollEnd"]);
    expect(routeListener("onSelect", callbacks)).toEqual({
      react: "onSelect",
      host: null,
      native: null,
      once: false,
    });
    expect(routeListener("onSelectOnce", callbacks)).toEqual({
      react: "onSelect",
      host: null,
      native: null,
      once: true,
    });
    expect(routeListener("onScrollend", callbacks).react).toBe("onScrollEnd");
    // Not a callback of this part: the DOM's select, heard from inside.
    expect(routeListener("onSelect").host).toBe("onSelect");
  });
});

// --------------------------------------------------------------------------
// Each listener on a bridged field, fired once by what fires it.
// --------------------------------------------------------------------------

const fire = {
  click: (input: HTMLElement) => input.click(),
  key:
    (name: string, key = "a") =>
    (input: HTMLElement) =>
      input.dispatchEvent(new KeyboardEvent(name, { key, bubbles: true })),
  mouse: (name: string) => (input: HTMLElement) =>
    input.dispatchEvent(new MouseEvent(name, { bubbles: true })),
};

/**
 * Each listener, as a template writes it on KozmosInput, what fires it on
 * React's `<input>`, and how many times it must run.
 */
const LISTENERS: [string, (input: HTMLElement) => void, number][] = [
  ["@click", fire.click, 1],
  ["@keydown", fire.key("keydown"), 1],
  [
    "@keydown.enter",
    (input) => {
      fire.key("keydown", "a")(input);
      fire.key("keydown", "Enter")(input);
    },
    1,
  ],
  ["@keyup", fire.key("keyup"), 1],
  ["@mousedown", fire.mouse("mousedown"), 1],
  ["@dblclick", fire.mouse("dblclick"), 1],
  [
    "@pointerdown",
    (input) =>
      input.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })),
    1,
  ],
  ["@contextmenu", fire.mouse("contextmenu"), 1],
  ["@focus", (input) => input.focus(), 1],
  [
    "@blur",
    (input) => {
      input.focus();
      input.blur();
    },
    1,
  ],
  [
    // React's, from a mouseover coming from outside: the host and the
    // <input> are both entered, by one event.
    "@mouseenter",
    (input) =>
      input.dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          relatedTarget: document.body,
        }),
      ),
    1,
  ],
  [
    // It does not bubble: React listens on the element itself.
    "@scroll",
    (input) => input.dispatchEvent(new Event("scroll")),
    1,
  ],
  [
    // Only React 19 synthesises it, and it does not bubble: the box hears
    // it in the capture phase.
    "@scrollend",
    (input) => input.dispatchEvent(new Event("scrollend")),
    1,
  ],
  [
    "@transitionrun",
    (input) =>
      input.dispatchEvent(new Event("transitionrun", { bubbles: true })),
    1,
  ],
  ["@click.capture", fire.click, 1],
  ["@keydown.capture", fire.key("keydown"), 1],
  [
    "@click.once",
    (input) => {
      input.click();
      input.click();
    },
    1,
  ],
  [
    "@keydown.once",
    (input) => {
      fire.key("keydown")(input);
      fire.key("keydown")(input);
    },
    1,
  ],
  ["@focusin", (input) => input.focus(), 1],
  [
    "@focusout",
    (input) => {
      input.focus();
      input.blur();
    },
    1,
  ],
  [
    "@touchstart.passive",
    (input) => input.dispatchEvent(new Event("touchstart", { bubbles: true })),
    1,
  ],
  [
    // React has no capture phase for it: the box's native capture listener
    // hears it on its way down, though it does not bubble.
    "@mouseenter.capture",
    (input) => input.dispatchEvent(new MouseEvent("mouseenter")),
    1,
  ],
  [
    // A custom event, dispatched on React's element: the box hears it.
    "@kozmos-ping",
    (input) =>
      input.dispatchEvent(new CustomEvent("kozmos-ping", { bubbles: true })),
    1,
  ],
];

describe("each listener on a bridged field runs once", () => {
  it("the listener table", async () => {
    for (const [listener, fires, times] of LISTENERS) {
      const spy = vi.fn();
      mount(
        page(`<KozmosInput aria-label="Field" ${listener}="spy" />`, { spy }),
      );
      const input = await until(() => $<HTMLInputElement>("input"));
      await settle();
      fires(input);
      await settle();
      expect.soft(spy, listener).toHaveBeenCalledTimes(times);
      unmount();
    }
    // Input hands a name it does not take to its <input>, and React says it
    // ignores it; the box's native listener heard it (README of the
    // adapter: a custom event is bound on both).
    expect(heard()).toEqual([
      expect.stringContaining("Unknown event handler property `%s`"),
    ]);
  });

  it("@keydown and @keydown.enter together: each once, Enter only for the second", async () => {
    const any = vi.fn();
    const enter = vi.fn();
    mount(
      page(
        `<KozmosInput aria-label="Field" @keydown="any" @keydown.enter="enter" />`,
        { any, enter },
      ),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    press(input, "a");
    press(input, "Enter");
    await settle();
    expect(any).toHaveBeenCalledTimes(2);
    expect(enter).toHaveBeenCalledTimes(1);
  });

  it("compiled modifiers act on React's event: .enter, .stop and .prevent on @keydown, .stop on @click", async () => {
    const enter = vi.fn();
    const clicked = vi.fn();
    const outside = vi.fn();
    const host = mount(
      page(
        `<KozmosInput aria-label="Field" @keydown.enter.stop.prevent="enter" @click.stop="clicked" />`,
        { enter, clicked },
      ),
    );
    host.addEventListener("keydown", outside);
    host.addEventListener("click", outside);
    const input = await until(() => $<HTMLInputElement>("input"));
    const key = (name: string) => {
      const event = new KeyboardEvent("keydown", {
        key: name,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);
      return event;
    };
    // Not Enter: the handler is not run, and nothing is stopped.
    expect(key("a").defaultPrevented).toBe(false);
    expect(key("Enter").defaultPrevented).toBe(true);
    input.click();
    await settle();
    expect(enter).toHaveBeenCalledTimes(1);
    expect(clicked).toHaveBeenCalledTimes(1);
    // The "a" reached the page; Enter and the click were stopped at React's element.
    expect(outside).toHaveBeenCalledTimes(1);
  });
});

// --------------------------------------------------------------------------
// Every Kozmos* export hears what it draws in place. A part with no element
// of its own (a Radix root, a provider) gave React's listener to nothing,
// and nothing else heard it: before React's host, `@click` on KozmosDialog
// ran for none of its content.
// --------------------------------------------------------------------------

const fruit = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
];
const tile = { id: "shopping", label: "Shopping", selected: false };
const poi = {
  id: "gate-12",
  name: "Gate 12",
  media: [],
  actions: ["navigate"],
};
const result = {
  poiId: "gate-12",
  resultIndex: 0,
  selected: false,
  featured: false,
};
const route = {
  id: "quickest",
  label: "Quickest",
  durationSeconds: 240,
  durationLabel: "4 min",
  distanceMetres: 150,
  distanceLabel: "150 m",
  preference: "quickest",
  selected: true,
  available: true,
};
const photos = ["a", "b"].map((id) => ({ id, src: "data:,", alt: id }));

interface InPlace {
  /** What the part needs to draw. */
  props?: Record<string, unknown>;
  /** A part that draws its default slot in place is clicked there. */
  slot?: boolean;
  /** Where the part puts the listener, when that is not all it draws. */
  target?: (drawn: HTMLElement) => Element | null;
}

/**
 * What each export needs to draw in place. One drawn with a default slot is
 * clicked in its slot, and any other on the first element it draws.
 */
const IN_PLACE: Record<string, InPlace> = {
  KozmosBox: { slot: true },
  KozmosStack: { slot: true },
  KozmosGrid: { slot: true },
  // A <p> cannot hold the slot's box.
  KozmosText: { props: { children: "Gate 4" } },
  KozmosHeading: { slot: true },
  KozmosContainer: { slot: true },
  KozmosIcon: { props: { name: "search" } },
  KozmosCounter: { slot: true },
  KozmosBadge: { slot: true },
  KozmosLabel: { slot: true },
  KozmosCard: { slot: true },
  KozmosSlider: { props: { "aria-label": "Volume" } },
  KozmosSearch: { props: { "aria-label": "Search" } },
  KozmosSearchBar: { props: { placeholder: "Where to?" } },
  KozmosSelect: { slot: true },
  KozmosBottomNavigation: {
    props: { items: [{ icon: e("span"), label: "Home" }] },
  },
  KozmosNavbar: { slot: true },
  KozmosSidebar: { slot: true },
  KozmosMenu: { slot: true },
  KozmosDrawer: { slot: true },
  KozmosBreadcrumb: { slot: true },
  KozmosPagination: { slot: true },
  KozmosStepper: { props: { steps: ["Pick", "Pay"], currentStep: 0 } },
  KozmosAlert: { props: { title: "Saved" } },
  KozmosProgress: { props: { value: 40 } },
  KozmosSpinner: {},
  KozmosSkeleton: { slot: true },
  KozmosAvatar: { props: { fallback: "AL" } },
  KozmosTag: { slot: true },
  KozmosList: { slot: true },
  // A table cannot hold the slot's box.
  KozmosTable: {},
  KozmosTree: { props: { data: [{ id: "1", name: "a.ts" }] } },
  KozmosTimeline: { slot: true },
  KozmosPopover: { slot: true },
  KozmosAccordion: { slot: true },
  KozmosSeparator: {},
  KozmosMapView: { slot: true },
  KozmosLocationPin: {},
  KozmosWayfindingCard: { slot: true },
  KozmosWayfindingInputRow: {},
  KozmosDirectionStep: { props: { type: "left", instruction: "Turn left" } },
  KozmosFloorSelector: { props: { floors: ["1", "2"], label: "Floor" } },
  // Its onClick is its button's (`callbacks`).
  KozmosPOICard: {
    props: { title: "Gate 4" },
    target: (drawn) => drawn.querySelector("button"),
  },
  KozmosBottomSheet: { slot: true },
  KozmosOTPInput: { props: { length: 4 } },
  KozmosRating: { props: { label: "Your visit" } },
  KozmosFileUpload: { props: { label: "Floor plan" } },
  KozmosDatePicker: { props: { "aria-label": "Date" } },
  KozmosTimePicker: { props: { "aria-label": "Time" } },
  KozmosFloatingActionButton: { slot: true },
  KozmosSplitButton: { slot: true },
  KozmosToggleButton: { slot: true },
  KozmosSegmentedControl: {
    props: { label: "Mode", items: [{ value: "walk", label: "Walk" }] },
  },
  KozmosLink: { slot: true },
  KozmosIconButton: { slot: true },
  KozmosTabs: { slot: true },
  KozmosDialog: { slot: true },
  KozmosMapOverlay: { slot: true },
  KozmosAnalyticsProvider: { slot: true },
  KozmosChip: { slot: true },
  KozmosDynamicIsland: {},
  KozmosEmptyState: { props: { title: "Nothing here" } },
  KozmosFeedbackCard: {},
  KozmosFieldWrapper: { slot: true },
  KozmosMapControlsGroup: {},
  KozmosNavigationAnnouncer: { props: { message: "Turn left" } },
  KozmosRadioGroup: { slot: true },
  KozmosRouteSummary: {},
  KozmosRoutingInputGroup: {
    props: {
      points: [
        { id: "origin", value: "Gate 4" },
        { id: "destination", value: "Lounge" },
      ],
      onPointChange: noop,
    },
  },
  KozmosSaveLocationCard: {},
  KozmosScrollArea: { slot: true },
  KozmosUserLocationMarker: {},
  KozmosCheckbox: { props: { "aria-label": "Accept" } },
  KozmosInput: { props: { "aria-label": "Name" } },
  KozmosTextarea: { props: { "aria-label": "Note" } },
  KozmosSwitch: { props: { "aria-label": "Wi-Fi" } },
  KozmosAdaptiveMapShell: { props: { panel: "Gate 4" } },
  KozmosBrowseCategoriesPanel: {
    props: { categories: [tile], onSelect: noop, renderIcon: () => null },
  },
  KozmosCategoryTile: { props: { category: tile, icon: null, onSelect: noop } },
  KozmosMapControlButton: {},
  KozmosNavigationItem: { slot: true },
  KozmosPOIDetailPanel: {
    props: {
      poi,
      actionLabels: {
        navigate: "Go",
        favourite: "Favourite",
        bookmark: "Bookmark",
        share: "Share",
        order: "Order",
      },
      onAction: noop,
    },
  },
  KozmosPOIMediaGallery: {
    props: {
      media: photos,
      label: "Photos",
      positionLabel: (current: number, total: number) =>
        `${current} of ${total}`,
    },
  },
  KozmosPOIResultCard: { props: { poi, result, onSelect: noop } },
  KozmosPOIResultList: {
    props: {
      items: [{ poi, result }],
      onSelect: noop,
      resultCountLabel: "1 result",
    },
  },
  KozmosRouteOptionCard: { props: { option: route, onSelect: noop } },
  KozmosRoutePreviewPanel: {
    props: {
      destinationName: "Gate 4",
      options: [route],
      status: "ready",
      onOptionSelect: noop,
      onBack: noop,
      onContinue: noop,
      backLabel: "Back",
      continueLabel: "Continue",
    },
  },
  KozmosColorPicker: { props: { label: "Brand" } },
  KozmosCombobox: { props: { options: fruit, label: "Fruit" } },
  KozmosDateRangePicker: { props: { label: "Stay" } },
  KozmosListbox: { props: { options: fruit, "aria-label": "Fruit" } },
  KozmosMultiSelect: { props: { options: fruit, label: "Fruit" } },
  KozmosNumberInput: { props: { "aria-label": "Guests" } },
  KozmosPasswordInput: { props: { "aria-label": "Password" } },
};

/** Exports that draw nothing in place: the portal tests below hear them. */
const IN_A_PORTAL = [
  "KozmosBackdrop",
  "KozmosAnchoredPopover",
  "KozmosTourStep",
];

/**
 * Exports that cannot draw alone: each needs a React parent, and no wrapper
 * can be one, since each wrapper is a React root of its own (GAP-016).
 */
const CANNOT_DRAW_ALONE: Record<string, string> = {
  KozmosToast: "a ToastProvider",
  KozmosTooltip: "a TooltipProvider",
  KozmosRadioGroupItem: "a RadioGroup",
};

/** The parts the review named, which draw no element of their own. */
const ELEMENTLESS = [
  "KozmosDialog",
  "KozmosSelect",
  "KozmosMenu",
  "KozmosDrawer",
  "KozmosPopover",
  "KozmosBottomSheet",
  "KozmosAnalyticsProvider",
  "KozmosNavigationAnnouncer",
];

/** The first element React drew inside a wrapper's root that draws a box. */
function firstDrawn(host: HTMLElement) {
  const [own] = host.children;
  const [container] = own.children;
  return [...container.querySelectorAll<HTMLElement>("*")].find(
    (element) => getComputedStyle(element).display !== "contents",
  );
}

describe("every Kozmos* export hears what it draws in place", () => {
  it("lists each export once: drawn in place, in a portal, or not alone", () => {
    const listed = [
      ...Object.keys(IN_PLACE),
      ...IN_A_PORTAL,
      ...Object.keys(CANNOT_DRAW_ALONE),
    ];
    expect(new Set(listed).size).toBe(listed.length);
    expect(listed.sort()).toEqual(
      Object.keys(Bridge)
        .filter((name) => name.startsWith("Kozmos"))
        .sort(),
    );
    for (const name of ELEMENTLESS) expect(IN_PLACE).toHaveProperty(name);
  });

  it.each(Object.entries(IN_PLACE))(
    "%s: @click and @keydown each run once, given the native event",
    async (name, { props, slot, target }) => {
      const onClick = vi.fn();
      const onKeydown = vi.fn();
      const host = mount(() =>
        h(
          Bridge[name as keyof typeof Bridge] as Component,
          { ...props, onClick, onKeydown },
          slot
            ? {
                default: () =>
                  h("button", { type: "button", "data-probe": "" }, "Probe"),
              }
            : undefined,
        ),
      );
      const [own] = host.children;
      const [container] = own.children;
      // Drawn by React, in place: inside its root.
      const clicked = await until(() =>
        slot
          ? container.querySelector<HTMLElement>("[data-probe]")
          : target
            ? (target(container as HTMLElement) as HTMLElement | null)
            : firstDrawn(host),
      );
      await settle();
      // As a pointer's click: an <svg> has no click() of its own.
      clicked.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      clicked.dispatchEvent(
        new KeyboardEvent("keydown", { key: "x", bubbles: true }),
      );
      await settle();
      expect.soft(onClick, "click").toHaveBeenCalledTimes(1);
      expect.soft(onClick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
      expect.soft(onKeydown, "keydown").toHaveBeenCalledTimes(1);
      expect.soft(onKeydown.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
    },
  );
});

// --------------------------------------------------------------------------
// What a part draws in a portal is outside the wrapper's box, and React's
// host hears it there. Each part is opened, and a button in what it opens is
// clicked and given a key.
// --------------------------------------------------------------------------

/** A button to press inside what a part opens. */
const probe = () => e("button", { type: "button", "data-probe": "" }, "Probe");
const a11y = (Title: unknown, Description: unknown) => [
  e(Title as React.ElementType, { key: "title" }, "Title"),
  e(Description as React.ElementType, { key: "description" }, "Description"),
];

const IN_PORTALS: [string, Record<string, unknown>, boolean?][] = [
  // An element-less root, its content React's.
  [
    "KozmosDialog",
    {
      open: true,
      children: e(
        DialogContent,
        null,
        ...a11y(DialogTitle, DialogDescription),
        probe(),
      ),
    },
  ],
  [
    "KozmosDrawer",
    {
      open: true,
      children: e(
        DrawerContent,
        null,
        ...a11y(DrawerTitle, DrawerDescription),
        probe(),
      ),
    },
  ],
  ["KozmosPopover", { open: true, children: e(PopoverContent, null, probe()) }],
  // Parts that draw nothing in place: what they open is all they draw.
  [
    "KozmosAnchoredPopover",
    {
      open: true,
      anchor: { getBoundingClientRect: () => new DOMRect(0, 0, 10, 10) },
      children: probe(),
    },
  ],
  ["KozmosBackdrop", { children: probe() }],
  ["KozmosTourStep", { title: "Step", children: probe() }],
];

describe("what a part draws in a portal", () => {
  it.each(IN_PORTALS)(
    "%s: @click and @keydown inside it each run once, given the native event",
    async (name, props) => {
      const onClick = vi.fn();
      const onKeydown = vi.fn();
      const host = mount(() =>
        h(Bridge[name as keyof typeof Bridge] as Component, {
          ...props,
          onClick,
          onKeydown,
        }),
      );
      const button = await until(() => $<HTMLElement>("[data-probe]"));
      // Outside the wrapper: in the portal.
      expect(host.contains(button)).toBe(false);
      await settle();
      button.click();
      button.dispatchEvent(
        new KeyboardEvent("keydown", { key: "x", bubbles: true }),
      );
      await settle();
      expect.soft(onClick, "click").toHaveBeenCalledTimes(1);
      expect.soft(onClick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
      expect.soft(onKeydown, "keydown").toHaveBeenCalledTimes(1);
      expect.soft(onKeydown.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
    },
  );
});

// --------------------------------------------------------------------------
// The native event, and Vue's modifiers on it, wherever a listener hears it:
// on the element the part puts it on, on React's host, and on the box.
// --------------------------------------------------------------------------

describe("a listener is given the native event, and its modifiers act on it", () => {
  /** KozmosDialog with a trigger drawn in place, from a Vue slot: the host's. */
  const dialog = (listeners: string, state: Record<string, unknown>) =>
    page(
      `<KozmosDialog ${listeners}><button type="button" data-probe>Open</button></KozmosDialog>`,
      state,
    );

  it("on each path: the part's element, React's host, and the box", async () => {
    const seen: Event[] = [];
    const listen = (event: Event) => seen.push(event);
    mount(
      page(
        `<KozmosInput aria-label="Field" @click="listen" @keydown="listen" @focusin="listen" />`,
        { listen },
      ),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    input.click();
    press(input, "a");
    input.focus();
    await settle();
    unmount();
    mount(dialog(`@click="listen" @keydown="listen"`, { listen }));
    const trigger = await until(() => $<HTMLElement>("[data-probe]"));
    await settle();
    trigger.click();
    press(trigger, "a");
    await settle();
    const kinds = [
      MouseEvent,
      KeyboardEvent,
      FocusEvent,
      MouseEvent,
      KeyboardEvent,
    ];
    expect(seen).toHaveLength(kinds.length);
    seen.forEach((event, index) => expect(event).toBeInstanceOf(kinds[index]));
    // What it heard, where it heard it.
    expect(seen[0].target).toBe(input);
    expect(seen[3].target).toBe(trigger);
  });

  it(".stop and .prevent act on React's event, and the page's, on the host's path", async () => {
    const enter = vi.fn();
    const clicked = vi.fn();
    const outside = vi.fn();
    const host = mount(
      dialog(`@keydown.enter.stop.prevent="enter" @click.stop="clicked"`, {
        enter,
        clicked,
      }),
    );
    host.addEventListener("keydown", outside);
    host.addEventListener("click", outside);
    const trigger = await until(() => $<HTMLElement>("[data-probe]"));
    await settle();
    const key = (name: string) => {
      const event = new KeyboardEvent("keydown", {
        key: name,
        bubbles: true,
        cancelable: true,
      });
      trigger.dispatchEvent(event);
      return event;
    };
    expect(key("a").defaultPrevented).toBe(false);
    expect(key("Enter").defaultPrevented).toBe(true);
    trigger.click();
    await settle();
    expect(enter).toHaveBeenCalledTimes(1);
    expect(enter.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(outside).toHaveBeenCalledTimes(1);
  });

  it(".stop is React's too: the part's own handlers above the element never run", async () => {
    const outer = vi.fn();
    // A part that hands onClick to its button, inside a box of its own that
    // listens as well.
    const Part = ({ onClick }: { onClick?: () => void }) =>
      e(
        "div",
        { onClick: outer },
        e("button", { type: "button", onClick }, "Go"),
      );
    const clicked = vi.fn();
    mount(
      defineComponent({
        components: { Part: createVueWrapper(Part) },
        setup: () => ({ clicked }),
        template: `<Part @click.stop="clicked" />`,
      }),
    );
    const button = await until(() => $<HTMLElement>("button"));
    await settle();
    button.click();
    await settle();
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it(".prevent is React's too: a Radix part sees the event prevented, and does nothing", async () => {
    const clicked = vi.fn();
    mount(
      page(`<KozmosCheckbox aria-label="Accept" @click.prevent="clicked" />`, {
        clicked,
      }),
    );
    const box = await until(() => $<HTMLElement>("[role=checkbox]"));
    box.click();
    await settle();
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(box.getAttribute("aria-checked")).toBe("false");
  });

  it(".self is the element React calls it on: the part's own, never what it draws inside it", async () => {
    const self = vi.fn();
    mount(
      page(`<KozmosInput aria-label="Field" @click.self="self" />`, { self }),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    await settle();
    // Inside the part, round its <input>: the host hears it, `.self` does not.
    input.parentElement!.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
    input.click();
    await settle();
    expect(self).toHaveBeenCalledTimes(1);
    expect(self.mock.calls[0][0].target).toBe(input);
    expect(self.mock.calls[0][0].currentTarget).toBe(null);
  });

  it(".capture runs on the way down: before the part's own listener, on the host's path", async () => {
    const order: string[] = [];
    const host = mount(
      dialog(`@click.capture="captured"`, {
        captured: () => order.push("capture"),
      }),
    );
    const trigger = await until(() => $<HTMLElement>("[data-probe]"));
    trigger.addEventListener("click", () => order.push("target"));
    await settle();
    trigger.click();
    await settle();
    expect(order).toEqual(["capture", "target"]);
    void host;
  });

  it(".once runs once, wherever it is heard: in place, then in a portal", async () => {
    const once = vi.fn();
    mount(() =>
      h(Bridge.KozmosPopover, {
        open: true,
        onClickOnce: once,
        children: [
          e("button", { key: "in-place", type: "button", "data-in-place": "" }),
          e(PopoverContent, { key: "content" }, probe()),
        ],
      }),
    );
    const inPlace = await until(() => $<HTMLElement>("[data-in-place]"));
    const inPortal = await until(() => $<HTMLElement>("[data-probe]"));
    await settle();
    inPlace.click();
    inPortal.click();
    inPlace.click();
    await settle();
    expect(once).toHaveBeenCalledTimes(1);
  });
});

// --------------------------------------------------------------------------
// A callback of a part named like a DOM event: the part's alone. Through the
// host, or the box, the listener would also run for that DOM event from
// what the part draws, with an event where the part gives an id or a value.
// --------------------------------------------------------------------------

/** React's DOM event for each of its names. */
const reactEvents: Record<string, string> = {
  ...REACT_DOM_EVENTS,
  ...REACT_UNTYPED_EVENTS,
};

/**
 * The DOM event Vue's runtime binds a native listener's key to, and whether
 * in the capture phase: `onSelectionChange` is `selection-change`, not the
 * DOM's `selectionchange`.
 */
function vueEvent(key: string) {
  let name = key;
  let capture = false;
  for (let suffix; (suffix = /(Once|Passive|Capture)$/.exec(name)?.[1]); ) {
    if (suffix === "Capture") capture = true;
    name = name.slice(0, -suffix.length);
  }
  const event =
    name[2] === ":"
      ? name.slice(3)
      : name
          .slice(2)
          .replace(/\B([A-Z])/g, "-$1")
          .toLowerCase();
  return { event, capture };
}

/**
 * Every DOM event: lib.dom's, React's, and `search`, which Chrome and Safari
 * fire on an `<input type=search>` and lib.dom does not name.
 */
const domEvents = () =>
  new Set([
    ...libDomEvents(),
    ...Object.values(REACT_DOM_EVENTS),
    ...Object.values(REACT_UNTYPED_EVENTS),
    ...Object.values(REACT_19_EVENTS),
    "search",
  ]);

/**
 * Whether a listener of the part's callback's name is also heard as a DOM
 * event from what the part draws: on the host, which takes only the events
 * that reach it, or on the box, as the DOM event Vue binds its key to, when
 * that reaches the box or it listens in the capture phase.
 */
function heardAsDomEvent(
  name: string,
  callbacks: ReadonlySet<string>,
  events: ReadonlySet<string>,
) {
  const route = routeListener(name, callbacks);
  const onHost = route.host
    ? reactEvents[route.host.replace(/Capture$/, "")]
    : null;
  const onBox = route.native ? vueEvent(route.native) : null;
  return (
    (onHost != null && events.has(onHost)) ||
    (onBox !== null &&
      events.has(onBox.event) &&
      (onBox.capture || !TARGET_ONLY_EVENTS.has(onBox.event)))
  );
}

describe("a part's callback named like a DOM event", () => {
  it.each([
    // The review's case: a name React does not know, over a DOM event that
    // bubbles, goes to the part and to the box.
    ["onSearch", [], true],
    ["onSearch", ["onSearch"], false],
    // React's own: the host hears it from inside.
    ["onSelect", [], true],
    ["onSelect", ["onSelect"], false],
    ["onChange", [], true],
    // Only React 19's: the box hears it, in the capture phase.
    ["onScrollEnd", [], true],
    // One only its target hears: the part's alone already.
    ["onClose", [], false],
    ["onPause", [], false],
    // Vue binds `selection-change`, which no DOM fires.
    ["onSelectionChange", [], false],
    ["onZoomIn", [], false],
  ] as const)(
    "%s, with callbacks %j: heard as a DOM event too, %s",
    (name, callbacks, heard) => {
      expect(heardAsDomEvent(name, new Set(callbacks), domEvents())).toBe(
        heard,
      );
    },
  );

  it("is the part's alone: no callback of a bridged part is heard as a DOM event too", () => {
    const events = domEvents();
    const side = reactSides();
    const parts = bridgedParts();
    expect(
      parts.filter((part) => !part.react).map((part) => part.name),
    ).toEqual([]);
    const collisions: string[] = [];
    let callbacks = 0;
    for (const part of parts) {
      for (const member of side(part.react!).react) {
        if (!/^on[A-Z]/.test(member.name) || !member.callable) continue;
        callbacks += 1;
        if (heardAsDomEvent(member.name, part.bridge!.callbacks, events))
          collisions.push(`${part.name} ${member.name}: ${member.type}`);
      }
    }
    expect(callbacks).toBeGreaterThan(100);
    expect(collisions).toEqual([]);
  }, 60_000);

  it("ColorPicker's @change is its hex field's, never its format menu's", async () => {
    const changed = vi.fn();
    mount(() =>
      h(Bridge.KozmosColorPicker, {
        label: "Brand",
        open: true,
        onChange: changed,
      }),
    );
    const menu = await until(() =>
      $<HTMLSelectElement>("select[aria-label='Color format']"),
    );
    await settle();
    select(menu, "hex");
    await settle();
    expect(changed).not.toHaveBeenCalled();
    type($<HTMLInputElement>("input[type=text]")!, "#abc");
    await settle();
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls[0][0].target).toBe($("input[type=text]"));
  });

  it("SearchBar's @change is its text, once a keystroke, never also the field's DOM change", async () => {
    const changed = vi.fn();
    mount(() =>
      h(Bridge.KozmosSearchBar, {
        placeholder: "Where to?",
        onChange: changed,
      }),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    await settle();
    type(input, "Gate");
    await settle();
    expect(changed.mock.calls).toEqual([["Gate"]]);
  });
});

describe("a React part's callbacks", () => {
  // Each button pressed twice: a callback runs each time, a `.once` one
  // once. Vue names `@zoom-in` `onZoomIn`, which goes to React as it is.
  const CALLBACKS: [string, string, string, number][] = [
    ["KozmosWayfindingCard", "@close", "Close navigation", 2],
    ["KozmosWayfindingCard", "@close.once", "Close navigation", 1],
    ["KozmosMapControlsGroup", "@zoom-in", "Zoom in", 2],
    ["KozmosMapControlsGroup", "@zoom-in.once", "Zoom in", 1],
    ["KozmosWayfindingInputRow", "@swap", "Swap origin and destination", 2],
    [
      "KozmosWayfindingInputRow",
      "@swap.once",
      "Swap origin and destination",
      1,
    ],
  ];

  it("each runs once a press, a .once one once", async () => {
    for (const [part, listener, button, times] of CALLBACKS) {
      const spy = vi.fn();
      mount(page(`<${part} ${listener}="spy">Route</${part}>`, { spy }));
      const pressed = await until(() => $(`button[aria-label='${button}']`));
      pressed.click();
      await settle();
      pressed.click();
      await settle();
      expect.soft(spy, `${part} ${listener}`).toHaveBeenCalledTimes(times);
      unmount();
    }
  });
});

// --------------------------------------------------------------------------
// The Vue playground's field (apps/playground-vue/src/App.vue).
// --------------------------------------------------------------------------

describe("the playground's field", () => {
  it('<KozmosInput v-model="newTask" @keydown.enter="addTask">: Enter adds the task typed, once', async () => {
    const newTask = ref("");
    const tasks = ref<string[]>([]);
    const addTask = vi.fn(() => {
      if (newTask.value.trim()) {
        tasks.value.push(newTask.value.trim());
        newTask.value = "";
      }
    });
    mount(
      page(
        `<KozmosInput v-model="newTask" placeholder="What needs to be done?" @keydown.enter="addTask" />`,
        { newTask, addTask },
      ),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    type(input, "Buy milk");
    await settle();
    press(input, "k");
    await settle();
    expect(addTask).not.toHaveBeenCalled();
    press(input, "Enter");
    await settle();
    expect(addTask).toHaveBeenCalledTimes(1);
    expect(tasks.value).toEqual(["Buy milk"]);
    expect(input.value).toBe("");
  });
});

void $$;
