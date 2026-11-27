// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import * as KozmosReact from "@kozmos-ds/react";
import { h, ref, type VNode } from "vue";
import {
  KozmosBottomSheet,
  KozmosBottomSheetContent,
  KozmosBottomSheetDescription,
  KozmosBottomSheetTitle,
  KozmosBottomSheetTrigger,
  KozmosButton,
  KozmosCombobox,
  KozmosDialog,
  KozmosDialogContent,
  KozmosDialogDescription,
  KozmosDialogTitle,
  KozmosDialogTrigger,
  KozmosDrawer,
  KozmosDrawerContent,
  KozmosDrawerDescription,
  KozmosDrawerTitle,
  KozmosDrawerTrigger,
  KozmosMultiSelect,
  KozmosPopover,
  KozmosPopoverContent,
  KozmosPopoverTrigger,
  KozmosSelect,
  KozmosSelectContent,
  KozmosSelectItem,
  KozmosSelectTrigger,
  KozmosSelectValue,
} from "../../src/index";
import {
  button,
  e,
  key,
  mountReact,
  mountVue,
  press,
  settle,
  useOverlayPage,
} from "./overlays";

/**
 * Why the overlays were ported together (wave V2): a native Select,
 * Combobox or MultiSelect inside an overlay must work as React's does inside React's. Each
 * host is opened from its trigger; the field in it is opened and an option
 * pressed: the value changes and the host stays open; then Escape closes
 * only the field's list first, and the host next. Run in both frameworks,
 * step by step, each step's outcome compared. The browser suites prove the
 * same with real input (scripts/check-vue-interactions.mjs, `layers-*`),
 * where a modal's body pointer-events and the popup's are real.
 */

type Host = "dialog" | "drawer" | "bottom sheet" | "popover";
const fruit = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
];

function reactHost(host: Host, field: React.ReactElement) {
  const trigger = e(KozmosReact.Button, null, "Open");
  if (host === "popover")
    return e(
      KozmosReact.Popover,
      null,
      e(KozmosReact.PopoverTrigger, { asChild: true }, trigger),
      e(KozmosReact.PopoverContent, { "aria-label": "Choose" }, field),
    );
  const [Root, Trigger, Content, Title, Description] =
    host === "dialog"
      ? [
          KozmosReact.Dialog,
          KozmosReact.DialogTrigger,
          KozmosReact.DialogContent,
          KozmosReact.DialogTitle,
          KozmosReact.DialogDescription,
        ]
      : host === "drawer"
        ? [
            KozmosReact.Drawer,
            KozmosReact.DrawerTrigger,
            KozmosReact.DrawerContent,
            KozmosReact.DrawerTitle,
            KozmosReact.DrawerDescription,
          ]
        : [
            KozmosReact.BottomSheet,
            KozmosReact.BottomSheetTrigger,
            KozmosReact.BottomSheetContent,
            KozmosReact.BottomSheetTitle,
            KozmosReact.BottomSheetDescription,
          ];
  return e(
    Root as React.ElementType,
    null,
    e(Trigger as React.ElementType, { asChild: true }, trigger),
    e(
      Content as React.ElementType,
      null,
      e(Title as React.ElementType, null, "Choose"),
      e(Description as React.ElementType, null, "Choose a fruit"),
      field,
    ),
  );
}

function vueHost(host: Host, field: () => VNode): VNode {
  const trigger = () => h(KozmosButton, null, () => "Open");
  if (host === "popover")
    return h(KozmosPopover, null, () => [
      h(KozmosPopoverTrigger, { asChild: true }, trigger),
      h(KozmosPopoverContent, { "aria-label": "Choose" }, field),
    ]);
  const [Root, Trigger, Content, Title, Description] =
    host === "dialog"
      ? [
          KozmosDialog,
          KozmosDialogTrigger,
          KozmosDialogContent,
          KozmosDialogTitle,
          KozmosDialogDescription,
        ]
      : host === "drawer"
        ? [
            KozmosDrawer,
            KozmosDrawerTrigger,
            KozmosDrawerContent,
            KozmosDrawerTitle,
            KozmosDrawerDescription,
          ]
        : [
            KozmosBottomSheet,
            KozmosBottomSheetTrigger,
            KozmosBottomSheetContent,
            KozmosBottomSheetTitle,
            KozmosBottomSheetDescription,
          ];
  return h(Root as never, null, () => [
    h(Trigger as never, { asChild: true }, trigger),
    h(Content as never, null, () => [
      h(Title as never, null, () => "Choose"),
      h(Description as never, null, () => "Choose a fruit"),
      field(),
    ]),
  ]);
}

/** What a step leaves: the host open, the list open, the value, focus. */
const state = (value: () => string) => ({
  host: document.querySelectorAll("[role=dialog]").length,
  list: document.querySelectorAll("[role=listbox]").length,
  value: value(),
  focus:
    document.activeElement === document.body
      ? "the page"
      : (document.activeElement?.getAttribute("role") ??
        document.activeElement?.tagName),
});

async function inBoth(
  host: Host,
  field: "select" | "combobox" | "multiselect",
  steps: (() => void | Promise<void>)[],
) {
  const seen = { react: [] as unknown[], vue: [] as unknown[] };
  for (const side of ["react", "vue"] as const) {
    const values: string[] = [];
    const value = () => values.at(-1) ?? "";
    if (side === "react") {
      const Field = () =>
        field === "select"
          ? e(
              KozmosReact.Select,
              { onValueChange: (next: string) => values.push(next) },
              e(
                KozmosReact.SelectTrigger,
                { "aria-label": "Fruit" },
                e(KozmosReact.SelectValue, { placeholder: "Pick" }),
              ),
              e(
                KozmosReact.SelectContent,
                null,
                ...fruit.map((option) =>
                  e(
                    KozmosReact.SelectItem,
                    { key: option.value, value: option.value },
                    option.label,
                  ),
                ),
              ),
            )
          : field === "combobox"
            ? e(KozmosReact.Combobox, {
                label: "Fruit",
                options: fruit,
                onValueChange: (next: string) => values.push(next),
              })
            : e(KozmosReact.MultiSelect, {
                label: "Fruit",
                options: fruit,
                onValueChange: (next: string[]) => values.push(next.join()),
              });
      await mountReact(reactHost(host, e(Field)));
    } else {
      const chosen = ref<string>();
      await mountVue(() =>
        vueHost(host, () =>
          field === "select"
            ? h(
                KozmosSelect,
                {
                  modelValue: chosen.value,
                  "onUpdate:modelValue": (next: string) => {
                    chosen.value = next;
                    values.push(next);
                  },
                },
                () => [
                  h(KozmosSelectTrigger, { "aria-label": "Fruit" }, () =>
                    h(KozmosSelectValue, null, { placeholder: () => "Pick" }),
                  ),
                  h(KozmosSelectContent, null, () =>
                    fruit.map((option) =>
                      h(
                        KozmosSelectItem,
                        { value: option.value },
                        () => option.label,
                      ),
                    ),
                  ),
                ],
              )
            : field === "combobox"
              ? h(KozmosCombobox, {
                  label: "Fruit",
                  options: fruit,
                  modelValue: chosen.value,
                  "onUpdate:modelValue": (next: string) => {
                    chosen.value = next;
                    values.push(next);
                  },
                })
              : h(KozmosMultiSelect, {
                  label: "Fruit",
                  options: fruit,
                  modelValue: chosen.value ? chosen.value.split(",") : [],
                  "onUpdate:modelValue": (next: string[]) => {
                    chosen.value = next.join();
                    values.push(next.join());
                  },
                }),
        ),
      );
    }
    for (const step of steps) {
      if (side === "react") await act(async () => void (await step()));
      else await step();
      await settle();
      await settle();
      seen[side].push(state(value));
    }
  }
  return seen;
}

const open = () => {
  const trigger = button("Open")!;
  trigger.focus();
  return press(trigger);
};
const option = (words: string) =>
  [...document.querySelectorAll("[role=option]")].find(
    (row) => row.textContent?.trim() === words,
  )!;
const escape = () =>
  void key(document.activeElement ?? document.body, "Escape");

useOverlayPage();

describe.each<Host>(["dialog", "drawer", "bottom sheet", "popover"])(
  "a native field in a native %s",
  (host) => {
    it("Select: a press on an option chooses it and leaves the host open; Escape closes the list, then the host", async () => {
      const trigger = () =>
        document.querySelector<HTMLElement>("button[role=combobox]")!;
      const seen = await inBoth(host, "select", [
        open,
        () => key(trigger(), "Enter"),
        () => press(option("Banana")),
        () => key(trigger(), "Enter"),
        escape,
        escape,
      ]);
      expect(seen.react.map((step) => (step as { host: number }).host)).toEqual(
        [1, 1, 1, 1, 1, 0],
      );
      expect(seen.react.map((step) => (step as { list: number }).list)).toEqual(
        [0, 1, 0, 1, 0, 0],
      );
      expect((seen.react[2] as { value: string }).value).toBe("banana");
      expect(seen.vue).toEqual(seen.react);
    });

    it("Combobox: its popup takes a press on an option, which chooses it and leaves the host open; Escape closes the popup, then the host", async () => {
      const field = () =>
        document.querySelector<HTMLInputElement>("input[role=combobox]")!;
      const seen = await inBoth(host, "combobox", [
        open,
        () => field().focus(),
        () => press(option("Banana")),
        () => key(field(), "ArrowDown"),
        escape,
        escape,
      ]);
      expect(seen.react[1]).toMatchObject({ host: 1, list: 1 });
      expect(seen.react[2]).toMatchObject({ host: 1, value: "banana" });
      expect(seen.react[4]).toMatchObject({ host: 1, list: 0 });
      expect(seen.react[5]).toMatchObject({ host: 0 });
      expect(seen.vue).toEqual(seen.react);
    });

    it("MultiSelect: its popup takes a press on an option, which chooses it and leaves the host and the list open; Escape closes the list, then the host", async () => {
      const field = () =>
        document.querySelector<HTMLInputElement>("input[role=combobox]")!;
      const seen = await inBoth(host, "multiselect", [
        open,
        () => field().focus(),
        () => press(option("Banana")),
        escape,
        escape,
      ]);
      expect(seen.react[1]).toMatchObject({ host: 1, list: 1 });
      expect(seen.react[2]).toMatchObject({ host: 1, value: "banana" });
      expect(seen.react[3]).toMatchObject({ host: 1, list: 0 });
      expect(seen.react[4]).toMatchObject({ host: 0 });
      expect(seen.vue).toEqual(seen.react);
    });
  },
);
