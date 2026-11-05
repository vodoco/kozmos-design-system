import { beforeAll, describe, expect, it } from "vitest";
import { planOf, reactSides, type ReactSide } from "./read-contract";

/**
 * The contract reads React's parts as the compiler does, on the real
 * declarations: what is a callback, a render prop, a model, a slot and a
 * default. Each case is a part a Vue port will meet, and each was misread
 * by an earlier draft (second independent review, 5 Nov 2026).
 */
let side: (name: string) => ReactSide;
beforeAll(() => {
  side = reactSides();
}, 120_000);

const plan = (name: string) =>
  planOf({
    port: { vue: `Kozmos${name}`, react: name, stories: null },
    vueProps: [],
    vueEmits: [],
    vueSlots: [],
    ...side(name),
  });
const member = (part: string, name: string) =>
  side(part).react.find((m) => m.name === name);

describe("React's side of the contract", () => {
  it("gives a form field v-model and no slot", () => {
    // Input's value and onChange are the input element's; its children are
    // only React's attribute.
    expect(side("Input").reactElement).toBe("HTMLInputElement");
    expect(member("Input", "children")).toBeUndefined();
    expect([...plan("Input").models.values()]).toEqual([
      { react: "value", vue: "modelValue", change: null },
    ]);
  });

  it("pairs a value with Kozmos's own onChange", () => {
    expect(plan("SearchBar").models.get("value")).toEqual({
      react: "value",
      vue: "modelValue",
      change: "onChange",
    });
  });

  it("finds each controlled prop, by its on…Change", () => {
    // Combobox: the selection and the typed text; its onValueChange also
    // passes the option, which update:modelValue must carry.
    const { models } = plan("Combobox");
    expect(models.get("value")?.change).toBe("onValueChange");
    expect(models.get("inputValue")).toEqual({
      react: "inputValue",
      vue: "inputValue",
      change: "onInputValueChange",
    });
  });

  it("keeps a value nothing controls as `value`", () => {
    expect(plan("TabsTrigger").models.size).toBe(0);
    expect(plan("TabsTrigger").vueName("value")).toBe("value");
  });

  it("reads Radix's handlers as callbacks, however their types are written", () => {
    const callbacks = plan("DialogContent").callbacks.map((m) => m.name);
    for (const name of [
      "onOpenAutoFocus",
      "onCloseAutoFocus",
      "onEscapeKeyDown",
    ])
      expect(callbacks).toContain(name);
  });

  it("reads a render prop as one", () => {
    expect(member("BrowseCategoriesPanel", "renderIcon")).toMatchObject({
      callable: true,
      returnsNode: true,
    });
  });

  it("reads React's default on a DOM attribute", () => {
    expect(side("AISearchButton").reactDefaults.get("type")).toBe('"button"');
  });
});
