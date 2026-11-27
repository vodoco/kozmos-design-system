// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { KozmosThemeProvider } from "../index";
import * as Bridge from "./index";
import { IN_A_COMPOUND } from "../../test/compounds";
import {
  $,
  $$,
  byText,
  eventually,
  mount,
  settle,
  until,
} from "../../test/react-bridge-harness";

// The parts made of parts, through the bridge (GAP-230, decision 172). A
// wrapper in another wrapper's slot is drawn in that one's React tree, by a
// portal into its own box, where the React part draws the slot: so it finds
// the context its compound gives it, as a React child does. Before, each
// wrapper was a React root of its own, and an item inside its group (a
// KozmosRadioGroupItem in its KozmosRadioGroup, since ported to Vue) threw:
// it could not find its group.

describe("each part of a part made of parts draws inside its compound", () => {
  it.each(Object.entries(IN_A_COMPOUND))(
    "%s",
    async (_name, { render, drawn }) => {
      mount(render);
      // The harness fails the test on anything React or Vue says: a part
      // that cannot find its compound throws, and React says so.
      await until(() => $(drawn));
      await settle();
    },
  );
});

describe("a compound is one React tree", () => {
  it("Accordion: v-model is the item opened, and each item is its accordion's", async () => {
    const level = ref("1");
    const item = (value: string, title: string) =>
      h(Bridge.KozmosAccordionItem, { value }, () => [
        h(Bridge.KozmosAccordionTrigger, {}, () => title),
        h(Bridge.KozmosAccordionContent, {}, () => `${title} opens`),
      ]);
    mount(() =>
      h(
        Bridge.KozmosAccordion,
        {
          type: "single",
          collapsible: true,
          modelValue: level.value,
          "onUpdate:modelValue": (value: string) => (level.value = value),
        },
        () => [item("1", "Level 1"), item("2", "Level 2")],
      ),
    );
    const triggers = await until(() => {
      const found = $$<HTMLButtonElement>("button[aria-expanded]");
      return found.length === 2 && found;
    });
    expect(
      triggers.map((trigger) => trigger.getAttribute("aria-expanded")),
    ).toEqual(["true", "false"]);
    triggers[1].click();
    await eventually(() => expect(level.value).toBe("2"));
    await eventually(() =>
      expect(
        triggers.map((trigger) => trigger.getAttribute("aria-expanded")),
      ).toEqual(["false", "true"]),
    );
  });

  it("Tabs: a trigger shows its panel, and a panel not shown draws nothing of its slot", async () => {
    mount(IN_A_COMPOUND.KozmosTabsTrigger.render);
    const list = await until(() => byText("[role=tab]", "List"));
    expect($("[role=tabpanel]:not([hidden])")!.textContent).toBe("The map");
    // The hidden panel's words are in no box the page draws.
    const boxes = [...document.querySelectorAll("div")].filter(
      (box) => box.textContent === "The list",
    );
    const hidden = boxes.at(-1)!;
    expect(hidden.closest("[style*='display: none']")).not.toBeNull();
    list.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, button: 0 }),
    );
    await eventually(() =>
      expect($("[role=tabpanel]:not([hidden])")!.textContent).toBe("The list"),
    );
  });

  it("Accordion: a trigger opens and closes its item's content", async () => {
    mount(IN_A_COMPOUND.KozmosAccordionTrigger.render);
    const trigger = await until(() => byText("button", "Opening hours"));
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    trigger.click();
    await eventually(() =>
      expect(trigger.getAttribute("aria-expanded")).toBe("false"),
    );
  });

  it("a listener on a part of a compound runs once, given the native event", async () => {
    const click = vi.fn();
    mount(() =>
      h(Bridge.KozmosAccordion, { type: "single", collapsible: true }, () => [
        h(Bridge.KozmosAccordionItem, { value: "1" }, () => [
          h(Bridge.KozmosAccordionTrigger, { onClick: click }, () => "Level 1"),
        ]),
      ]),
    );
    const trigger = await until(() => $("button[aria-expanded]"));
    trigger.click();
    await settle();
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  it("a part leaves its compound's tree when Vue takes it away", async () => {
    const shown = ref(true);
    const item = (value: string) =>
      h(Bridge.KozmosAccordionItem, { value }, () => [
        h(Bridge.KozmosAccordionTrigger, {}, () => `Level ${value}`),
      ]);
    mount(() =>
      h(Bridge.KozmosAccordion, { type: "single", collapsible: true }, () => [
        item("1"),
        shown.value ? item("2") : null,
        item("3"),
      ]),
    );
    const third = await until(() => $$("button[aria-expanded]")[2]);
    shown.value = false;
    await nextTick();
    await eventually(() =>
      expect(
        $$("button[aria-expanded]").map((trigger) => trigger.textContent),
      ).toEqual(["Level 1", "Level 3"]),
    );
    // The item after it is the one it was: not drawn again.
    expect($$("button[aria-expanded]")[1]).toBe(third);
  });
});

describe("toast()", () => {
  it("a KozmosToaster draws what toast() shows, in the Vue provider's theme", async () => {
    mount(
      defineComponent({
        render: () =>
          h(KozmosThemeProvider, { theme: "dark" }, () => [
            h(Bridge.KozmosToaster),
          ]),
      }),
    );
    await settle();
    Bridge.toast("Level 2 saved");
    const words = await until(() =>
      [...document.querySelectorAll("li")].find((item) =>
        item.textContent?.includes("Level 2 saved"),
      ),
    );
    expect(
      words.closest("[data-kozmos-portal]")?.getAttribute("data-theme"),
    ).toBe("dark");
  });
});
