import { describe, expect, it } from "vitest";
import * as React from "react";
import { h, type VNode } from "vue";
import * as KozmosReact from "@kozmos-ds/react";
import {
  KozmosBreadcrumb,
  KozmosBreadcrumbItem,
  KozmosBreadcrumbLink,
  KozmosBreadcrumbList,
  KozmosBreadcrumbPage,
  KozmosBreadcrumbSeparator,
  KozmosButton,
  KozmosPageHeader,
  KozmosThemeProvider,
} from "../../src/index";
import { renderBoth } from "./render";

/**
 * React's PageHeader stories give it JSX (a breadcrumb, buttons, an info
 * button), so the stories parity check cannot draw them from args: here is
 * each, in both, and its edges (a title addon, the panel inset, a header
 * that is not centred, what an app adds). Breadcrumb and Button are native
 * in both; IconButton (bridged), and the Text and Container the Plain story
 * draws under the header, are the same plain elements in both, so what is
 * compared is the header's own drawing, its Container, Heading and Text
 * included.
 */
const pair = (react: () => React.ReactNode, vue: () => VNode | VNode[]) =>
  renderBoth({
    react: KozmosReact.ThemeProvider,
    vue: KozmosThemeProvider,
    children: [{ react: () => react(), vue: { setup: () => vue } }],
  });

const R = React.createElement;

const crumbs = {
  react: () =>
    R(
      KozmosReact.Breadcrumb,
      null,
      R(
        KozmosReact.BreadcrumbList,
        null,
        R(
          KozmosReact.BreadcrumbItem,
          null,
          R(KozmosReact.BreadcrumbLink, { href: "#" }, "Boston Logan Airport"),
        ),
        R(KozmosReact.BreadcrumbSeparator),
        R(
          KozmosReact.BreadcrumbItem,
          null,
          R(KozmosReact.BreadcrumbPage, null, "Settings"),
        ),
      ),
    ),
  vue: () =>
    h(KozmosBreadcrumb, null, () => [
      h(KozmosBreadcrumbList, null, () => [
        h(KozmosBreadcrumbItem, null, () => [
          h(KozmosBreadcrumbLink, { href: "#" }, () => "Boston Logan Airport"),
        ]),
        h(KozmosBreadcrumbSeparator),
        h(KozmosBreadcrumbItem, null, () => [
          h(KozmosBreadcrumbPage, null, () => "Settings"),
        ]),
      ]),
    ]),
};

/** A node prop's stand-in, the same plain element in both. */
const plain = (tag: string, props: Record<string, string>, text: string) => ({
  react: () =>
    R(
      tag,
      Object.fromEntries(
        Object.entries(props).map(([k, v]) => [
          k === "class" ? "className" : k,
          v,
        ]),
      ),
      text,
    ),
  vue: () => h(tag, props, text),
});

const DESCRIPTION = "Manage the site's map, its levels and who can edit them.";

describe("KozmosPageHeader draws what React's PageHeader draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await pair(
      () =>
        R(KozmosReact.PageHeader, {
          breadcrumb: crumbs.react(),
          title: "Settings",
          description: DESCRIPTION,
          actions: R(KozmosReact.Button, null, "Save changes"),
        }),
      () =>
        h(KozmosPageHeader, null, {
          breadcrumb: () => [crumbs.vue()],
          title: () => "Settings",
          description: () => DESCRIPTION,
          actions: () => [h(KozmosButton, null, () => "Save changes")],
        }),
    );
    expect(react).toContain('data-tone="subtle"');
    expect(react).toContain("<h1");
    expect(vue).toBe(react);
  });

  it("Landing: draws what React's story draws", async () => {
    const plus = plain(
      "span",
      { "aria-hidden": "true", class: "h-5 w-5" },
      "+",
    );
    const { react, vue } = await pair(
      () =>
        R(KozmosReact.PageHeader, {
          size: "lg",
          title: "Welcome back",
          description: "Pick up where you left off, or start a new map.",
          actions: R(KozmosReact.Button, null, plus.react(), "New site"),
        }),
      () =>
        h(
          KozmosPageHeader,
          { size: "lg" },
          {
            title: () => "Welcome back",
            description: () =>
              "Pick up where you left off, or start a new map.",
            actions: () => [
              h(KozmosButton, null, () => [plus.vue(), "New site"]),
            ],
          },
        ),
    );
    expect(react).toContain("kozmos-text-3xl");
    expect(vue).toBe(react);
  });

  it("WithInfo: draws what React's story draws", async () => {
    const info = plain(
      "button",
      { "aria-label": "About map content", class: "kozmos-icon-button" },
      "i",
    );
    const { react, vue } = await pair(
      () =>
        R(KozmosReact.PageHeader, {
          breadcrumb: crumbs.react(),
          title: "Map content",
          info: info.react(),
          description: "Every feature on the map, by level and type.",
          actions: R(
            React.Fragment,
            null,
            R(KozmosReact.Button, { variant: "outline" }, "Import"),
            R(KozmosReact.Button, null, "Publish"),
          ),
        }),
      () =>
        h(KozmosPageHeader, null, {
          breadcrumb: () => [crumbs.vue()],
          title: () => "Map content",
          info: () => [info.vue()],
          description: () => "Every feature on the map, by level and type.",
          actions: () => [
            h(KozmosButton, { variant: "outline" }, () => "Import"),
            h(KozmosButton, null, () => "Publish"),
          ],
        }),
    );
    expect(react).toContain('data-slot="page-header-info"');
    expect(vue).toBe(react);
  });

  it("Plain: draws what React's story draws", async () => {
    // React's Container and Text under it: the classes each draws.
    const below = {
      react: () =>
        R(
          "div",
          { className: "w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl" },
          R(
            "p",
            {
              className:
                "kozmos-reset kozmos-text kozmos-text-sm kozmos-text-normal kozmos-text-start kozmos-text-default",
            },
            "The content of the page starts here, on the same edge.",
          ),
        ),
      vue: () =>
        h("div", { class: "w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl" }, [
          h(
            "p",
            {
              class:
                "kozmos-reset kozmos-text kozmos-text-sm kozmos-text-normal kozmos-text-start kozmos-text-default",
            },
            "The content of the page starts here, on the same edge.",
          ),
        ]),
    };
    const { react, vue } = await pair(
      () =>
        R(
          React.Fragment,
          null,
          R(KozmosReact.PageHeader, {
            tone: "default",
            breadcrumb: crumbs.react(),
            title: "Settings",
            description: DESCRIPTION,
            actions: R(KozmosReact.Button, null, "Save changes"),
          }),
          below.react(),
        ),
      () => [
        h(
          KozmosPageHeader,
          { tone: "default" },
          {
            breadcrumb: () => [crumbs.vue()],
            title: () => "Settings",
            description: () => DESCRIPTION,
            actions: () => [h(KozmosButton, null, () => "Save changes")],
          },
        ),
        below.vue(),
      ],
    );
    expect(react).toContain('data-tone="default"');
    expect(react).not.toContain("kozmos-page-header-subtle");
    expect(vue).toBe(react);
  });

  it.each([
    ["a title addon", {}, true],
    [
      "the panel inset, not centred",
      { inset: "panel", centered: false },
      false,
    ],
  ] as const)("%s", async (_name, props, addon) => {
    const tag = plain(
      "span",
      { class: "kozmos-tag" },
      "Changes Awaiting Publish",
    );
    const { react, vue } = await pair(
      () =>
        R(KozmosReact.PageHeader, {
          ...props,
          title: "Map content",
          titleAddon: addon ? tag.react() : undefined,
        }),
      () =>
        h(KozmosPageHeader, props, {
          title: () => "Map content",
          ...(addon ? { titleAddon: () => [tag.vue()] } : {}),
        }),
    );
    expect(vue).toBe(react);
  });
});
