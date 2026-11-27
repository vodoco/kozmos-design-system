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

export const IN_A_COMPOUND: Record<string, InACompound> = {
  KozmosAccordionItem: { render: accordion, drawn: "[data-state=open]" },
  KozmosAccordionTrigger: { render: accordion, drawn: "button" },
  KozmosAccordionContent: { render: accordion, drawn: "[role=region]" },
  KozmosTabsList: { render: tabs, drawn: "[role=tablist]" },
  KozmosTabsTrigger: { render: tabs, drawn: "[role=tab]" },
  KozmosTabsContent: { render: tabs, drawn: "[role=tabpanel]:not([hidden])" },
  KozmosToast: { render: toast, drawn: "li[data-state=open]" },
  KozmosToastViewport: { render: toast, drawn: "ol" },
};
