import { describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import {
  KozmosBadge,
  KozmosDescriptionList,
  KozmosDescriptionListItem,
  KozmosThemeProvider,
} from "../../src/index";
import { renderBoth, type Drawn } from "./render";
import { element, slotted } from "./slotted";

/**
 * React's DescriptionList story draws its items with its own render, so the
 * stories parity check cannot draw it from args: here it is, drawn in both,
 * and the edges React's tests cover (DescriptionList.test.tsx). React's
 * `label` and node `value` are Vue's `#label` and `#value`; React's boolean
 * `value` is Vue's `:value`, written as `yes-label` or `no-label`.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const list = (props: Record<string, unknown>, items: Drawn[]) =>
  slotted(KozmosReact.DescriptionList, KozmosDescriptionList, props, {
    default: items,
  });
/**
 * An item: React's props, and Vue's `#label`, `#value` (a node value) and
 * `:value` (a boolean one).
 */
const item = (
  props: Record<string, unknown>,
  slots: Record<string, (Drawn | string)[]> = {},
) => {
  const { label, value, ...rest } = props;
  const vueSlots: Record<string, (Drawn | string)[]> = {
    label: [String(label)],
    ...slots,
  };
  const vueProps: Record<string, unknown> = { ...rest };
  if (typeof value === "boolean") vueProps.value = value;
  else if (value !== undefined) vueSlots.value = [String(value)];
  return {
    react: slotted(
      KozmosReact.DescriptionListItem,
      KozmosDescriptionListItem,
      {
        ...props,
      },
      slots,
    ).react,
    vue: slotted(
      KozmosReact.DescriptionListItem,
      KozmosDescriptionListItem,
      vueProps,
      vueSlots,
    ).vue,
  };
};
const badge = (label: string) =>
  slotted(
    KozmosReact.Badge,
    KozmosBadge,
    { variant: "secondary" },
    { default: [label] },
  );

const both = (tree: Drawn) => renderBoth(inTheme(tree));

describe("KozmosDescriptionList draws what React's DescriptionList draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await both(
      element("div", { style: { maxWidth: "480px" } }, [
        list({ "aria-label": "Unit" }, [
          item({ label: "Name", value: "Bean & Leaf Café" }),
          item(
            { label: "Categories" },
            { default: [badge("Café"), badge("Food")] },
          ),
          item({ label: "Featured", value: true }),
          item({ label: "Hidden from visitors", value: false }),
        ]),
      ]),
    );
    expect(react).toContain('data-layout="stack"');
    expect(react).toContain("Yes");
    expect(react).toContain("No");
    expect(vue).toBe(react);
  });

  it.each([
    ["a row layout", { layout: "row" }],
    ["a class after the recipe's", { className: "kozmos-parity" }],
  ] as const)("%s", async (_name, props) => {
    const { className, ...rest } = props as Record<string, unknown>;
    const { react, vue } = await both(
      slotted(
        KozmosReact.DescriptionList,
        KozmosDescriptionList,
        props,
        { default: [item({ label: "Name", value: "Gate A12" })] },
        className === undefined ? rest : { ...rest, class: className },
      ),
    );
    expect(vue).toBe(react);
  });

  it.each([
    ["children as the value", { label: "FID" }, { default: ["f-1042"] }],
    [
      "a value over children",
      { label: "FID", value: "f-1042" },
      { default: ["ignored"] },
    ],
    [
      "an action after the value",
      { label: "FID", value: "f-1042" },
      { action: [element("button", { "aria-label": "Copy FID" }, ["Copy"])] },
    ],
    [
      "a product's words for yes",
      { label: "Featured", value: true, yesLabel: "Oui" },
      {},
    ],
    [
      "a product's words for no",
      { label: "Featured", value: false, noLabel: "Non" },
      {},
    ],
    ["no value at all", { label: "Notes" }, {}],
  ] as const)("an item: %s", async (_name, props, slots) => {
    const { react, vue } = await both(
      list({}, [
        item({ ...props }, slots as Record<string, (Drawn | string)[]>),
      ]),
    );
    expect(vue).toBe(react);
  });
});
