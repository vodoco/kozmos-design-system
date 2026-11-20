// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, type Component } from "vue";
import * as Bridge from "./index";
import { $, mount, until } from "../../test/react-bridge-harness";

// GAP-150 (decision 219) through the React bridge: the cell drawn from the
// atlas the product names, named by its label, and an empty box otherwise.

class FakeImage {
  naturalWidth = 400;
  naturalHeight = 220;
  onload: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

beforeEach(() => {
  vi.stubGlobal("Image", FakeImage);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ atm: { x: 90, y: 0, width: 90, height: 90 } }),
    })),
  );
});
afterEach(() => vi.unstubAllGlobals());

const page = (template: string) =>
  defineComponent({
    components: Bridge as Record<string, Component>,
    template,
  });

describe("SpriteIcon through the bridge (GAP-150)", () => {
  it("draws the named cell from the product's atlas, named by its label", async () => {
    mount(
      page(
        `<KozmosSpriteIcon sprite="https://cdn.test/vue/sprite" name="atm" :size="20" label="ATM" />`,
      ),
    );
    const icon = await until(() => {
      const box = $("[data-slot=sprite-icon]");
      return box?.getAttribute("data-state") === "drawn" ? box : null;
    });
    expect(icon.getAttribute("role")).toBe("img");
    expect(icon.getAttribute("aria-label")).toBe("ATM");
    expect((icon as HTMLElement).style.width).toBe("20px");
    expect(fetch).toHaveBeenCalledWith("https://cdn.test/vue/sprite.json");
  });
});
