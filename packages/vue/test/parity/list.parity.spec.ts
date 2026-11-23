import { describe, expect, it } from "vitest";
import * as React from "react";
import { createCommentVNode, defineComponent, h } from "vue";
import * as KozmosReact from "@kozmos-ds/react";
import {
  KozmosButton,
  KozmosIcon,
  KozmosList,
  KozmosListItem,
  KozmosListItemStatus,
  KozmosTag,
  KozmosThemeProvider,
} from "../../src/index";
import { renderBoth, type Drawn } from "./render";
import { element, slotted } from "./slotted";

/**
 * React's List stories draw their rows with their own render, so the
 * stories parity check cannot draw them from args: here is each, drawn in
 * both, and the edges React's tests cover (ListItem.slots.test.tsx). Where
 * a story holds a part Vue has no native port of yet (Checkbox,
 * IconButton), the same element stands in for it in both, so what is
 * compared is the list's own drawing; Button, Tag and Icon are native, and
 * drawn as themselves.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const list = (props: Record<string, unknown>, rows: Drawn[]) =>
  slotted(KozmosReact.List, KozmosList, props, { default: rows }, vue(props));
const row = (
  props: Record<string, unknown>,
  slots: Record<string, (Drawn | string)[]>,
) => slotted(KozmosReact.ListItem, KozmosListItem, props, slots, vue(props));
const status = (props: Record<string, unknown>) =>
  slotted(
    KozmosReact.ListItemStatus,
    KozmosListItemStatus,
    props,
    {},
    vue(props),
  );
const button = (props: Record<string, unknown>, label: string) =>
  slotted(KozmosReact.Button, KozmosButton, props, { default: [label] });
const tag = (label: string) =>
  slotted(
    KozmosReact.Tag,
    KozmosTag,
    { variant: "secondary" },
    { default: [label] },
  );
/** React's `className` is Vue's `class`. */
function vue(props: Record<string, unknown>) {
  const { className, ...rest } = props;
  return className === undefined ? rest : { ...rest, class: className };
}
const items = (...words: string[]) =>
  words.map((w) => row({}, { default: [w] }));

const both = (tree: Drawn) => renderBoth(inTheme(tree));

describe("KozmosList draws what React's List draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await both(
      list({}, items("First item", "Second item", "Third item")),
    );
    expect(react).toContain('data-density="default"');
    expect(vue).toBe(react);
  });

  it("Compact: draws what React's story draws", async () => {
    const { react, vue } = await both(
      list(
        { density: "compact" },
        items("First item", "Second item", "Third item"),
      ),
    );
    expect(react).toContain('data-density="compact"');
    expect(vue).toBe(react);
  });

  it("Checklist: draws what React's story draws", async () => {
    const tour = (
      state: string,
      title: string,
      role: string,
      description: string,
      meta: string,
      action: Drawn,
    ) =>
      row(
        {},
        {
          leading: [status({ status: state })],
          title: [title],
          titleAddon: [tag(role)],
          description: [description],
          meta: [meta],
          trailing: [action],
        },
      );
    const { react, vue } = await both(
      list({ className: "w-mobile" }, [
        tour(
          "done",
          "Explore the map",
          "Viewer",
          "Pan, zoom and change levels.",
          "2 min",
          button({ size: "sm", variant: "outline" }, "Replay"),
        ),
        tour(
          "inProgress",
          "Add a point of interest",
          "Editor",
          "Place it, name it and choose its type.",
          "Step 2 of 4 · 3 min",
          button({ size: "sm" }, "Resume"),
        ),
        tour(
          "todo",
          "Publish your changes",
          "Admin",
          "Review what changed and make it live.",
          "4 min",
          button({ size: "sm" }, "Start"),
        ),
      ]),
    );
    expect(react).toContain("kozmos-list-item-slotted");
    expect(react).toContain('data-slot="title-addon"');
    expect(react).toContain("kozmos-list-item-status-check");
    expect(vue).toBe(react);
  });

  it("PersonaVisibility: draws what React's story draws", async () => {
    const shown: Record<string, boolean> = {
      Visitor: true,
      Staff: false,
      Contractor: true,
    };
    const { react, vue } = await both(
      list(
        { density: "compact", className: "w-mobile" },
        Object.keys(shown).map((persona) =>
          row(
            { selected: shown[persona] },
            {
              // Icon's, IconButton's and Checkbox's places.
              leading: [
                slotted(KozmosReact.Icon, KozmosIcon, {
                  name: "user",
                  size: "sm",
                  color: "muted",
                }),
              ],
              title: [persona],
              titleAddon: [
                element("button", { "aria-label": `About ${persona}` }),
              ],
              trailing: [
                element("button", {
                  role: "checkbox",
                  "aria-checked": String(shown[persona]),
                  "aria-label": `Show to ${persona}`,
                }),
              ],
            },
          ),
        ),
      ),
    );
    expect(react).toContain("kozmos-list-item-selected");
    expect(react).toContain("data-selected>");
    expect(vue).toBe(react);
  });

  it.each([
    ["a row with no slots is its children", {}, { default: ["Reception"] }],
    [
      "a title alone draws the body and heading, and nothing else",
      {},
      { title: ["Reception"] },
    ],
    [
      "an add-on with no title draws the heading around it alone",
      {},
      { titleAddon: ["New"] },
    ],
    [
      "a description and meta, with children after them in the body",
      {},
      {
        description: ["Ground floor"],
        meta: ["2 min"],
        default: ["More"],
      },
    ],
    [
      "a trailing control alone",
      {},
      { trailing: [element("button", {}, ["Open"])] },
    ],
    [
      "selected, with a class after the recipe's",
      { selected: true, className: "kozmos-parity" },
      { default: ["Reception"] },
    ],
    [
      "not selected: no tint and no data-selected",
      { selected: false },
      { title: ["Reception"] },
    ],
  ] as const)("%s", async (_name, props, slots) => {
    const { react, vue } = await both(
      list({}, [
        row({ ...props }, slots as Record<string, (Drawn | string)[]>),
      ]),
    );
    expect(vue).toBe(react);
  });

  it("a slot whose content is all v-if'd away is no slot, as React's null", async () => {
    // React's `title={null}`; Vue's `<template #title><b v-if="false" /></template>`.
    const { react, vue } = await both(
      list({}, [
        {
          react: () =>
            React.createElement(
              KozmosReact.ListItem,
              { title: null },
              "Reception",
            ),
          vue: defineComponent({
            setup: () => () =>
              h(KozmosListItem, null, {
                title: () => [createCommentVNode("v-if")],
                default: () => ["Reception"],
              }),
          }),
        },
      ]),
    );
    expect(react).not.toContain("kozmos-list-item-slotted");
    expect(vue).toBe(react);
  });

  it.each([
    ["not started", { status: "todo" }],
    ["in progress", { status: "inProgress" }],
    ["done", { status: "done" }],
    ["a product's own words", { status: "done", label: "Terminé" }],
  ] as const)("ListItemStatus: %s", async (_name, props) => {
    const { react, vue } = await both(status({ ...props }));
    expect(vue).toBe(react);
  });
});
