// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { defineComponent, ref, type Component } from "vue";
import * as Bridge from "./index";
import { $, $$, mount, until } from "../../test/react-bridge-harness";

// GAP-195 and GAP-040 through the React bridge: ListItem's named slots
// arrive as its slots, and SettingsRow's #control and @reset reach React.

const page = (template: string, setup: () => object = () => ({})) =>
  defineComponent({
    components: Bridge as Record<string, Component>,
    setup,
    template,
  });

describe("ListItem's slots through the bridge (GAP-195)", () => {
  it("draws the checklist row from its props and named slots, the status read first", async () => {
    mount(
      page(
        `<KozmosList>
           <KozmosListItem title="Explore the map" description="Pan, zoom and change levels." meta="2 min">
             <template #leading><KozmosListItemStatus status="done" /></template>
             <template #titleAddon><span>Viewer</span></template>
             <template #trailing><button type="button">Replay</button></template>
           </KozmosListItem>
         </KozmosList>`,
      ),
    );
    const row = await until(() => {
      const li = $("li");
      return li?.querySelector("[data-slot=trailing] button") &&
        li.querySelector("[data-status=done]")
        ? li
        : null;
    });
    expect(
      [...row.querySelectorAll("[data-slot]")].map((node) =>
        node.getAttribute("data-slot"),
      ),
    ).toEqual([
      "leading",
      "title",
      "title-addon",
      "description",
      "meta",
      "trailing",
    ]);
    expect(row.textContent).toBe(
      "DoneExplore the mapViewerPan, zoom and change levels.2 minReplay",
    );
  });
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
