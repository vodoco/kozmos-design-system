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

  it("one draw for each change made in place to a reactive value given", async () => {
    // Not `style`: a parent's `v-bind` copies a style object as it renders,
    // and so sees its change itself. Nothing the parent or the wrapper
    // renders reads these: only the bridge's deep watch sees them change.
    const items = reactive(["a"]);
    const filter = reactive({ query: "" });
    bindProbe({ items, filter });
    await settle();
    const counts: Record<string, number> = {};
    const step = async (name: string, change: () => void) => {
      const before = draws;
      change();
      await settle();
      counts[name] = draws - before;
    };
    await step("item pushed", () => items.push("b"));
    await step("item replaced", () => (items[0] = "z"));
    await step("nested key set", () => (filter.query = "gate"));
    await step("two changes in one tick", () => {
      items.push("c");
      filter.query = "gate 4";
    });
    expect(counts).toEqual({
      "item pushed": 1,
      "item replaced": 1,
      "nested key set": 1,
      "two changes in one tick": 1,
    });
    expect(given.items).toEqual(["z", "b", "c"]);
    expect(given.filter).toEqual({ query: "gate 4" });
  });

  it("no draw when only what a template's slot shows changes", async () => {
    const query = ref("a");
    const items = reactive(Array.from({ length: 100 }, (_, index) => index));
    mount(
      defineComponent({
        components: { Wrapper },
        setup: () => ({ query, items }),
        template: `<Wrapper :items="items" title="t">{{ query }}</Wrapper>`,
      }),
    );
    await settle();
    const before = draws;
    query.value = "b";
    await settle();
    expect(document.body.textContent).toContain("b");
    expect(draws - before).toBe(0);
  });

  it("no draw when a render function renders the wrapper again with the same props", async () => {
    const tick = ref(0);
    const items = reactive(["a"]);
    const onClick = () => {};
    mount(() =>
      h("div", { "data-tick": tick.value }, [
        h(
          Wrapper,
          { title: "t", items, onClick },
          { default: () => `tick ${tick.value}` },
        ),
      ]),
    );
    await settle();
    const before = draws;
    tick.value += 1;
    await settle();
    expect(document.body.textContent).toContain("tick 1");
    expect(draws - before).toBe(0);
    // And the same parent's change is drawn once.
    items.push("b");
    await settle();
    expect(draws - before).toBe(1);
  });

  it("one draw for a slot given or taken away after mount, which React is given as a prop", async () => {
    const shown = ref(false);
    mount(() =>
      h(
        Wrapper,
        { title: "t" },
        shown.value
          ? { default: () => "Gate", actions: () => "Open" }
          : { default: () => "Gate" },
      ),
    );
    await settle();
    expect(given).not.toHaveProperty("actions");
    const before = draws;
    shown.value = true;
    await settle();
    expect(given).toHaveProperty("actions");
    shown.value = false;
    await settle();
    expect(given).not.toHaveProperty("actions");
    expect(draws - before).toBe(2);
  });

  it("one draw for a row added to a v-for whose wrappers are held in a template ref array", async () => {
    // A `<script setup>` `ref="items"` in a v-for compiles to these three
    // keys, the ref itself an array Vue pushes each row's instance into and
    // splices it out of: a part of the vnode, never given to the wrapper, so
    // no change to it is a change to what React was given. JSX and render
    // functions hold the same ref object.
    const rows = ref([1, 2, 3]);
    const items = ref<unknown[]>([]);
    mount(() =>
      h(
        "div",
        rows.value.map((row) =>
          h(Wrapper, {
            key: row,
            ref: items,
            ref_for: true,
            ref_key: "items",
            title: String(row),
          }),
        ),
      ),
    );
    await settle();
    expect(draws).toBe(3);
    expect(items.value).toHaveLength(3);
    rows.value = [...rows.value, 4];
    await settle();
    expect(items.value).toHaveLength(4);
    expect(draws).toBe(4);
    rows.value = rows.value.slice(1);
    await settle();
    expect(items.value).toHaveLength(3);
    expect(draws).toBe(4);
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
    // model: the redraw `onUpdated` asks for when the parent takes it,
    // `settle` when it does not. A third would be a draw Vue did not ask for.
    // React 19 batches the last two however many are asked for, so only
    // React 18, which `test:react18` runs in CI's Vue job, sees a third:
    // `settle` drawing again after the parent took the change.
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
