import * as KozmosReact from "@kozmos-ds/react";
import {
  createVueWrapper,
  describeBooleans,
  describeParts,
  eventValue,
} from "../src/react-bridge/react-adapter";
import { PART_BOOLEANS, PART_TAKES } from "../src/react-bridge/part-takes";

/**
 * React's Search and Menu, mounted through the bridge's adapter as
 * `@kozmos-ds/vue`'s bridge mounted them until their native ports (wave
 * V3), for the bridge's specs: Search a plain text field with a DOM-event
 * `v-model`, which they drive to hold the adapter's text-field model,
 * listeners and booleans to React's; Menu a part that draws no element and
 * opens in a portal, whose listeners are heard from what it draws in place
 * and never from its portal. The bridge exports neither kind any more
 * (DatePicker's and TimePicker's `v-model` is Search's model, on fields a
 * test cannot type words into), so the specs mount these. Not exported from
 * any entry. Each is described as bridge-takes.mjs described it: Search as
 * SearchBar is, with its own `clearable` and `error`; Menu by its root's
 * props.
 */
const bar = PART_BOOLEANS.get(KozmosReact.SearchBar)!;
describeParts([[KozmosReact.Search, PART_TAKES.get(KozmosReact.SearchBar)!]]);
describeBooleans([
  [
    KozmosReact.Search,
    {
      // SearchBar's, and Search's own `clearable` and `error`.
      flags: [...bar.flags, "clearable"],
      unions: bar.unions,
      texts: [...bar.texts, "error"],
    },
  ],
]);

describeParts([[KozmosReact.Menu, { dom: false, own: ["onOpenChange"] }]]);
describeBooleans([
  [
    KozmosReact.Menu,
    { flags: ["defaultOpen", "modal", "open"], unions: [], texts: [] },
  ],
]);

export const KozmosMenu = createVueWrapper(KozmosReact.Menu);

export const KozmosSearch = createVueWrapper(KozmosReact.Search, {
  modelValue: {
    prop: "value",
    callback: "onChange",
    read: eventValue,
    empty: "",
  },
});
