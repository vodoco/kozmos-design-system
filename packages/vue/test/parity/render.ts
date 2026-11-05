import * as React from "react";
import { renderToString as reactToString } from "react-dom/server";
import { createSSRApp, h, type Component } from "vue";
import { renderToString as vueToString } from "vue/server-renderer";
import { normalizeHtml } from "./normalize-html";

/**
 * One node of a tree drawn in both frameworks: a part (React's and Vue's) or
 * an element (the same tag name in both), its props, and its children, which
 * become React `children` and a part's default slot. A string child is text.
 */
export interface Drawn {
  react: React.ElementType;
  vue: Component | string;
  props?: Record<string, unknown>;
  /** Vue's props, where they are spelled differently (`class`, a style string). */
  vueProps?: Record<string, unknown>;
  /**
   * Vue's named slots, each drawing its text: a node React takes as a prop
   * (Badge's `counter`) is a slot in Vue.
   */
  vueSlots?: Record<string, string>;
  children?: (Drawn | string)[];
}

export const toReact = (node: Drawn | string): React.ReactNode =>
  typeof node === "string"
    ? node
    : React.createElement(
        node.react,
        node.props ?? {},
        ...(node.children ?? []).map(toReact),
      );

export const toVue = (node: Drawn | string): ReturnType<typeof h> | string =>
  typeof node === "string"
    ? node
    : typeof node.vue === "string"
      ? h(
          node.vue,
          node.vueProps ?? node.props ?? {},
          (node.children ?? []).map(toVue),
        )
      : h(node.vue, node.vueProps ?? node.props ?? {}, slotsOf(node));

/** A part's slots: its children as the default slot, and its named slots. */
function slotsOf(node: Drawn) {
  const slots: Record<string, () => ReturnType<typeof toVue>[]> = {};
  if (node.children?.length) slots.default = () => node.children!.map(toVue);
  for (const [name, text] of Object.entries(node.vueSlots ?? {}))
    slots[name] = () => [text];
  return Object.keys(slots).length ? slots : undefined;
}

/** The tree's server render in each framework, normalised (`normalize-html.ts`). */
export async function renderBoth(tree: Drawn) {
  const react = reactToString(toReact(tree) as React.ReactElement);
  const vue = await vueToString(createSSRApp({ render: () => toVue(tree) }));
  return {
    react: normalizeHtml(react),
    vue: normalizeHtml(vue),
    raw: { react, vue },
  };
}
