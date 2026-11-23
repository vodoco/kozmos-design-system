import { describe, expect, it } from "vitest";
import * as React from "react";
import { h, type VNode } from "vue";
import * as KozmosReact from "@kozmos-ds/react";
import {
  KozmosBreadcrumb,
  KozmosBreadcrumbEllipsis,
  KozmosBreadcrumbItem,
  KozmosBreadcrumbLink,
  KozmosBreadcrumbList,
  KozmosBreadcrumbPage,
  KozmosBreadcrumbSeparator,
  KozmosThemeProvider,
} from "../../src/index";
import { renderBoth } from "./render";

/**
 * React's Breadcrumb story draws its parts by hand, so the stories parity
 * check cannot draw it from args: here it is in both, and each part's edges:
 * the ellipsis's dots and words, a separator's own mark, a link drawn on
 * its child (`as-child`), and an app's name for the trail. The chevron and
 * the dots are `@kozmos-ds/icons`' in React and `@kozmos-ds/icons/vue`'s in
 * Vue: the same <svg>.
 */
const pair = (react: () => React.ReactNode, vue: () => VNode | VNode[]) =>
  renderBoth({
    react: KozmosReact.ThemeProvider,
    vue: KozmosThemeProvider,
    children: [{ react: () => react(), vue: { setup: () => vue } }],
  });

const R = React.createElement;

describe("KozmosBreadcrumb draws what React's Breadcrumb draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await pair(
      () =>
        R(
          KozmosReact.Breadcrumb,
          null,
          R(
            KozmosReact.BreadcrumbList,
            null,
            R(
              KozmosReact.BreadcrumbItem,
              null,
              R(KozmosReact.BreadcrumbLink, { href: "/" }, "Home"),
            ),
            R(KozmosReact.BreadcrumbSeparator),
            R(
              KozmosReact.BreadcrumbItem,
              null,
              R(
                KozmosReact.BreadcrumbLink,
                { href: "/components" },
                "Components",
              ),
            ),
            R(KozmosReact.BreadcrumbSeparator),
            R(
              KozmosReact.BreadcrumbItem,
              null,
              R(KozmosReact.BreadcrumbPage, null, "Breadcrumb"),
            ),
          ),
        ),
      () =>
        h(KozmosBreadcrumb, null, () => [
          h(KozmosBreadcrumbList, null, () => [
            h(KozmosBreadcrumbItem, null, () => [
              h(KozmosBreadcrumbLink, { href: "/" }, () => "Home"),
            ]),
            h(KozmosBreadcrumbSeparator),
            h(KozmosBreadcrumbItem, null, () => [
              h(
                KozmosBreadcrumbLink,
                { href: "/components" },
                () => "Components",
              ),
            ]),
            h(KozmosBreadcrumbSeparator),
            h(KozmosBreadcrumbItem, null, () => [
              h(KozmosBreadcrumbPage, null, () => "Breadcrumb"),
            ]),
          ]),
        ]),
    );
    expect(react).toContain('aria-label="breadcrumb"');
    expect(react).toContain('aria-current="page"');
    expect(react).toContain("<svg");
    expect(vue).toBe(react);
  });

  it("the ellipsis: its dots, and its words for a screen reader", async () => {
    const { react, vue } = await pair(
      () => R(KozmosReact.BreadcrumbEllipsis, { className: "h-8" }),
      () => h(KozmosBreadcrumbEllipsis, { class: "h-8" }),
    );
    expect(react).toContain('"More"');
    expect(vue).toBe(react);
  });

  it("a separator with its own mark", async () => {
    const { react, vue } = await pair(
      () => R(KozmosReact.BreadcrumbSeparator, null, "/"),
      () => h(KozmosBreadcrumbSeparator, null, () => "/"),
    );
    expect(react).not.toContain("<svg");
    expect(vue).toBe(react);
  });

  it("a link drawn on its child, as-child", async () => {
    const { react, vue } = await pair(
      () =>
        R(
          KozmosReact.BreadcrumbLink,
          { asChild: true, className: "underline" },
          R("a", { href: "/levels", className: "router-link" }, "Levels"),
        ),
      () =>
        h(KozmosBreadcrumbLink, { asChild: true, class: "underline" }, () => [
          h("a", { href: "/levels", class: "router-link" }, "Levels"),
        ]),
    );
    expect(react).toContain("router-link");
    expect(vue).toBe(react);
  });

  it("an app's own name for the trail", async () => {
    const { react, vue } = await pair(
      () =>
        R(KozmosReact.Breadcrumb, { "aria-label": "Where you are" }, "Trail"),
      () =>
        h(KozmosBreadcrumb, { "aria-label": "Where you are" }, () => "Trail"),
    );
    expect(react).toContain('aria-label="Where you are"');
    expect(vue).toBe(react);
  });
});
