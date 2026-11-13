// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";
import { KozmosRating } from "./index";
import { $, $$, heard, mount, settle } from "../../test/react-bridge-harness";

// Decision 181: a read-only star rating shows a score to the nearest half.
// The bridge passes v-model through as React's `value`, so a Vue app's 4.3
// draws as four and a half stars and is named for 4.5.
describe("KozmosRating's read-only halves", () => {
  it("draws a score to the nearest half, and says the rounded value", async () => {
    mount(
      defineComponent({
        components: { KozmosRating },
        template: `<KozmosRating read-only :model-value="4.3" />`,
      }),
    );
    await settle();
    expect(heard()).toEqual([]);
    expect($("[role=img]")!.getAttribute("aria-label")).toBe(
      "Rated 4.5 out of 5 stars",
    );
    expect($$("[data-rating-half]")).toHaveLength(1);
  });
});
