import { describe, expect, it } from "vitest";
import * as React from "react";
import { h, type VNode } from "vue";
import * as KozmosReact from "@kozmos-ds/react";
import {
  KozmosButton,
  KozmosEmptyState,
  KozmosLink,
  KozmosThemeProvider,
} from "../../src/index";
import { renderBoth } from "./render";

/**
 * React's EmptyState stories give it JSX (an icon, an action) or draw their
 * own render, so the stories parity check cannot draw them from args: here
 * is each, in both, and its edges (each tone, compact with and without a
 * description, a list beside a progress, a value past either end, a list
 * item that is a link). The icon is the same plain glyph in both; Button and
 * Link are native in both. The progress bar is React's Progress and Vue's
 * KozmosProgress: its role, values and states are compared here.
 */
const pair = (react: () => React.ReactNode, vue: () => VNode | VNode[]) =>
  renderBoth({
    react: KozmosReact.ThemeProvider,
    vue: KozmosThemeProvider,
    children: [{ react: () => react(), vue: { setup: () => vue } }],
  });

const R = React.createElement;

/** The search icon's stand-in: the same element in both. */
const icon = {
  react: () => R("span", { className: "h-8 w-8 text-muted-foreground" }, "⌕"),
  vue: () => h("span", { class: "h-8 w-8 text-muted-foreground" }, "⌕"),
};

/** React's story's frame, the same element in both. */
const frame = (height: string) =>
  `w-[360px] ${height} border rounded-container bg-card flex`;

type Props = Record<string, unknown>;
/** An EmptyState in both, its icon and action given as slots in Vue. */
const emptyState = (
  props: Props,
  { withIcon = false, action }: { withIcon?: boolean; action?: string } = {},
) => ({
  react: () =>
    R(KozmosReact.EmptyState, {
      ...(props as { title: string }),
      icon: withIcon ? icon.react() : undefined,
      action: action
        ? R(KozmosReact.Button, { variant: "outline" }, action)
        : undefined,
    }),
  vue: () =>
    h(KozmosEmptyState, props as { title: string }, {
      ...(withIcon ? { icon: () => [icon.vue()] } : {}),
      ...(action
        ? {
            action: () => [
              h(KozmosButton, { variant: "outline" }, () => action),
            ],
          }
        : {}),
    }),
});

describe("KozmosEmptyState draws what React's EmptyState draws", () => {
  it("Default: draws what React's story draws", async () => {
    const part = emptyState(
      {
        title: "No results found",
        description:
          "We couldn't find any places matching your search. Please check your spelling or try another term.",
      },
      { withIcon: true, action: "Clear Search" },
    );
    const { react, vue } = await pair(
      () => R("div", { className: frame("h-[400px]") }, part.react()),
      () => h("div", { class: frame("h-[400px]") }, [part.vue()]),
    );
    expect(react).toContain("w-16 h-16 rounded-pill bg-muted");
    expect(vue).toBe(react);
  });

  it("Compact: draws what React's story draws", async () => {
    const SIZES = ["default", "compact"] as const;
    const parts = SIZES.map((size) =>
      emptyState(
        {
          description: "Nothing at this airport serves Korean food.",
          size,
          title: "No Korean restaurants found",
        },
        { withIcon: true },
      ),
    );
    const box = "w-[320px] max-w-full rounded-container border border-dashed";
    const { react, vue } = await pair(
      () =>
        R(
          "div",
          { className: "flex flex-wrap items-start gap-6" },
          ...parts.map((part, i) =>
            R("div", { key: i, className: box }, part.react()),
          ),
        ),
      () =>
        h(
          "div",
          { class: "flex flex-wrap items-start gap-6" },
          parts.map((part) => h("div", { class: box }, [part.vue()])),
        ),
    );
    expect(react).toContain('data-size="compact"');
    expect(vue).toBe(react);
  });

  it("DownloadProgress: draws what React's story draws", async () => {
    const part = emptyState(
      {
        title: "The assistant isn't downloaded yet",
        description: "It works offline once it's on this device.",
        progress: {
          value: 40,
          label: "Downloading the assistant",
          valueText: "12 of 30 MB",
        },
      },
      { action: "Back to search" },
    );
    const { react, vue } = await pair(
      () => R("div", { className: frame("h-[400px]") }, part.react()),
      () => h("div", { class: frame("h-[400px]") }, [part.vue()]),
    );
    expect(react).toContain('role="progressbar"');
    expect(react).toContain('aria-valuetext="12 of 30 MB"');
    expect(vue).toBe(react);
  });

  it("WithList: draws what React's story draws", async () => {
    const part = emptyState(
      {
        title: "No Map Content Found",
        description: "Nothing on this level matches your search.",
        listLabel: "What to try",
        list: [
          "Check the building and level",
          "Clear the type filters",
          "Search by another name or an ID",
        ],
      },
      { withIcon: true, action: "Clear filters" },
    );
    const { react, vue } = await pair(
      () => R("div", { className: frame("h-[440px]") }, part.react()),
      () => h("div", { class: frame("h-[440px]") }, [part.vue()]),
    );
    expect(react).toContain('role="list"');
    expect(vue).toBe(react);
  });

  it.each(["neutral", "themed", "success", "danger", "informative", "alert"])(
    "the %s tone, a card of its own, with an app's style over it",
    async (tone) => {
      const part = emptyState(
        {
          title: "No Map Content Found",
          description: "Nothing on this level matches your search.",
          tone,
          list: ["Check the level"],
          progress: { value: 100, label: "Indexing" },
          style: { minHeight: "120px" },
        },
        { withIcon: true },
      );
      const { react, vue } = await pair(part.react, part.vue);
      expect(react).toContain(`--semantics-emotion-${tone}-surface`);
      expect(vue).toBe(react);
    },
  );

  it.each([
    [
      "compact, a list and a progress without a description",
      { size: "compact" },
    ],
    ["a list and a progress without a description", {}],
    [
      "compact, with a description",
      { size: "compact", description: "Nothing here." },
    ],
  ] as const)("%s", async (_name, props) => {
    const part = emptyState(
      {
        title: "Nothing yet",
        list: ["Check the level"],
        progress: { value: 12.5, label: "Loading" },
        ...props,
      },
      { withIcon: true, action: "Back" },
    );
    const { react, vue } = await pair(part.react, part.vue);
    expect(vue).toBe(react);
  });

  it.each([
    ["past the end", 140],
    ["before the start", -3],
    ["not a number", Number.NaN],
  ])("a progress value %s, clamped", async (_name, value) => {
    const part = emptyState({
      title: "Downloading",
      progress: { value, label: "The assistant", valueText: "" },
    });
    const { react, vue } = await pair(part.react, part.vue);
    expect(react).toContain('role="progressbar"');
    expect(vue).toBe(react);
  });

  it("an empty list draws none, and an item may be a link", async () => {
    const { react, vue } = await pair(
      () =>
        R(
          React.Fragment,
          null,
          R(KozmosReact.EmptyState, { title: "Empty", list: [] }),
          R(KozmosReact.EmptyState, {
            title: "Linked",
            list: [
              "Check the level",
              R(KozmosReact.Link, { href: "/help" }, "Read the help"),
            ],
          }),
        ),
      () => [
        h(KozmosEmptyState, { title: "Empty", list: [] }),
        h(KozmosEmptyState, {
          title: "Linked",
          list: [
            "Check the level",
            h(KozmosLink, { href: "/help" }, () => "Read the help"),
          ],
        }),
      ],
    );
    expect(react.match(/<ul/g)).toHaveLength(1);
    expect(vue).toBe(react);
  });
});
