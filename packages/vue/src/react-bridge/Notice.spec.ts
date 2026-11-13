// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";
import { KozmosNotice } from "./index";
import { $, heard, mount, settle } from "../../test/react-bridge-harness";

// The bridge draws a slot in a <div>. Notice's summary and detail were
// paragraphs until #522's review, and a <div> in a <p> is markup React
// refuses ("cannot be a descendant of <p>"): a Vue app could not give the
// detail as a slot.
describe("KozmosNotice's slots", () => {
  it("takes its detail from the default slot, in valid markup", async () => {
    mount(
      defineComponent({
        components: { KozmosNotice },
        template: `<KozmosNotice summary="Check allergens." :collapsible="false">The full wording.</KozmosNotice>`,
      }),
    );
    await settle();
    expect(heard()).toEqual([]);
    expect($("[role=status]")!.textContent).toContain("The full wording.");
    expect(document.querySelector("p div, p p")).toBeNull();
  });
});
