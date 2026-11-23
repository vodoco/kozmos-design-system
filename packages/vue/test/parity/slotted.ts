import * as React from "react";
import { defineComponent, h, type Component } from "vue";
import { toReact, toVue, type Drawn } from "./render";

type Child = Drawn | string;

/**
 * A part drawn in both with nodes in its slots: each of `slots` is a React
 * node prop of the same name (`default` is `children`) and a Vue slot,
 * holding the same tree (`render.ts`). `props` go to both; `vueProps`, when
 * given, are Vue's instead (`class`, a boolean React writes as a node).
 */
export function slotted(
  react: React.ElementType,
  vue: Component,
  props: Record<string, unknown> = {},
  slots: Record<string, Child[]> = {},
  vueProps?: Record<string, unknown>,
): Drawn {
  const nodes = (children: Child[]) =>
    children.length === 1
      ? toReact(children[0])
      : React.createElement(React.Fragment, null, ...children.map(toReact));
  return {
    react: () =>
      React.createElement(
        react,
        {
          ...props,
          ...Object.fromEntries(
            Object.entries(slots)
              .filter(([name]) => name !== "default")
              .map(([name, children]) => [name, nodes(children)]),
          ),
        },
        ...(slots.default ?? []).map(toReact),
      ),
    vue: defineComponent({
      setup: () => () =>
        h(
          vue,
          vueProps ?? props,
          Object.fromEntries(
            Object.entries(slots).map(([name, children]) => [
              name,
              () => children.map(toVue),
            ]),
          ),
        ),
    }),
  };
}

/** The same element in both: a tag, its React props, and Vue's spelling. */
export function element(
  tag: string,
  props: Record<string, unknown> = {},
  children: Child[] = [],
): Drawn {
  const { className, ...rest } = props;
  return {
    react: tag,
    vue: tag,
    props,
    vueProps: className === undefined ? rest : { ...rest, class: className },
    children,
  };
}
