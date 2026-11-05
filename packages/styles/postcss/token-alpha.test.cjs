const assert = require("node:assert/strict");
const { test } = require("node:test");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const { withTokenAlpha } = require("./token-alpha.cjs");

test("plain roles stay unchanged; nested roles and arbitrary opacity stay live", () => {
  const colors = withTokenAlpha({
    background: "var(--background)",
    card: { foreground: "var(--ink)" },
    white: "#fff",
  });
  assert.equal(colors.background(), "var(--background)");
  assert.equal(colors.background({ opacityValue: "1" }), "var(--background)");
  assert.equal(
    colors.background({
      opacityValue: "var(--tw-bg-opacity)",
      opacityVariable: "--tw-bg-opacity",
    }),
    "var(--background)",
  );
  assert.equal(
    colors.card.foreground({ opacityValue: ".35" }),
    "color-mix(in srgb, var(--ink) calc(.35 * 100%), transparent)",
  );
  assert.equal(colors.white, "#fff");
});

test("real compiler emits base, hover, border, text, ring and arbitrary alpha", async () => {
  const config = require("../tailwind.config.js");
  const result = await postcss([
    tailwind({
      ...config,
      content: [
        {
          raw: "bg-background bg-background/50 hover:bg-accent/10 border-border/70 text-foreground/50 ring-primary/20 bg-muted/[0.35]",
          extension: "html",
        },
      ],
    }),
  ]).process("@tailwind utilities;", { from: undefined });
  for (const selector of [
    ".bg-background\\/50",
    ".hover\\:bg-accent\\/10:hover",
    ".border-border\\/70",
    ".text-foreground\\/50",
    ".ring-primary\\/20",
    ".bg-muted\\/\\[0\\.35\\]",
  ]) {
    assert(result.css.includes(selector), `Missing compiled ${selector}`);
  }
  assert.match(
    result.css,
    /color-mix\(in srgb, var\(--primitives-colors-background-0\) calc\(var\(--primitives-opacity-50\) \* 100%\), transparent\)/,
  );
});
