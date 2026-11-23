import {
  defineComponent,
  h,
  normalizeClass,
  type SlotsType,
  type VNode,
} from "vue";
import { Label } from "reka-ui";
import { cn, labelVariants } from "#kozmos-recipes";

/**
 * Vue's counterpart of React's Label: a field's name, drawn as the `<label>`
 * React's draws, on Reka UI's Label as React's is on Radix's, from the same
 * recipe (`labelVariants`). `for` names the field it labels, as React's
 * `htmlFor`; a double click on it selects no text. `as-child` draws the
 * recipe on the one child instead, as Radix's Slot does.
 */
export const KozmosLabel = defineComponent({
  name: "KozmosLabel",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    /** The label's words, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        Label,
        {
          asChild: props.asChild,
          class: cn(labelVariants(), normalizeClass(className)),
          ...rest,
        },
        slots.default,
      );
    };
  },
});
