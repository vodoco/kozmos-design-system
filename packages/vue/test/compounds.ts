import { h, type Component, type VNode } from "vue";
import * as Bridge from "../src/react-bridge/index";

/**
 * The bridge's exports that draw only inside their compound, as their React
 * parts do (GAP-230): each with the compound it is drawn in, whole, and
 * the element it draws there. `src/react-bridge/Compounds.spec.ts` draws
 * each, and `Listeners.spec.ts` lists them beside the parts that draw
 * alone, so no export is left out of either.
 */
export interface InACompound {
  /** The compound, drawn whole and open. */
  render: () => VNode;
  /** The element the part draws in it. */
  drawn: string;
}

const B = Bridge as unknown as Record<string, Component>;
/** A bridged part, by its name after `Kozmos`, with its props and slot. */
const part = (
  name: string,
  props: Record<string, unknown> = {},
  ...children: (VNode | string)[]
) => h(B[`Kozmos${name}`], props, children.length ? () => children : undefined);

const accordion = () =>
  part(
    "Accordion",
    { type: "single", collapsible: true, defaultValue: "a" },
    part(
      "AccordionItem",
      { value: "a" },
      part("AccordionTrigger", {}, "Opening hours"),
      part("AccordionContent", {}, "9 to 5"),
    ),
  );
const dialog = (name: "Dialog" | "Drawer") => () =>
  part(
    name,
    { open: true },
    part(`${name}Trigger`, {}, "Edit"),
    part(
      `${name}Content`,
      {},
      part(
        `${name}Header`,
        {},
        part(`${name}Title`, {}, "Edit level"),
        part(`${name}Description`, {}, "Rename the level."),
      ),
      part(`${name}Footer`, {}, part(`${name}Close`, {}, "Done")),
    ),
  );
const select = () =>
  part(
    "Select",
    { open: true, defaultValue: "1" },
    part(
      "SelectTrigger",
      { "aria-label": "Level" },
      part("SelectValue", { placeholder: "Level" }),
    ),
    part(
      "SelectContent",
      {},
      part(
        "SelectGroup",
        {},
        part("SelectLabel", {}, "Floors"),
        part("SelectItem", { value: "1" }, "Level 1"),
        part("SelectItem", { value: "2" }, "Level 2"),
      ),
    ),
  );
const tabs = () =>
  part(
    "Tabs",
    { defaultValue: "map" },
    part(
      "TabsList",
      { "aria-label": "View" },
      part("TabsTrigger", { value: "map" }, "Map"),
      part("TabsTrigger", { value: "list" }, "List"),
    ),
    part("TabsContent", { value: "map" }, "The map"),
    part("TabsContent", { value: "list" }, "The list"),
  );
const tooltip = () =>
  part(
    "Tooltip",
    { open: true },
    part("TooltipTrigger", {}, "Info"),
    part("TooltipContent", {}, "Opens at 9"),
  );
const toast = () =>
  part(
    "ToastProvider",
    {},
    part(
      "Toast",
      { open: true },
      part("ToastTitle", {}, "Saved"),
      part("ToastDescription", {}, "Level 2 is renamed."),
      part("ToastAction", { altText: "Undo the rename" }, "Undo"),
      part("ToastClose", {}),
    ),
    part("ToastViewport", {}),
  );
const radio = () =>
  part(
    "RadioGroup",
    { "aria-label": "Level", defaultValue: "1" },
    part("RadioGroupItem", { value: "1", label: "Level 1" }),
    part("RadioGroupItem", { value: "2", label: "Level 2" }),
  );

export const IN_A_COMPOUND: Record<string, InACompound> = {
  KozmosAccordionItem: { render: accordion, drawn: "[data-state=open]" },
  KozmosAccordionTrigger: { render: accordion, drawn: "button" },
  KozmosAccordionContent: { render: accordion, drawn: "[role=region]" },
  KozmosDialogTrigger: {
    render: dialog("Dialog"),
    drawn: "button[aria-haspopup=dialog]",
  },
  KozmosDialogContent: { render: dialog("Dialog"), drawn: "[role=dialog]" },
  KozmosDialogTitle: { render: dialog("Dialog"), drawn: "[role=dialog] h2" },
  KozmosDialogDescription: {
    render: dialog("Dialog"),
    drawn: "[role=dialog] p",
  },
  KozmosDialogClose: {
    render: dialog("Dialog"),
    drawn: "[role=dialog] button",
  },
  KozmosDrawerTrigger: {
    render: dialog("Drawer"),
    drawn: "button[aria-haspopup=dialog]",
  },
  KozmosDrawerContent: { render: dialog("Drawer"), drawn: "[role=dialog]" },
  KozmosDrawerTitle: { render: dialog("Drawer"), drawn: "[role=dialog] h2" },
  KozmosDrawerDescription: {
    render: dialog("Drawer"),
    drawn: "[role=dialog] p",
  },
  KozmosDrawerClose: {
    render: dialog("Drawer"),
    drawn: "[role=dialog] button",
  },
  KozmosSelectTrigger: { render: select, drawn: "[role=combobox]" },
  KozmosSelectValue: { render: select, drawn: "[role=combobox] span" },
  KozmosSelectContent: { render: select, drawn: "[role=listbox]" },
  KozmosSelectLabel: { render: select, drawn: "[role=group] div[id]" },
  KozmosSelectItem: { render: select, drawn: "[role=option]" },
  KozmosTabsList: { render: tabs, drawn: "[role=tablist]" },
  KozmosTabsTrigger: { render: tabs, drawn: "[role=tab]" },
  KozmosTabsContent: { render: tabs, drawn: "[role=tabpanel]:not([hidden])" },
  KozmosTooltipTrigger: { render: tooltip, drawn: "button[data-state]" },
  KozmosTooltipContent: { render: tooltip, drawn: "[role=tooltip]" },
  KozmosToast: { render: toast, drawn: "li[data-state=open]" },
  KozmosToastViewport: { render: toast, drawn: "ol" },
  KozmosRadioGroupItem: { render: radio, drawn: "[role=radio]" },
};
