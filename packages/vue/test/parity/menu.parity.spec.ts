// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import * as KozmosReact from "@kozmos-ds/react";
import { h, ref } from "vue";
import {
  KozmosButton,
  KozmosDialog,
  KozmosDialogContent,
  KozmosDialogDescription,
  KozmosDialogTitle,
  KozmosMenu,
  KozmosMenuCheckboxItem,
  KozmosMenuContent,
  KozmosMenuGroup,
  KozmosMenuItem,
  KozmosMenuLabel,
  KozmosMenuPortal,
  KozmosMenuRadioGroup,
  KozmosMenuRadioItem,
  KozmosMenuSeparator,
  KozmosMenuShortcut,
  KozmosMenuSub,
  KozmosMenuSubContent,
  KozmosMenuSubTrigger,
  KozmosMenuTrigger,
  KozmosThemeProvider,
} from "../../src/index";
import {
  inBoth,
  openBeside,
  trees,
  type MenuParts,
  type MenuSpec,
  type Step,
} from "./menus";
import {
  body,
  button,
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
 * Menu and its fourteen parts, which every React story draws by hand, drawn
 * in both from one description (`menus.ts`): each story closed, as a server
 * renders it, and open, mounted; then, mounted, what Radix's DropdownMenu
 * does and Reka's is held to (Menu/menuParts.ts): the trigger opening on
 * the pointer's press without taking focus, and from Enter, Space and
 * ArrowDown; the arrows, Home, End, PageUp and PageDown among enabled rows,
 * with and without `loop`; type-ahead past disabled rows, by `text-value`,
 * Space while typing ahead; a submenu opened by ArrowRight and closed by
 * ArrowLeft, mirrored right to left, and by the pointer resting on its row;
 * select's preventDefault keeping the menu open; the checkbox and radio
 * items' v-model:checked and v-model; focus back to the trigger; the
 * panels' events; the page made inert by a modal menu (GAP-193); external
 * items (decision 152); `menu_item_selected`; and a native Menu in a native
 * Dialog, whose item press closes the menu and leaves the Dialog open.
 */

const PARTS: MenuParts = {
  Root: [KozmosReact.Menu, KozmosMenu],
  Trigger: [KozmosReact.MenuTrigger, KozmosMenuTrigger],
  Content: [KozmosReact.MenuContent, KozmosMenuContent],
  Portal: [KozmosReact.MenuPortal, KozmosMenuPortal],
  Item: [KozmosReact.MenuItem, KozmosMenuItem],
  CheckboxItem: [KozmosReact.MenuCheckboxItem, KozmosMenuCheckboxItem],
  RadioGroup: [KozmosReact.MenuRadioGroup, KozmosMenuRadioGroup],
  RadioItem: [KozmosReact.MenuRadioItem, KozmosMenuRadioItem],
  Group: [KozmosReact.MenuGroup, KozmosMenuGroup],
  Label: [KozmosReact.MenuLabel, KozmosMenuLabel],
  Separator: [KozmosReact.MenuSeparator, KozmosMenuSeparator],
  Shortcut: [KozmosReact.MenuShortcut, KozmosMenuShortcut],
  Sub: [KozmosReact.MenuSub, KozmosMenuSub],
  SubTrigger: [KozmosReact.MenuSubTrigger, KozmosMenuSubTrigger],
  SubContent: [KozmosReact.MenuSubContent, KozmosMenuSubContent],
};
const BUTTON: [typeof KozmosReact.Button, typeof KozmosButton] = [
  KozmosReact.Button,
  KozmosButton,
];

useOverlayPage();

const draw =
  (spec: MenuSpec, heard?: Parameters<typeof trees>[3]) =>
  (hear: Parameters<typeof trees>[2]) =>
    trees(PARTS, spec, hear, heard);
const server = async (spec: MenuSpec) => {
  const tree = trees(PARTS, spec, () => () => {});
  return serverBoth(tree.react(), tree.vue);
};
const mounted = async (spec: MenuSpec) => {
  const tree = trees(PARTS, spec, () => () => {});
  const react = await mountReact(tree.react);
  const vue = await mountVue(tree.vue);
  return { react, vue };
};

const at = () => document.activeElement ?? document.body;
const pressKey = (name: string): Step => ({
  name,
  act: () => key(at(), name),
});
const pressTrigger: Step = {
  name: "press the trigger",
  act: () => press(button("Open")!),
};
/**
 * The trigger's Enter. A press opens a menu that is not modal and then, in
 * jsdom, closes it: the press's mousedown focuses the trigger, outside the
 * menu, where a browser fires no mousedown after the pointerdown the
 * trigger prevented.
 */
const enterTrigger: Step = {
  name: "Enter on the trigger",
  act: () => {
    button("Open")!.focus();
    return key(button("Open")!, "Enter");
  },
};
const row = (words: string) =>
  [...document.querySelectorAll<HTMLElement>('[role^="menuitem"]')].find(
    (item) => item.textContent?.trim().startsWith(words),
  )!;
const pressRow = (words: string): Step => ({
  name: `press ${words}`,
  act: () => press(row(words)),
});

// The stories, as React's draws them.
const outline = { variant: "outline" };
const defaultStory: MenuSpec = {
  trigger: {},
  triggerChild: BUTTON,
  triggerWords: "Open Menu",
  nodes: [
    { label: "My Account" },
    { separator: true },
    { item: "Profile" },
    { item: "Billing" },
    { item: "Team" },
    { item: "Subscription" },
  ],
};
const accountItems: MenuSpec["nodes"] = [
  { item: "Settings" },
  {
    item: "Documentation",
    props: { external: true },
    link: { href: "https://docs.pointr.tech" },
  },
  { separator: true },
  { item: "Sign out" },
];

// Every part, with its props, an app's attributes and a submenu.
const everything: MenuSpec = {
  page: true,
  content: { className: "w-56", "data-app": "panel" },
  nodes: [
    { label: "Account", props: { inset: true, "data-app": "label" } },
    { item: "Rename", shortcut: "⌘R", props: { "data-app": "item" } },
    { item: "Duplicate", props: { inset: true } },
    { item: "Archive", props: { disabled: true } },
    { item: "Cherry", props: { textValue: "Cherry" } },
    {
      item: "Documentation",
      props: { external: true, externalLabel: "öffnet in einem neuen Tab" },
    },
    { separator: true, props: { "data-app": "separator" } },
    { checkbox: "Show grid", checked: true },
    { checkbox: "Show labels" },
    { checkbox: "Show floors", checked: "indeterminate" },
    {
      radio: [
        ["map", "Map"],
        ["list", "List"],
      ],
      value: "map",
      props: { "aria-label": "View" },
    },
    {
      group: [{ item: "Level 1" }, { item: "Level 2" }],
      props: { "aria-label": "Levels" },
    },
    {
      sub: "Move to",
      props: { inset: true },
      items: [
        { item: "Floor 1" },
        { item: "Floor 2", props: { disabled: true } },
        { item: "Floor 3" },
      ],
    },
    { item: "Delete" },
  ],
};

describe("KozmosMenu behaves as React's Menu", () => {
  const fruit: MenuSpec = {
    page: true,
    nodes: [
      { item: "Apple" },
      { item: "Banana", props: { disabled: true } },
      { item: "Blueberry" },
      { item: "Cherry pie", props: { textValue: "Cherry" } },
      { sub: "More", items: [{ item: "Deep" }, { item: "Deeper" }] },
      { item: "Date" },
    ],
  };

  it("opens on the pointer's press without the trigger taking focus, and the keys move as Radix's", async () => {
    const seen = await inBoth(draw(fruit, { root: ["openChange"] }), [
      { ...pressTrigger, dom: true },
      { ...pressKey("ArrowDown"), dom: true },
      pressKey("ArrowDown"),
      pressKey("ArrowDown"),
      { ...pressKey("End"), dom: true },
      pressKey("Home"),
      pressKey("ArrowUp"),
      pressKey("PageDown"),
      pressKey("PageUp"),
      pressKey("Tab"),
      pressKey("Escape"),
    ]);
    expect(seen.react.map((step) => (step as { focus: string }).focus)).toEqual(
      [
        "menu",
        "menuitem Apple",
        "menuitem Blueberry",
        "menuitem Cherry pie",
        "menuitem Date",
        "menuitem Apple",
        "menuitem Apple",
        "menuitem Date",
        "menuitem Apple",
        "menuitem Apple",
        "button Open",
      ],
    );
    expect(seen.vue).toEqual(seen.react);
  });

  it("loops with `loop`", async () => {
    const seen = await inBoth(draw({ ...fruit, content: { loop: true } }), [
      pressTrigger,
      pressKey("ArrowUp"),
      pressKey("ArrowDown"),
      pressKey("ArrowUp"),
      pressKey("ArrowUp"),
    ]);
    expect(seen.vue).toEqual(seen.react);
  });

  it(
    "type-ahead skips disabled rows, reads text-value, cycles a repeated letter, and Space while typing ahead chooses nothing",
    { timeout: 20_000 },
    async () => {
      const wait = (ms: number): Step => ({
        name: `wait ${ms}`,
        act: () => new Promise((resolve) => setTimeout(resolve, ms)),
      });
      const seen = await inBoth(draw(fruit), [
        {
          name: "Enter on the trigger",
          act: () => (button("Open")!.focus(), key(button("Open")!, "Enter")),
        },
        pressKey("b"),
        pressKey("b"),
        wait(1100),
        pressKey("c"),
        pressKey("h"),
        pressKey(" "),
        wait(1100),
        pressKey("d"),
        pressKey(" "),
      ]);
      expect(
        seen.react.map((step) => (step as { focus: string }).focus),
      ).toEqual([
        "menuitem Apple",
        "menuitem Blueberry",
        "menuitem Blueberry",
        "menuitem Blueberry",
        "menuitem Cherry pie",
        "menuitem Cherry pie",
        "menuitem Cherry pie",
        "menuitem Cherry pie",
        "menuitem Date",
        "menuitem Date",
      ]);
      expect(seen.vue).toEqual(seen.react);
    },
  );

  it("a submenu opens on ArrowRight, Enter and its row's pointer, and closes on ArrowLeft and Escape", async () => {
    const hover = (words: string): Step => ({
      name: `rest on ${words}`,
      act: async () => {
        const target = row(words);
        target.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            pointerType: "mouse",
            clientX: 5,
          }),
        );
        await new Promise((resolve) => setTimeout(resolve, 150));
      },
    });
    const seen = await inBoth(
      draw(fruit, { subOpen: true, sub: ["escapeKeyDown"] }),
      [
        pressTrigger,
        pressKey("m"),
        { ...pressKey("ArrowRight"), dom: true },
        { ...pressKey("ArrowDown"), dom: true },
        { ...pressKey("ArrowLeft"), dom: true },
        pressKey("Enter"),
        pressKey("Escape"),
        pressTrigger,
        hover("More"),
        hover("Date"),
      ],
    );
    expect(seen.react.map((step) => (step as { menus: number }).menus)).toEqual(
      [1, 1, 2, 2, 1, 2, 0, 1, 2, 1],
    );
    expect(seen.vue).toEqual(seen.react);
  });

  it("right to left, a submenu opens on ArrowLeft and closes on ArrowRight", async () => {
    const seen = await inBoth(draw({ ...fruit, root: { dir: "rtl" } }), [
      pressTrigger,
      pressKey("m"),
      pressKey("ArrowRight"),
      pressKey("ArrowLeft"),
      pressKey("ArrowLeft"),
      pressKey("ArrowRight"),
    ]);
    expect(seen.react.map((step) => (step as { menus: number }).menus)).toEqual(
      [1, 1, 1, 2, 2, 1],
    );
    expect(seen.vue).toEqual(seen.react);
  });

  it("chooses a row by press, Enter and Space, closes and gives focus back; select's preventDefault keeps it open; a disabled row runs nothing", async () => {
    const spec: MenuSpec = {
      page: true,
      nodes: [
        { item: "Rename" },
        { item: "Pin", keepOpen: true },
        { item: "Archive", props: { disabled: true } },
        { item: "Delete" },
      ],
    };
    const seen = await inBoth(
      draw(spec, { root: ["openChange"], content: ["closeAutoFocus"] }),
      [
        pressTrigger,
        pressRow("Pin"),
        pressRow("Archive"),
        pressRow("Rename"),
        { name: "Enter on the trigger", act: () => key(at(), "Enter") },
        pressKey("ArrowDown"),
        pressKey("Enter"),
        pressKey("ArrowDown"),
        pressKey("ArrowDown"),
        pressKey(" "),
      ],
    );
    expect(seen.react.at(-1)).toMatchObject({ focus: "button Open", menus: 0 });
    expect(
      (seen.react.at(-1) as { log: string[] }).log.filter((line) =>
        line.startsWith("select:"),
      ),
    ).toEqual([
      "select:Pin (prevented)",
      "select:Rename",
      "select:Pin (prevented)",
      "select:Delete",
    ]);
    expect(seen.vue).toEqual(seen.react);
    // menu_item_selected, once a choice, as React's.
    expect(seen.events.react).toHaveLength(4);
    expect(seen.events.vue).toEqual(seen.events.react);
  });

  it("checkbox and radio items: v-model:checked and v-model hear what onCheckedChange and onValueChange hear", async () => {
    const spec: MenuSpec = {
      nodes: [
        { checkbox: "Show grid" },
        { checkbox: "Show floors", checked: "indeterminate" },
        {
          radio: [
            ["map", "Map"],
            ["list", "List"],
          ],
          value: "map",
        },
      ],
    };
    const seen = await inBoth(draw(spec), [
      pressTrigger,
      pressRow("Show grid"),
      pressTrigger,
      pressRow("Show grid"),
      pressTrigger,
      pressRow("Show floors"),
      pressTrigger,
      { ...pressRow("List"), dom: true },
      pressTrigger,
      { name: "drawn", act: () => {}, dom: true },
    ]);
    expect((seen.react.at(-1) as { log: string[] }).log).toEqual([
      "select:Show grid",
      "checked:Show grid true",
      "select:Show grid",
      "checked:Show grid false",
      "select:Show floors",
      "checked:Show floors true",
      "select:list",
      'value "list"',
    ]);
    expect(seen.vue).toEqual(seen.react);
  });

  it("the panels' events: Escape, a press outside, focus outside a menu that is not modal, and a submenu's", async () => {
    const content = [
      "escapeKeyDown",
      "pointerDownOutside",
      "focusOutside",
      "interactOutside",
      "closeAutoFocus",
    ];
    for (const modal of [true, false]) {
      const seen = await inBoth(
        draw(
          { ...fruit, root: { modal } },
          {
            root: ["openChange"],
            content,
            sub: [
              "escapeKeyDown",
              "pointerDownOutside",
              "focusOutside",
              "interactOutside",
            ],
            subOpen: true,
          },
        ),
        [
          enterTrigger,
          pressKey("Escape"),
          enterTrigger,
          {
            name: "press outside",
            act: () => press(document.getElementById("host")!),
          },
          enterTrigger,
          pressKey("m"),
          pressKey("ArrowRight"),
          pressKey("Escape"),
          ...(modal
            ? []
            : [
                enterTrigger,
                {
                  name: "focus outside",
                  act: () => document.getElementById("undo")!.focus(),
                },
              ]),
        ],
      );
      expect((seen.react.at(-1) as { log: string[] }).log).toContain(
        "content:escapeKeyDown",
      );
      expect((seen.react.at(-1) as { log: string[] }).log).toContain(
        "sub:escapeKeyDown",
      );
      expect(seen.vue).toEqual(seen.react);
    }
  });

  it("focus moving into a Dialog opened beside it is outside, as Radix's tree says: focusOutside unprevented, interactOutside prevented if modal, and a menu that is not modal, and a submenu, close", async () => {
    for (const modal of [true, false]) {
      const seen = await inBoth(
        draw(
          { ...fruit, dialogBeside: true, root: { modal } },
          {
            root: ["openChange"],
            content: ["focusOutside", "interactOutside"],
            sub: ["focusOutside", "interactOutside"],
            subOpen: true,
          },
        ),
        [
          enterTrigger,
          pressKey("m"),
          pressKey("ArrowRight"),
          { name: "a Dialog opens beside it", act: () => openBeside() },
        ],
      );
      expect((seen.react.at(-1) as { log: string[] }).log).toEqual(
        modal
          ? [
              "root:openChange true",
              "sub:openChange true",
              "content:focusOutside",
              "content:interactOutside (prevented)",
              "sub:focusOutside",
              "sub:interactOutside",
              "sub:openChange false",
            ]
          : [
              "root:openChange true",
              "sub:openChange true",
              "content:focusOutside",
              "content:interactOutside",
              "sub:focusOutside",
              "sub:interactOutside",
              "sub:openChange false",
              "root:openChange false",
            ],
      );
      expect(seen.vue).toEqual(seen.react);
    }
  });

  it("makes the page inert while a modal menu is open, apart from live regions, and gives it back; a menu that is not modal makes nothing inert (GAP-193)", async () => {
    for (const modal of [true, false]) {
      const seen = await inBoth(draw({ ...fruit, root: { modal } }), [
        modal ? pressTrigger : enterTrigger,
        {
          name: "the live region",
          act: () => {},
        },
        pressKey("Escape"),
      ]);
      expect((seen.react[0] as { inert: boolean }).inert).toBe(modal);
      expect(seen.vue).toEqual(seen.react);
    }
    // The live region's button stays in reach, as React's.
    const tree = trees(
      PARTS,
      { ...fruit, root: { defaultOpen: true } },
      () => () => {},
    );
    for (const mount of [
      () => mountReact(tree.react),
      () => mountVue(tree.vue),
    ]) {
      await mount();
      expect(document.getElementById("undo")!.closest("[inert]")).toBeNull();
      expect(
        document.querySelector('[role="menu"]')!.closest("[inert]"),
      ).toBeNull();
    }
  });

  it("v-model:open hears what onOpenChange hears, and a controlled menu opens only as its owner says", async () => {
    const seen = await inBoth(
      draw({ ...fruit, root: { open: false } }, { root: ["openChange"] }),
      [pressTrigger, pressKey("Enter")],
    );
    expect((seen.react.at(-1) as { log: string[] }).log).toEqual([
      "root:openChange true",
      "root:openChange true",
    ]);
    expect((seen.react.at(-1) as { menus: number }).menus).toBe(0);
    expect(seen.vue).toEqual(seen.react);
  });
});

describe("MenuItem external (decision 152), in both", () => {
  const open = async (nodes: MenuSpec["nodes"]) =>
    mounted({ root: { defaultOpen: true }, nodes });

  it("draws the new-tab icon and words, the product's own or none, and around an app's link a new tab", async () => {
    for (const nodes of [
      [{ item: "Settings" }],
      [{ item: "Documentation", props: { external: true } }],
      [
        {
          item: "Dokumentation",
          props: { external: true, externalLabel: "öffnet in einem neuen Tab" },
        },
        { item: "Pointr", props: { external: true, externalLabel: "" } },
      ],
      [
        {
          item: "Documentation",
          props: { external: true },
          link: { href: "https://docs.example.com" },
        },
      ],
      [
        {
          item: "Documentation",
          props: { external: true },
          link: {
            href: "https://docs.example.com",
            target: "docs",
            rel: "noopener",
          },
        },
      ],
      [
        {
          item: "Documentation",
          props: { external: true },
          link: { href: "https://docs.example.com", target: "docs" },
        },
      ],
      ...["_self", "_TOP", "_parent", ""].map((target) => [
        {
          item: "Documentation",
          props: { external: true },
          link: { href: "/docs", target },
        },
      ]),
      [{ item: "Settings", link: { href: "/settings" } }],
    ] as MenuSpec["nodes"][]) {
      const { react, vue } = await open(nodes);
      expect(vue).toBe(react);
    }
  });
});

describe("a native Menu in a native Dialog", () => {
  it("stays inside the Dialog's layer: an item's press closes the menu, not the Dialog; Escape closes the menu first, then the Dialog", async () => {
    const reactTree = () =>
      e(
        KozmosReact.Dialog,
        { defaultOpen: true },
        e(
          KozmosReact.DialogContent,
          null,
          e(KozmosReact.DialogTitle, null, "Level 2"),
          e(KozmosReact.DialogDescription, null, "Rename the level"),
          e(
            KozmosReact.Menu,
            null,
            e(KozmosReact.MenuTrigger, null, "Open"),
            e(
              KozmosReact.MenuContent,
              null,
              e(KozmosReact.MenuItem, null, "Rename"),
              e(KozmosReact.MenuItem, null, "Archive"),
            ),
          ),
        ),
      );
    const vueTree = () =>
      h(KozmosDialog, { defaultOpen: true }, () =>
        h(KozmosDialogContent, null, () => [
          h(KozmosDialogTitle, null, () => "Level 2"),
          h(KozmosDialogDescription, null, () => "Rename the level"),
          h(KozmosMenu, null, () => [
            h(KozmosMenuTrigger, null, () => "Open"),
            h(KozmosMenuContent, null, () => [
              h(KozmosMenuItem, null, () => "Rename"),
              h(KozmosMenuItem, null, () => "Archive"),
            ]),
          ]),
        ]),
      );
    const state = () => ({
      dialog: document.querySelectorAll('[role="dialog"]').length,
      menu: document.querySelectorAll('[role="menu"]').length,
      focus: document.activeElement?.textContent?.trim(),
    });
    const steps = [
      () => press(button("Open")!),
      () => press(row("Rename")),
      () => press(button("Open")!),
      () => void key(at(), "Escape"),
      () => void key(at(), "Escape"),
    ];
    const seen: Record<string, unknown[]> = { react: [], vue: [] };
    for (const side of ["react", "vue"] as const) {
      if (side === "react") await mountReact(reactTree);
      else await mountVue(vueTree);
      for (const step of steps) {
        await step();
        await settle();
        await settle();
        seen[side].push(state());
      }
    }
    expect(seen.react.map((s) => (s as { dialog: number }).dialog)).toEqual([
      1, 1, 1, 1, 0,
    ]);
    expect(seen.react.map((s) => (s as { menu: number }).menu)).toEqual([
      1, 0, 1, 0, 0,
    ]);
    expect(seen.vue).toEqual(seen.react);
  });
});

describe("the theme provider holds what the menu draws", () => {
  it("draws inside KozmosThemeProvider's portal", async () => {
    await mountVue(() =>
      h(KozmosThemeProvider, null, () =>
        h(KozmosMenu, { defaultOpen: true }, () => [
          h(KozmosMenuTrigger, null, () => "Open"),
          h(KozmosMenuContent, null, () =>
            h(KozmosMenuItem, null, () => "Rename"),
          ),
        ]),
      ),
    );
    expect(
      document.querySelector('[role="menu"]')!.closest("[data-kozmos-portal]"),
    ).not.toBeNull();
    expect(body()).toContain("Rename");
  });
});

describe("every event fires as React's callback", () => {
  it("v-model:open, the panels' events, select, v-model:checked, v-model and a submenu's v-model:open", async () => {
    const seen: Record<string, string[]> = { react: [], vue: [] };
    const open = () => enterTrigger.act();
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
              KozmosReact.Menu,
              { modal: false, onOpenChange: hear("open") },
              e(KozmosReact.MenuTrigger, null, "Open"),
              e(
                KozmosReact.MenuContent,
                {
                  onCloseAutoFocus: hear("closeAutoFocus"),
                  onEscapeKeyDown: hear("escapeKeyDown"),
                  onPointerDownOutside: hear("pointerDownOutside"),
                  onFocusOutside: hear("focusOutside"),
                  onInteractOutside: hear("interactOutside"),
                },
                e(KozmosReact.MenuItem, { onSelect: hear("select") }, "Rename"),
                e(
                  KozmosReact.MenuCheckboxItem,
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
                  KozmosReact.MenuRadioGroup,
                  {
                    value,
                    onValueChange: (next: string) => {
                      hear("value")(next);
                      setValue(next);
                    },
                  },
                  e(
                    KozmosReact.MenuRadioItem,
                    { value: "map", onSelect: hear("select map") },
                    "Map",
                  ),
                  e(
                    KozmosReact.MenuRadioItem,
                    { value: "list", onSelect: hear("select list") },
                    "List",
                  ),
                ),
                e(
                  KozmosReact.MenuSub,
                  { onOpenChange: hear("sub open") },
                  e(KozmosReact.MenuSubTrigger, null, "More"),
                  e(
                    KozmosReact.MenuSubContent,
                    {
                      onEscapeKeyDown: hear("sub escapeKeyDown"),
                      onPointerDownOutside: hear("sub pointerDownOutside"),
                      onFocusOutside: hear("sub focusOutside"),
                      onInteractOutside: hear("sub interactOutside"),
                    },
                    e(KozmosReact.MenuItem, null, "Deep"),
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
          h(KozmosMenu, { modal: false, "onUpdate:open": hear("open") }, () => [
            h(KozmosMenuTrigger, null, () => "Open"),
            h(
              KozmosMenuContent,
              {
                onCloseAutoFocus: hear("closeAutoFocus"),
                onEscapeKeyDown: hear("escapeKeyDown"),
                onPointerDownOutside: hear("pointerDownOutside"),
                onFocusOutside: hear("focusOutside"),
                onInteractOutside: hear("interactOutside"),
              },
              () => [
                h(KozmosMenuItem, { onSelect: hear("select") }, () => "Rename"),
                h(
                  KozmosMenuCheckboxItem,
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
                  KozmosMenuRadioGroup,
                  {
                    modelValue: value.value,
                    "onUpdate:modelValue": (next: string) => {
                      hear("value")(next);
                      value.value = next;
                    },
                  },
                  () => [
                    h(
                      KozmosMenuRadioItem,
                      { value: "map", onSelect: hear("select map") },
                      () => "Map",
                    ),
                    h(
                      KozmosMenuRadioItem,
                      { value: "list", onSelect: hear("select list") },
                      () => "List",
                    ),
                  ],
                ),
                h(KozmosMenuSub, { "onUpdate:open": hear("sub open") }, () => [
                  h(KozmosMenuSubTrigger, null, () => "More"),
                  h(
                    KozmosMenuSubContent,
                    {
                      onEscapeKeyDown: hear("sub escapeKeyDown"),
                      onPointerDownOutside: hear("sub pointerDownOutside"),
                      onFocusOutside: hear("sub focusOutside"),
                      onInteractOutside: hear("sub interactOutside"),
                    },
                    () => h(KozmosMenuItem, null, () => "Deep"),
                  ),
                ]),
              ],
            ),
          ]),
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
      "select checkbox",
      "checked true",
      "select list",
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

// Last: a server render runs Reka's menu setup, whose shared keyboard
// tracker (useIsUsingKeyboard) starts listening only once mounted, and is
// never let go of on a server. Drawn before the mounted specs, it left every
// menu mounted after it in this module deaf to the keyboard, so a key's open
// focused the panel and not its first row. Apps render on a server in a
// realm of their own.
describe("Menu's stories, drawn in both", () => {
  it("Default: closed, as a server draws it, and open", async () => {
    const closed = await server(defaultStory);
    expect(closed.vue).toBe(closed.react);
    const open = await mounted({
      ...defaultStory,
      root: { defaultOpen: true },
    });
    expect(open.react).toContain('role="menu"');
    expect(open.vue).toBe(open.react);
  });

  it("ExternalItem: closed, and open", async () => {
    const spec: MenuSpec = {
      triggerChild: BUTTON,
      triggerWords: "Account",
      nodes: accountItems,
    };
    const closed = await server(spec);
    expect(closed.vue).toBe(closed.react);
    const open = await mounted({ ...spec, root: { defaultOpen: true } });
    expect(open.vue).toBe(open.react);
  });

  it("ExternalItemOpen: open from the start, not modal, at the trigger's start", async () => {
    const spec: MenuSpec = {
      root: { defaultOpen: true, modal: false },
      triggerChild: BUTTON,
      triggerWords: "Account",
      content: { align: "start" },
      nodes: accountItems,
    };
    const { react, vue } = await mounted(spec);
    expect(react).toContain("opens in a new tab");
    expect(vue).toBe(react);
    void outline;
  });
});

describe("KozmosMenu draws what React's Menu draws", () => {
  it("every part, open, with an app's attributes: modal, and not", async () => {
    for (const modal of [true, false]) {
      const { react, vue } = await mounted({
        ...everything,
        root: { defaultOpen: true, modal },
      });
      expect(react).toContain('role="menuitemcheckbox"');
      expect(react).toContain('aria-checked="mixed"');
      expect(vue).toBe(react);
    }
  });

  it("a trigger of its own and of the app's, closed and open, with its attributes and its `disabled`", async () => {
    for (const trigger of [
      { className: "kozmos-parity", id: "account", "aria-label": "Account" },
      { disabled: true },
    ]) {
      const closed = await server({ trigger, nodes: [{ item: "Rename" }] });
      expect(closed.vue).toBe(closed.react);
    }
    const open = await mounted({
      root: { defaultOpen: true },
      trigger: { "data-app": "trigger" },
      triggerChild: BUTTON,
      nodes: [{ item: "Rename" }],
    });
    expect(open.vue).toBe(open.react);
  });

  it("a portal of the theme's, and the app's own portal container", async () => {
    const tree = (react: boolean, holder: HTMLElement) =>
      react
        ? e(
            KozmosReact.Menu,
            { defaultOpen: true },
            e(KozmosReact.MenuTrigger, null, "Open"),
            e(
              KozmosReact.MenuPortal,
              null,
              e("p", { id: "in-portal" }, "In the portal"),
            ),
            e(
              KozmosReact.MenuContent,
              { portalContainer: holder },
              e(KozmosReact.MenuItem, null, "Rename"),
            ),
          )
        : h(KozmosMenu, { defaultOpen: true }, () => [
            h(KozmosMenuTrigger, null, () => "Open"),
            h(KozmosMenuPortal, null, () =>
              h("p", { id: "in-portal" }, "In the portal"),
            ),
            h(KozmosMenuContent, { portalContainer: holder }, () =>
              h(KozmosMenuItem, null, () => "Rename"),
            ),
          ]);
    const seen: string[] = [];
    for (const react of [true, false]) {
      // The app's own container, in the page.
      const holder = document.createElement("div");
      const mount = react
        ? mountReact(tree(true, holder))
        : mountVue(() => tree(false, holder));
      document.body.append(holder);
      await mount;
      await settle();
      seen.push(
        `${holder.innerHTML.includes('role="menu"')} ${
          document
            .getElementById("in-portal")
            ?.closest("[data-kozmos-portal]") !== null
        }`,
      );
    }
    expect(seen[0]).toBe("true true");
    expect(seen[1]).toBe(seen[0]);
  });
});
