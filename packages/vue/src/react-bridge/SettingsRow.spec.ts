// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { defineComponent, ref, type Component } from "vue";
import * as Bridge from "./index";
import { KozmosList } from "../index";
import { $, $$, mount, until } from "../../test/react-bridge-harness";

// GAP-040 through the React bridge: SettingsRow's #control and @reset
// reach React, in a row of Vue's native KozmosList. ListItem's slots
// (GAP-195) are native: test/parity/list.parity.spec.ts.

const page = (template: string, setup: () => object = () => ({})) =>
  defineComponent({
    components: { ...(Bridge as Record<string, Component>), KozmosList },
    setup,
    template,
  });

describe("SettingsRow through the bridge (GAP-040)", () => {
  it("names its #control by the label, and @reset is heard", async () => {
    const state = ref("overridden");
    mount(
      page(
        `<KozmosList>
           <KozmosSettingsRow label="Show the banner" :state="state" @reset="state = 'inherited'">
             <template #control><input type="checkbox" /></template>
           </KozmosSettingsRow>
         </KozmosList>`,
        () => ({ state }),
      ),
    );
    const reset = await until(() =>
      $$<HTMLButtonElement>("button").find(
        (button) => button.textContent === "Reset to default",
      ),
    );
    expect($("li")?.getAttribute("data-state")).toBe("overridden");
    const box = await until(() => {
      const input = $<HTMLInputElement>("input[type=checkbox]");
      return input?.getAttribute("aria-labelledby") ? input : null;
    });
    expect(
      document.getElementById(box.getAttribute("aria-labelledby") ?? "")
        ?.textContent,
    ).toBe("Show the banner");
    reset.click();
    await until(() => $("li")?.getAttribute("data-state") === "inherited");
    expect(
      $$<HTMLButtonElement>("button").some(
        (button) => button.textContent === "Reset to default",
      ),
    ).toBe(false);
  });
});
