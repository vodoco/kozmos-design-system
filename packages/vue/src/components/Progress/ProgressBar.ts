import {
  defineComponent,
  Fragment,
  h,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { Primitive } from "reka-ui";
import {
  cn,
  PROGRESS_STATUS_CLASS,
  progressBarClasses,
  progressbarState,
  progressDefaultValueLabel,
  progressIndicatorClass,
  progressWaitName,
  progressWaitSpeaks,
} from "#kozmos-recipes";
import type { KozmosProgressPlacement } from "./types";
import { styleAttribute } from "../style";
import { slotText } from "./slot-text";

/**
 * The progressbar Radix's Progress draws, its attributes in Radix's words:
 * `aria-valuetext` from `getValueLabel`, `data-state` and the value and
 * total it holds. Drawn here, as Radix draws it, rather than on Reka's
 * ProgressRoot, which says `getValueLabel` as `aria-label`.
 */
export function progressbarAttributes(
  value: number | null | undefined,
  max: number | null | undefined,
  getValueLabel: ((value: number, max: number) => string) | undefined,
) {
  const state = progressbarState(value, max);
  return {
    state,
    attributes: {
      "aria-valuemax": state.max,
      "aria-valuemin": 0,
      "aria-valuenow": state.value ?? undefined,
      "aria-valuetext":
        state.value == null
          ? undefined
          : (getValueLabel ?? progressDefaultValueLabel)(
              state.value,
              state.max,
            ),
      role: "progressbar",
      "data-state": state.state,
      "data-value": state.value ?? undefined,
      "data-max": state.max,
    },
  };
}

/**
 * Progress's bar, internal, as React's ProgressBar is: with a value it fills
 * from the inline start as far as `percentage`; with none it waits
 * (GAP-159), sweeping, and a polite status beside it says the wait once,
 * mounted empty and given its words after (GAP-226): the label, else the
 * bar's own name, else "Loading". Bars that start waiting within 500 ms of
 * each other share the first one's announcement (`progressWaitSpeaks`).
 */
export const KozmosProgressBar = defineComponent({
  name: "KozmosProgressBar",
  inheritAttrs: false,
  props: {
    value: { type: Number as PropType<number | null>, default: undefined },
    max: { type: Number, default: undefined },
    percentage: { type: Number, default: 0 },
    placement: {
      type: String as PropType<KozmosProgressPlacement>,
      default: undefined,
    },
    asChild: { type: Boolean, default: undefined },
    getValueLabel: {
      type: Function as PropType<(value: number, max: number) => string>,
      default: undefined,
    },
  },
  slots: Object as SlotsType<{ label?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const waiting = () => props.value == null;
    // Shallow: the words may be the label slot's nodes, which Vue patches
    // in place; a deep ref would make each patch a change to draw again.
    const said = shallowRef<VNode[] | string | null>(null);
    let opened: number | undefined;
    const speak = () => {
      const own = slots.label?.();
      const ownText = slotText(own);
      const ariaLabel = attrs["aria-label"];
      const by = attrs["aria-labelledby"];
      const group = progressWaitSpeaks(opened);
      opened = group.opened;
      if (!group.speaks) return;
      said.value =
        (own?.length && ownText !== "" ? own : undefined) ??
        ((typeof ariaLabel === "string" && ariaLabel) ||
          (typeof by === "string"
            ? by
                .split(" ")
                .map((id) => document.getElementById(id)?.textContent)
                .join(" ")
                .trim()
            : "") ||
          "Loading");
    };
    onMounted(() => {
      if (waiting()) speak();
      watch(waiting, (now) => {
        if (now) speak();
        else said.value = null;
      });
    });
    onBeforeUnmount(() => (said.value = null));
    return () => {
      const {
        class: className,
        "aria-label": ariaLabel,
        "aria-labelledby": labelledBy,
        ...rest
      } = attrs;
      const isWaiting = waiting();
      const { attributes } = progressbarAttributes(
        props.value,
        props.max,
        props.getValueLabel,
      );
      return h(Fragment, [
        h(
          Primitive,
          {
            as: "div",
            asChild: props.asChild,
            ...attributes,
            class: cn(
              progressBarClasses(props.placement),
              normalizeClass(className),
            ),
            "aria-labelledby": labelledBy,
            "aria-label":
              isWaiting && !ariaLabel && !labelledBy
                ? progressWaitName(slotText(slots.label?.()))
                : ariaLabel,
            ...rest,
          },
          () => [
            h("div", {
              "data-state": attributes["data-state"],
              "data-value": attributes["data-value"],
              "data-max": attributes["data-max"],
              class: progressIndicatorClass(isWaiting),
              ...styleAttribute(
                isWaiting ? undefined : { width: `${props.percentage}%` },
              ),
            }),
          ],
        ),
        isWaiting
          ? h(
              "span",
              {
                role: "status",
                "aria-live": "polite",
                class: PROGRESS_STATUS_CLASS,
              },
              said.value ?? undefined,
            )
          : null,
      ]);
    };
  },
});
