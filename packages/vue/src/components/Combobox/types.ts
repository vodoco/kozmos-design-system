import type { Component, InjectionKey, VNode } from "vue";

/**
 * A command a Combobox's popup lists after its options (React's
 * `ComboboxPopupAction`): "Current position", "Select from map". It shares
 * the arrows and Enter with the options but never becomes the value or the
 * query. Its id is its identity, and every command sharing an id, or with
 * a blank one, is left out. React's `icon` is a node; Vue's is a Vue
 * component (an `@kozmos-ds/icons/vue` glyph) or a VNode.
 */
export interface KozmosComboboxPopupAction {
  id: string;
  label: string;
  icon?: Component | VNode;
  disabled?: boolean;
  onAction: () => void;
}

/**
 * How the map shell presents its panel (`bottom`, a sheet on a phone, or
 * beside or apart from the map), as React's MapShellPresentationContext:
 * parts that scroll draw their scrollbar the way the presentation does
 * (decision 75, GAP-138/139). Null outside a shell. Internal: the shell is
 * not a Vue part yet, so nothing provides it, and a Vue list draws the thin
 * scrollbar it draws outside a shell; this is the key a native shell will
 * provide.
 */
export const MapShellPresentationKey: InjectionKey<string | null> = Symbol(
  "KozmosMapShellPresentation",
);
