import {
  Comment,
  defineComponent,
  h,
  isVNode,
  normalizeClass,
  Text,
  type PropType,
  type SlotsType,
  type VNode,
  type VNodeArrayChildren,
} from "vue";
import {
  cn,
  KBD_CAP_CLASS,
  KBD_COMBINATION_CLASS,
  KBD_JOIN_CLASS,
  KBD_NAME_CLASS,
  kbdKeyName,
} from "#kozmos-recipes";

type Glyph = string | VNode[] | undefined;

/**
 * A slot's content as React's `children` would be: its text, when it is one
 * run of text (`<KozmosKbd>Esc</KozmosKbd>`), which a key is read by; else
 * its nodes, which are drawn and read as they are.
 */
function glyphOf(nodes: VNode[] | undefined): Glyph {
  const drawn = nodes?.filter(
    (node) => !isVNode(node) || node.type !== Comment,
  );
  if (!drawn?.length) return undefined;
  const [only] = drawn;
  return drawn.length === 1 &&
    isVNode(only) &&
    only.type === Text &&
    typeof only.children === "string"
    ? only.children
    : drawn;
}

/** One cap: its glyph drawn, its name read where the two differ. */
function cap(glyph: Glyph, read?: string, attrs: Record<string, unknown> = {}) {
  const { class: className, ...rest } = attrs;
  const spoken =
    read ?? (typeof glyph === "string" ? kbdKeyName(glyph) : undefined);
  const differs = spoken !== undefined && spoken !== glyph;
  return h(
    "kbd",
    { class: cn(KBD_CAP_CLASS, normalizeClass(className)), ...rest },
    differs
      ? [
          h("span", { "aria-hidden": "true" }, glyph),
          h("span", { class: KBD_NAME_CLASS }, spoken),
        ]
      : glyph,
  );
}

/**
 * Vue's counterpart of React's Kbd: a key drawn as a key (GAP-156), the
 * `<kbd>` React's draws from the same recipe. "Press Esc to clear" draws Esc
 * as a key cap, and a screen reader reads it by the key's name, "Escape"
 * (`kbdKeyName`, in English). `keys` draws a combination, keys joined by
 * "+", read by each key's name, as HTML writes one: a `<kbd>` of `<kbd>`s.
 * `label` is what a screen reader hears instead: the product's own words.
 */
export const KozmosKbd = defineComponent({
  name: "KozmosKbd",
  inheritAttrs: false,
  props: {
    /**
     * A combination, drawn as keys joined by "+": `["Ctrl", "C"]`, read
     * "Control+C". Given, it is drawn instead of the default slot.
     */
    keys: { type: Array as PropType<readonly string[]>, default: undefined },
    /**
     * What a screen reader hears instead of the keys' names: the product's
     * own words for them. By default each key is read by its name, in English.
     */
    label: { type: String, default: undefined },
  },
  slots: Object as SlotsType<{
    /** One key, as it is drawn: "Esc", "⌘", "K"; React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { keys, label } = props;
      // One key given as `keys` is one key.
      if (!keys || keys.length === 1)
        return cap(keys ? keys[0] : glyphOf(slots.default?.()), label, attrs);
      // A combination is a <kbd> of <kbd>s, as HTML writes one.
      const drawn: VNodeArrayChildren = keys.flatMap((key, index) => [
        index > 0 ? h("span", { class: KBD_JOIN_CLASS }, "+") : null,
        label === undefined
          ? cap(key)
          : h("kbd", { class: KBD_CAP_CLASS }, key),
      ]);
      const { class: className, ...rest } = attrs;
      return h(
        "kbd",
        {
          class: cn(KBD_COMBINATION_CLASS, normalizeClass(className)),
          ...rest,
        },
        label === undefined
          ? drawn
          : [
              h("span", { "aria-hidden": "true" }, drawn),
              h("span", { class: KBD_NAME_CLASS }, label),
            ],
      );
    };
  },
});
