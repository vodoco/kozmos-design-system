// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref, type Component } from "vue";
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
// wrapper was a React root of its own, and a KozmosRadioGroupItem inside a
// KozmosRadioGroup threw: it could not find its group.

const B = Bridge as unknown as Record<string, Component>;

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
  it("RadioGroup: v-model is the item pressed, and each item is its group's", async () => {
    const level = ref("1");
    mount(() =>
      h(
        Bridge.KozmosRadioGroup,
        {
          "aria-label": "Level",
          modelValue: level.value,
          "onUpdate:modelValue": (value: string) => (level.value = value),
        },
        () => [
          h(Bridge.KozmosRadioGroupItem, { value: "1", label: "Level 1" }),
          h(Bridge.KozmosRadioGroupItem, { value: "2", label: "Level 2" }),
        ],
      ),
    );
    const radios = await until(() => {
      const found = $$<HTMLButtonElement>("[role=radio]");
      return found.length === 2 && found;
    });
    expect(radios.map((radio) => radio.getAttribute("aria-checked"))).toEqual([
      "true",
      "false",
    ]);
    radios[1].click();
    await eventually(() => expect(level.value).toBe("2"));
    await eventually(() =>
      expect(radios.map((radio) => radio.getAttribute("aria-checked"))).toEqual(
        ["false", "true"],
      ),
    );
    // One group: the arrow keys move between its items (Radix's roving
    // focus finds them in its collection).
    expect($("[role=radiogroup]")!.contains(radios[0])).toBe(true);
  });

  it("Select: the item chosen is the model, and the trigger shows its words", async () => {
    const level = ref("1");
    const open = ref(true);
    mount(() =>
      h(
        Bridge.KozmosSelect,
        {
          modelValue: level.value,
          "onUpdate:modelValue": (value: string) => (level.value = value),
          open: open.value,
          "onUpdate:open": (value: boolean) => (open.value = value),
        },
        () => [
          h(Bridge.KozmosSelectTrigger, { "aria-label": "Level" }, () => [
            h(Bridge.KozmosSelectValue, { placeholder: "Level" }),
          ]),
          h(Bridge.KozmosSelectContent, null, () => [
            h(Bridge.KozmosSelectItem, { value: "1" }, () => "Level 1"),
            h(Bridge.KozmosSelectItem, { value: "2" }, () => "Level 2"),
          ]),
        ],
      ),
    );
    const option = await until(() => byText("[role=option]", "Level 2"));
    // The chosen item's words are drawn in the trigger as well as the list.
    expect($("[role=combobox]")!.textContent).toContain("Level 1");
    option.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerType: "mouse" }),
    );
    option.click();
    await eventually(() => expect(level.value).toBe("2"));
    await eventually(() => expect(open.value).toBe(false));
    await eventually(() =>
      expect($("[role=combobox]")!.textContent).toContain("Level 2"),
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

  it("Dialog: its close button closes it, through v-model:open", async () => {
    const open = ref(true);
    mount(() =>
      h(
        Bridge.KozmosDialog,
        {
          open: open.value,
          "onUpdate:open": (value: boolean) => (open.value = value),
        },
        () => [
          h(Bridge.KozmosDialogContent, null, () => [
            h(Bridge.KozmosDialogTitle, null, () => "Edit level"),
            h(Bridge.KozmosDialogDescription, null, () => "Rename it."),
            h(Bridge.KozmosDialogClose, null, () => "Done"),
          ]),
        ],
      ),
    );
    const dialog = await until(() => $("[role=dialog]"));
    // Its title names it: Radix finds the title the compound drew.
    expect(dialog.getAttribute("aria-labelledby")).toBe(
      byText("h2", "Edit level")!.id,
    );
    byText("[role=dialog] button", "Done")!.click();
    await eventually(() => expect(open.value).toBe(false));
  });

  it("a listener on a part of a compound runs once, given the native event", async () => {
    const click = vi.fn();
    mount(() =>
      h(Bridge.KozmosRadioGroup, { "aria-label": "Level" }, () => [
        h(Bridge.KozmosRadioGroupItem, {
          value: "1",
          label: "Level 1",
          onClick: click,
        }),
      ]),
    );
    const radio = await until(() => $("[role=radio]"));
    radio.click();
    await settle();
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  it("a part leaves its compound's tree when Vue takes it away", async () => {
    const shown = ref(true);
    mount(() =>
      h(Bridge.KozmosRadioGroup, { "aria-label": "Level" }, () => [
        h(Bridge.KozmosRadioGroupItem, { value: "1", label: "Level 1" }),
        shown.value
          ? h(Bridge.KozmosRadioGroupItem, { value: "2", label: "Level 2" })
          : null,
        h(Bridge.KozmosRadioGroupItem, { value: "3", label: "Level 3" }),
      ]),
    );
    const third = await until(() => $$("[role=radio]")[2]);
    shown.value = false;
    await nextTick();
    await eventually(() =>
      expect(
        $$("[role=radio]").map((radio) => radio.getAttribute("value")),
      ).toEqual(["1", "3"]),
    );
    // The item after it is the one it was: not drawn again.
    expect($$("[role=radio]")[1]).toBe(third);
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

describe("Tooltip", () => {
  it("draws with no provider of the caller's: every root has one", async () => {
    mount(IN_A_COMPOUND.KozmosTooltipContent.render);
    await until(() => byText("[role=tooltip]", "Opens at 9"));
  });

  it("a KozmosTooltipProvider sets the delay of the tooltips in it", async () => {
    mount(() =>
      h(B.KozmosTooltipProvider, { delayDuration: 0 }, () => [
        h(B.KozmosTooltip, null, () => [
          h(B.KozmosTooltipTrigger, null, () => "Info"),
          h(B.KozmosTooltipContent, null, () => "Opens at 9"),
        ]),
      ]),
    );
    const trigger = await until(() => byText("button", "Info"));
    trigger.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    // No delay: open at once, which the default 700 ms would not be.
    await eventually(
      () => expect(trigger.getAttribute("data-state")).toBe("delayed-open"),
      300,
    );
  });
});
