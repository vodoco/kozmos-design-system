import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import React from "react";
import { readFileSync } from "node:fs";

// Import foundational pure-UI bounds
import { Button } from "../../src/components/Button/Button";
import { IconButton } from "../../src/components/IconButton/IconButton";
import { Card } from "../../src/components/Card/Card";
import { Input } from "../../src/components/Input/Input";
import { SearchMd as Search } from "@kozmos-ds/icons";

expect.extend(matchers);

type ColorMode = "light" | "dark";

const cssVariablesByMode: Record<ColorMode, Record<string, string>> = {
  light: readCssVariables("../../../tokens/dist/css/variables-light.css"),
  dark: readCssVariables("../../../tokens/dist/css/variables-dark.css"),
};

const buttonContrastPairs = [
  {
    name: "default idle",
    background: "components-primary-buttons-themed-button-background-idle",
    foreground:
      "components-primary-buttons-themed-button-foreground-content-idle",
    minimum: 4.5,
  },
  {
    name: "default hover",
    background: "components-primary-buttons-themed-button-background-hover",
    foreground:
      "components-primary-buttons-themed-button-foreground-content-hover",
    minimum: 4.5,
  },
  {
    name: "destructive idle",
    background: "components-primary-buttons-danger-button-background-idle",
    foreground:
      "components-primary-buttons-danger-button-foreground-content-idle",
    minimum: 4.5,
  },
  {
    name: "destructive hover",
    background: "components-primary-buttons-danger-button-background-hover",
    foreground:
      "components-primary-buttons-danger-button-foreground-content-hover",
    minimum: 4.5,
  },
  {
    name: "secondary idle",
    background: "primitives-colors-background-200",
    foreground: "primitives-colors-foreground-0",
    minimum: 4.5,
  },
  {
    name: "outline idle text",
    background: "primitives-colors-background-0",
    foreground:
      "components-secondary-buttons-themed-button-foreground-content-idle",
    minimum: 4.5,
  },
  {
    name: "outline idle border",
    background: "primitives-colors-background-0",
    foreground:
      "components-secondary-buttons-themed-button-foreground-content-idle",
    minimum: 3,
  },
  {
    name: "outline hover text",
    background: "primitives-colors-background-0",
    foreground:
      "components-secondary-buttons-themed-button-foreground-content-hover",
    minimum: 4.5,
  },
  {
    name: "ghost/link idle text",
    background: "primitives-colors-background-0",
    foreground:
      "components-secondary-buttons-themed-button-foreground-content-idle",
    minimum: 4.5,
  },
  {
    name: "ghost/link hover text",
    background: "primitives-colors-background-0",
    foreground:
      "components-secondary-buttons-themed-button-foreground-content-hover",
    minimum: 4.5,
  },
];

describe("WCAG 2.1 Native A11y Validations", () => {
  it.each([
    "default",
    "destructive",
    "outline",
    "secondary",
    "ghost",
    "link",
    "glass",
  ] as const)(
    "Button %s variant has no structural axe violations",
    async (variant) => {
      const { container } = render(
        <Button variant={variant}>WCAG Accessible Button</Button>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    },
  );

  it("IconButton has no structural axe violations when labelled", async () => {
    const { container } = render(
      <IconButton aria-label="Search">
        <Search aria-hidden="true" />
      </IconButton>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Button token pairs meet WCAG contrast thresholds in light and dark modes", () => {
    for (const mode of ["light", "dark"] as const) {
      for (const pair of buttonContrastPairs) {
        const background = tokenColor(mode, pair.background);
        const foreground = tokenColor(mode, pair.foreground);
        const ratio = contrastRatio(background, foreground);

        expect(
          ratio,
          `${mode} ${pair.name}: ${background} / ${foreground} = ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(pair.minimum);
      }
    }
  });

  it("Card layout arrays must structurally map without ARIA violations", async () => {
    const { container } = render(
      <Card>
        <h1>Card Title</h1>
        <p>Card descriptions enforcing A11y text cascades natively.</p>
      </Card>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Forms and Inputs must unconditionally bind accessible DOM labels", async () => {
    const { container } = render(
      <Input placeholder="Search POIs" aria-label="Search Input" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

function readCssVariables(relativePath: string) {
  const file = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const variables: Record<string, string> = {};

  for (const match of file.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    variables[match[1]] = match[2].trim();
  }

  return variables;
}

function tokenColor(mode: ColorMode, tokenName: string) {
  const value = cssVariablesByMode[mode][tokenName];
  if (!value) throw new Error(`Missing ${mode} token ${tokenName}`);
  return value;
}

function contrastRatio(a: string, b: string) {
  const l1 = relativeLuminance(hexToRgb(a));
  const l2 = relativeLuminance(hexToRgb(b));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance([r, g, b]: [number, number, number]) {
  return 0.2126 * linearRgb(r) + 0.7152 * linearRgb(g) + 0.0722 * linearRgb(b);
}

function linearRgb(value: number) {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function hexToRgb(value: string): [number, number, number] {
  const hex = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`Expected 6-digit hex color, received ${value}`);
  }

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}
