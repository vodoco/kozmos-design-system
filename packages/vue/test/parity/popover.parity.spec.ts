// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import * as KozmosReact from "@kozmos-ds/react";
import { h, ref, type VNode } from "vue";
import {
  KozmosAnchoredPopover,
  KozmosButton,
  KozmosPopover,
  KozmosPopoverAnchor,
  KozmosPopoverArrow,
  KozmosPopoverContent,
  KozmosPopoverTrigger,
} from "../../src/index";
import {
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
 * Popover and its four parts, which React's stories draw by hand, drawn in
 * both from one description: closed on a server, open and mounted in the
 * theme's portal, with and without its arrow; then what React's tests cover
 * (Popover.test.tsx): PopoverAnchor leaving its control plain and opening
 * nothing, the product opening and closing it, focus given back to what had
 * it as it opened, else to the anchor, a handler keeping it, a trigger's own
 * return of focus, and an anchor that is a rect, which draws nothing. And
 * Vue's KozmosAnchoredPopover (GAP-190), which draws the same three parts
 * in one.
 */
type Props = Record<string, unknown>;
const asVue = ({ className, ...rest }: Props = {}) => ({
  ...rest,
  ...(className === undefined ? {} : { class: className }),
});

/** React's Default story, open or closed, with an arrow when asked. */
function reactDefault(root: Props = {}, arrow = false, content: Props = {}) {
  return e(
    KozmosReact.Popover,
    root,
    e(
      KozmosReact.PopoverTrigger,
      { asChild: true },
      e(KozmosReact.Button, { variant: "outline" }, "Open popover"),
    ),
    e(
      KozmosReact.PopoverContent,
      { className: "w-80", ...content },
      e(
        "div",
        { className: "grid gap-4" },
        e(
          "div",
          { className: "space-y-2" },
          e("h4", { className: "font-medium leading-none" }, "Dimensions"),
          e(
            "p",
            { className: "text-sm text-muted-foreground" },
            "Set the dimensions for the layer.",
          ),
        ),
      ),
      arrow ? e(KozmosReact.PopoverArrow) : null,
    ),
  );
}
function vueDefault(
  root: Props = {},
  arrow = false,
  content: Props = {},
): VNode {
  return h(KozmosPopover, root, () => [
    h(KozmosPopoverTrigger, { asChild: true }, () =>
      h(KozmosButton, { variant: "outline" }, () => "Open popover"),
    ),
    h(KozmosPopoverContent, { class: "w-80", ...asVue(content) }, () => [
      h("div", { class: "grid gap-4" }, [
        h("div", { class: "space-y-2" }, [
          h("h4", { class: "font-medium leading-none" }, "Dimensions"),
          h(
            "p",
            { class: "text-sm text-muted-foreground" },
            "Set the dimensions for the layer.",
          ),
        ]),
      ]),
      arrow ? h(KozmosPopoverArrow) : null,
    ]),
  ]);
}

useOverlayPage();

describe("KozmosPopover draws what React's Popover draws", () => {
  it("Default, closed: draws what React's story draws on a server", async () => {
    const { react, vue } = await serverBoth(reactDefault(), () => vueDefault());
    expect(react).toContain('aria-haspopup="dialog"');
    // Reka's trigger writes an id of its own as it draws, and names the
    // panel only while open: Vue's takes the id off and names the panel
    // once mounted (the mounted drawings below), so a server's HTML still
    // has the one and lacks the other.
    expect(vue.replace(/ id="id-\d+"/, "")).toBe(
      react.replace(/ aria-controls="id-\d+"/, ""),
    );
  });

  it.each<[string, Props, boolean, Props]>([
    ["Default, open", { defaultOpen: true }, false, {}],
    ["with its arrow", { defaultOpen: true }, true, {}],
    [
      "its own side, align and name",
      { defaultOpen: true },
      true,
      {
        side: "bottom",
        align: "start",
        sideOffset: 8,
        "aria-label": "Step 2 of 5",
      },
    ],
  ])("%s: mounted, as React's", async (_name, root, arrow, content) => {
    const react = await mountReact(reactDefault(root, arrow, content));
    expect(react).toContain('role="dialog"');
    expect(react.includes("<svg")).toBe(arrow);
    const vue = await mountVue(() => vueDefault(root, arrow, content));
    expect(vue).toBe(react);
  });
});

/**
 * GAP-190's tour step in both: "Start tour" opens a popover anchored to
 * "Add desk", a plain button, with a "Next" inside; `showStart` takes the
 * start away.
 */
function tour(
  side: "react" | "vue",
  { changes = [] as boolean[], prevent = false, showStart = ref(true) } = {},
) {
  if (side === "react") {
    let hideStart: () => void = () => {};
    const Tour = () => {
      const [open, setOpen] = React.useState(false);
      const [start, setStart] = React.useState(true);
      hideStart = () => setStart(false);
      return e(
        React.Fragment,
        null,
        start
          ? e(
              "button",
              { type: "button", onClick: () => setOpen(true) },
              "Start tour",
            )
          : null,
        e(
          KozmosReact.Popover,
          {
            open,
            onOpenChange: (next: boolean) => {
              changes.push(next);
              setOpen(next);
            },
          },
          e(
            KozmosReact.PopoverAnchor,
            { asChild: true },
            e("button", { type: "button" }, "Add desk"),
          ),
          e(
            KozmosReact.PopoverContent,
            {
              "aria-label": "Step 1 of 3",
              onCloseAutoFocus: prevent
                ? (event: Event) => event.preventDefault()
                : undefined,
            },
            e("button", { type: "button" }, "Next"),
          ),
        ),
      );
    };
    return {
      mount: () => mountReact(e(Tour)),
      hideStart: () => act(() => hideStart()),
    };
  }
  const open = ref(false);
  return {
    mount: () =>
      mountVue(() => [
        showStart.value
          ? h(
              "button",
              { type: "button", onClick: () => (open.value = true) },
              "Start tour",
            )
          : null,
        h(
          KozmosPopover,
          {
            open: open.value,
            "onUpdate:open": (next: boolean) => {
              changes.push(next);
              open.value = next;
            },
          },
          () => [
            h(KozmosPopoverAnchor, { asChild: true }, () =>
              h("button", { type: "button" }, "Add desk"),
            ),
            h(
              KozmosPopoverContent,
              {
                "aria-label": "Step 1 of 3",
                ...(prevent
                  ? {
                      onCloseAutoFocus: (event: Event) =>
                        event.preventDefault(),
                    }
                  : {}),
              },
              () => h("button", { type: "button" }, "Next"),
            ),
          ],
        ),
      ]),
    hideStart: () => {
      showStart.value = false;
    },
  };
}

const step = () => document.querySelector("[role=dialog]");
const focusName = () =>
  document.activeElement === document.body
    ? "the page"
    : document.activeElement?.textContent?.trim();

describe("KozmosPopoverAnchor, mounted, as React's (GAP-190)", () => {
  /** Runs `act` in both and returns what each ended with. */
  async function both(
    run: (
      side: "react" | "vue",
      tools: ReturnType<typeof tour>,
    ) => Promise<void>,
    options: { prevent?: boolean } = {},
  ) {
    const out: Record<string, unknown> = {};
    for (const side of ["react", "vue"] as const) {
      const changes: boolean[] = [];
      const tools = tour(side, { changes, prevent: options.prevent });
      await tools.mount();
      await run(side, tools);
      await settle();
      await settle();
      out[side] = { changes, focus: focusName(), open: !!step() };
    }
    return out as Record<
      "react" | "vue",
      { changes: boolean[]; focus: string; open: boolean }
    >;
  }
  const doing = (side: "react" | "vue", fn: () => unknown) =>
    side === "react"
      ? act(async () => void (await fn()))
      : Promise.resolve(fn()).then(() => undefined);

  it("leaves its target a plain button, which opens nothing", async () => {
    for (const side of ["react", "vue"] as const) {
      await tour(side).mount();
      const target = button("Add desk")!;
      for (const attribute of [
        "aria-haspopup",
        "aria-expanded",
        "aria-controls",
        "data-state",
      ])
        expect(target.hasAttribute(attribute), `${side} ${attribute}`).toBe(
          false,
        );
      await doing(side, () => press(target));
      await settle();
      expect(step(), side).toBeNull();
    }
  });

  it("opens from the product's state and closes on Escape, giving focus back to what had it", async () => {
    const { react, vue } = await both(async (side) => {
      const start = button("Start tour")!;
      start.focus();
      await doing(side, () => press(start));
      await settle();
      await doing(side, () => void key(step()!, "Escape"));
    });
    expect(react).toEqual({
      changes: [false],
      focus: "Start tour",
      open: false,
    });
    expect(vue).toEqual(react);
  });

  it("gives focus to its anchor when nothing had it as it opened", async () => {
    const { react, vue } = await both(async (side) => {
      await doing(side, () => button("Start tour")!.click());
      await settle();
      await doing(side, () => void key(step()!, "Escape"));
    });
    expect(react.focus).toBe("Add desk");
    expect(vue).toEqual(react);
  });

  it("gives focus to its anchor when what opened it is gone", async () => {
    const { react, vue } = await both(async (side, tools) => {
      const start = button("Start tour")!;
      start.focus();
      await doing(side, () => press(start));
      await settle();
      tools.hideStart();
      await settle();
      await doing(side, () => void key(step()!, "Escape"));
    });
    expect(react.focus).toBe("Add desk");
    expect(vue).toEqual(react);
  });

  it("leaves focus alone when the close's auto focus is prevented", async () => {
    const { react, vue } = await both(
      async (side) => {
        await doing(side, () => button("Start tour")!.click());
        await settle();
        await doing(side, () => void key(step()!, "Escape"));
      },
      { prevent: true },
    );
    expect(react.focus).toBe("the page");
    expect(vue).toEqual(react);
  });

  it("keeps a trigger's own return of focus", async () => {
    const result: string[] = [];
    await mountReact(
      e(
        KozmosReact.Popover,
        null,
        e(KozmosReact.PopoverTrigger, null, "Open"),
        e(
          KozmosReact.PopoverContent,
          { "aria-label": "Panel" },
          e("button", null, "Inside"),
        ),
      ),
    );
    for (const side of ["react", "vue"] as const) {
      if (side === "vue")
        await mountVue(() =>
          h(KozmosPopover, null, () => [
            h(KozmosPopoverTrigger, null, () => "Open"),
            h(KozmosPopoverContent, { "aria-label": "Panel" }, () =>
              h("button", null, "Inside"),
            ),
          ]),
        );
      const trigger = button("Open")!;
      trigger.focus();
      await doing(side, () => press(trigger));
      await settle();
      await doing(side, () => void key(step()!, "Escape"));
      await settle();
      await settle();
      result.push(focusName()!);
    }
    expect(result).toEqual(["Open", "Open"]);
  });

  it("anchors to a rect through virtual-ref, drawing no element, and leaves focus with nothing to give it to", async () => {
    const rect = {
      getBoundingClientRect: () =>
        DOMRect.fromRect({ x: 100, y: 200, width: 40, height: 20 }),
    };
    const seen: unknown[] = [];
    for (const side of ["react", "vue"] as const) {
      if (side === "react") {
        const Hint = () => {
          const [open, setOpen] = React.useState(true);
          return e(
            KozmosReact.Popover,
            { open, onOpenChange: setOpen },
            e(
              "span",
              { "data-holder": "" },
              e(KozmosReact.PopoverAnchor, { virtualRef: { current: rect } }),
            ),
            e(
              KozmosReact.PopoverContent,
              { "aria-label": "Feature" },
              e("button", null, "Directions"),
            ),
          );
        };
        await mountReact(e(Hint));
      } else {
        const open = ref(true);
        await mountVue(() =>
          h(
            KozmosPopover,
            {
              open: open.value,
              "onUpdate:open": (next: boolean) => (open.value = next),
            },
            () => [
              h("span", { "data-holder": "" }, [
                h(KozmosPopoverAnchor, { virtualRef: { current: rect } }),
              ]),
              h(KozmosPopoverContent, { "aria-label": "Feature" }, () =>
                h("button", null, "Directions"),
              ),
            ],
          ),
        );
      }
      const holder = document.querySelector("[data-holder]")!;
      const drawn = holder.innerHTML.replace(/<!--.*?-->/g, "");
      const opened = !!step();
      await doing(side, () => void key(step()!, "Escape"));
      await settle();
      await settle();
      seen.push({ drawn, opened, focus: focusName(), open: !!step() });
    }
    expect(seen[0]).toEqual({
      drawn: "",
      opened: true,
      focus: "the page",
      open: false,
    });
    expect(seen[1]).toEqual(seen[0]);
  });

  it("gives focus to an element given as its virtual-ref", async () => {
    const seen: string[] = [];
    for (const side of ["react", "vue"] as const) {
      const outside = document.createElement("button");
      outside.textContent = "Map pin";
      if (side === "react") {
        const Hint = () => {
          const [open, setOpen] = React.useState(true);
          return e(
            KozmosReact.Popover,
            { open, onOpenChange: setOpen },
            e(KozmosReact.PopoverAnchor, { virtualRef: { current: outside } }),
            e(
              KozmosReact.PopoverContent,
              { "aria-label": "Pin" },
              e("button", null, "Close"),
            ),
          );
        };
        await mountReact(e(Hint));
      } else {
        const open = ref(true);
        await mountVue(() =>
          h(
            KozmosPopover,
            {
              open: open.value,
              "onUpdate:open": (next: boolean) => (open.value = next),
            },
            () => [
              h(KozmosPopoverAnchor, { virtualRef: { current: outside } }),
              h(KozmosPopoverContent, { "aria-label": "Pin" }, () =>
                h("button", null, "Close"),
              ),
            ],
          ),
        );
      }
      document.body.append(outside);
      await doing(side, () => void key(step()!, "Escape"));
      await settle();
      await settle();
      seen.push(focusName()!);
    }
    expect(seen).toEqual(["Map pin", "Map pin"]);
  });
});

describe("KozmosAnchoredPopover draws React's Popover, anchor and content in one", () => {
  it("beside an element Vue holds: as React's PopoverAnchor with that element as its virtual ref", async () => {
    const target = document.createElement("button");
    target.textContent = "Add desk";
    const react = await mountReact(
      e(
        KozmosReact.Popover,
        { open: true },
        e(KozmosReact.PopoverAnchor, { virtualRef: { current: target } }),
        e(
          KozmosReact.PopoverContent,
          { side: "bottom", "aria-label": "Step 2 of 5" },
          e("button", null, "Got it"),
        ),
      ),
    );
    const vue = await mountVue(() =>
      h(
        KozmosAnchoredPopover,
        {
          open: true,
          anchor: target,
          side: "bottom",
          "aria-label": "Step 2 of 5",
        },
        () => h("button", null, "Got it"),
      ),
    );
    expect(react).toContain('aria-label="Step 2 of 5"');
    expect(vue).toBe(react);
  });
});

describe("KozmosPopoverTrigger, mounted, names the panel as Radix's", () => {
  it("in aria-controls while closed and open, with no id of its own", async () => {
    const seen: string[][] = [];
    for (const side of ["react", "vue"] as const) {
      if (side === "react") await mountReact(reactDefault());
      else await mountVue(() => vueDefault());
      const trigger = button("Open popover")!;
      const read = () => [
        String(trigger.hasAttribute("aria-controls")),
        String(trigger.hasAttribute("id")),
      ];
      const closed = read();
      if (side === "react") await act(() => press(trigger));
      else await press(trigger);
      await settle();
      const open = read();
      (side === "react" ? act : (fn: () => void) => fn())(
        () => void key(step()!, "Escape"),
      );
      await settle();
      seen.push([...closed, ...open, ...read()]);
    }
    expect(seen[0]).toEqual([
      "true",
      "false",
      "true",
      "false",
      "true",
      "false",
    ]);
    expect(seen[1]).toEqual(seen[0]);
  });
});

describe("KozmosPopoverContent and KozmosAnchoredPopover tell what React's tell", () => {
  it("the content's events and v-model:open, through a press outside and Escape", async () => {
    const heard = { react: [] as unknown[], vue: [] as unknown[] };
    for (const side of ["react", "vue"] as const) {
      const log = heard[side];
      const listen = (name: string) => () => log.push(name);
      if (side === "react") {
        const Owner = () => {
          const [open, setOpen] = React.useState(true);
          return e(
            React.Fragment,
            null,
            e("button", { type: "button" }, "Page"),
            e(
              KozmosReact.Popover,
              {
                open,
                onOpenChange: (next: boolean) => {
                  log.push(["open", next]);
                  setOpen(next);
                },
              },
              e(KozmosReact.PopoverTrigger, null, "Open"),
              e(
                KozmosReact.PopoverContent,
                {
                  "aria-label": "Panel",
                  onOpenAutoFocus: listen("openAutoFocus"),
                  onCloseAutoFocus: listen("closeAutoFocus"),
                  onEscapeKeyDown: listen("escapeKeyDown"),
                  onPointerDownOutside: (event: Event) => {
                    log.push("pointerDownOutside");
                    event.preventDefault();
                  },
                  onFocusOutside: listen("focusOutside"),
                  onInteractOutside: listen("interactOutside"),
                },
                e("button", null, "Inside"),
              ),
            ),
          );
        };
        await mountReact(e(Owner));
      } else {
        const open = ref(true);
        await mountVue(() => [
          h("button", { type: "button" }, "Page"),
          h(
            KozmosPopover,
            {
              open: open.value,
              "onUpdate:open": (next: boolean) => {
                log.push(["open", next]);
                open.value = next;
              },
            },
            () => [
              h(KozmosPopoverTrigger, null, () => "Open"),
              h(
                KozmosPopoverContent,
                {
                  "aria-label": "Panel",
                  onOpenAutoFocus: listen("openAutoFocus"),
                  onCloseAutoFocus: listen("closeAutoFocus"),
                  onEscapeKeyDown: listen("escapeKeyDown"),
                  onPointerDownOutside: (event: Event) => {
                    log.push("pointerDownOutside");
                    event.preventDefault();
                  },
                  onFocusOutside: listen("focusOutside"),
                  onInteractOutside: listen("interactOutside"),
                },
                () => h("button", null, "Inside"),
              ),
            ],
          ),
        ]);
      }
      const page = button("Page")!;
      if (side === "react") await act(() => press(page));
      else await press(page);
      await settle();
      const inside = button("Inside");
      if (inside) {
        if (side === "react") act(() => void key(inside, "Escape"));
        else key(inside, "Escape");
      }
      await settle();
      await settle();
      heard[side] = [...log];
    }
    expect(heard.react).toEqual(
      expect.arrayContaining([
        "openAutoFocus",
        "pointerDownOutside",
        "interactOutside",
      ]),
    );
    expect(heard.vue).toEqual(heard.react);
  });

  it("KozmosAnchoredPopover: v-model:open hears Escape, as React's Popover's onOpenChange", async () => {
    const heard = { react: [] as unknown[], vue: [] as unknown[] };
    const told = (side: "react" | "vue") => ({
      onOpenAutoFocus: () => heard[side].push("openAutoFocus"),
      onCloseAutoFocus: () => heard[side].push("closeAutoFocus"),
      onEscapeKeyDown: () => heard[side].push("escapeKeyDown"),
      onPointerDownOutside: () => heard[side].push("pointerDownOutside"),
      onFocusOutside: () => heard[side].push("focusOutside"),
      onInteractOutside: () => heard[side].push("interactOutside"),
    });
    const target = document.createElement("button");
    const React_ = () => {
      const [open, setOpen] = React.useState(true);
      return e(
        KozmosReact.Popover,
        {
          open,
          onOpenChange: (next: boolean) => {
            heard.react.push(next);
            setOpen(next);
          },
        },
        e(KozmosReact.PopoverAnchor, { virtualRef: { current: target } }),
        e(
          KozmosReact.PopoverContent,
          { "aria-label": "Step", ...told("react") },
          e("button", null, "Got it"),
        ),
      );
    };
    await mountReact(e(React_));
    act(() => void key(step()!, "Escape"));
    await settle();
    const open = ref(true);
    await mountVue(() =>
      h(
        KozmosAnchoredPopover,
        {
          open: open.value,
          anchor: target,
          "aria-label": "Step",
          "onUpdate:open": (next: boolean) => {
            heard.vue.push(next);
            open.value = next;
          },
          onOpenAutoFocus: told("vue").onOpenAutoFocus,
          onCloseAutoFocus: told("vue").onCloseAutoFocus,
          onEscapeKeyDown: told("vue").onEscapeKeyDown,
          onPointerDownOutside: told("vue").onPointerDownOutside,
          onFocusOutside: told("vue").onFocusOutside,
          onInteractOutside: told("vue").onInteractOutside,
        },
        () => h("button", null, "Got it"),
      ),
    );
    key(step()!, "Escape");
    await settle();
    expect(heard.react).toContain(false);
    expect(heard.react).toContain("escapeKeyDown");
    expect(heard.vue).toEqual(heard.react);
  });
});
