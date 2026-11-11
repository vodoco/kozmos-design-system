// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { defineComponent, ref, type Component } from "vue";
import * as Bridge from "./index";
import { $, $$, mount, settle } from "../../test/react-bridge-harness";

// GAP-153 and GAP-165 through the React bridge: a bare `mixed` attribute is
// true, `@reset-mixed` hears the reset, and EmptyState's list arrives as the
// array it is.

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
    await settle();
    const [name, height] = $$<HTMLInputElement>("input");
    expect(name.value).toBe("Gate B2");
    expect(height.placeholder).toBe("Multiple values");
    expect(height.hasAttribute("data-mixed")).toBe(true);

    const reset = $$<HTMLButtonElement>("button").find(
      (button) => button.textContent === "Reset to multiple values",
    );
    expect(reset).toBeTruthy();
    reset!.click();
    await settle();
    expect(edit.value).toBeNull();
    expect(name.value).toBe("");
    expect(name.placeholder).toBe("Multiple values");
  });

  it("EmptyState's list arrives in order", async () => {
    mount(
      page(
        `<KozmosEmptyState title="No Map Content Found" :list="['Check the level', 'Clear the filters']" />`,
      ),
    );
    await settle();
    expect($("ul")?.getAttribute("role")).toBe("list");
    expect($$("li").map((item) => item.textContent)).toEqual([
      "Check the level",
      "Clear the filters",
    ]);
  });
});
