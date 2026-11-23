import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { cn, DESCRIPTION_LIST_CLASSES } from "#kozmos-recipes";
import { drawn } from "../drawn";
import type { KozmosDescriptionListLayout } from "./types";

/**
 * Vue's counterpart of React's DescriptionList: a set of values each under
 * its label, with no field chrome (GAP-221, decision 199), a record's
 * read-only view. A `<dl>`, each `KozmosDescriptionListItem` a `<dt>` and
 * its `<dd>`, so a screen reader hears each label with its value, drawn
 * from the same recipe (`DESCRIPTION_LIST_CLASSES`). `layout` is `"stack"`
 * (the default), one under another, or `"row"`, side by side, wrapping.
 */
export const KozmosDescriptionList = defineComponent({
  name: "KozmosDescriptionList",
  inheritAttrs: false,
  props: {
    layout: {
      type: String as PropType<KozmosDescriptionListLayout>,
      default: "stack",
    },
  },
  /** The items, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "dl",
        {
          "data-layout": props.layout,
          class: cn(DESCRIPTION_LIST_CLASSES.root, normalizeClass(className)),
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});

/**
 * Vue's counterpart of React's DescriptionListItem: one label and its value,
 * the label 12/16 in the muted foreground over the value 14/20, with no
 * border, fill or field around them. `#label` is the `<dt>`. The value is
 * `#value`, or the default slot where `#value` is not given (tags, words);
 * `:value="true"` and `:value="false"` are a yes and a no, written as
 * `yes-label` and `no-label`, as React's boolean `value` is. `#action` is a
 * part after the value, on its line (a Copy IconButton), read after it.
 */
export const KozmosDescriptionListItem = defineComponent({
  name: "KozmosDescriptionListItem",
  inheritAttrs: false,
  props: {
    /**
     * React's `value` when it is a boolean, a yes or a no: a slot carries
     * nodes, not a boolean. Words and parts are the `#value` slot.
     */
    value: { type: Boolean, default: undefined },
    yesLabel: { type: String, default: "Yes" },
    noLabel: { type: String, default: "No" },
  },
  slots: Object as SlotsType<{
    /** The label, over the value: its `<dt>`. */
    label: () => VNode[];
    /** The value: words, tags or any other part. */
    value?: () => VNode[];
    /** The value too, where `#value` is not given. */
    default?: () => VNode[];
    /** A part after the value, on its line, part of the `<dd>`. */
    action?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      const action = drawn(slots.action?.());
      const shown =
        props.value === true
          ? props.yesLabel
          : props.value === false
            ? props.noLabel
            : slots.value
              ? slots.value()
              : slots.default?.();
      return h(
        "div",
        {
          class: cn(DESCRIPTION_LIST_CLASSES.item, normalizeClass(className)),
          ...rest,
        },
        [
          h("dt", { class: DESCRIPTION_LIST_CLASSES.label }, slots.label?.()),
          h("dd", { class: DESCRIPTION_LIST_CLASSES.value }, [
            h("span", { class: DESCRIPTION_LIST_CLASSES.content }, shown),
            action
              ? h("span", { class: DESCRIPTION_LIST_CLASSES.action }, action)
              : null,
          ]),
        ],
      );
    };
  },
});
