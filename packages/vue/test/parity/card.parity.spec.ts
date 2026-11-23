import { describe, expect, it } from "vitest";
import * as React from "react";
import { h, type VNode } from "vue";
import * as KozmosReact from "@kozmos-ds/react";
import {
  KozmosButton,
  KozmosCard,
  KozmosCardContent,
  KozmosCardDescription,
  KozmosCardFooter,
  KozmosCardHeader,
  KozmosCardTitle,
  KozmosThemeProvider,
} from "../../src/index";
import { renderBoth } from "./render";

/**
 * React's Card stories each draw the card's parts by hand, so the stories
 * parity check cannot draw them from args: here is each, drawn in both, and
 * the parts' edges (padding through the card, a subtle header's title, a
 * header's actions, a title's level and size, a nested card). Label,
 * Input, IconButton and Heading, which the stories draw beside the card
 * (Input and IconButton bridged), are the same plain elements in both, so
 * what is compared is the card's own drawing; Button is native in both.
 */
const pair = (react: () => React.ReactNode, vue: () => VNode | VNode[]) =>
  renderBoth({
    react: KozmosReact.ThemeProvider,
    vue: KozmosThemeProvider,
    children: [{ react: () => react(), vue: { setup: () => vue } }],
  });

const R = React.createElement;

/** IconButton's stand-in: the same plain button in both. */
const iconButton = {
  react: (label: string) => R("button", { "aria-label": label }, "✎"),
  vue: (label: string) => h("button", { "aria-label": label }, "✎"),
};

describe("KozmosCard draws what React's Card draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await pair(
      () =>
        R(
          KozmosReact.Card,
          { className: "w-mobile" },
          R(
            KozmosReact.CardHeader,
            null,
            R(KozmosReact.CardTitle, null, "Create project"),
            R(
              KozmosReact.CardDescription,
              null,
              "Deploy your new project in one-click.",
            ),
          ),
          R(
            KozmosReact.CardContent,
            null,
            R(
              "form",
              null,
              R(
                "div",
                { className: "grid w-full items-center gap-4" },
                R(
                  "div",
                  { className: "flex flex-col space-y-1.5" },
                  R("label", { htmlFor: "name" }, "Name"),
                  R("input", {
                    id: "name",
                    placeholder: "Name of your project",
                  }),
                ),
              ),
            ),
          ),
          R(
            KozmosReact.CardFooter,
            { className: "flex justify-between" },
            R(KozmosReact.Button, { variant: "outline" }, "Cancel"),
            R(KozmosReact.Button, null, "Deploy"),
          ),
        ),
      () =>
        h(KozmosCard, { class: "w-mobile" }, () => [
          h(KozmosCardHeader, null, () => [
            h(KozmosCardTitle, null, () => "Create project"),
            h(
              KozmosCardDescription,
              null,
              () => "Deploy your new project in one-click.",
            ),
          ]),
          h(KozmosCardContent, null, () => [
            h("form", null, [
              h("div", { class: "grid w-full items-center gap-4" }, [
                h("div", { class: "flex flex-col space-y-1.5" }, [
                  h("label", { for: "name" }, "Name"),
                  h("input", {
                    id: "name",
                    placeholder: "Name of your project",
                  }),
                ]),
              ]),
            ]),
          ]),
          h(KozmosCardFooter, { class: "flex justify-between" }, () => [
            h(KozmosButton, { variant: "outline" }, () => "Cancel"),
            h(KozmosButton, null, () => "Deploy"),
          ]),
        ]),
    );
    expect(react).toContain('data-padding="default"');
    expect(vue).toBe(react);
  });

  it("TitleLevel: draws what React's story draws", async () => {
    const { react, vue } = await pair(
      () =>
        R(
          "div",
          { className: "flex w-mobile max-w-full flex-col gap-4" },
          R("h1", null, "Settings"),
          R(
            KozmosReact.Card,
            { className: "w-full" },
            R(
              KozmosReact.CardHeader,
              null,
              R(KozmosReact.CardTitle, { as: "h2" }, "Client details"),
              R(
                KozmosReact.CardDescription,
                null,
                "The client this site belongs to.",
              ),
            ),
            R(
              KozmosReact.CardContent,
              { className: "text-sm text-muted-foreground" },
              "Pointr",
            ),
          ),
        ),
      () =>
        h("div", { class: "flex w-mobile max-w-full flex-col gap-4" }, [
          h("h1", null, "Settings"),
          h(KozmosCard, { class: "w-full" }, () => [
            h(KozmosCardHeader, null, () => [
              h(KozmosCardTitle, { as: "h2" }, () => "Client details"),
              h(
                KozmosCardDescription,
                null,
                () => "The client this site belongs to.",
              ),
            ]),
            h(
              KozmosCardContent,
              { class: "text-sm text-muted-foreground" },
              () => "Pointr",
            ),
          ]),
        ]),
    );
    expect(react).toContain("<h2");
    expect(vue).toBe(react);
  });

  const PADDINGS = ["default", "compact"] as const;

  it("Padding: draws what React's story draws", async () => {
    const { react, vue } = await pair(
      () =>
        R(
          "div",
          { className: "flex flex-wrap gap-6" },
          ...PADDINGS.map((padding) =>
            R(
              KozmosReact.Card,
              { key: padding, padding, className: "w-[320px] max-w-full" },
              R(
                KozmosReact.CardHeader,
                null,
                R(KozmosReact.CardTitle, { className: "text-base" }, "Search"),
                R(
                  KozmosReact.CardDescription,
                  null,
                  "How visitors search at this site.",
                ),
              ),
              R(
                KozmosReact.CardContent,
                { className: "text-sm text-muted-foreground" },
                `padding="${padding}" — ${padding === "default" ? 24 : 16}px`,
              ),
            ),
          ),
        ),
      () =>
        h(
          "div",
          { class: "flex flex-wrap gap-6" },
          PADDINGS.map((padding) =>
            h(KozmosCard, { padding, class: "w-[320px] max-w-full" }, () => [
              h(KozmosCardHeader, null, () => [
                h(KozmosCardTitle, { class: "text-base" }, () => "Search"),
                h(
                  KozmosCardDescription,
                  null,
                  () => "How visitors search at this site.",
                ),
              ]),
              h(
                KozmosCardContent,
                { class: "text-sm text-muted-foreground" },
                () =>
                  `padding="${padding}" — ${padding === "default" ? 24 : 16}px`,
              ),
            ]),
          ),
        ),
    );
    expect(react).toContain("p-4");
    expect(vue).toBe(react);
  });

  it("WithoutHeader: draws what React's story draws", async () => {
    const { react, vue } = await pair(
      () =>
        R(
          "div",
          { className: "flex flex-wrap gap-6" },
          ...PADDINGS.map((padding) =>
            R(
              "div",
              {
                key: padding,
                className: "flex w-[320px] max-w-full flex-col gap-6",
              },
              R(
                KozmosReact.Card,
                { padding, className: "w-full" },
                R(
                  KozmosReact.CardContent,
                  { className: "text-sm text-muted-foreground" },
                  `Content alone — ${padding === "default" ? 24 : 16}px on every side.`,
                ),
              ),
              R(
                KozmosReact.Card,
                { padding, className: "w-full" },
                R(
                  KozmosReact.CardContent,
                  { className: "text-sm text-muted-foreground" },
                  "Content above a footer.",
                ),
                R(
                  KozmosReact.CardFooter,
                  { className: "justify-end gap-2" },
                  R(KozmosReact.Button, { variant: "outline" }, "Cancel"),
                  R(KozmosReact.Button, null, "Save"),
                ),
              ),
            ),
          ),
        ),
      () =>
        h(
          "div",
          { class: "flex flex-wrap gap-6" },
          PADDINGS.map((padding) =>
            h("div", { class: "flex w-[320px] max-w-full flex-col gap-6" }, [
              h(KozmosCard, { padding, class: "w-full" }, () => [
                h(
                  KozmosCardContent,
                  { class: "text-sm text-muted-foreground" },
                  () =>
                    `Content alone — ${padding === "default" ? 24 : 16}px on every side.`,
                ),
              ]),
              h(KozmosCard, { padding, class: "w-full" }, () => [
                h(
                  KozmosCardContent,
                  { class: "text-sm text-muted-foreground" },
                  () => "Content above a footer.",
                ),
                h(KozmosCardFooter, { class: "justify-end gap-2" }, () => [
                  h(KozmosButton, { variant: "outline" }, () => "Cancel"),
                  h(KozmosButton, null, () => "Save"),
                ]),
              ]),
            ]),
          ),
        ),
    );
    expect(react).toContain("[--kozmos-card-lead:0px]");
    expect(vue).toBe(react);
  });

  it("HeaderActions: draws what React's story draws", async () => {
    const { react, vue } = await pair(
      () =>
        R(
          KozmosReact.Card,
          { className: "w-mobile" },
          R(
            KozmosReact.CardHeader,
            { actions: iconButton.react("Edit Boston Logan Airport") },
            R(KozmosReact.CardTitle, null, "Boston Logan Airport"),
            R(KozmosReact.CardDescription, null, "3 buildings, 11 levels"),
          ),
          R(
            KozmosReact.CardContent,
            null,
            R("p", { className: "text-sm" }, "Changes awaiting publish."),
          ),
        ),
      () =>
        h(KozmosCard, { class: "w-mobile" }, () => [
          h(KozmosCardHeader, null, {
            actions: () => [iconButton.vue("Edit Boston Logan Airport")],
            default: () => [
              h(KozmosCardTitle, null, () => "Boston Logan Airport"),
              h(KozmosCardDescription, null, () => "3 buildings, 11 levels"),
            ],
          }),
          h(KozmosCardContent, null, () => [
            h("p", { class: "text-sm" }, "Changes awaiting publish."),
          ]),
        ]),
    );
    expect(react).toContain('data-slot="card-header-actions"');
    expect(vue).toBe(react);
  });

  it("SubtleHeader: draws what React's story draws", async () => {
    const { react, vue } = await pair(
      () =>
        R(
          "div",
          { className: "flex flex-wrap gap-6" },
          R(
            KozmosReact.Card,
            { padding: "compact", className: "w-[400px] max-w-full" },
            R(
              KozmosReact.CardHeader,
              {
                tone: "subtle",
                actions: R(
                  React.Fragment,
                  null,
                  iconButton.react("Help"),
                  iconButton.react("Close"),
                ),
              },
              R(KozmosReact.CardTitle, null, "Add beacon"),
              R(KozmosReact.CardDescription, null, "Terminal A / Level 2"),
            ),
            R(
              KozmosReact.CardContent,
              null,
              R(
                KozmosReact.Button,
                { variant: "subtle", className: "w-full" },
                "+ Add additional field",
              ),
            ),
          ),
          R(
            KozmosReact.Card,
            { className: "w-[320px] max-w-full" },
            R(
              KozmosReact.CardHeader,
              { tone: "subtle" },
              R(KozmosReact.CardTitle, null, "Landmark directions"),
            ),
            R(
              KozmosReact.CardContent,
              { className: "text-sm text-muted-foreground" },
              "A lone title: the strip stays 52.",
            ),
          ),
        ),
      () =>
        h("div", { class: "flex flex-wrap gap-6" }, [
          h(
            KozmosCard,
            { padding: "compact", class: "w-[400px] max-w-full" },
            () => [
              h(
                KozmosCardHeader,
                { tone: "subtle" },
                {
                  actions: () => [
                    iconButton.vue("Help"),
                    iconButton.vue("Close"),
                  ],
                  default: () => [
                    h(KozmosCardTitle, null, () => "Add beacon"),
                    h(
                      KozmosCardDescription,
                      null,
                      () => "Terminal A / Level 2",
                    ),
                  ],
                },
              ),
              h(KozmosCardContent, null, () => [
                h(
                  KozmosButton,
                  { variant: "subtle", class: "w-full" },
                  () => "+ Add additional field",
                ),
              ]),
            ],
          ),
          h(KozmosCard, { class: "w-[320px] max-w-full" }, () => [
            h(KozmosCardHeader, { tone: "subtle" }, () => [
              h(KozmosCardTitle, null, () => "Landmark directions"),
            ]),
            h(
              KozmosCardContent,
              { class: "text-sm text-muted-foreground" },
              () => "A lone title: the strip stays 52.",
            ),
          ]),
        ]),
    );
    expect(react).toContain('data-tone="subtle"');
    expect(react).toContain('data-size="sm"');
    expect(vue).toBe(react);
  });

  it("TitleSize: draws what React's story draws", async () => {
    const SIZES = ["lg", "md", "sm"] as const;
    const { react, vue } = await pair(
      () =>
        R(
          "div",
          { className: "flex flex-wrap gap-6" },
          ...SIZES.map((size) =>
            R(
              KozmosReact.Card,
              {
                key: size,
                padding: "compact",
                className: "w-[240px] max-w-full",
              },
              R(
                KozmosReact.CardHeader,
                null,
                R(KozmosReact.CardTitle, { size }, "Lunch nearby"),
                R(KozmosReact.CardDescription, null, `size="${size}"`),
              ),
            ),
          ),
        ),
      () =>
        h(
          "div",
          { class: "flex flex-wrap gap-6" },
          SIZES.map((size) =>
            h(
              KozmosCard,
              { padding: "compact", class: "w-[240px] max-w-full" },
              () => [
                h(KozmosCardHeader, null, () => [
                  h(KozmosCardTitle, { size }, () => "Lunch nearby"),
                  h(KozmosCardDescription, null, () => `size="${size}"`),
                ]),
              ],
            ),
          ),
        ),
    );
    expect(react).toContain('data-size="md"');
    expect(vue).toBe(react);
  });

  it.each([
    [
      "a subtle header's title, sized by hand",
      { tone: "subtle" },
      { size: "lg" },
    ],
    ["a compact card's subtle header", { tone: "subtle" }, {}],
    ["a title at h4", {}, { as: "h4" }],
  ] as const)("%s", async (_name, header, title) => {
    const { react, vue } = await pair(
      () =>
        R(
          KozmosReact.Card,
          { padding: "compact" },
          R(
            KozmosReact.CardHeader,
            header,
            R(KozmosReact.CardTitle, title, "Level 2"),
          ),
        ),
      () =>
        h(KozmosCard, { padding: "compact" }, () => [
          h(KozmosCardHeader, header, () => [
            h(KozmosCardTitle, title, () => "Level 2"),
          ]),
        ]),
    );
    expect(vue).toBe(react);
  });

  it("a card inside a card takes its own padding, not the outer's", async () => {
    const { react, vue } = await pair(
      () =>
        R(
          KozmosReact.Card,
          { padding: "compact" },
          R(
            KozmosReact.CardContent,
            null,
            R(
              KozmosReact.Card,
              null,
              R(KozmosReact.CardContent, null, "Inner"),
              R(KozmosReact.CardFooter, null, "End"),
            ),
          ),
        ),
      () =>
        h(KozmosCard, { padding: "compact" }, () => [
          h(KozmosCardContent, null, () => [
            h(KozmosCard, null, () => [
              h(KozmosCardContent, null, () => "Inner"),
              h(KozmosCardFooter, null, () => "End"),
            ]),
          ]),
        ]),
    );
    expect(react).toContain("px-6 pb-6");
    expect(vue).toBe(react);
  });

  it("a header's actions slot that draws nothing draws no actions box", async () => {
    const { react, vue } = await pair(
      () => R(KozmosReact.CardHeader, { actions: null }, "Title"),
      () =>
        h(KozmosCardHeader, null, {
          actions: () => [],
          default: () => "Title",
        }),
    );
    expect(react).not.toContain("card-header-actions");
    expect(vue).toBe(react);
  });
});
