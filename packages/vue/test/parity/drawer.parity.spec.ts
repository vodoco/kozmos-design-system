// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import * as KozmosReact from "@kozmos-ds/react";
import { h, ref, type VNode } from "vue";
import {
  KozmosBottomSheet,
  KozmosBottomSheetClose,
  KozmosBottomSheetContent,
  KozmosBottomSheetDescription,
  KozmosBottomSheetFooter,
  KozmosBottomSheetHeader,
  KozmosBottomSheetTitle,
  KozmosBottomSheetTrigger,
  KozmosButton,
  KozmosDrawer,
  KozmosDrawerClose,
  KozmosDrawerContent,
  KozmosDrawerDescription,
  KozmosDrawerFooter,
  KozmosDrawerHeader,
  KozmosDrawerTitle,
  KozmosDrawerTrigger,
  KozmosPopover,
  KozmosPopoverContent,
  KozmosPopoverTrigger,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import {
  button,
  e,
  key,
  mountReact,
  mountVue,
  press,
  read,
  serverBoth,
  settle,
  useOverlayPage,
} from "./overlays";

/**
 * Drawer and BottomSheet, with every part each exports, drawn in both from
 * one description: closed on a server, and open, mounted: fixed at each
 * side in the theme's portal over its scrim; inline and modal over its
 * region alone; inline and not modal, a labelled panel beside the page.
 * Then what React's tests cover (Drawer.test.tsx, BottomSheet.test.tsx): a
 * panel takes focus only from its trigger, leaves a press and focus
 * outside to the product, closes on Escape only from inside, lets a
 * Popover inside it take Escape first, gives focus back only when it had
 * it; the close's name and the sheet's title; v-model:open and analytics.
 */
type Props = Record<string, unknown>;
interface Spec {
  root?: Props;
  content?: Props;
  /** Draw it as a BottomSheet. */
  sheet?: boolean;
  /** Its own sheet title, drawn in the content. */
  ownTitle?: boolean;
  /** No title in it. */
  untitled?: boolean;
  /** A Popover inside it. */
  popover?: boolean;
  /** A KozmosDrawerClose of its own in its footer. */
  footerClose?: boolean;
}
const asVue = ({ className, ...rest }: Props = {}) => ({
  ...rest,
  ...(className === undefined ? {} : { class: className }),
});

function reactTree(
  spec: Spec,
  listeners: { root?: Props; content?: Props } = {},
) {
  const P = spec.sheet
    ? {
        Root: KozmosReact.BottomSheet,
        Trigger: KozmosReact.BottomSheetTrigger,
        Content: KozmosReact.BottomSheetContent,
        Header: KozmosReact.BottomSheetHeader,
        Title: KozmosReact.BottomSheetTitle,
        Description: KozmosReact.BottomSheetDescription,
        Footer: KozmosReact.BottomSheetFooter,
        Close: KozmosReact.BottomSheetClose,
      }
    : {
        Root: KozmosReact.Drawer,
        Trigger: KozmosReact.DrawerTrigger,
        Content: KozmosReact.DrawerContent,
        Header: KozmosReact.DrawerHeader,
        Title: KozmosReact.DrawerTitle,
        Description: KozmosReact.DrawerDescription,
        Footer: KozmosReact.DrawerFooter,
        Close: KozmosReact.DrawerClose,
      };
  return e(
    "div",
    { className: "relative", "data-region": "" },
    e("button", { type: "button" }, "Page"),
    e(
      P.Root as React.ElementType,
      { ...spec.root, ...listeners.root },
      e(
        P.Trigger,
        { asChild: true },
        e(KozmosReact.Button, { variant: "outline" }, "Open drawer"),
      ),
      e(
        P.Content as React.ElementType,
        { ...spec.content, ...listeners.content },
        spec.untitled
          ? null
          : e(
              P.Header,
              null,
              spec.sheet && !spec.ownTitle
                ? null
                : e(P.Title, null, "Manage venue layers"),
              e(
                P.Description,
                null,
                "Review visibility, routing, and publishing settings.",
              ),
            ),
        spec.popover
          ? e(
              KozmosReact.Popover,
              null,
              e(KozmosReact.PopoverTrigger, null, "Places"),
              e(
                KozmosReact.PopoverContent,
                { "aria-label": "Places" },
                "Lobby",
              ),
            )
          : e(
              "div",
              { className: "rounded-control border p-4 text-sm" },
              "Drawer body",
            ),
        e(
          P.Footer,
          null,
          spec.footerClose
            ? e(
                P.Close,
                { asChild: true },
                e(KozmosReact.Button, { variant: "outline" }, "Cancel"),
              )
            : e(KozmosReact.Button, { variant: "outline" }, "Cancel"),
          e(KozmosReact.Button, null, "Save changes"),
        ),
      ),
    ),
  );
}

function vueTree(
  spec: Spec,
  listeners: { root?: Props; content?: Props } = {},
): VNode {
  const P = spec.sheet
    ? {
        Root: KozmosBottomSheet,
        Trigger: KozmosBottomSheetTrigger,
        Content: KozmosBottomSheetContent,
        Header: KozmosBottomSheetHeader,
        Title: KozmosBottomSheetTitle,
        Description: KozmosBottomSheetDescription,
        Footer: KozmosBottomSheetFooter,
        Close: KozmosBottomSheetClose,
      }
    : {
        Root: KozmosDrawer,
        Trigger: KozmosDrawerTrigger,
        Content: KozmosDrawerContent,
        Header: KozmosDrawerHeader,
        Title: KozmosDrawerTitle,
        Description: KozmosDrawerDescription,
        Footer: KozmosDrawerFooter,
        Close: KozmosDrawerClose,
      };
  return h("div", { class: "relative", "data-region": "" }, [
    h("button", { type: "button" }, "Page"),
    h(P.Root as never, { ...spec.root, ...listeners.root }, () => [
      h(P.Trigger, { asChild: true }, () =>
        h(KozmosButton, { variant: "outline" }, () => "Open drawer"),
      ),
      h(
        P.Content as never,
        { ...asVue(spec.content), ...listeners.content },
        () => [
          spec.untitled
            ? null
            : h(P.Header, null, () => [
                spec.sheet && !spec.ownTitle
                  ? null
                  : h(P.Title, null, () => "Manage venue layers"),
                h(
                  P.Description,
                  null,
                  () => "Review visibility, routing, and publishing settings.",
                ),
              ]),
          spec.popover
            ? h(KozmosPopover, null, () => [
                h(KozmosPopoverTrigger, null, () => "Places"),
                h(
                  KozmosPopoverContent,
                  { "aria-label": "Places" },
                  () => "Lobby",
                ),
              ])
            : h(
                "div",
                { class: "rounded-control border p-4 text-sm" },
                "Drawer body",
              ),
          h(P.Footer, null, () => [
            spec.footerClose
              ? h(P.Close, { asChild: true }, () =>
                  h(KozmosButton, { variant: "outline" }, () => "Cancel"),
                )
              : h(KozmosButton, { variant: "outline" }, () => "Cancel"),
            h(KozmosButton, null, () => "Save changes"),
          ]),
        ],
      ),
    ]),
  ]);
}

useOverlayPage();

describe("KozmosDrawer and KozmosBottomSheet draw what React's draw", () => {
  it.each<[string, Spec]>([
    ["a drawer", {}],
    ["a bottom sheet", { sheet: true }],
    ["an inline panel", { root: { placement: "inline", defaultOpen: true } }],
  ])("%s, on a server: as React's", async (_name, spec) => {
    const { react, vue } = await serverBoth(reactTree(spec), () =>
      vueTree(spec),
    );
    expect(vue).toBe(react);
  });

  it.each<[string, Spec]>([
    ...(["right", "left", "top", "bottom"] as const).map(
      (side): [string, Spec] => [
        `fixed, ${side}`,
        { root: { defaultOpen: true }, content: { side } },
      ],
    ),
    [
      "its close's own name",
      { root: { defaultOpen: true }, content: { closeLabel: "Fermer" } },
    ],
    [
      "no close",
      { root: { defaultOpen: true }, content: { showClose: false } },
    ],
    [
      "an app's class and attributes",
      {
        root: { defaultOpen: true },
        content: { className: "w-96", "data-parity": "content" },
      },
    ],
    [
      "inline and modal",
      { root: { placement: "inline", modal: true, defaultOpen: true } },
    ],
    ...(["right", "left", "top", "bottom"] as const).map(
      (side): [string, Spec] => [
        `an inline panel, ${side}`,
        { root: { placement: "inline", defaultOpen: true }, content: { side } },
      ],
    ),
    ["a bottom sheet", { sheet: true, root: { defaultOpen: true } }],
    [
      "a bottom sheet named by title",
      {
        sheet: true,
        root: { defaultOpen: true },
        content: { title: "Edit profile" },
      },
    ],
    [
      "a bottom sheet with its own title",
      { sheet: true, ownTitle: true, root: { defaultOpen: true } },
    ],
    [
      "a bottom sheet with no close",
      {
        sheet: true,
        root: { defaultOpen: true },
        content: { showClose: false },
      },
    ],
    [
      "an inline bottom sheet",
      { sheet: true, root: { placement: "inline", defaultOpen: true } },
    ],
  ])("%s: mounted, as React's", async (_name, spec) => {
    const react = await mountReact(reactTree(spec));
    const vue = await mountVue(() => vueTree(spec));
    expect(vue).toBe(react);
  });
});

/** What each heard and where things ended, after `steps`, in both. */
async function inBoth(
  spec: Spec,
  steps: ((side: "react" | "vue") => void | Promise<void>)[],
  probe: () => unknown = () => null,
) {
  const out = {} as Record<
    "react" | "vue",
    { heard: unknown[]; events: unknown[]; probes: unknown[] }
  >;
  for (const side of ["react", "vue"] as const) {
    delete (globalThis as { pageEscape?: boolean }).pageEscape;
    const heard: unknown[] = [];
    const events: KozmosAnalyticsEvent[] = [];
    const probes: unknown[] = [];
    const content = (prevent = (spec.content?.prevent as string) ?? "") => ({
      onOpenAutoFocus: () => heard.push("openAutoFocus"),
      onCloseAutoFocus: (event: Event) => {
        heard.push("closeAutoFocus");
        if (prevent.includes("close")) event.preventDefault();
      },
      onEscapeKeyDown: (event: Event) => {
        heard.push("escapeKeyDown");
        if (prevent.includes("escape")) event.preventDefault();
      },
      onPointerDownOutside: () => heard.push("pointerDownOutside"),
      onFocusOutside: () => heard.push("focusOutside"),
      onInteractOutside: () => heard.push("interactOutside"),
    });
    const own = { ...(spec.content ?? {}) } as Props;
    const closeOnOutside = own.closeOnOutside;
    delete own.prevent;
    delete own.closeOnOutside;
    const ownSpec = { ...spec, content: own };
    if (side === "react") {
      const Owner = () => {
        const [open, setOpen] = React.useState(!!spec.root?.defaultOpen);
        const listened = content();
        return reactTree(ownSpec, {
          root: {
            defaultOpen: undefined,
            open,
            onOpenChange: (next: boolean) => {
              heard.push(["open", next]);
              setOpen(next);
            },
          },
          content: {
            ...listened,
            onInteractOutside: () => {
              listened.onInteractOutside();
              if (closeOnOutside) setOpen(false);
            },
          },
        });
      };
      await mountReact(e(Owner), events);
    } else {
      const open = ref(!!spec.root?.defaultOpen);
      const listened = content();
      await mountVue(
        () =>
          vueTree(ownSpec, {
            root: h(KozmosDrawer, {
              defaultOpen: undefined,
              open: open.value,
              "onUpdate:open": (next: boolean) => {
                heard.push(["open", next]);
                open.value = next;
              },
            }).props as Props,
            content: h(KozmosDrawerContent, {
              onOpenAutoFocus: listened.onOpenAutoFocus,
              onCloseAutoFocus: listened.onCloseAutoFocus,
              onEscapeKeyDown: listened.onEscapeKeyDown,
              onPointerDownOutside: listened.onPointerDownOutside,
              onFocusOutside: listened.onFocusOutside,
              onInteractOutside: () => {
                listened.onInteractOutside();
                if (closeOnOutside) open.value = false;
              },
            }).props as Props,
          }),
        events,
      );
    }
    probes.push(probe());
    for (const step of steps) {
      if (side === "react") await act(async () => void (await step(side)));
      else await step(side);
      await settle();
      await settle();
      probes.push(probe());
    }
    out[side] = { heard: [...heard], events: read(events), probes };
  }
  return out;
}

const panel = () =>
  document.querySelector("[role=complementary], [role=dialog]");
const where = () => ({
  open: !!panel(),
  focus:
    document.activeElement === document.body
      ? "the page"
      : (document.activeElement?.getAttribute("aria-label") ??
        document.activeElement?.textContent?.trim()),
});
const inline = { placement: "inline" };

describe("KozmosDrawer, mounted, behaves as React's", () => {
  it("fixed: opens from its trigger, closes from its close giving the trigger focus, with v-model:open and analytics", async () => {
    const { react, vue } = await inBoth(
      {},
      [
        () => {
          button("Open drawer")!.focus();
          return press(button("Open drawer")!);
        },
        () => press(button("Close drawer")!),
      ],
      where,
    );
    expect(react.probes).toEqual([
      { open: false, focus: "the page" },
      // Its first stop, the close coming last.
      { open: true, focus: "Cancel" },
      { open: false, focus: "Open drawer" },
    ]);
    expect(
      react.events.map((event) => (event as { eventName: string }).eventName),
    ).toEqual(["button_clicked", "drawer_opened", "drawer_closed"]);
    expect(vue).toEqual(react);
  });

  it("fixed: closes on Escape and from a DrawerClose of its own", async () => {
    const escape = await inBoth(
      { root: { defaultOpen: true } },
      [() => void key(panel()!, "Escape")],
      where,
    );
    expect(escape.react.probes.at(-1)).toMatchObject({ open: false });
    expect(escape.vue).toEqual(escape.react);
    const own = await inBoth(
      { root: { defaultOpen: true }, footerClose: true },
      [() => press(button("Cancel")!)],
      where,
    );
    expect(own.react.probes.at(-1)).toMatchObject({ open: false });
    expect(own.vue).toEqual(own.react);
  });

  it("an inline panel the product opens takes no focus; one its trigger opens does, and its close gives the trigger focus", async () => {
    const byProduct = await inBoth(
      { root: { ...inline, defaultOpen: true } },
      [],
      where,
    );
    expect(byProduct.react.probes).toEqual([{ open: true, focus: "the page" }]);
    expect(byProduct.vue).toEqual(byProduct.react);
    const byTrigger = await inBoth(
      { root: inline },
      [
        () => {
          button("Open drawer")!.focus();
          return press(button("Open drawer")!);
        },
        () => press(button("Close drawer")!),
      ],
      where,
    );
    expect(byTrigger.react.probes[1]).toMatchObject({ open: true });
    expect(byTrigger.react.probes[2]).toEqual({
      open: false,
      focus: "Open drawer",
    });
    expect(byTrigger.vue).toEqual(byTrigger.react);
  });

  it("an inline panel closes on Escape only from inside, telling escapeKeyDown, and leaves the page's Escape alone", async () => {
    delete (globalThis as { pageEscape?: boolean }).pageEscape;
    const { react, vue } = await inBoth(
      { root: { ...inline, defaultOpen: true } },
      [
        () => {
          const page = button("Page")!;
          page.focus();
          const event = key(page, "Escape");
          (globalThis as { pageEscape?: boolean }).pageEscape =
            event.defaultPrevented;
        },
        () => {
          button("Save changes")!.focus();
          key(button("Save changes")!, "Escape");
        },
      ],
      () => ({
        ...where(),
        pagePrevented: (globalThis as { pageEscape?: boolean }).pageEscape,
      }),
    );
    expect(react.probes[1]).toMatchObject({ open: true, pagePrevented: false });
    expect(react.probes[2]).toMatchObject({ open: false });
    expect(react.heard).toContain("escapeKeyDown");
    expect(vue).toEqual(react);
  });

  it("an inline panel keeps an Escape its escapeKeyDown refuses", async () => {
    const { react, vue } = await inBoth(
      {
        root: { ...inline, defaultOpen: true },
        content: { prevent: "escape" },
      },
      [() => void key(button("Save changes")!, "Escape")],
      where,
    );
    expect(react.probes.at(-1)).toMatchObject({ open: true });
    expect(vue).toEqual(react);
  });

  it("an inline panel tells of a press and of focus outside, and stays open; closes on one in interactOutside; a press on its trigger is not outside", async () => {
    const stays = await inBoth(
      { root: { ...inline, defaultOpen: true } },
      [() => press(button("Page")!), () => button("Page")!.focus()],
      where,
    );
    expect(stays.react.heard).toEqual(
      expect.arrayContaining([
        "pointerDownOutside",
        "interactOutside",
        "focusOutside",
      ]),
    );
    expect(stays.react.probes.at(-1)).toMatchObject({ open: true });
    expect(stays.vue).toEqual(stays.react);

    const closes = await inBoth(
      {
        root: { ...inline, defaultOpen: true },
        content: { closeOnOutside: true },
      },
      [() => press(button("Page")!)],
      where,
    );
    expect(closes.react.probes.at(-1)).toEqual({ open: false, focus: "Page" });
    expect(closes.vue).toEqual(closes.react);

    const trigger = await inBoth(
      {
        root: { ...inline, defaultOpen: true },
        content: { closeOnOutside: true },
      },
      [() => press(button("Open drawer")!)],
      where,
    );
    expect(trigger.react.heard).not.toContain("pointerDownOutside");
    expect(trigger.react.probes.at(-1)).toMatchObject({ open: false });
    expect(trigger.vue).toEqual(trigger.react);
  });

  it("an inline panel lets a Popover inside it take Escape first", async () => {
    const { react, vue } = await inBoth(
      { root: { ...inline, defaultOpen: true }, popover: true },
      [
        () => {
          button("Places")!.focus();
          return press(button("Places")!);
        },
        () => void key(document.activeElement!, "Escape"),
        () => void key(document.activeElement!, "Escape"),
      ],
      () => ({
        ...where(),
        popover: !!document.querySelector('[role=dialog][aria-label="Places"]'),
      }),
    );
    expect(react.probes.slice(1)).toEqual([
      expect.objectContaining({ open: true, popover: true }),
      { open: true, popover: false, focus: "Places" },
      expect.objectContaining({ open: false, popover: false }),
    ]);
    expect(vue).toEqual(react);
  });

  it("an inline panel leaves focus on the page when it closes, if focus was never in it", async () => {
    const { react, vue } = await inBoth(
      { root: { ...inline, defaultOpen: true } },
      [
        () => {
          // The product closes it, from outside.
          button("Page")!.focus();
          button("Page")!.blur();
        },
      ],
      where,
    );
    expect(vue).toEqual(react);
  });

  it("an inline panel with nothing to name it warns in development, and not with a title", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const said = { react: 0, vue: 0 };
    await mountReact(
      reactTree({ root: { ...inline, defaultOpen: true }, untitled: true }),
    );
    said.react = warn.mock.calls.filter(([m]) =>
      String(m).startsWith("Drawer:"),
    ).length;
    warn.mockClear();
    await mountVue(() =>
      vueTree({ root: { ...inline, defaultOpen: true }, untitled: true }),
    );
    said.vue = warn.mock.calls.filter(([m]) =>
      String(m).startsWith("Drawer:"),
    ).length;
    warn.mockClear();
    await mountVue(() => vueTree({ root: { ...inline, defaultOpen: true } }));
    const titled = warn.mock.calls.filter(([m]) =>
      String(m).startsWith("Drawer:"),
    ).length;
    warn.mockRestore();
    expect(said.react).toBe(1);
    expect(said.vue).toBe(said.react);
    expect(titled).toBe(0);
  });

  it("a fixed trigger says it opens a dialog; a panel's says it controls the panel", async () => {
    for (const root of [{}, inline]) {
      const read = () => {
        const trigger = button("Open drawer")!;
        return [
          trigger.getAttribute("aria-haspopup"),
          !!trigger.getAttribute("aria-controls"),
        ];
      };
      await mountReact(reactTree({ root }));
      const react = read();
      await mountVue(() => vueTree({ root }));
      expect(read()).toEqual(react);
    }
  });
});

describe("KozmosBottomSheet, mounted, tells what React's tells", () => {
  it("v-model:open and the content's events, opened from its trigger and closed by Escape", async () => {
    const heard = { react: [] as unknown[], vue: [] as unknown[] };
    for (const side of ["react", "vue"] as const) {
      const log = heard[side];
      const listen = (name: string) => () => log.push(name);
      if (side === "react") {
        const Owner = () => {
          const [open, setOpen] = React.useState(false);
          return reactTree(
            { sheet: true },
            {
              root: {
                open,
                onOpenChange: (next: boolean) => {
                  log.push(["open", next]);
                  setOpen(next);
                },
              },
              content: {
                onOpenAutoFocus: listen("openAutoFocus"),
                onCloseAutoFocus: listen("closeAutoFocus"),
                onEscapeKeyDown: listen("escapeKeyDown"),
                onPointerDownOutside: listen("pointerDownOutside"),
                onFocusOutside: listen("focusOutside"),
                onInteractOutside: listen("interactOutside"),
              },
            },
          );
        };
        await mountReact(e(Owner));
      } else {
        const open = ref(false);
        await mountVue(() =>
          vueTree(
            { sheet: true },
            {
              root: h(KozmosBottomSheet, {
                open: open.value,
                "onUpdate:open": (next: boolean) => {
                  log.push(["open", next]);
                  open.value = next;
                },
              }).props as Props,
              content: h(KozmosBottomSheetContent, {
                onOpenAutoFocus: listen("openAutoFocus"),
                onCloseAutoFocus: listen("closeAutoFocus"),
                onEscapeKeyDown: listen("escapeKeyDown"),
                onPointerDownOutside: listen("pointerDownOutside"),
                onFocusOutside: listen("focusOutside"),
                onInteractOutside: listen("interactOutside"),
              }).props as Props,
            },
          ),
        );
      }
      const trigger = button("Open drawer")!;
      trigger.focus();
      if (side === "react") await act(() => press(trigger));
      else await press(trigger);
      await settle();
      if (side === "react") act(() => void key(panel()!, "Escape"));
      else key(panel()!, "Escape");
      await settle();
      await settle();
      heard[side] = [...log];
    }
    expect(heard.react).toEqual(
      expect.arrayContaining([
        ["open", true],
        "openAutoFocus",
        "escapeKeyDown",
        ["open", false],
      ]),
    );
    expect(heard.vue).toEqual(heard.react);
  });
});
