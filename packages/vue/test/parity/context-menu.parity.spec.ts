// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import * as KozmosReact from "@kozmos-ds/react";
import { h, ref } from "vue";
import {
  KozmosContextMenu,
  KozmosContextMenuCheckboxItem,
  KozmosContextMenuContent,
  KozmosContextMenuGroup,
  KozmosContextMenuItem,
  KozmosContextMenuLabel,
  KozmosContextMenuPortal,
  KozmosContextMenuRadioGroup,
  KozmosContextMenuRadioItem,
  KozmosContextMenuSeparator,
  KozmosContextMenuShortcut,
  KozmosContextMenuSub,
  KozmosContextMenuSubContent,
  KozmosContextMenuSubTrigger,
  KozmosContextMenuTrigger,
  KozmosMenu,
  KozmosMenuContent,
  KozmosMenuItem,
  KozmosMenuTrigger,
  KozmosText,
} from "../../src/index";
import {
  inBoth,
  trees,
  type MenuParts,
  type MenuSpec,
  type Step,
} from "./menus";
import {
  e,
  key,
  mountReact,
  mountVue,
  press,
  serverBoth,
  settle,
  useOverlayPage,
} from "./overlays";

/**
 * ContextMenu and its fourteen parts (GAP-155), drawn in both from one
 * description (`menus.ts`), open as a right click opens it: Menu's panel and
 * rows, at the point; the keyboard's context-menu key and Shift+F10 at the
 * focused item's inline start and block end (right to left too, and in a
 * `dir="auto"` the browser resolves right to left), and no other key; no
 * opening when disabled or when the app handled the key; a long press on
 * touch; the browser's own menu kept shut over it; Menu's keys, submenus
 * and items; `@open-change`; the panels' events; the page made inert while
 * it is modal; and its stories, closed and open.
 */

const PARTS: MenuParts = {
  Root: [KozmosReact.ContextMenu, KozmosContextMenu],
  Trigger: [KozmosReact.ContextMenuTrigger, KozmosContextMenuTrigger],
  Content: [KozmosReact.ContextMenuContent, KozmosContextMenuContent],
  Portal: [KozmosReact.ContextMenuPortal, KozmosContextMenuPortal],
  Item: [KozmosReact.ContextMenuItem, KozmosContextMenuItem],
  CheckboxItem: [
    KozmosReact.ContextMenuCheckboxItem,
    KozmosContextMenuCheckboxItem,
  ],
  RadioGroup: [KozmosReact.ContextMenuRadioGroup, KozmosContextMenuRadioGroup],
  RadioItem: [KozmosReact.ContextMenuRadioItem, KozmosContextMenuRadioItem],
  Group: [KozmosReact.ContextMenuGroup, KozmosContextMenuGroup],
  Label: [KozmosReact.ContextMenuLabel, KozmosContextMenuLabel],
  Separator: [KozmosReact.ContextMenuSeparator, KozmosContextMenuSeparator],
  Shortcut: [KozmosReact.ContextMenuShortcut, KozmosContextMenuShortcut],
  Sub: [KozmosReact.ContextMenuSub, KozmosContextMenuSub],
  SubTrigger: [KozmosReact.ContextMenuSubTrigger, KozmosContextMenuSubTrigger],
  SubContent: [KozmosReact.ContextMenuSubContent, KozmosContextMenuSubContent],
};

useOverlayPage();

const draw =
  (spec: MenuSpec, heard?: Parameters<typeof trees>[3]) =>
  (hear: Parameters<typeof trees>[2]) =>
    trees(PARTS, spec, hear, { rootModel: false, ...heard });

const area = () =>
  [...document.querySelectorAll<HTMLElement>("span")].find(
    (span) => span.textContent === "Open",
  )!;
const at = () => document.activeElement ?? document.body;
const rightClick = (x = 30, y = 40): Step => ({
  name: `right click at ${x}, ${y}`,
  act: () =>
    area().dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
      }),
    ),
});
const pressKey = (name: string): Step => ({
  name,
  act: () => key(at(), name),
});
const row = (words: string) =>
  [...document.querySelectorAll<HTMLElement>('[role^="menuitem"]')].find(
    (item) => item.textContent?.trim().startsWith(words),
  )!;
const where = () => {
  const wrapper = document.querySelector<HTMLElement>(
    "[data-radix-popper-content-wrapper], [data-reka-popper-content-wrapper]",
  );
  return wrapper?.style.transform ?? "none";
};

const nodes: MenuSpec["nodes"] = [
  { label: "Feature actions" },
  { item: "Copy", shortcut: "⌘C" },
  { item: "Paste", shortcut: "⌘V" },
  { separator: true },
  {
    sub: "Move to level",
    items: [{ item: "Level 1" }, { item: "Level 2" }],
  },
  {
    item: "Documentation",
    props: { external: true },
    link: { href: "https://docs.pointr.tech" },
  },
];

describe("KozmosContextMenu behaves as React's ContextMenu", () => {
  it("opens on a right click at the pointer, an item is chosen and it closes; Menu's keys and submenu", async () => {
    const seen = await inBoth(
      draw({ page: true, nodes }, { root: ["openChange"], subOpen: true }),
      [
        { ...rightClick(), dom: true },
        { name: "placed", act: () => {}, dom: false },
        pressKey("ArrowDown"),
        pressKey("ArrowDown"),
        pressKey("m"),
        { ...pressKey("ArrowRight"), dom: true },
        pressKey("ArrowLeft"),
        { name: "press Copy", act: () => press(row("Copy")) },
        rightClick(60, 80),
        pressKey("Escape"),
      ],
    );
    expect((seen.react.at(-1) as { log: string[] }).log).toEqual([
      "root:openChange true",
      "sub:openChange true",
      "sub:openChange false",
      "select:Copy",
      "root:openChange false",
      "root:openChange true",
      "root:openChange false",
    ]);
    expect(seen.vue).toEqual(seen.react);
    // Menu_item_selected, as React's, under ContextMenu's name.
    expect(seen.events.vue).toEqual(seen.events.react);
  });

  it("is placed at the point it was opened at", async () => {
    const placed: string[] = [];
    for (const mount of ["react", "vue"] as const) {
      const tree = draw({ nodes })(() => () => {});
      if (mount === "react") await mountReact(tree.react);
      else await mountVue(tree.vue);
      const open = rightClick(120, 64).act;
      if (mount === "react") await act(async () => void open());
      else open();
      await settle();
      placed.push(where());
    }
    expect(placed[0]).toMatch(/^translate\(\d+px, 64px\)$/);
    expect(placed[1]).toBe(placed[0]);
  });

  it.each([
    ["the context-menu key", { key: "ContextMenu" }],
    ["Shift+F10", { key: "F10", shiftKey: true }],
  ])(
    "opens from %s at the item that has focus, its inline start and block end, and the key does nothing more",
    async (_, init) => {
      const seen: string[] = [];
      for (const mount of ["react", "vue"] as const)
        for (const dir of ["ltr", "rtl", "auto"]) {
          const heard: number[][] = [];
          const onContextmenu = (event: MouseEvent) =>
            heard.push([event.clientX, event.clientY]);
          const item = (props: Record<string, unknown>) =>
            mount === "react"
              ? e(
                  "div",
                  { role: "treeitem", tabIndex: 0, ...props },
                  "Gate A12",
                )
              : h(
                  "div",
                  { role: "treeitem", tabindex: 0, ...props },
                  "Gate A12",
                );
          const reactTree = () =>
            e(
              "div",
              { dir },
              e(
                KozmosReact.ContextMenu,
                null,
                e(
                  KozmosReact.ContextMenuTrigger,
                  { onContextMenu: onContextmenu },
                  item({}),
                ),
                e(
                  KozmosReact.ContextMenuContent,
                  null,
                  e(KozmosReact.ContextMenuItem, null, "Copy"),
                ),
              ),
            );
          const vueTree = () =>
            h("div", { dir }, [
              h(KozmosContextMenu, null, () => [
                h(KozmosContextMenuTrigger, { onContextmenu }, () => item({})),
                h(KozmosContextMenuContent, null, () =>
                  h(KozmosContextMenuItem, null, () => "Copy"),
                ),
              ]),
            ]);
          if (mount === "react") await mountReact(reactTree);
          else await mountVue(vueTree);
          const target =
            document.querySelector<HTMLElement>('[role="treeitem"]')!;
          target.getBoundingClientRect = () =>
            DOMRect.fromRect({ x: 40, y: 100, width: 200, height: 32 });
          // The browser resolves "auto" from the text; jsdom doesn't.
          const computed = window.getComputedStyle;
          const spy = vi
            .spyOn(window, "getComputedStyle")
            .mockImplementation((element, pseudo) => {
              const style = computed(element, pseudo);
              return element === target && dir === "auto"
                ? ({ ...style, direction: "rtl" } as CSSStyleDeclaration)
                : style;
            });
          target.focus();
          let event!: KeyboardEvent;
          try {
            const fire = () => {
              event = new KeyboardEvent("keydown", {
                bubbles: true,
                cancelable: true,
                ...init,
              });
              target.dispatchEvent(event);
            };
            if (mount === "react") await act(async () => fire());
            else fire();
            await settle();
          } finally {
            spy.mockRestore();
          }
          seen.push(
            `${mount === "react" ? "" : ""}${dir}: prevented ${event.defaultPrevented}, at ${JSON.stringify(heard)}, open ${!!document.querySelector('[role="menu"]')}`,
          );
        }
      expect(seen.slice(0, 3)).toEqual([
        "ltr: prevented true, at [[40,132]], open true",
        "rtl: prevented true, at [[240,132]], open true",
        "auto: prevented true, at [[240,132]], open true",
      ]);
      expect(seen.slice(3)).toEqual(seen.slice(0, 3));
    },
  );

  it("leaves other keys, and F10 without Shift, alone; opens nothing when disabled or when the app handled the key", async () => {
    const seen: string[][] = [];
    for (const mount of ["react", "vue"] as const) {
      const out: string[] = [];
      for (const [props, vueProps] of [
        [{}, {}],
        [{ disabled: true }, { disabled: true }],
        [
          { onKeyDown: (event: React.KeyboardEvent) => event.preventDefault() },
          { onKeydown: (event: KeyboardEvent) => event.preventDefault() },
        ],
      ] as const) {
        const tree =
          mount === "react"
            ? () =>
                e(
                  KozmosReact.ContextMenu,
                  null,
                  e(
                    KozmosReact.ContextMenuTrigger,
                    props,
                    e("div", { tabIndex: 0, id: "gate" }, "Gate A12"),
                  ),
                  e(
                    KozmosReact.ContextMenuContent,
                    null,
                    e(KozmosReact.ContextMenuItem, null, "Copy"),
                  ),
                )
            : () =>
                h(KozmosContextMenu, null, () => [
                  h(KozmosContextMenuTrigger, vueProps, () =>
                    h("div", { tabindex: 0, id: "gate" }, "Gate A12"),
                  ),
                  h(KozmosContextMenuContent, null, () =>
                    h(KozmosContextMenuItem, null, () => "Copy"),
                  ),
                ]);
        if (mount === "react") await mountReact(tree);
        else await mountVue(tree);
        const gate = document.getElementById("gate")!;
        for (const init of [
          { key: "F10" },
          { key: "F10", shiftKey: true, ctrlKey: true },
          { key: "Enter" },
          { key: "m" },
          { key: "ContextMenu" },
        ]) {
          const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            ...init,
          });
          if (mount === "react")
            await act(async () => void gate.dispatchEvent(event));
          else gate.dispatchEvent(event);
          await settle();
          out.push(
            `${JSON.stringify(init)} ${event.defaultPrevented} ${!!document.querySelector('[role="menu"]')}`,
          );
        }
      }
      seen.push(out);
    }
    expect(seen[0].slice(0, 5)).toEqual([
      '{"key":"F10"} false false',
      '{"key":"F10","shiftKey":true,"ctrlKey":true} false false',
      '{"key":"Enter"} false false',
      '{"key":"m"} false false',
      '{"key":"ContextMenu"} true true',
    ]);
    expect(seen[1]).toEqual(seen[0]);
  });

  it("cancels the contextmenu event the menu key's keyup fires in the open menu, so the browser's menu stays shut", async () => {
    const seen: string[] = [];
    for (const mount of ["react", "vue"] as const) {
      const tree = draw({ nodes })(() => () => {});
      if (mount === "react") await mountReact(tree.react);
      else await mountVue(tree.vue);
      const open = rightClick().act;
      if (mount === "react") await act(async () => void open());
      else open();
      await settle();
      const focused = document.activeElement!;
      const event = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      focused.dispatchEvent(event);
      await settle();
      seen.push(
        `${!!focused.closest('[role="menu"]')} ${event.defaultPrevented} ${!!document.querySelector('[role="menu"]')}`,
      );
    }
    expect(seen).toEqual(["true true true", "true true true"]);
  });

  it("opens on a long press on touch", async () => {
    const seen: boolean[] = [];
    for (const mount of ["react", "vue"] as const) {
      const tree = draw({ nodes })(() => () => {});
      if (mount === "react") await mountReact(tree.react);
      else await mountVue(tree.vue);
      vi.useFakeTimers();
      try {
        const down = () =>
          area().dispatchEvent(
            new PointerEvent("pointerdown", {
              bubbles: true,
              pointerType: "touch",
            }),
          );
        if (mount === "react") act(() => void down());
        else down();
        if (mount === "react") act(() => void vi.advanceTimersByTime(700));
        else vi.advanceTimersByTime(700);
      } finally {
        vi.useRealTimers();
      }
      await settle();
      seen.push(!!document.querySelector('[role="menu"]'));
    }
    expect(seen).toEqual([true, true]);
  });

  it("draws Menu's panel and rows", async () => {
    const classes: string[][] = [];
    for (const mount of ["react", "vue"] as const) {
      const tree = draw({ nodes: [{ item: "Copy" }] })(() => () => {});
      if (mount === "react") await mountReact(tree.react);
      else await mountVue(tree.vue);
      const open = rightClick().act;
      if (mount === "react") await act(async () => void open());
      else open();
      await settle();
      const panel = document.querySelector('[role="menu"]')!;
      classes.push([panel.className, row("Copy").className]);
    }
    await mountVue(() =>
      h(KozmosMenu, { defaultOpen: true }, () => [
        h(KozmosMenuTrigger, null, () => "Open"),
        h(KozmosMenuContent, null, () =>
          h(KozmosMenuItem, null, () => "Rename"),
        ),
      ]),
    );
    const menu = [
      document.querySelector('[role="menu"]')!.className,
      row("Rename").className,
    ];
    expect(classes[1]).toEqual(classes[0]);
    expect(classes[1]).toEqual(menu);
  });

  it("makes the page inert while it is open, as Menu does, and gives it back; not modal, nothing", async () => {
    for (const modal of [true, false]) {
      const seen = await inBoth(draw({ page: true, root: { modal }, nodes }), [
        rightClick(),
        pressKey("Escape"),
      ]);
      expect((seen.react[0] as { inert: boolean }).inert).toBe(modal);
      expect((seen.react[1] as { inert: boolean }).inert).toBe(false);
      expect(seen.vue).toEqual(seen.react);
    }
  });

  it("checkbox and radio items, and the panels' events", async () => {
    const seen = await inBoth(
      draw(
        {
          page: true,
          root: { modal: false },
          nodes: [
            { checkbox: "Show grid" },
            {
              radio: [
                ["map", "Map"],
                ["list", "List"],
              ],
              value: "map",
            },
            { sub: "More", items: [{ item: "Deep" }] },
          ],
        },
        {
          content: [
            "escapeKeyDown",
            "pointerDownOutside",
            "focusOutside",
            "interactOutside",
            "closeAutoFocus",
          ],
          sub: ["escapeKeyDown"],
        },
      ),
      [
        rightClick(),
        { name: "press Show grid", act: () => press(row("Show grid")) },
        rightClick(),
        { name: "press List", act: () => press(row("List")) },
        rightClick(),
        pressKey("Escape"),
        rightClick(),
        {
          name: "press outside",
          act: () => press(document.getElementById("host")!),
        },
        rightClick(),
        pressKey("End"),
        pressKey("ArrowRight"),
        pressKey("Escape"),
        rightClick(),
        {
          name: "focus outside",
          act: () => document.getElementById("undo")!.focus(),
        },
      ],
    );
    expect(seen.vue).toEqual(seen.react);
  });
});

describe("every event fires as React's callback", () => {
  it("@open-change, the panels' events, select, v-model:checked, v-model and a submenu's v-model:open", async () => {
    const seen: Record<string, string[]> = { react: [], vue: [] };
    const open = () =>
      document
        .getElementById("area")!
        .dispatchEvent(
          new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
        );
    const steps = [
      open,
      () => press(row("Rename")),
      open,
      () => press(row("Show grid")),
      open,
      () => press(row("List")),
      open,
      () => void key(at(), "End"),
      () => void key(at(), "ArrowRight"),
      () => press(document.getElementById("host")!),
      open,
      () => void key(at(), "End"),
      () => void key(at(), "ArrowRight"),
      () => void key(at(), "Escape"),
      open,
      () => void key(at(), "Escape"),
      open,
      () => document.getElementById("host")!.focus(),
    ];
    for (const side of ["react", "vue"] as const) {
      const log = seen[side];
      const hear = (name: string) => (payload?: unknown) =>
        log.push(
          payload instanceof Event || payload === undefined
            ? name
            : `${name} ${JSON.stringify(payload)}`,
        );
      if (side === "react") {
        function Tree() {
          const [checked, setChecked] = React.useState(false);
          const [value, setValue] = React.useState("map");
          return e(
            React.Fragment,
            null,
            e("button", { type: "button", id: "host" }, "Host"),
            e(
              KozmosReact.ContextMenu,
              { modal: false, onOpenChange: hear("open") },
              e(
                KozmosReact.ContextMenuTrigger,
                null,
                e("div", { id: "area", tabIndex: 0 }, "Area"),
              ),
              e(
                KozmosReact.ContextMenuContent,
                {
                  onCloseAutoFocus: hear("closeAutoFocus"),
                  onEscapeKeyDown: hear("escapeKeyDown"),
                  onPointerDownOutside: hear("pointerDownOutside"),
                  onFocusOutside: hear("focusOutside"),
                  onInteractOutside: hear("interactOutside"),
                },
                e(
                  KozmosReact.ContextMenuItem,
                  { onSelect: hear("select") },
                  "Rename",
                ),
                e(
                  KozmosReact.ContextMenuCheckboxItem,
                  {
                    checked,
                    onCheckedChange: (next: boolean) => {
                      hear("checked")(next);
                      setChecked(next);
                    },
                    onSelect: hear("select checkbox"),
                  },
                  "Show grid",
                ),
                e(
                  KozmosReact.ContextMenuRadioGroup,
                  {
                    value,
                    onValueChange: (next: string) => {
                      hear("value")(next);
                      setValue(next);
                    },
                  },
                  e(
                    KozmosReact.ContextMenuRadioItem,
                    { value: "map", onSelect: hear("select map") },
                    "Map",
                  ),
                  e(
                    KozmosReact.ContextMenuRadioItem,
                    { value: "list", onSelect: hear("select list") },
                    "List",
                  ),
                ),
                e(
                  KozmosReact.ContextMenuSub,
                  { onOpenChange: hear("sub open") },
                  e(KozmosReact.ContextMenuSubTrigger, null, "More"),
                  e(
                    KozmosReact.ContextMenuSubContent,
                    {
                      onEscapeKeyDown: hear("sub escapeKeyDown"),
                      onPointerDownOutside: hear("sub pointerDownOutside"),
                      onFocusOutside: hear("sub focusOutside"),
                      onInteractOutside: hear("sub interactOutside"),
                    },
                    e(KozmosReact.ContextMenuItem, null, "Deep"),
                  ),
                ),
              ),
            ),
          );
        }
        await mountReact(Tree);
      } else {
        const checked = ref(false);
        const value = ref("map");
        await mountVue(() => [
          h("button", { type: "button", id: "host" }, "Host"),
          h(
            KozmosContextMenu,
            { modal: false, onOpenChange: hear("open") },
            () => [
              h(KozmosContextMenuTrigger, null, () =>
                h("div", { id: "area", tabindex: 0 }, "Area"),
              ),
              h(
                KozmosContextMenuContent,
                {
                  onCloseAutoFocus: hear("closeAutoFocus"),
                  onEscapeKeyDown: hear("escapeKeyDown"),
                  onPointerDownOutside: hear("pointerDownOutside"),
                  onFocusOutside: hear("focusOutside"),
                  onInteractOutside: hear("interactOutside"),
                },
                () => [
                  h(
                    KozmosContextMenuItem,
                    { onSelect: hear("select") },
                    () => "Rename",
                  ),
                  h(
                    KozmosContextMenuCheckboxItem,
                    {
                      checked: checked.value,
                      "onUpdate:checked": (next: boolean) => {
                        hear("checked")(next);
                        checked.value = next;
                      },
                      onSelect: hear("select checkbox"),
                    },
                    () => "Show grid",
                  ),
                  h(
                    KozmosContextMenuRadioGroup,
                    {
                      modelValue: value.value,
                      "onUpdate:modelValue": (next: string) => {
                        hear("value")(next);
                        value.value = next;
                      },
                    },
                    () => [
                      h(
                        KozmosContextMenuRadioItem,
                        { value: "map", onSelect: hear("select map") },
                        () => "Map",
                      ),
                      h(
                        KozmosContextMenuRadioItem,
                        { value: "list", onSelect: hear("select list") },
                        () => "List",
                      ),
                    ],
                  ),
                  h(
                    KozmosContextMenuSub,
                    { "onUpdate:open": hear("sub open") },
                    () => [
                      h(KozmosContextMenuSubTrigger, null, () => "More"),
                      h(
                        KozmosContextMenuSubContent,
                        {
                          onEscapeKeyDown: hear("sub escapeKeyDown"),
                          onPointerDownOutside: hear("sub pointerDownOutside"),
                          onFocusOutside: hear("sub focusOutside"),
                          onInteractOutside: hear("sub interactOutside"),
                        },
                        () => h(KozmosContextMenuItem, null, () => "Deep"),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ]);
      }
      for (const step of steps) {
        if (side === "react") await act(async () => void (await step()));
        else await step();
        await settle();
        await settle();
      }
    }
    for (const event of [
      "open true",
      "open false",
      "select",
      "closeAutoFocus",
      "checked true",
      'value "list"',
      "sub open true",
      "pointerDownOutside",
      "interactOutside",
      "sub escapeKeyDown",
      "escapeKeyDown",
      "focusOutside",
    ])
      expect(seen.react).toContain(event);
    expect(seen.vue).toEqual(seen.react);
  });
});

// Last: a server render leaves Reka's shared keyboard tracker deaf in this
// module (menu.parity.spec.ts says why).
describe("ContextMenu's stories, drawn in both", () => {
  const area = (mount: "react" | "vue") =>
    mount === "react"
      ? e(
          "div",
          {
            tabIndex: 0,
            "aria-label": "Gate A12, map feature",
            className:
              "flex h-40 w-72 items-center justify-center rounded-control border border-dashed border-border focus:outline-none focus:ring-2 focus:ring-ring",
          },
          e(
            KozmosReact.Text,
            { size: "sm", color: "muted" },
            "Right click, or long press, here",
          ),
        )
      : h(
          "div",
          {
            tabindex: 0,
            "aria-label": "Gate A12, map feature",
            class:
              "flex h-40 w-72 items-center justify-center rounded-control border border-dashed border-border focus:outline-none focus:ring-2 focus:ring-ring",
          },
          [
            h(
              KozmosText,
              { size: "sm", color: "muted" },
              () => "Right click, or long press, here",
            ),
          ],
        );
  const story = (mount: "react" | "vue", modal = true) => {
    const tree = trees(
      PARTS,
      {
        root: { modal },
        triggerElement: { react: () => area("react"), vue: () => area("vue") },
        nodes,
      },
      () => () => {},
      { rootModel: false },
    );
    return mount === "react" ? tree.react() : tree.vue();
  };

  it("Default: closed, as a server draws it, and open from a right click", async () => {
    const closed = await serverBoth(
      story("react"),
      () => story("vue") as never,
    );
    expect(closed.vue).toBe(closed.react);
  });

  it("Open: opened at 24 into the area, not modal", async () => {
    const drawn: string[] = [];
    for (const mount of ["react", "vue"] as const) {
      if (mount === "react") await mountReact(story("react", false));
      else await mountVue(() => story("vue", false) as never);
      const target = document.querySelector<HTMLElement>(
        '[aria-label="Gate A12, map feature"]',
      )!;
      const fire = () =>
        target.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 24,
            clientY: 24,
          }),
        );
      if (mount === "react") await act(async () => void fire());
      else fire();
      await settle();
      drawn.push(
        document.body.innerHTML.includes('role="menu"') ? "open" : "shut",
      );
    }
    expect(drawn).toEqual(["open", "open"]);
  });
});
