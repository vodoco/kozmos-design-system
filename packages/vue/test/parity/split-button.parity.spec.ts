// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import * as KozmosReact from "@kozmos-ds/react";
import { Download01 as ReactDownload } from "@kozmos-ds/icons";
import { Download01 } from "@kozmos-ds/icons/vue";
import { h, type VNode } from "vue";
import {
  KozmosMenuItem,
  KozmosMenuLabel,
  KozmosSplitButton,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import {
  body,
  button,
  e,
  mountReact,
  mountVue,
  press,
  read,
  serverBoth,
  settle,
  useOverlayPage,
} from "./overlays";

/**
 * SplitButton (GAP-168) in both: its story, closed as a server draws it and
 * open; each variant's seam (site GAP-73, GAP-200) and size; its menu half's
 * name; items with an icon, a separator, a disabled item and custom content
 * in the `#menu-content` slot (React's `menuContent`), open; and, mounted,
 * `@main-click`, each item's `onClick` (never a disabled one's), and the
 * analytics each press reports.
 */

useOverlayPage();

type Item =
  | { type: "separator" }
  | {
      label: string;
      icon?: boolean;
      disabled?: boolean;
      textValue?: string;
    };

const reactTree = (
  props: Record<string, unknown>,
  items: Item[] = [],
  heard: string[] = [],
  content = false,
) =>
  e(
    KozmosReact.SplitButton,
    {
      ...props,
      onMainClick: () => heard.push("main"),
      menuItems: items.map((item) =>
        "type" in item
          ? item
          : {
              ...item,
              icon: item.icon ? e(ReactDownload, null) : undefined,
              onClick: () => heard.push(item.label),
            },
      ),
      menuContent: content
        ? e(
            React.Fragment,
            null,
            e(KozmosReact.MenuLabel, null, "Schedule"),
            e(
              KozmosReact.MenuItem,
              { onSelect: () => heard.push("tonight") },
              "Publish tonight",
            ),
          )
        : undefined,
    },
    "Publish",
  );

const vueTree = (
  props: Record<string, unknown>,
  items: Item[] = [],
  heard: string[] = [],
  content = false,
): VNode =>
  h(
    KozmosSplitButton,
    {
      ...props,
      onMainClick: () => heard.push("main"),
      menuItems: items.map((item) =>
        "type" in item
          ? item
          : {
              ...item,
              icon: item.icon ? Download01 : undefined,
              onClick: () => heard.push(item.label),
            },
      ),
    },
    {
      default: () => "Publish",
      ...(content
        ? {
            menuContent: () => [
              h(KozmosMenuLabel, null, () => "Schedule"),
              h(
                KozmosMenuItem,
                { onSelect: () => heard.push("tonight") },
                () => "Publish tonight",
              ),
            ],
          }
        : {}),
    },
  );

const items: Item[] = [
  { label: "Publish to staging", icon: true },
  { type: "separator" },
  { label: "Publish to production", disabled: true },
];

const row = (words: string) =>
  [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
    (item) => item.textContent?.trim() === words,
  )!;

describe("KozmosSplitButton draws what React's SplitButton draws", () => {
  it("Default: the story's Save, with its two items, closed", async () => {
    const story = [{ label: "Save as Draft" }, { label: "Save and Publish" }];
    const { react, vue } = await serverBoth(
      React.cloneElement(reactTree({}, story), {}, "Save"),
      () => h(KozmosSplitButton, { menuItems: story }, () => "Save"),
    );
    expect(react).toContain('aria-label="More options"');
    expect(vue).toBe(react);
  });

  it("each variant's seam, each size, disabled, its menu half's name and an app's attributes", async () => {
    for (const props of [
      { variant: "outline" },
      { variant: "subtle" },
      { variant: "destructive" },
      { size: "sm" },
      { size: "lg" },
      { disabled: true },
      { menuLabel: "Weitere Optionen" },
      { id: "publish", className: "w-full", "data-app": "split" },
    ]) {
      const { react, vue } = await serverBoth(reactTree(props), () =>
        vueTree({
          ...props,
          ...("className" in props ? { class: props.className } : {}),
          className: undefined,
        }),
      );
      expect(vue).toBe(react);
    }
  });

  it("open: an item's icon before its words, a separator, a disabled item, and custom content after", async () => {
    const drawn: string[] = [];
    for (const mount of ["react", "vue"] as const) {
      if (mount === "react") await mountReact(reactTree({}, items, [], true));
      else await mountVue(() => vueTree({}, items, [], true));
      const open = () => press(button("More options")!);
      if (mount === "react") await act(open);
      else await open();
      await settle();
      drawn.push(body());
    }
    expect(drawn[0]).toContain("Publish tonight");
    expect(drawn[1]).toBe(drawn[0]);
  });
});

describe("KozmosSplitButton behaves as React's SplitButton", () => {
  it("@main-click, each item's onClick (not a disabled one's), custom content's select, and their analytics", async () => {
    const seen: Record<string, { heard: string[]; events: unknown[] }> = {};
    for (const mount of ["react", "vue"] as const) {
      const heard: string[] = [];
      const events: KozmosAnalyticsEvent[] = [];
      if (mount === "react")
        await mountReact(reactTree({}, items, heard, true), events);
      else await mountVue(() => vueTree({}, items, heard, true), events);
      const steps = [
        () => press(button("Publish")!),
        () => press(button("More options")!),
        () => press(row("Publish to production")),
        () => press(row("Publish to staging")),
        () => press(button("More options")!),
        () => press(row("Publish tonight")),
      ];
      for (const step of steps) {
        if (mount === "react") await act(step);
        else await step();
        await settle();
      }
      seen[mount] = { heard, events: read(events) };
    }
    expect(seen.react.heard).toEqual(["main", "Publish to staging", "tonight"]);
    // The main half reports its own press and no button_clicked; the menu
    // half is a plain Button; each item its label, as React's.
    expect(
      (seen.react.events as { component: string; eventName: string }[]).map(
        (event) => `${event.component} ${event.eventName}`,
      ),
    ).toEqual([
      "SplitButton split_button_main_clicked",
      "Button button_clicked",
      "Menu menu_item_selected",
      "SplitButton split_button_menu_item_clicked",
      "Button button_clicked",
      "Menu menu_item_selected",
    ]);
    expect(seen.vue).toEqual(seen.react);
  });
});
