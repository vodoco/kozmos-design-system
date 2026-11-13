// @vitest-environment jsdom
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref, type Component } from "vue";
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
  IconButton,
  PopoverContent,
} from "@kozmos-ds/react";
import * as KozmosReact from "@kozmos-ds/react";
import * as Bridge from "./index";
import { ADAPTER_TAKES, PART_TAKES } from "./part-takes";
import {
  HEARD_ON_THE_WAY_DOWN,
  NATIVE_DOM_EVENTS,
  REACT_19_EVENTS,
  REACT_CAPTURELESS_EVENTS,
  REACT_DOM_EVENTS,
  REACT_DOM_PROPS,
  REACT_UNTYPED_EVENTS,
  createVueWrapper,
  routeListener,
  takesProp,
  type Takes,
} from "./react-adapter";
import { REPOSITORY, computeTakes } from "../../scripts/bridge-takes.mjs";
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

// Listeners through the React bridge (react-adapter.ts). Each listener goes
// to one place. When the React part takes its prop, it is the part's alone,
// by React's name (Vue names `@keydown` `onKeydown`, and React knows only
// `onKeyDown`), and the part decides what runs it, as for a React caller.
// When the part does not, it is a native listener on the wrapper's own box,
// as Vue binds a listener a component does not declare on its root element:
// it hears what the part draws in place, and, as a component's listener
// never hears what it teleports, nothing the part draws in a portal. Which
// props a part takes is part-takes.ts, read from React's types.
//
// Round 3 also gave React's events to a host React drew round the part, to
// hear an element-less part's portal; that host ran `@click` when the part
// chose not to call `onClick` (LocationPin's second tap, a disabled
// NavigationItem), and is gone.

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

/** The React 18 run's own description of its React, not any value a shell
 * happens to hold. */
const onTheReact18Run = () => {
  try {
    const run = JSON.parse(process.env.KOZMOS_REACT18 ?? "null") as {
      reactVersion?: unknown;
    } | null;
    return (
      typeof run?.reactVersion === "string" &&
      run.reactVersion.startsWith("18.")
    );
  } catch {
    return false;
  }
};

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
    expect([...REACT_DOM_PROPS].sort()).toEqual([...keys].sort());
  });

  // react-dom 19's own list, so the React 18 run (vitest.react18.config.mts,
  // which describes its React 18 in KOZMOS_REACT18) skips it here, whatever
  // `-t` it is given; its React 18 half is test/react-dom-events.spec.ts.
  // Every other run holds it, and fails it on any React but 19.
  it.skipIf(onTheReact18Run())(
    "with REACT_UNTYPED_EVENTS and REACT_19_EVENTS, lists every DOM event react-dom 19 synthesises, by React's name",
    () => {
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
    },
  );

  it("names each DOM event once; the box's own are none React takes; it hears only non-bubbling ones on the way down", () => {
    const dom = [
      ...Object.values(REACT_DOM_EVENTS),
      ...Object.values(REACT_UNTYPED_EVENTS),
      ...Object.values(REACT_19_EVENTS),
    ];
    expect(new Set(dom).size).toBe(dom.length);
    for (const event of NATIVE_DOM_EVENTS) expect(dom).not.toContain(event);
    for (const event of HEARD_ON_THE_WAY_DOWN) expect(dom).toContain(event);
    // The box is entered and left itself: those reach it as its own.
    for (const event of [
      "mouseenter",
      "mouseleave",
      "pointerenter",
      "pointerleave",
    ])
      expect(HEARD_ON_THE_WAY_DOWN.has(event)).toBe(false);
    expect([...HEARD_ON_THE_WAY_DOWN]).toEqual(
      expect.arrayContaining([
        "focus",
        "blur",
        "scroll",
        "scrollend",
        "toggle",
        "load",
      ]),
    );
  });
});

// --------------------------------------------------------------------------
// Which `on…` props each part takes: part-takes.ts, generated from React's
// built declarations by scripts/bridge-takes.mjs.
// --------------------------------------------------------------------------

describe("which on… props each part takes", () => {
  const table = computeTakes();

  /** The runtime table's entry for each React export the computed table names. */
  const byName = () =>
    Object.fromEntries(
      Object.keys(table.parts).map((name) => [
        name,
        PART_TAKES.get(KozmosReact[name as keyof typeof KozmosReact]),
      ]),
    );

  it("part-takes.ts is what React's types say (else run pnpm --filter @kozmos-ds/vue bridge:takes)", () => {
    // Each React export is keyed by itself, with what its types take.
    expect(byName()).toEqual(table.parts);
    expect(new Set(PART_TAKES.values()).size).toBeLessThanOrEqual(
      Object.keys(table.parts).length,
    );
    expect(ADAPTER_TAKES).toEqual(table.adapters);
    expect([...REACT_DOM_PROPS].sort()).toEqual(table.domProps);
  }, 60_000);

  it("is exact both ways: a part takes each prop its types take, and no other", () => {
    const everyName = new Set([
      ...REACT_DOM_PROPS,
      ...Object.values(table.handlers).flat(),
      "onFocusIn",
      "onScrollEnd",
      "onKozmosPing",
    ]);
    const wrong: string[] = [];
    const entries: [string, Takes][] = [
      ...(Object.entries(byName()) as [string, Takes][]),
      ...Object.entries(ADAPTER_TAKES),
    ];
    for (const [name, takes] of entries) {
      const handlers = new Set(table.handlers[name]);
      for (const prop of everyName)
        if (takesProp(takes, prop) !== handlers.has(prop))
          wrong.push(`${name} ${prop}: ${handlers.has(prop)}`);
    }
    expect(entries.length).toBeGreaterThan(100);
    expect(wrong).toEqual([]);
  }, 60_000);

  it("describes every Kozmos* export's part", () => {
    const parts = bridgedParts();
    expect(parts.length).toBeGreaterThan(90);
    const undescribed = parts
      .filter(({ bridge }) => {
        const part = bridge?.part as { name?: string } | undefined;
        return (
          !bridge?.takes ||
          (bridge.takes !== PART_TAKES.get(part) &&
            bridge.takes !== ADAPTER_TAKES[part?.name ?? ""])
        );
      })
      .map(({ name }) => name);
    expect(undescribed).toEqual([]);
  });

  it("the parts that take no onClick: the element-less nine, Tooltip, and two whose props omit it", () => {
    const none = bridgedParts()
      .filter(({ bridge }) => !takesProp(bridge!.takes!, "onClick"))
      .map(({ name }) => name)
      .sort();
    expect(none).toEqual(
      [
        ...ELEMENTLESS,
        "KozmosTooltip",
        // Their props omit onClick: each draws a button whose click is its
        // onSelect.
        "KozmosCategoryTile",
        "KozmosRouteOptionCard",
      ].sort(),
    );
  });

  // A part whose props are a union. Members that disagree on a React DOM
  // event prop make the generator fail: whether a listener of it is the
  // part's or the box's changes what runs it, so a person decides. Members
  // that disagree on a callback of the part's own make it taken: a box
  // listener for a name no DOM event has could never run.
  const FIXTURE = path.join(
    REPOSITORY,
    "packages/react/dist/bridge-takes.fixture.d.ts",
  );
  const fixture = `import type * as React from "react";
interface RowProps extends React.HTMLAttributes<HTMLDivElement> { kind: "row"; onPick?: () => void }
interface ListProps { kind: "list"; items: string[] }
export declare const Mixed: (props: RowProps | ListProps) => React.ReactElement | null;
interface PickRowProps extends React.HTMLAttributes<HTMLDivElement> { kind: "row"; onPick?: () => void }
interface PickListProps extends React.HTMLAttributes<HTMLDivElement> { kind: "list" }
export declare const Picker: (props: PickRowProps | PickListProps) => React.ReactElement | null;
`;
  const fromFixture = (parts: string[]) =>
    computeTakes(REPOSITORY, {
      declarations: FIXTURE,
      virtual: new Map([[FIXTURE, fixture]]),
      parts,
      adapters: {},
    });

  it("a union whose members disagree on a React DOM event prop fails generation, naming the part", () => {
    expect(() => fromFixture(["Mixed"])).toThrow(
      /^Mixed: its props are a union whose members disagree on 158 React DOM event prop\(s\) \(onAbort, onAbortCapture, /,
    );
  }, 60_000);

  it("a union whose members disagree on a callback of the part's own takes it", () => {
    const { parts } = fromFixture(["Picker"]);
    expect(parts.Picker).toEqual({ dom: true, own: ["onPick"] });
  }, 60_000);
});

// --------------------------------------------------------------------------
// Where each spelling of a listener goes.
// --------------------------------------------------------------------------

/** A part whose props carry React's DOM attributes (Input's). */
const dom: Takes = { dom: true, own: [] };
/** A part that takes no DOM event, and a callback of its own (Dialog's). */
const none: Takes = { dom: false, own: ["onOpenChange"] };
/** A part with a callback named like an event React knows (WayfindingCard's). */
const closes: Takes = { dom: true, own: ["onClose"] };

describe("routeListener", () => {
  it.each([
    // A DOM event the part takes: React's name, from Vue's or React's.
    ["onClick", dom, "onClick", null, false],
    ["onKeydown", dom, "onKeyDown", null, false],
    ["onKeyDown", dom, "onKeyDown", null, false],
    ["onDblclick", dom, "onDoubleClick", null, false],
    ["onContextmenu", dom, "onContextMenu", null, false],
    ["onMouseenter", dom, "onMouseEnter", null, false],
    ["onGotpointercapture", dom, "onGotPointerCapture", null, false],
    ["onFocus", dom, "onFocus", null, false],
    // `.capture` is React's capture variant; `.once` runs once.
    ["onClickCapture", dom, "onClickCapture", null, false],
    ["onKeydownCapture", dom, "onKeyDownCapture", null, false],
    [
      "onGotPointerCaptureCapture",
      dom,
      "onGotPointerCaptureCapture",
      null,
      false,
    ],
    ["onClickOnce", dom, "onClick", null, true],
    ["onKeydownCaptureOnce", dom, "onKeyDownCapture", null, true],
    // `.passive`, which React cannot take, is dropped on the part.
    ["onTouchstartPassive", dom, "onTouchStart", null, false],
    // React has no capture variant for it: no part takes one, so the box.
    ["onMouseenterCapture", dom, null, "onMouseenterCapture", false],
    // DOM events React does not synthesise: the box, by their DOM name.
    ["onFocusin", dom, null, "onFocusin", false],
    ["onFocusIn", dom, null, "onFocusin", false],
    ["onFocusoutOnce", dom, null, "onFocusoutOnce", false],
    ["on:my-event", dom, null, "on:my-event", false],
    // React's types do not declare these: the box, on the way down for
    // those that do not bubble.
    ["onScrollend", dom, null, "onScrollendCapture", false],
    ["onScrollEnd", dom, null, "onScrollendCapture", false],
    ["onBeforetoggle", dom, null, "onBeforetoggleCapture", false],
    ["onToggle", dom, null, "onToggleCapture", false],
    ["onTransitionrun", dom, null, "onTransitionrun", false],
    ["onTransitionStartOnce", dom, null, "onTransitionstartOnce", false],
    // A name the part does not take: a custom event, on the box.
    ["onKozmosPing", dom, null, "onKozmosPing", false],
    ["onKozmosPingCapture", dom, null, "onKozmosPingCapture", false],
    // A part that takes no DOM event: each is the box's, as Vue's spelling.
    ["onClick", none, null, "onClick", false],
    ["onKeydown", none, null, "onKeydown", false],
    ["onKeyDown", none, null, "onKeydown", false],
    ["onClickOnce", none, null, "onClickOnce", false],
    ["onClickCapture", none, null, "onClickCapture", false],
    // One that does not bubble: on the way down, so the box hears it.
    ["onFocus", none, null, "onFocusCapture", false],
    ["onBlur", none, null, "onBlurCapture", false],
    ["onScroll", none, null, "onScrollCapture", false],
    ["onLoadOnce", none, null, "onLoadCaptureOnce", false],
    // Not enter and leave: the box is entered and left itself.
    ["onMouseenter", none, null, "onMouseenter", false],
    ["onOpenChange", none, "onOpenChange", null, false],
    // A callback of the part's own named like an event: the part's.
    ["onClose", closes, "onClose", null, false],
    ["onCloseOnce", closes, "onClose", null, true],
  ] as const)(
    "%s, for a part that takes %j: part %s, box %s, once %s",
    (key, takes, react, native, once) => {
      expect(routeListener(key, (prop) => takesProp(takes, prop))).toEqual({
        react,
        native,
        once,
      });
    },
  );

  it.each([
    ["onMouseenterCapture", "onMouseenterCapture"],
    ["onMouseleaveCapture", "onMouseleaveCapture"],
    ["onPointerenterCapture", "onPointerenterCapture"],
    ["onPointerLeaveCapture", "onPointerleaveCapture"],
  ])(
    "a part of a consumer's: %s, which React has no capture for, is the box's (%s)",
    (key, native) => {
      expect(routeListener(key)).toEqual({ react: null, native, once: false });
    },
  );

  it("a part of a consumer's takes React's contract: every React DOM event and every callback", () => {
    expect(routeListener("onClick")).toEqual({
      react: "onClick",
      native: null,
      once: false,
    });
    expect(routeListener("onPoiClick").react).toBe("onPoiClick");
    expect(routeListener("onToggle").react).toBe("onToggle");
    expect(routeListener("onFocusin").native).toBe("onFocusin");
    expect(routeListener("onScrollend").native).toBe("onScrollendCapture");
  });
});

// --------------------------------------------------------------------------
// Each listener on a bridged field (KozmosInput takes every DOM event),
// fired once by what fires it.
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
    // React's, from a mouseover coming from outside.
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
    // React's types do not declare it: the box hears it on the way down.
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
    // A custom event, which Input does not take: the box hears it.
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

  it("one event dispatched twice runs the listener twice, as a native listener does", async () => {
    const click = vi.fn();
    mount(page(`<KozmosInput aria-label="Field" @click="click" />`, { click }));
    const input = await until(() => $<HTMLInputElement>("input"));
    await settle();
    const event = new MouseEvent("click", { bubbles: true });
    input.dispatchEvent(event);
    input.dispatchEvent(event);
    await settle();
    expect(click).toHaveBeenCalledTimes(2);
  });

  it("a .once listener taken away and given again runs once more, and one swapped for another hears the next", async () => {
    const a = vi.fn();
    const b = vi.fn();
    const which = ref<"none" | "a" | "b" | "aOnce">("none");
    mount(() =>
      h(Bridge.KozmosInput, {
        "aria-label": "Field",
        ...(which.value === "a" && { onClick: a }),
        ...(which.value === "b" && { onClick: b }),
        ...(which.value === "aOnce" && { onClickOnce: a }),
      }),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    const step = async (next: typeof which.value) => {
      which.value = next;
      await nextTick();
      await settle();
    };
    await settle();
    input.click();
    await step("a");
    input.click();
    await step("b");
    input.click();
    await step("none");
    input.click();
    await step("aOnce");
    input.click();
    input.click();
    await settle();
    expect({ a: a.mock.calls.length, b: b.mock.calls.length }).toEqual({
      a: 2,
      b: 1,
    });
  });
});

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

// --------------------------------------------------------------------------
// Every Kozmos* export hears its listeners where it should. A part that
// takes onClick and onKeyDown runs them on the element it gives them to;
// a part that takes no DOM event (a Radix root, a provider) is heard on the
// wrapper's box, from what it draws in place.
// --------------------------------------------------------------------------

interface InPlace {
  /** What the part needs to draw. */
  props?: Record<string, unknown>;
  /** A part that draws its default slot in place is clicked there. */
  slot?: boolean;
  /** The element the part gives onClick to, when not the first it draws. */
  click?: (drawn: HTMLElement) => Element | null | undefined;
  /** The element the part gives onKeyDown to, when not where it gives onClick. */
  key?: (drawn: HTMLElement) => Element | null | undefined;
}

const first = (selector: string) => (drawn: HTMLElement) =>
  drawn.querySelector(selector);

/**
 * What each export needs to draw in place, and where its listeners are
 * heard: in its slot when it draws one in place, else on the element the
 * part gives them to (found by clicking each element in turn, and written
 * here), else the first element it draws.
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
  KozmosSlider: {
    props: { "aria-label": "Volume" },
    click: first("span[data-orientation]"),
  },
  KozmosSearch: { props: { "aria-label": "Search" }, click: first("input") },
  KozmosSearchBar: {
    props: { placeholder: "Where to?" },
    click: first("input"),
  },
  KozmosSelect: { slot: true },
  KozmosBottomNavigation: {
    props: { items: [{ icon: e("span"), label: "Home" }] },
  },
  KozmosNavbar: { slot: true },
  KozmosSidebar: { slot: true },
  KozmosMenu: { slot: true },
  KozmosContextMenu: { slot: true },
  KozmosKbd: { props: { keys: ["Esc"] } },
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
  KozmosListItem: { slot: true },
  KozmosListItemStatus: { props: { status: "done" } },
  KozmosSettingsRow: { props: { label: "Analytics" } },
  // A table cannot hold the slot's box.
  KozmosTable: { click: first("table") },
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
  // Its onClick is its button's; its other props go on the card.
  KozmosPOICard: { props: { title: "Gate 4" }, click: first("button") },
  KozmosBottomSheet: { slot: true },
  KozmosOTPInput: {
    props: { length: 4 },
    click: (drawn) => drawn.querySelector("input")?.parentElement,
  },
  KozmosRating: { props: { label: "Your visit" } },
  KozmosFileUpload: {
    props: { label: "Floor plan" },
    click: (drawn) => drawn.querySelector("input[type=file]")?.parentElement,
  },
  KozmosDatePicker: { props: { "aria-label": "Date" }, click: first("input") },
  KozmosTimePicker: { props: { "aria-label": "Time" }, click: first("input") },
  KozmosFloatingActionButton: { slot: true },
  KozmosSplitButton: { slot: true },
  KozmosToggleButton: { slot: true },
  KozmosSegmentedControl: {
    props: { label: "Mode", items: [{ value: "walk", label: "Walk" }] },
    click: first("[role=group]"),
  },
  KozmosLink: { slot: true },
  KozmosIconButton: { slot: true },
  KozmosTabs: { slot: true },
  KozmosDialog: { slot: true },
  KozmosMapOverlay: { slot: true },
  KozmosAnalyticsProvider: { slot: true },
  KozmosChip: { slot: true },
  // Its island, inside the theme scope it draws round it.
  KozmosDynamicIsland: { click: first("[data-kozmos-root] > *") },
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
  KozmosCheckbox: {
    props: { "aria-label": "Accept" },
    click: first("[role=checkbox]"),
  },
  KozmosInput: { props: { "aria-label": "Name" }, click: first("input") },
  KozmosTextarea: { props: { "aria-label": "Note" }, click: first("textarea") },
  KozmosSwitch: {
    props: { "aria-label": "Wi-Fi" },
    click: first("[role=switch]"),
  },
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
  KozmosColorPicker: {
    props: { label: "Brand" },
    click: first("input[type=text]"),
  },
  KozmosCombobox: {
    props: { options: fruit, label: "Fruit" },
    click: first("input[role=combobox]"),
  },
  KozmosDateRangePicker: {
    props: { label: "Stay" },
    click: (drawn) => drawn.querySelector("[role=group]")?.children[1],
  },
  KozmosListbox: { props: { options: fruit, "aria-label": "Fruit" } },
  KozmosMultiSelect: {
    props: { options: fruit, label: "Fruit" },
    click: (drawn) =>
      drawn.querySelector("[data-slot=chip-group]")?.parentElement,
  },
  KozmosNumberInput: {
    props: { "aria-label": "Guests" },
    click: first("input"),
  },
  KozmosPasswordInput: {
    props: { "aria-label": "Password" },
    click: first("input"),
  },
};

/**
 * Exports that draw nothing in place, and take onClick: what they draw in a
 * portal is theirs, and the portal tests hear it.
 */
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
  "KozmosContextMenu",
  "KozmosDrawer",
  "KozmosPopover",
  "KozmosBottomSheet",
  "KozmosAnalyticsProvider",
  "KozmosNavigationAnnouncer",
];

/** The first element React drew inside a wrapper's root that draws a box. */
function firstDrawn(drawn: Element) {
  return [...drawn.querySelectorAll<HTMLElement>("*")].find(
    (element) => getComputedStyle(element).display !== "contents",
  );
}

describe("every Kozmos* export hears its listeners where it should", () => {
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
    async (name, { props, slot, click, key }) => {
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
      const [drawn] = own.children as unknown as HTMLElement[];
      const where = (find?: InPlace["click"]) => () =>
        (slot
          ? drawn.querySelector<HTMLElement>("[data-probe]")
          : (find?.(drawn) ?? firstDrawn(drawn))) as HTMLElement | null;
      const clicked = await until(where(click));
      const keyed = (await until(where(key ?? click)))!;
      await settle();
      // As a pointer's click: an <svg> has no click() of its own.
      clicked.dispatchEvent(
        new MouseEvent("click", { bubbles: true, detail: 1 }),
      );
      keyed.dispatchEvent(
        new KeyboardEvent("keydown", { key: "x", bubbles: true }),
      );
      await settle();
      expect.soft(onClick, "click").toHaveBeenCalledTimes(1);
      expect.soft(onClick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
      expect.soft(onClick.mock.calls[0]?.[0]?.type).toBe("click");
      expect.soft(onKeydown, "keydown").toHaveBeenCalledTimes(1);
      expect.soft(onKeydown.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
    },
  );
});

// --------------------------------------------------------------------------
// The part decides what runs its listener, as it does for a React caller.
// Each of these gates is the React part's own.
// --------------------------------------------------------------------------

/** A click as a browser stamps it: its count of clicks. */
const clickWith = (element: Element, detail: number) =>
  element.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, detail }),
  );

describe("the part decides what runs its listener", () => {
  /** A LocationPin with @click and @open, and what each heard. */
  async function pin(props: Record<string, unknown> = {}) {
    const click = vi.fn();
    const open = vi.fn();
    mount(() =>
      h(Bridge.KozmosLocationPin, {
        label: "Gate 4",
        onClick: click,
        onOpen: open,
        ...props,
      }),
    );
    const element = await until(() => $<HTMLElement>(".kozmos-location-pin"));
    await settle();
    const heardSoFar = () => ({
      click: click.mock.calls.length,
      open: open.mock.calls.length,
    });
    return { element, heardSoFar };
  }

  it("LocationPin: one press runs @click", async () => {
    const { element, heardSoFar } = await pin();
    clickWith(element, 1);
    await settle();
    expect(heardSoFar()).toEqual({ click: 1, open: 0 });
  });

  it("LocationPin: a double tap runs @click for its first press, and @open for its second", async () => {
    const { element, heardSoFar } = await pin();
    clickWith(element, 1);
    clickWith(element, 2);
    await settle();
    expect(heardSoFar()).toEqual({ click: 1, open: 1 });
  });

  it("LocationPin: a triple click's third press runs nothing", async () => {
    const { element, heardSoFar } = await pin();
    clickWith(element, 1);
    clickWith(element, 2);
    clickWith(element, 3);
    await settle();
    expect(heardSoFar()).toEqual({ click: 1, open: 1 });
  });

  it("LocationPin disabled: activating it, as assistive technology does, runs nothing", async () => {
    const { element, heardSoFar } = await pin({ disabled: true });
    element.click();
    await settle();
    expect(heardSoFar()).toEqual({ click: 0, open: 0 });
  });

  it("NavigationItem: a link runs @click, and a disabled one runs nothing", async () => {
    for (const [disabled, times] of [
      [false, 1],
      [true, 0],
    ] as const) {
      const click = vi.fn();
      mount(
        page(
          `<KozmosNavigationItem href="#gates" :disabled="disabled" @click="click">Gates</KozmosNavigationItem>`,
          { click, disabled },
        ),
      );
      const link = await until(() => $<HTMLElement>("a"));
      await settle();
      link.click();
      await settle();
      expect.soft(click, `disabled ${disabled}`).toHaveBeenCalledTimes(times);
      unmount();
    }
  });

  it.each([
    ["KozmosIconButton", { "aria-label": "Go" }, "button"],
    ["KozmosFloatingActionButton", { "aria-label": "Go" }, "button"],
    ["KozmosToggleButton", { "aria-label": "Bold" }, "button"],
    ["KozmosChip", {}, "button"],
  ] as const)(
    "%s disabled: React runs no onClick of a disabled button",
    async (name, props, selector) => {
      const click = vi.fn();
      mount(() =>
        h(
          Bridge[name] as Component,
          { ...props, disabled: true, onClick: click },
          { default: () => "Go" },
        ),
      );
      const button = await until(() => $<HTMLButtonElement>(selector));
      await settle();
      expect(button.disabled).toBe(true);
      clickWith(button, 1);
      await settle();
      expect(click).not.toHaveBeenCalled();
    },
  );
});

// --------------------------------------------------------------------------
// Portals. A part that takes no DOM event is heard on the wrapper's box:
// from its content in place, never from what it draws in a portal, as a
// Vue component's listener never hears what it teleports. A part that
// takes onClick hears it wherever it gives it, in a portal too.
// --------------------------------------------------------------------------

/** A button to press inside what a part opens. */
const probe = () =>
  e("button", { key: "probe", type: "button", "data-probe": "" }, "Probe");
/** One drawn in place, beside it. */
const inPlace = () =>
  e("button", { key: "in-place", type: "button", "data-in-place": "" }, "Open");
const a11y = (Title: unknown, Description: unknown) => [
  e(Title as React.ElementType, { key: "title" }, "Title"),
  e(Description as React.ElementType, { key: "description" }, "Description"),
];

/** Each part, open, and how many times a press in its portal runs @click and @keydown. */
const IN_PORTALS: [string, number, Record<string, unknown>, boolean][] = [
  // Element-less: what they draw in a portal is not heard.
  [
    "KozmosDialog",
    0,
    {
      open: true,
      children: [
        inPlace(),
        e(
          DialogContent,
          { key: "content" },
          ...a11y(DialogTitle, DialogDescription),
          probe(),
        ),
      ],
    },
    true,
  ],
  [
    "KozmosDrawer",
    0,
    {
      open: true,
      children: [
        inPlace(),
        e(
          DrawerContent,
          { key: "content" },
          ...a11y(DrawerTitle, DrawerDescription),
          probe(),
        ),
      ],
    },
    true,
  ],
  [
    "KozmosPopover",
    0,
    {
      open: true,
      children: [inPlace(), e(PopoverContent, { key: "content" }, probe())],
    },
    true,
  ],
  // They take onClick, and give it to what they draw in a portal.
  [
    "KozmosAnchoredPopover",
    1,
    {
      open: true,
      anchor: { getBoundingClientRect: () => new DOMRect(0, 0, 10, 10) },
      children: probe(),
    },
    false,
  ],
  ["KozmosBackdrop", 1, { children: probe() }, false],
  ["KozmosTourStep", 1, { title: "Step", children: probe() }, false],
];

describe("what a part draws in a portal", () => {
  it.each(IN_PORTALS)(
    "%s: a press inside its portal runs @click and @keydown %s time(s)",
    async (name, times, props, drawsInPlace) => {
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
      expect.soft(onClick, "click in the portal").toHaveBeenCalledTimes(times);
      expect
        .soft(onKeydown, "keydown in the portal")
        .toHaveBeenCalledTimes(times);
      // What it draws in place beside the portal: the box hears it.
      const beside = $<HTMLElement>("[data-in-place]");
      expect(beside !== null).toBe(drawsInPlace);
      if (drawsInPlace) {
        expect(host.contains(beside)).toBe(true);
        beside!.click();
        await settle();
        expect.soft(onClick, "click in place").toHaveBeenCalledTimes(times + 1);
      }
    },
  );

  it("Dialog > IconButton in its content: the button's @click runs once, and Dialog's not at all", async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    mount(() =>
      h(Bridge.KozmosDialog, {
        open: true,
        onClick: outer,
        children: e(
          DialogContent,
          null,
          ...a11y(DialogTitle, DialogDescription),
          e(IconButton, { "aria-label": "Go", onClick: inner }, "x"),
        ),
      }),
    );
    const button = await until(() => $<HTMLElement>("button[aria-label=Go]"));
    await settle();
    button.click();
    await settle();
    expect({
      outer: outer.mock.calls.length,
      inner: inner.mock.calls.length,
    }).toEqual({
      outer: 0,
      inner: 1,
    });
  });
});

// --------------------------------------------------------------------------
// Wrappers inside wrappers: each hears its own, once.
// --------------------------------------------------------------------------

describe("a wrapper inside another", () => {
  it("Card > IconButton: each @click runs once, and .stop on the inner silences the outer", async () => {
    for (const [modifier, outerTimes] of [
      ["", 1],
      [".stop", 0],
    ] as const) {
      const outer = vi.fn();
      const inner = vi.fn();
      mount(
        page(
          `<KozmosCard @click="outer"><KozmosIconButton aria-label="Go" @click${modifier}="inner">x</KozmosIconButton></KozmosCard>`,
          { outer, inner },
        ),
      );
      const button = await until(() => $<HTMLElement>("button[aria-label=Go]"));
      await settle();
      button.click();
      await settle();
      expect
        .soft(
          { outer: outer.mock.calls.length, inner: inner.mock.calls.length },
          modifier,
        )
        .toEqual({ outer: outerTimes, inner: 1 });
      unmount();
    }
  });
});

// --------------------------------------------------------------------------
// The event a listener is given, and Vue's modifiers on it.
// --------------------------------------------------------------------------

describe("a listener's event is of its own type, and its modifiers act on it", () => {
  /** KozmosDialog with a trigger drawn in place, from a Vue slot: the box's. */
  const dialog = (listeners: string, state: Record<string, unknown>) =>
    page(
      `<KozmosDialog ${listeners}><button type="button" data-probe>Open</button></KozmosDialog>`,
      state,
    );

  it("on the part: the native event where it is of the listener's type, React's where React makes it from another", async () => {
    const seen: Record<string, Event> = {};
    const listen = (name: string) => (event: Event) => (seen[name] = event);
    mount(() =>
      h(Bridge.KozmosInput, {
        "aria-label": "Field",
        modelValue: "",
        "onUpdate:modelValue": noop,
        onClick: listen("click"),
        onKeydown: listen("keydown"),
        onFocus: listen("focus"),
        onMouseenter: listen("mouseenter"),
        onChange: listen("change"),
        onFocusin: listen("focusin"),
      }),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    await settle();
    input.click();
    press(input, "a");
    input.focus();
    input.dispatchEvent(
      new MouseEvent("mouseover", {
        bubbles: true,
        relatedTarget: document.body,
      }),
    );
    type(input, "A");
    await settle();
    // The native event, of its own type.
    expect(seen.click).toBeInstanceOf(MouseEvent);
    expect(seen.keydown).toBeInstanceOf(KeyboardEvent);
    expect(seen.focusin).toBeInstanceOf(FocusEvent);
    // React's, which names its own type: React made it from focusin,
    // mouseover and input.
    expect(
      Object.fromEntries(
        ["click", "keydown", "focus", "mouseenter", "change", "focusin"].map(
          (name) => [name, seen[name]?.type],
        ),
      ),
    ).toEqual({
      click: "click",
      keydown: "keydown",
      focus: "focus",
      mouseenter: "mouseenter",
      change: "change",
      focusin: "focusin",
    });
    expect(seen.mouseenter.target).toBe(input);
  });

  it("@mouseenter and @mouseleave: outside, the label, the input, the label, outside", async () => {
    const seen: string[] = [];
    mount(() =>
      h(Bridge.KozmosInput, {
        label: "Name",
        onMouseenter: (event: Event) => seen.push(`enter(${event.type})`),
        onMouseleave: (event: Event) => seen.push(`leave(${event.type})`),
      }),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    const label = $<HTMLElement>("label")!;
    await settle();
    const move = (from: Element, to: Element) => {
      from.dispatchEvent(
        new MouseEvent("mouseout", { bubbles: true, relatedTarget: to }),
      );
      to.dispatchEvent(
        new MouseEvent("mouseover", { bubbles: true, relatedTarget: from }),
      );
    };
    move(document.body, label);
    seen.push("|label|");
    move(label, input);
    seen.push("|input|");
    move(input, label);
    seen.push("|label|");
    move(label, document.body);
    seen.push("|outside|");
    await settle();
    expect(seen.join(" ")).toBe(
      "|label| enter(mouseenter) |input| leave(mouseleave) |label| |outside|",
    );
  });

  it(".capture: currentTarget is the part's element, and .capture.self runs on a press of it", async () => {
    let current: unknown = null;
    const self = vi.fn();
    mount(
      page(
        `<KozmosInput aria-label="Field" @click.capture="capture" @click.capture.self="self" />`,
        { capture: (event: Event) => (current = event.currentTarget), self },
      ),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    await settle();
    input.click();
    await settle();
    expect(current).toBe(input);
    expect(self).toHaveBeenCalledTimes(1);
  });

  it.each(["gotpointercapture", "lostpointercapture"])(
    "@%s, and with .capture: the native PointerEvent, its own type",
    async (event) => {
      const seen: Event[] = [];
      const listen = (heard: Event) => seen.push(heard);
      mount(
        page(
          `<KozmosInput aria-label="Field" @${event}="listen" @${event}.capture="listen" />`,
          { listen },
        ),
      );
      const input = await until(() => $<HTMLInputElement>("input"));
      await settle();
      input.dispatchEvent(new PointerEvent(event, { bubbles: true }));
      await settle();
      expect(seen).toHaveLength(2);
      for (const heard of seen) {
        expect(heard).toBeInstanceOf(PointerEvent);
        expect(heard.type).toBe(event);
      }
    },
  );

  it("on the box, an event that does not bubble is heard from what the part draws in place: @focus, @blur and @scroll", async () => {
    const seen: string[] = [];
    const listen = (event: Event) => seen.push(event.type);
    mount(
      page(
        `<KozmosDialog @focus="listen" @blur="listen" @scroll="listen"><button type="button" data-probe>Open</button><div data-scroller style="overflow: auto">Long</div></KozmosDialog>`,
        { listen },
      ),
    );
    const trigger = await until(() => $<HTMLElement>("[data-probe]"));
    await settle();
    trigger.focus();
    trigger.blur();
    $<HTMLElement>("[data-scroller]")!.dispatchEvent(new Event("scroll"));
    await settle();
    expect(seen).toEqual(["focus", "blur", "scroll"]);
  });

  it("on the box: the native event, as Vue gives a listener on an element", async () => {
    const seen: Event[] = [];
    const listen = (event: Event) => seen.push(event);
    mount(dialog(`@click="listen" @keydown="listen"`, { listen }));
    const trigger = await until(() => $<HTMLElement>("[data-probe]"));
    await settle();
    trigger.click();
    press(trigger, "a");
    await settle();
    expect(seen).toHaveLength(2);
    expect(seen[0]).toBeInstanceOf(MouseEvent);
    expect(seen[1]).toBeInstanceOf(KeyboardEvent);
    expect(seen[0].target).toBe(trigger);
  });

  it(".stop and .prevent on the box's path", async () => {
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

  it(".self is the element the part gives the listener to, and currentTarget is restored after", async () => {
    const self = vi.fn();
    mount(
      page(`<KozmosInput aria-label="Field" @click.self="self" />`, { self }),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    await settle();
    input.click();
    await settle();
    expect(self).toHaveBeenCalledTimes(1);
    expect(self.mock.calls[0][0].target).toBe(input);
    expect(self.mock.calls[0][0].currentTarget).toBe(null);
  });

  it(".capture on the box runs on the way down, before the target's own listener", async () => {
    const order: string[] = [];
    mount(
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
  });
});

// --------------------------------------------------------------------------
// A part's own callback named like a DOM event is the part's: its types
// declare it, so it takes it.
// --------------------------------------------------------------------------

describe("a part's callback named like a DOM event", () => {
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

  it("SearchBar's @change is its text, once a keystroke", async () => {
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

  it("CategoryTile's @select is its id; its @click, which it does not take, the box's", async () => {
    const selected = vi.fn();
    const clicked = vi.fn();
    mount(() =>
      h(Bridge.KozmosCategoryTile, {
        category: tile,
        icon: e("span"),
        onSelect: selected,
        onClick: clicked,
      }),
    );
    const button = await until(() => $<HTMLElement>("button"));
    await settle();
    button.click();
    await settle();
    expect(selected.mock.calls).toEqual([["shopping"]]);
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(clicked.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
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
