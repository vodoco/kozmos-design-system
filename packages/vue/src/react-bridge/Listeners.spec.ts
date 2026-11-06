// @vitest-environment jsdom
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, ref, type Component } from "vue";
import ts from "typescript";
import * as Bridge from "./index";
import {
  NATIVE_DOM_EVENTS,
  REACT_CAPTURELESS_EVENTS,
  REACT_DOM_EVENTS,
  routeListener,
} from "./react-adapter";
import {
  $,
  heard,
  mount,
  press,
  settle,
  type,
  unmount,
  until,
} from "../../test/react-bridge-harness";

// Listeners through the React bridge (react-adapter.ts). Vue names `@keydown`
// `onKeydown` and `@dblclick` `onDblclick`; React knows only `onKeyDown` and
// `onDoubleClick`, and dropped the others ("Invalid event handler property
// onKeydown"). Before the wrapper's attributes were React's alone, Vue also
// bound each listener natively on the wrapper's own box, so those fired
// there, and a `@click` fired twice. Now each listener is routed by its
// name: a DOM event React synthesises to React, by React's name; focusin,
// focusout, `.passive` and React's capture-less events to the box; and any
// other name, a React callback of the part or a custom DOM event, to both,
// where only one of the two can ever hear it.

/** A template, compiled at runtime as an SFC's is at build. */
const page = (template: string, state: Record<string, unknown> = {}) =>
  defineComponent({
    components: Bridge as Record<string, Component>,
    setup: () => state,
    template,
  });

// --------------------------------------------------------------------------
// React DOM's events, as @types/react declares them.
// --------------------------------------------------------------------------

describe("React DOM's events", () => {
  /** `DOMAttributes`' keys, as the adapter's own import of React reads them. */
  function domAttributes() {
    const file = path.join(__dirname, "react-dom-events.probe.ts");
    const text = `import type { DOMAttributes } from "react";\nexport type Keys = keyof DOMAttributes<Element>;\n`;
    const options: ts.CompilerOptions = {
      moduleResolution: ts.ModuleResolutionKind.Node10,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
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

  it("names each DOM event once, and none React also takes natively", () => {
    const dom = Object.values(REACT_DOM_EVENTS);
    expect(new Set(dom).size).toBe(dom.length);
    for (const event of NATIVE_DOM_EVENTS) expect(dom).not.toContain(event);
  });
});

// --------------------------------------------------------------------------
// Where each spelling of a listener goes.
// --------------------------------------------------------------------------

describe("routeListener", () => {
  it.each([
    // A DOM event React synthesises: React's name, from Vue's or React's.
    ["onClick", "onClick", null, false],
    ["onKeydown", "onKeyDown", null, false],
    ["onKeyDown", "onKeyDown", null, false],
    ["onDblclick", "onDoubleClick", null, false],
    ["onContextmenu", "onContextMenu", null, false],
    ["onPointerdown", "onPointerDown", null, false],
    ["onMouseenter", "onMouseEnter", null, false],
    ["onGotpointercapture", "onGotPointerCapture", null, false],
    // `.capture` is React's capture variant; `.once` runs once.
    ["onClickCapture", "onClickCapture", null, false],
    ["onKeydownCapture", "onKeyDownCapture", null, false],
    ["onGotPointerCaptureCapture", "onGotPointerCaptureCapture", null, false],
    ["onClickOnce", "onClick", null, true],
    ["onKeydownCaptureOnce", "onKeyDownCapture", null, true],
    // `.passive`, and capture on an event React has no capture for: native.
    ["onTouchstartPassive", null, "onTouchstartPassive", false],
    ["onWheelCapturePassive", null, "onWheelCapturePassive", false],
    ["onMouseenterCapture", null, "onMouseenterCapture", false],
    // DOM events React does not synthesise: native, by their DOM name.
    ["onFocusin", null, "onFocusin", false],
    ["onFocusIn", null, "onFocusin", false],
    ["onFocusoutOnce", null, "onFocusoutOnce", false],
    ["on:my-event", null, "on:my-event", false],
    // Any other name: a React callback of the part, or a custom DOM event.
    ["onClose", "onClose", "onClose", false],
    ["onPoiClick", "onPoiClick", "onPoiClick", false],
    ["onValueChange", "onValueChange", "onValueChange", false],
    ["onPoiClickOnce", "onPoiClick", "onPoiClickOnce", true],
    // `.capture` and `.passive` only a DOM event has.
    ["onKozmosPingCapture", null, "onKozmosPingCapture", false],
  ] as const)(
    "%s: React %s, native %s, once %s",
    (key, react, native, once) => {
      expect(routeListener(key)).toEqual({ react, native, once });
    },
  );
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
