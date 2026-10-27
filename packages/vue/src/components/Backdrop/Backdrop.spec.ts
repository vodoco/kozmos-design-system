import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { KozmosBackdrop } from "../../index";
import { toReactTarget } from "../../targets";

describe("KozmosBackdrop", () => {
  it("is the Vue wrapper of the React Backdrop, under its name", () => {
    expect(KozmosBackdrop).toMatchObject({
      name: "Backdrop",
      setup: expect.any(Function),
    });
  });

  // Vue writes every undeclared attribute onto the wrapper's element as
  // well, and a component instance cannot be written as one: the story threw
  // "Cannot convert object to primitive value" until `target` was a prop.
  it("declares target as a prop, so it is never written as an attribute", () => {
    expect(Object.keys(KozmosBackdrop.props ?? {})).toContain("target");
  });

  // GAP-189: `target` reaches React as what it names.
  describe("target", () => {
    const element = { nodeType: 1, getBoundingClientRect: () => ({}) };

    it("passes an element, a React ref, a rect, a virtual element and nothing on", () => {
      const reactRef = { current: element };
      const rect = { top: 1, left: 2, width: 3, height: 4 };
      const virtual = { getBoundingClientRect: () => rect };
      for (const target of [element, reactRef, rect, virtual, null])
        expect(toReactTarget(target)).toBe(target);
    });

    it("lights a component by its element: a template ref on one is its instance", () => {
      expect(toReactTarget({ $el: element, $props: {} })).toBe(element);
      expect(toReactTarget({ $el: null })).toBeNull();
    });

    it("reads a ref() the template did not unwrap, and every item of a list", () => {
      expect(toReactTarget(ref(element))).toBe(element);
      expect(toReactTarget([ref({ $el: element }), element, null])).toEqual([
        element,
        element,
        null,
      ]);
    });
  });
});
