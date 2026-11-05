import * as React from "react";
import { renderToString as reactToString } from "react-dom/server";
import { createSSRApp, h, type Component } from "vue";
import { renderToString as vueToString } from "vue/server-renderer";
import { normalizeHtml } from "./normalize-html";

/**
 * One node of a tree drawn in both frameworks: a part (React's and Vue's),
 * its props, and its children, which become React `children` and Vue's
 * default slot. A string child is text.
 */
export interface Drawn {
  react: React.ElementType;
  vue: Component;
  props?: Record<string, unknown>;
  /** Vue's props, where they are spelled differently (`class`, a style string). */
  vueProps?: Record<string, unknown>;
  children?: (Drawn | string)[];
}

const toReact = (node: Drawn | string): React.ReactNode =>
  typeof node === "string"
    ? node
    : React.createElement(
        node.react,
        node.props ?? {},
        ...(node.children ?? []).map(toReact),
      );

const toVue = (node: Drawn | string): ReturnType<typeof h> | string =>
  typeof node === "string"
    ? node
    : h(
        node.vue,
        node.vueProps ?? node.props ?? {},
        node.children?.length
          ? { default: () => node.children!.map(toVue) }
          : undefined,
      );

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
