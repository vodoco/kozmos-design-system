import {
  defineComponent,
  h,
  normalizeClass,
  useId,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  cn,
  ICON_BUTTON_COUNTER_CLASS,
  iconButtonSizeClass,
} from "#kozmos-recipes";
import { KozmosButton } from "../Button/Button";
import type {
  KozmosButtonEmotion,
  KozmosButtonSize,
  KozmosButtonVariant,
} from "../Button/types";

/**
 * Vue's counterpart of React's IconButton: an icon-only KozmosButton, ghost
 * at the `icon` size by default, squared by the shared recipe
 * (`iconButtonSizeClass`), so the two draw the same `<button>`. Name it with
 * `aria-label` or `aria-labelledby`; every other attribute and listener
 * reaches the button, and a press reports `button_clicked`, as React's
 * Button underneath it does.
 *
 * `counter` draws a count at the button's top-end corner (GAP-197) in
 * Counter's brand pill at `sm`, the class React's draws
 * (`ICON_BUTTON_COUNTER_CLASS`). The count is read with the button's name,
 * "Help, 3" by default, in `counter-label`'s words when given and after
 * `counter-separator`; the number drawn is hidden from readers. Named by its
 * content or by `aria-labelledby`, the count is read from a hidden line the
 * name joins, as React's is.
 */
export const KozmosIconButton = defineComponent({
  name: "KozmosIconButton",
  inheritAttrs: false,
  props: {
    /** The count at the top-end corner; unset, no counter. */
    counter: { type: Number, default: undefined },
    /** What the count is read as, after the button's name. */
    counterLabel: {
      type: Function as PropType<(count: number) => string>,
      default: String,
    },
    /** What stands between the button's name and its count when read. */
    counterSeparator: { type: String, default: ", " },
    isLoading: { type: Boolean, default: undefined },
    emotion: {
      type: String as PropType<KozmosButtonEmotion>,
      default: undefined,
    },
    size: { type: String as PropType<KozmosButtonSize>, default: "icon" },
    variant: {
      type: String as PropType<KozmosButtonVariant>,
      default: "ghost",
    },
  },
  slots: Object as SlotsType<{
    /** The icon, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    const countId = useId();
    return () => {
      const {
        class: className,
        "aria-label": label,
        "aria-labelledby": labelledBy,
        ...rest
      } = attrs as Record<string, unknown>;
      const said =
        props.counter === undefined
          ? undefined
          : props.counterLabel(props.counter);
      // A name from aria-labelledby wins over aria-label and the content,
      // so the hidden line joins the elements it names.
      const labelledByCount =
        said !== undefined && labelledBy
          ? `${labelledBy as string} ${countId}`
          : labelledBy;
      return h(
        KozmosButton,
        {
          size: props.size,
          variant: props.variant,
          emotion: props.emotion,
          isLoading: props.isLoading,
          "aria-label":
            said && label && !labelledBy
              ? `${label as string}${props.counterSeparator}${said}`
              : label,
          "aria-labelledby": labelledByCount,
          class: cn(
            iconButtonSizeClass(props.size),
            said !== undefined && "kozmos-icon-button-counted",
            normalizeClass(className),
          ),
          ...rest,
        },
        {
          default: () => [
            slots.default?.(),
            said === undefined
              ? null
              : [
                  h(
                    "span",
                    {
                      "aria-hidden": "true",
                      "data-slot": "counter",
                      class: ICON_BUTTON_COUNTER_CLASS,
                    },
                    String(props.counter),
                  ),
                  // Named by its content or by aria-labelledby, the count
                  // is read from here.
                  label && !labelledBy
                    ? null
                    : h(
                        "span",
                        { id: countId, class: "sr-only" },
                        `${props.counterSeparator}${said}`,
                      ),
                ],
          ],
        },
      );
    };
  },
});
