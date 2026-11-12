// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { defineComponent, ref, type Component } from "vue";
import * as Bridge from "./index";
import { $, $$, mount, until } from "../../test/react-bridge-harness";

// GAP-153 and GAP-165 through the React bridge: a bare `mixed` attribute is
// true, `@reset-mixed` hears the reset, and EmptyState's list arrives as the
// array it is. Each bridged part is a React root of its own, drawn when it is
// ready: the spec waits for what it reads, never for a fixed time.

const page = (template: string, setup: () => object = () => ({})) =>
  defineComponent({
    components: Bridge as Record<string, Component>,
    setup,
    template,
  });

describe("a mixed field through the bridge (GAP-153)", () => {
  it("a bare mixed attribute shows the mixed label; the reset is heard and takes it back", async () => {
    const edit = ref<string | null>("Gate B2");
    mount(
      page(
        `<KozmosInput label="Name" :mixed="edit === null" :model-value="edit ?? ''"
           @update:model-value="edit = $event" @reset-mixed="edit = null" />
         <KozmosNumberInput label="Height" mixed />`,
        () => ({ edit }),
      ),
    );
    const [name, height] = await until(() => {
      const inputs = $$<HTMLInputElement>("input");
      return inputs.length === 2 && inputs;
    });
    expect(name.value).toBe("Gate B2");
    expect(height.placeholder).toBe("Multiple values");
    expect(height.hasAttribute("data-mixed")).toBe(true);

    const reset = await until(() =>
      $$<HTMLButtonElement>("button").find(
        (button) => button.textContent === "Reset to multiple values",
      ),
    );
    reset.click();
    await until(
      () => edit.value === null && name.placeholder === "Multiple values",
    );
    expect(name.value).toBe("");
  });

  it("EmptyState's list arrives in order", async () => {
    mount(
      page(
        `<KozmosEmptyState title="No Map Content Found" :list="['Check the level', 'Clear the filters']" />`,
      ),
    );
    await until(() => $$("li").length === 2);
    expect($("ul")?.getAttribute("role")).toBe("list");
    expect($$("li").map((item) => item.textContent)).toEqual([
      "Check the level",
      "Clear the filters",
    ]);
  });
});
