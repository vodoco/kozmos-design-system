// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, type Component } from "vue";
import * as Bridge from "./index";
import { $, mount, unmount, until } from "../../test/react-bridge-harness";

// GAP-162 through the bridge: a Checkbox's and a Switch's `description`
// reaches React as a prop, and the control reads it as its description, not
// its name; Switch's state words follow its model.
const page = (template: string) =>
  defineComponent({
    components: Bridge as Record<string, Component>,
    data: () => ({ alerts: true }),
    template,
  });

const describedBy = (control: Element) =>
  (control.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent)
    .join(" ");

afterEach(() => unmount());

describe("a control's description through the bridge (GAP-162)", () => {
  it("KozmosCheckbox reads its description as its description", async () => {
    mount(
      page(
        `<KozmosCheckbox label="Route updates" description="Tell me when a faster route opens" />`,
      ),
    );
    const box = await until(() => $("[role=checkbox]"));
    expect(describedBy(box)).toBe("Tell me when a faster route opens");
    const label = document.querySelector(`label[for="${box.id}"]`);
    expect(label?.textContent).toBe("Route updates");
  });

  it("KozmosSwitch reads its description, and its state words follow v-model", async () => {
    mount(
      page(
        `<KozmosSwitch v-model:checked="alerts" label="Gate alerts" description="Sends a push when your gate changes" show-state-label />`,
      ),
    );
    const control = await until(() => $("[role=switch]"));
    expect(describedBy(control)).toBe("Sends a push when your gate changes");
    expect($("[data-slot=state-label]")?.textContent).toBe("On");
    control.click();
    await until(() => $("[data-slot=state-label]")?.textContent === "Off");
    expect($("[data-slot=state-label]")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });
});
