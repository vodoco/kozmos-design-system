import { describe, expect, it } from "vitest";
import * as React from "react";
import { h } from "vue";
import * as KozmosReact from "@kozmos-ds/react";
import { KozmosThemeProvider, KozmosBadge } from "../../src/index";
import { renderBoth } from "./render";

/**
 * What the stories parity check cannot draw from React's args, drawn in
 * both: React's Icon story, whose icon is JSX, and the counter's edges.
 * The icon is the same element in both (a plain glyph), so the comparison is
 * of Badge's own drawing; `@kozmos-ds/icons` draws its own in each.
 */
describe("KozmosBadge draws what React's Badge draws", () => {
  const both = (
    props: Record<string, unknown>,
    slots: { icon?: string; counter?: string; label?: string } = {},
  ) =>
    renderBoth({
      react: KozmosReact.ThemeProvider,
      vue: KozmosThemeProvider,
      children: [
        {
          react: (reactProps: Record<string, unknown>) =>
            React.createElement(
              KozmosReact.Badge,
              {
                ...reactProps,
                icon: slots.icon
                  ? React.createElement("span", null, slots.icon)
                  : undefined,
                counter: slots.counter,
              },
              slots.label,
            ),
          vue: {
            setup: () => () =>
              h(KozmosBadge, props, {
                ...(slots.icon ? { icon: () => [h("span", slots.icon)] } : {}),
                ...(slots.counter ? { counter: () => [slots.counter!] } : {}),
                ...(slots.label ? { default: () => [slots.label!] } : {}),
              }),
          },
          props,
        },
      ],
    });

  it("Icon: draws what React's story draws", async () => {
    const { react, vue } = await both(
      { "aria-label": "Verified", size: "icon", variant: "default" },
      { icon: "✓" },
    );
    expect(react).toContain('role="img"');
    expect(react).toContain('data-slot="badge-icon"');
    expect(vue).toBe(react);
  });

  it.each([
    [
      "an icon beside the label",
      { variant: "secondary" },
      { icon: "✓", label: "Verified" },
    ],
    ["an icon Badge's label, with no icon", { size: "icon" }, { label: "✓" }],
    [
      "a counter in parentheses",
      { showCounter: true },
      { label: "New", counter: "(3)" },
    ],
    ["a counter without show-counter", {}, { label: "New", counter: "3" }],
    [
      "no counter on an icon Badge",
      { size: "icon", showCounter: true },
      { icon: "✓", counter: "3" },
    ],
    [
      "the destructive counter's tone",
      { variant: "destructive", showCounter: true },
      { label: "Errors", counter: "4" },
    ],
    [
      "the outline counter's tone",
      { variant: "outline", showCounter: true, size: "lg" },
      { label: "Drafts", counter: "5" },
    ],
  ] as const)("%s", async (_name, props, slots) => {
    const { react, vue } = await both({ ...props }, slots);
    expect(vue).toBe(react);
  });
});
