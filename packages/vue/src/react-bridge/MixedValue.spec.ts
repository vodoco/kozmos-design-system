// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { defineComponent, ref, type Component } from "vue";
import * as Bridge from "./index";
import { $$, mount, until } from "../../test/react-bridge-harness";

// GAP-153 through the React bridge: a bare `mixed` attribute is true, and
// `@reset-mixed` hears the reset (EmptyState's list, GAP-165, is the native
// part's now: src/components/EmptyState/EmptyState.spec.ts; so are Input's
// and NumberInput's mixed fields, wave V2: test/parity/input.parity.spec.ts
// and number-input.parity.spec.ts). Each bridged part is a React root of its own, drawn when it is
// ready: the spec waits for what it reads, never for a fixed time.

const page = (template: string, setup: () => object = () => ({})) =>
  defineComponent({
    components: Bridge as Record<string, Component>,
    setup,
    template,
  });

// Decisions 188 to 190 through the bridge: a bare `mixed` attribute is true
// on Switch and ToggleButton, a click turns either on and is heard through
// its v-model, and `@reset-mixed` hears the reset.
describe("a mixed Switch and ToggleButton through the bridge (decisions 188-190)", () => {
  it("a bare mixed switch is off with Multiple values; a click turns it on, the reset takes it back", async () => {
    const edit = ref<boolean | null>(null);
    mount(
      page(
        `<KozmosSwitch label="Step-free" :mixed="edit === null" :checked="edit ?? true"
           @update:checked="edit = $event" @reset-mixed="edit = null" />
         <KozmosSwitch label="Lifts" mixed />`,
        () => ({ edit }),
      ),
    );
    const [stepFree, lifts] = await until(() => {
      const switches = $$<HTMLButtonElement>('[role="switch"]');
      return switches.length === 2 && switches;
    });
    expect(lifts.hasAttribute("data-mixed")).toBe(true);
    expect(lifts.getAttribute("aria-checked")).toBe("false");
    const describedBy = lifts.getAttribute("aria-describedby") ?? "";
    expect(
      describedBy
        .split(" ")
        .map((id) => document.getElementById(id)?.textContent)
        .join(" "),
    ).toBe("Multiple values");

    stepFree.click();
    await until(
      () =>
        edit.value === true && stepFree.getAttribute("aria-checked") === "true",
    );
    const reset = await until(() =>
      $$<HTMLButtonElement>("button").find(
        (button) => button.textContent === "Reset to multiple values",
      ),
    );
    reset.click();
    await until(
      () => edit.value === null && stepFree.hasAttribute("data-mixed"),
    );
  });

  it("a bare mixed toggle is aria-pressed mixed; a click presses it, the reset takes it back", async () => {
    const edit = ref<boolean | null>(null);
    mount(
      page(
        `<div><KozmosToggleButton :mixed="edit === null" :pressed="edit ?? true"
           @update:pressed="edit = $event" @reset-mixed="edit = null">Bold</KozmosToggleButton></div>
         <KozmosToggleButton mixed>Italic</KozmosToggleButton>`,
        () => ({ edit }),
      ),
    );
    const italic = await until(() =>
      $$<HTMLButtonElement>("button").find(
        (button) => button.textContent === "Italic",
      ),
    );
    expect(italic.getAttribute("aria-pressed")).toBe("mixed");
    const bold = await until(() =>
      $$<HTMLButtonElement>("button").find(
        (button) => button.textContent === "Bold",
      ),
    );
    bold.click();
    await until(
      () => edit.value === true && bold.getAttribute("aria-pressed") === "true",
    );
    const reset = await until(() =>
      $$<HTMLButtonElement>("button").find(
        (button) => button.textContent === "Reset to multiple values",
      ),
    );
    reset.click();
    await until(
      () =>
        edit.value === null && bold.getAttribute("aria-pressed") === "mixed",
    );
  });
});
