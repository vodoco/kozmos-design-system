import {
  defineComponent,
  h,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  ref,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  cn,
  SPINNER_CLASS,
  SPINNER_LABEL_DELAY_MS,
  SPINNER_PIXELS,
  SPINNER_SIZE_CLASSES,
} from "#kozmos-recipes";
import { spinnerArc } from "./SpinnerArc";
import type { KozmosSpinnerSize } from "./types";

/**
 * Vue's counterpart of React's Spinner: indeterminate loading, the system's
 * arc turning in a polite status, drawn as the `<div>` React's draws from
 * the same recipes (`SPINNER_PIXELS`, `SPINNER_SIZE_CLASSES`, and the arc
 * Button draws too). The sizes are the `Spinner/size/*` tokens, 16, 24, 32
 * and 48; the turn stops
 * under reduced motion and the status keeps saying `label`, "Loading" by
 * default, which is put into the region a moment after it mounts (GAP-226)
 * so a screen reader says it.
 *
 * React's Spinner draws no `children`; the default slot is taken and drawn
 * nowhere, as React's is.
 */
export const KozmosSpinner = defineComponent({
  name: "KozmosSpinner",
  inheritAttrs: false,
  props: {
    size: {
      type: String as PropType<KozmosSpinnerSize>,
      default: "md",
    },
    label: { type: String, default: "Loading" },
  },
  slots: Object as SlotsType<{
    /** React's `children`, which its Spinner draws nowhere. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs }) {
    const labelled = ref(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    onMounted(() => {
      timer = setTimeout(() => (labelled.value = true), SPINNER_LABEL_DELAY_MS);
    });
    onBeforeUnmount(() => clearTimeout(timer));
    return () => {
      const { class: className, ...rest } = attrs;

      return h(
        "div",
        {
          class: cn(SPINNER_CLASS, normalizeClass(className)),
          role: "status",
          // Said as well as implied: an open Select or Menu hides every box
          // not marked aria-live (GAP-193).
          "aria-live": "polite",
          ...rest,
        },
        [
          spinnerArc({
            className: SPINNER_SIZE_CLASSES[props.size],
            size: SPINNER_PIXELS[props.size],
          }),
          h(
            "span",
            { class: "sr-only" },
            labelled.value ? props.label : undefined,
          ),
        ],
      );
    };
  },
});
