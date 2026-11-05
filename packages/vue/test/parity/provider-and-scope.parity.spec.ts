import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { ConfigProvider, injectConfigProviderContext, useId } from "reka-ui";
import {
  KozmosButton,
  KozmosDensityScope,
  KozmosThemeProvider,
  useKozmosDensity,
} from "../../src/index";
import { renderBoth, type Drawn } from "./render";
import { normalizeHtml } from "./normalize-html";

const theme = (
  props: Record<string, unknown>,
  ...children: (Drawn | string)[]
): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  props,
  children,
});
const scope = (
  props: Record<string, unknown>,
  ...children: (Drawn | string)[]
): Drawn => ({
  react: KozmosReact.DensityScope,
  vue: KozmosDensityScope,
  props,
  children,
});
const element = (
  tag: string,
  props: Record<string, unknown>,
  ...children: (Drawn | string)[]
): Drawn => ({
  react: tag,
  vue: tag,
  props,
  children,
});
const button = (text: string, props: Record<string, unknown> = {}): Drawn => ({
  react: KozmosReact.Button,
  vue: KozmosButton,
  props,
  children: [text],
});

describe("a DensityScope with as-child marks what React's marks", () => {
  const cases: [string, Drawn][] = [
    [
      "nested as-child scopes: the inner one marks the element",
      theme(
        {},
        scope(
          { density: "compact", asChild: true },
          scope(
            { density: "touch", asChild: true },
            element("nav", {}, "Tools"),
          ),
        ),
      ),
    ],
    [
      "an as-child scope around a plain scope: the plain scope's element keeps its own",
      theme(
        {},
        scope(
          { density: "compact", asChild: true },
          scope({ density: "touch" }, button("Save")),
        ),
      ),
    ],
    [
      "a child that carries a density already takes the scope's",
      theme(
        {},
        scope(
          { density: "compact", asChild: true },
          element(
            "button",
            { "data-kozmos-density": "touch", type: "button" },
            "Go",
          ),
        ),
      ),
    ],
    [
      "a part as the child takes it on its element",
      theme({}, scope({ density: "compact", asChild: true }, button("Save"))),
    ],
  ];
  for (const [name, tree] of cases) {
    it(name, async () => {
      const { react, vue } = await renderBoth(tree);
      expect(vue).toBe(react);
    });
  }

  it("nested as-child scopes give what is inside the inner density", async () => {
    const Probe = defineComponent({
      setup() {
        const density = useKozmosDensity();
        return () => h("output", { "data-read": density?.value });
      },
    });
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(KozmosThemeProvider, null, () =>
            h(KozmosDensityScope, { density: "compact", asChild: true }, () =>
              h(KozmosDensityScope, { density: "touch", asChild: true }, () =>
                h("nav", null, [h(Probe)]),
              ),
            ),
          ),
      }),
    );
    expect(html).toContain('<nav data-kozmos-density="touch">');
    expect(html).toContain('data-read="touch"');
  });
});

describe("KozmosThemeProvider inside an outer Reka ConfigProvider", () => {
  const Probe = defineComponent({
    setup() {
      const config = injectConfigProviderContext();
      const id = useId();
      return () =>
        h("output", {
          "data-dir": config.dir.value,
          "data-locale": config.locale.value,
          "data-nonce": config.nonce.value ?? "none",
          "data-scroll-body": String(config.scrollBody.value),
          "data-teleport-to": String(config.teleportTo.value ?? "none"),
          "data-id": id,
        });
    },
  });

  it("keeps the outer locale, scroll lock, nonce, teleport target and id source, and sets only dir", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            ConfigProvider,
            {
              locale: "de",
              nonce: "n0nce",
              scrollBody: false,
              teleportTo: "#overlays",
              useId: () => "custom",
            },
            () => h(KozmosThemeProvider, { dir: "rtl" }, () => h(Probe)),
          ),
      }),
    );
    const read = (name: string) =>
      html.match(new RegExp(`${name}="([^"]*)"`))?.[1];
    expect({
      dir: read("data-dir"),
      locale: read("data-locale"),
      nonce: read("data-nonce"),
      scrollBody: read("data-scroll-body"),
      teleportTo: read("data-teleport-to"),
      id: read("data-id"),
    }).toEqual({
      dir: "rtl",
      locale: "de",
      nonce: "n0nce",
      scrollBody: "false",
      teleportTo: "#overlays",
      id: "reka-custom",
    });
  });

  it("with no outer config, Reka's own defaults and the provider's direction", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(KozmosThemeProvider, null, () => h(Probe)),
      }),
    );
    expect(html).toContain('data-dir="ltr"');
    expect(html).toContain('data-locale="en"');
    expect(html).toContain('data-scroll-body="true"');
    expect(html).toContain('data-nonce="none"');
  });
});

describe("KozmosThemeProvider takes no attributes, as React's ThemeProvider takes none", () => {
  it("draws the same element when given a class and an id", async () => {
    // React's ThemeProvider names its props and passes nothing else on: a
    // className or id given to it reaches no element.
    const { react, vue, raw } = await renderBoth({
      react: KozmosReact.ThemeProvider,
      vue: KozmosThemeProvider,
      props: { className: "shell", id: "app" },
      vueProps: { class: "shell", id: "app" },
      children: [button("Go")],
    });
    expect(vue).toBe(react);
    expect(raw.vue).not.toMatch(/class="shell"|id="app"/);
    expect(normalizeHtml(raw.react)).not.toMatch(/shell|"app"/);
  });
});
