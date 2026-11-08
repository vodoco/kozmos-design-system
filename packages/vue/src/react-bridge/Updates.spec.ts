// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, reactive, ref } from "vue";
import React from "react";
import * as Bridge from "./index";
import { createVueWrapper } from "./react-adapter";
import { $, mount, settle, type, until } from "../../test/react-bridge-harness";

// What a bridged wrapper is given after mount reaches React, once per Vue
// update (react-adapter.ts, `onUpdated`). Until then React was drawn from a
// watch of `{ ...props, ...attrs }`: a spread reads only the attributes that
// are there, so a wrapper given none tracked none, and an attribute or a
// listener given to it later never reached React, while a Vue child bound
// to the same object was redrawn.

/** A part that says what React gave it, and how many times it was drawn. */
let given: Record<string, unknown> = {};
let draws = 0;
const Probe = (props: Record<string, unknown>) => {
  given = props;
  draws += 1;
  return null;
};
const Wrapper = createVueWrapper(Probe, {
  modelValue: { prop: "value", callback: "onValueChange", empty: "" },
});

afterEach(() => {
  given = {};
  draws = 0;
});

/** Mounts the probe bound to `bound` as `v-bind="bound"`, from a template. */
function bindProbe(bound: Record<string, unknown>) {
  const state = reactive({ bound });
  mount(
    defineComponent({
      components: { Wrapper },
      setup: () => state,
      template: `<Wrapper v-bind="bound" />`,
    }),
  );
  return state;
}

describe("what a wrapper given nothing is given later", () => {
  it("an attribute added to a wrapper that had none redraws React", async () => {
    const state = bindProbe({});
    await settle();
    expect(given).toEqual({});
    state.bound = { title: "t" };
    await settle();
    expect(given).toEqual({ title: "t" });
  });

  it("an attribute removed after it was added redraws React", async () => {
    const state = bindProbe({});
    await settle();
    state.bound = { title: "t", lang: "tr" };
    await settle();
    expect(given).toEqual({ title: "t", lang: "tr" });
    state.bound = { title: "t" };
    await settle();
    expect(given).toEqual({ title: "t" });
    state.bound = {};
    await settle();
    expect(given).toEqual({});
  });

  it("a listener added later is heard, and one taken away is not", async () => {
    const listener = vi.fn();
    const state = bindProbe({});
    await settle();
    expect(given).not.toHaveProperty("onClick");
    state.bound = { onClick: listener };
    await settle();
    (given.onClick as (event: unknown) => void)?.("tap");
    expect(listener).toHaveBeenCalledWith("tap");
    state.bound = {};
    await settle();
    expect(given).not.toHaveProperty("onClick");
  });

  it("KozmosNavigationItem bound to an object that starts empty draws what it is given", async () => {
    const onClick = vi.fn();
    const state = reactive({ bound: {} as Record<string, unknown> });
    mount(
      defineComponent({
        components: { KozmosNavigationItem: Bridge.KozmosNavigationItem },
        setup: () => state,
        template: `<KozmosNavigationItem v-bind="bound" />`,
      }),
    );
    const item = await until(() => $("button"));
    await settle();
    expect(item.hasAttribute("data-disabled")).toBe(false);
    state.bound = { title: "t", disabled: true };
    await settle();
    const drawn = $("[title=t]")!;
    expect(drawn).not.toBeNull();
    expect(drawn.getAttribute("data-disabled")).toBe("true");
    state.bound = { onClick };
    await settle();
    expect($("[title=t]")).toBeNull();
    $("button")!.click();
    await settle();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("React is drawn once per change", () => {
  it("one draw for each attribute, listener and model a wrapper is given, taken or changed", async () => {
    const state = bindProbe({});
    await settle();
    const counts: Record<string, number> = {};
    const step = async (name: string, bound: Record<string, unknown>) => {
      const before = draws;
      state.bound = bound;
      await settle();
      counts[name] = draws - before;
    };
    const listener = () => {};
    await step("attribute added", { title: "t" });
    await step("attribute changed", { title: "u" });
    await step("listener added", { title: "u", onClick: listener });
    await step("attribute removed", { onClick: listener });
    await step("listener removed", {});
    await step("model given", { modelValue: "a" });
    await step("model changed", { modelValue: "b" });
    expect(counts).toEqual({
      "attribute added": 1,
      "attribute changed": 1,
      "listener added": 1,
      "attribute removed": 1,
      "listener removed": 1,
      "model given": 1,
      "model changed": 1,
    });
  });

  it("one draw when a value given is changed in place", async () => {
    const style = reactive({ color: "red" });
    const items = reactive(["a"]);
    bindProbe({ style, items });
    await settle();
    const before = draws;
    style.color = "blue";
    await settle();
    expect(given.style).toEqual({ color: "blue" });
    items.push("b");
    await settle();
    expect(given.items).toEqual(["a", "b"]);
    expect(draws - before).toBe(2);
  });

  it("two draws for a change typed into React's field, whether the parent takes it or not", async () => {
    /** A field React controls, drawn by a part that counts its draws. */
    let fieldDraws = 0;
    const Field = (props: {
      value?: string;
      onValueChange?: (next: string) => void;
    }) => {
      fieldDraws += 1;
      return React.createElement("input", {
        value: props.value ?? "",
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          props.onValueChange?.(event.target.value),
      });
    };
    const FieldWrapper = createVueWrapper(Field, {
      modelValue: { prop: "value", callback: "onValueChange", empty: "" },
    });
    const value = ref("a");
    let refuse = false;
    mount(() =>
      h(FieldWrapper, {
        modelValue: value.value,
        "onUpdate:modelValue": (next: string) => {
          if (!refuse) value.value = next;
        },
      }),
    );
    const field = await until(() => $<HTMLInputElement>("input"));
    await settle();
    // One inside React's event, so the field keeps what was typed and its
    // caret (`emitModel`), and one after Vue's render with the parent's
    // model: `onUpdated` when the parent takes it, `settle` when it does
    // not. A third would be a draw Vue did not ask for.
    const typed = async (text: string) => {
      const before = fieldDraws;
      type(field, text);
      await nextTick();
      await settle();
      return fieldDraws - before;
    };
    expect(await typed("ab")).toBe(2);
    expect(value.value).toBe("ab");
    expect(field.value).toBe("ab");
    refuse = true;
    expect(await typed("abc")).toBe(2);
    expect(value.value).toBe("ab");
    expect(field.value).toBe("ab");
  });
});
