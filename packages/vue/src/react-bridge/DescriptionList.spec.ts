// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { defineComponent, type Component } from "vue";
import * as Bridge from "./index";
import { $, mount, until } from "../../test/react-bridge-harness";

// GAP-221 (decision 199) through the React bridge: each item is a term and
// its definition, a yes or a no in words, tags from the default slot and the
// action from #action.

const page = (template: string) =>
  defineComponent({
    components: Bridge as Record<string, Component>,
    template,
  });

describe("DescriptionList through the bridge (GAP-221)", () => {
  it("draws each label over its value, with tags, a yes and an action", async () => {
    mount(
      page(
        `<KozmosDescriptionList layout="row" aria-label="Unit">
           <KozmosDescriptionListItem label="Name" value="Gate A12" />
           <KozmosDescriptionListItem label="Featured" :value="true" />
           <KozmosDescriptionListItem label="Personas"><span>Visitor</span></KozmosDescriptionListItem>
           <KozmosDescriptionListItem label="FID" value="f-1209">
             <template #action><button type="button">Copy FID</button></template>
           </KozmosDescriptionListItem>
         </KozmosDescriptionList>`,
      ),
    );
    const list = await until(() => {
      const dl = $("dl");
      return dl?.querySelectorAll("dd").length === 4 &&
        dl.querySelector(".kozmos-description-list-action button") &&
        dl.textContent?.includes("Visitor")
        ? dl
        : null;
    });
    expect(list.getAttribute("data-layout")).toBe("row");
    expect(
      [...list.querySelectorAll("dt")].map((term) => term.textContent),
    ).toEqual(["Name", "Featured", "Personas", "FID"]);
    expect(
      [...list.querySelectorAll("dd")].map((value) => value.textContent),
    ).toEqual(["Gate A12", "Yes", "Visitor", "f-1209Copy FID"]);
  });
});
