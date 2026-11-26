import type { VNode } from "vue";

/** An option's leading Avatar (decision 215): its image, or its initials. */
export interface KozmosComboboxOptionMedia {
  /** The image: a client's logo, a person's photo. */
  src?: string;
  /** Drawn when there is no image, or until it loads; the label's first letters by default. */
  initials?: string;
}

/**
 * One option of a Listbox or a Combobox, as React's `ComboboxOption`: its
 * value and label, a description under the label, the group it is listed
 * under (GAP-192), a leading Avatar (decision 215), and what it shows at
 * its end (GAP-260). React's `trailing` is a node; Vue's is text, a number
 * or a VNode, what Vue draws there.
 */
export interface KozmosComboboxOption {
  description?: string;
  disabled?: boolean;
  /**
   * The group the option is listed under (GAP-192). Options with no group
   * come first, unlabelled; then the groups, in the order they first
   * appear, each under its group's label. The name is trimmed, and a blank
   * one is no group.
   */
  group?: string;
  label: string;
  /** A leading Avatar, drawn before the label; decoration, never the name. */
  media?: KozmosComboboxOptionMedia;
  /** Muted words at the option's end, before the check: read after the label. */
  trailing?: string | number | boolean | null | VNode;
  value: string;
}
