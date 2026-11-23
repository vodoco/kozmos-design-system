import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import {
  KozmosLabel,
  KozmosPersonaMark,
  KozmosPersonaMarkGroup,
  KozmosText,
  KozmosThemeProvider,
} from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's PersonaMark stories Group and InAPersonaList draw with their own
 * render: here is each, as its render draws it, with the native Text and
 * Label (InAPersonaList's checkboxes are React's own, through the bridge,
 * as Checkbox is not ported yet, so the rows' labels are what is
 * compared). And the group's edges: its label,
 * an app's class, and no persona at all, which draws nothing.
 */
const PERSONAS = [
  { name: "Customer", color: "#FF9800" },
  { name: "Visitor", color: "#2196F3" },
  { name: "Staff", color: "#4CAF50" },
];
const inTheme = (...children: Drawn[]) =>
  renderBoth({
    react: KozmosReact.ThemeProvider,
    vue: KozmosThemeProvider,
    children,
  });
const group = (props: Record<string, unknown>): Drawn => ({
  react: KozmosReact.PersonaMarkGroup,
  vue: KozmosPersonaMarkGroup,
  props,
});
const mark = (props: Record<string, unknown>): Drawn => ({
  react: KozmosReact.PersonaMark,
  vue: KozmosPersonaMark,
  props,
});

describe("KozmosPersonaMark draws what React's PersonaMark draws", () => {
  it("Group: draws what React's story draws", async () => {
    const { react, vue } = await inTheme({
      react: "div",
      vue: "div",
      props: { className: "flex items-center gap-2" },
      vueProps: { class: "flex items-center gap-2" },
      children: [
        {
          react: KozmosReact.Text,
          vue: KozmosText,
          props: { size: "sm" },
          children: ["Gate A12"],
        },
        group({ personas: PERSONAS }),
      ],
    });
    expect(react).toContain(
      'aria-label="Assigned personas: Customer, Visitor, Staff"',
    );
    expect(vue).toBe(react);
  });

  it("InAPersonaList: draws what React's story draws", async () => {
    const { react, vue } = await inTheme({
      react: "div",
      vue: "div",
      props: { className: "flex flex-col gap-2" },
      vueProps: { class: "flex flex-col gap-2" },
      children: PERSONAS.map(
        (persona): Drawn => ({
          react: KozmosReact.Label,
          vue: KozmosLabel,
          props: {
            className: "flex items-center gap-2",
            htmlFor: `persona-${persona.name}`,
          },
          vueProps: {
            class: "flex items-center gap-2",
            for: `persona-${persona.name}`,
          },
          children: [mark({ color: persona.color }), persona.name],
        }),
      ),
    });
    expect(react).toContain('aria-hidden="true"');
    expect(vue).toBe(react);
  });

  it.each([
    [
      "a group with its own label",
      { personas: PERSONAS, label: "Sichtbar für" },
    ],
    ["a group of one", { personas: PERSONAS.slice(0, 1) }],
  ] as const)("%s", async (_name, props) => {
    const { react, vue } = await inTheme(group({ ...props }));
    expect(vue).toBe(react);
  });

  it("draws no group with no persona", async () => {
    const { react, vue } = await inTheme(group({ personas: [] }));
    expect(react).not.toContain("kozmos-persona-marks");
    expect(vue).toBe(react);
  });

  it("puts an app's style beside the persona's colour", async () => {
    const { react, vue } = await inTheme({
      ...mark({ color: "#FF9800", name: "Customer", style: { marginTop: 2 } }),
      vueProps: {
        color: "#FF9800",
        name: "Customer",
        style: { marginTop: "2px" },
      },
    });
    expect(react).toContain("--kozmos-persona-color:#FF9800");
    expect(vue).toBe(react);
  });
});
