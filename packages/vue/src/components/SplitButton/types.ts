import type { Component, VNode } from "vue";

/** An action in a SplitButton's menu (GAP-168), as React's SplitButtonMenuAction. */
export interface KozmosSplitButtonMenuAction {
  type?: "item";
  /** What the item says, and its name: text, or a VNode where React's is a node. */
  label: string | VNode;
  /** Runs when the item is chosen, by pointer, Enter or Space. */
  onClick?: () => void;
  /** An icon before the words, at 16, hidden from the item's name: a component or a VNode. */
  icon?: Component | VNode;
  /** Said disabled, drawn at half and skipped by the arrow keys. */
  disabled?: boolean;
  /** The words type-ahead matches when `label` is not text: Menu's `text-value`. */
  textValue?: string;
}

/** A line between groups of items in a SplitButton's menu (GAP-168). */
export interface KozmosSplitButtonMenuSeparator {
  type: "separator";
}

export type KozmosSplitButtonMenuItem =
  | KozmosSplitButtonMenuAction
  | KozmosSplitButtonMenuSeparator;
