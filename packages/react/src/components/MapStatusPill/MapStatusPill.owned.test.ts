import { readFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import postcss, { type Rule } from "postcss";
import { describe, expect, it } from "vitest";

// Written out rather than imported from the component, so these run, and fail
// on what they measure, whether or not the component exists.
type Tone = "neutral" | "progress" | "success" | "danger" | "warning";
const TONES: Tone[] = ["neutral", "progress", "success", "danger", "warning"];

// Paths from this file, not `new URL(literal, import.meta.url)`: Vite rewrites
// that form into a served asset URL, which `readFileSync` cannot open.
const here = dirname(fileURLToPath(import.meta.url));

// The owned rules, read from the stylesheet the package ships: the map
// controls' own file (decision 40), where the pill's surface comes from.
const OWNED = readFileSync(
  resolvePath(here, "../../styles/owned-map-controls.css"),
  "utf8",
);
const variables = (mode: "light" | "dark") => {
  const css = readFileSync(
    resolvePath(here, `../../../../tokens/dist/css/variables-${mode}.css`),
    "utf8",
  );
  return Object.fromEntries(
    [...css.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [
      m[1],
      m[2].trim(),
    ]),
  );
};
const TOKENS = { light: variables("light"), dark: variables("dark") };

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** Every declaration of `property` the pill's rules make for one tone, in order. */
function declared(
  tone: Tone,
  property: string,
  target: "pill" | "mark",
): string | undefined {
  const pill = [
    ".kozmos-map-status-pill",
    `.kozmos-map-status-pill:where([data-tone="${tone}"])`,
  ];
  const selectors =
    target === "pill"
      ? pill
      : pill.map((s) => `${s} .kozmos-map-status-pill-mark`);
  let value: string | undefined;
  postcss.parse(OWNED).walkRules((rule: Rule) => {
    if (!rule.selectors.some((s) => selectors.includes(s.replace(/\s+/g, " "))))
      return;
    rule.walkDecls(property, (decl) => {
      value = decl.value;
    });
  });
  return value;
}

function resolve(value: string | undefined, mode: "light" | "dark"): string {
  const name = value?.match(/^var\(--([\w-]+)\)$/)?.[1];
  expect(name, `${value} is not one token`).toBeTruthy();
  const hex = TOKENS[mode][name!];
  expect(hex, `--${name} is not a ${mode} token`).toMatch(/^#[0-9a-f]{6}$/i);
  return hex;
}

describe("MapStatusPill's owned rules", () => {
  it("wears the map controls' surface from the same rule, not a copy of it (decision 40)", () => {
    // White, the Control corner, no stroke, the three shadows and the 32px
    // blur: one rule, so a later change to the map controls' surface reaches
    // the pill without anyone remembering it.
    let shared: Rule | undefined;
    postcss.parse(OWNED).walkRules((rule: Rule) => {
      if (
        rule.selectors.includes(".kozmos-map-control") &&
        rule.selectors.includes(".kozmos-map-status-pill")
      )
        shared = rule;
    });
    expect(shared, "no rule dresses both").toBeDefined();
    const text = shared!.toString();
    expect(text).toContain("@apply shadow-map-control");
    expect(text).toContain("backdrop-filter: blur(32px)");
    expect(text).toContain("border-width: 0");
    expect(text).toContain("var(--semantics-radius-control)");
  });

  it("draws each tone's words at 4.5:1 and its mark at 3:1 on its surface, in both themes", () => {
    const measured: string[] = [];
    for (const mode of ["light", "dark"] as const) {
      for (const tone of TONES) {
        const surface = resolve(
          declared(tone, "background-color", "pill"),
          mode,
        );
        const words = resolve(declared(tone, "color", "pill"), mode);
        const mark = declared(tone, "color", "mark")
          ? resolve(declared(tone, "color", "mark"), mode)
          : words;
        const w = contrast(words, surface);
        const m = contrast(mark, surface);
        measured.push(
          `${mode} ${tone}: words ${w.toFixed(2)}, mark ${m.toFixed(2)}`,
        );
        expect(
          w,
          `${mode} ${tone} words ${words} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          m,
          `${mode} ${tone} mark ${mark} on ${surface}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
    expect(measured).toHaveLength(10);
  });

  it("fills Turn Back with the named alert fill pair: the SDK's amber under black, 10.56:1 and 13.14:1", () => {
    // Olcay, 2026-09-28: Turn Back is the SDK's bright amber under black
    // words, from a named token pair in both themes, not a black each
    // platform picks per theme. Semantics.Emotion.alert.fill stays a bright
    // amber in both files, and its onFill stays black in both.
    expect(declared("warning", "background-color", "pill")).toBe(
      "var(--semantics-emotion-alert-fill)",
    );
    expect(declared("warning", "color", "pill")).toBe(
      "var(--semantics-emotion-alert-on-fill)",
    );
    const pinned = { light: "10.56", dark: "13.14" };
    for (const mode of ["light", "dark"] as const) {
      const fill = resolve(
        declared("warning", "background-color", "pill"),
        mode,
      );
      const ink = resolve(declared("warning", "color", "pill"), mode);
      expect(contrast(ink, fill).toFixed(2), `${mode} ${ink} on ${fill}`).toBe(
        pinned[mode],
      );
      expect(
        luminance(fill),
        `${mode}: ${fill} is not a bright amber`,
      ).toBeGreaterThan(0.4);
      expect(
        luminance(ink),
        `${mode}: the words are ${ink}, not dark`,
      ).toBeLessThan(0.05);
    }
  });
});
