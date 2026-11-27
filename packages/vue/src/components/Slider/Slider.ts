import {
  computed,
  defineComponent,
  h,
  inject,
  isVNode,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  ssrContextKey,
  Text,
  useId,
  watch,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { Primitive, useDirection } from "reka-ui";
import {
  mergeAriaIds,
  SLIDER_READOUT_CLASS,
  SLIDER_READOUT_SEPARATOR,
  SLIDER_TOOLTIP_CLASS,
  SLIDER_TRACK_CLASS,
  sliderClass,
  sliderFallbackValue,
  sliderRangeClass,
  sliderRowClass,
  sliderThumbClass,
  sliderThumbCount,
  sliderThumbLabel,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import { useControllable } from "../shared/controllable";
import { callAll } from "../shared/listeners";

type Orientation = "horizontal" | "vertical";
type Direction = "ltr" | "rtl";

const PAGE_KEYS = ["PageUp", "PageDown"];
const ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const BACK_KEYS: Record<string, string[]> = {
  "from-left": ["Home", "PageDown", "ArrowDown", "ArrowLeft"],
  "from-right": ["Home", "PageDown", "ArrowDown", "ArrowRight"],
  "from-bottom": ["Home", "PageDown", "ArrowDown", "ArrowLeft"],
  "from-top": ["Home", "PageDown", "ArrowUp", "ArrowLeft"],
};

// Radix's Slider arithmetic (1.3), as it places and steps the thumbs.
const clamp = (value: number, [min, max]: [number, number]) =>
  Math.min(max, Math.max(min, value));
const linearScale =
  (input: [number, number], output: [number, number]) => (value: number) => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };
const toPercent = (value: number, min: number, max: number) =>
  clamp((100 / (max - min)) * (value - min), [0, 100]);
const decimalCount = (value: number) =>
  (String(value).split(".")[1] || "").length;
const roundValue = (value: number, decimals: number) => {
  const rounder = Math.pow(10, decimals);
  return Math.round(value * rounder) / rounder;
};
const nextSorted = (previous: number[], next: number, atIndex: number) => {
  const values = [...previous];
  values[atIndex] = next;
  return values.sort((a, b) => a - b);
};
const hasMinSteps = (values: number[], minSteps: number) => {
  if (minSteps <= 0) return true;
  const steps = values.slice(0, -1).map((value, i) => values[i + 1] - value);
  return Math.min(...steps) >= minSteps;
};
const closestIndex = (values: number[], next: number) => {
  if (values.length === 1) return 0;
  const distances = values.map((value) => Math.abs(value - next));
  return distances.indexOf(Math.min(...distances));
};
const inBoundsOffset = (width: number, left: number, direction: number) => {
  const half = width / 2;
  const offset = linearScale([0, 50], [0, half]);
  return (half - offset(left) * direction) * direction;
};
/** A slot's nodes as words, when they are only text; else undefined. */
function wordsOf(nodes: VNode[]): string | undefined {
  if (!nodes.every((node) => isVNode(node) && node.type === Text))
    return undefined;
  return nodes.map((node) => String(node.children ?? "")).join("");
}

/**
 * Vue's counterpart of React's Slider: the field React's draws, from the
 * same recipe (`recipes/slider.ts`), around the slider Radix's Slider
 * draws. The slider is drawn here as Radix 1.3 draws it, not on Reka UI's
 * SliderRoot, which differs from it where an app can see: Reka draws each
 * thumb without Radix's positioned box around it, names its custom property
 * `--reka-slider-thumb-transform` where React's stylesheet and Radix name
 * `--radix-slider-thumb-transform`, marks the slider `data-slider-impl`,
 * and draws one hidden number input for the form, only with a `name`,
 * where Radix draws one per thumb.
 *
 * `v-model` is React's `value` and `onValueChange`: the thumbs' values, in
 * order; `default-value` starts an uncontrolled slider, and `thumb-count`
 * reserves thumbs before a value is given. `valueCommit` is React's
 * `onValueCommit`, once a drag ends or a key moves a thumb, reported as
 * `slider_value_changed`, with React's properties, before it is emitted.
 *
 * `label` names a single thumb (or `aria-label`); a range's thumbs are named
 * by `thumb-labels`, else "Minimum value", "Value 2"… "Maximum value".
 * `show-value` draws the value at the slider's end, at rest too (GAP-163),
 * and `show-value-tooltip` in a bubble on the thumb while it is hovered,
 * focused or dragged. The `#formatValue` slot, given `{ value }`, words the
 * value for both, and when it draws only text the thumb says that text
 * (`aria-valuetext`). `error` marks it invalid, and a string error is drawn
 * under it and read as each thumb's description.
 */
export const KozmosSlider = defineComponent({
  name: "KozmosSlider",
  inheritAttrs: false,
  props: {
    label: { type: String, default: undefined },
    // String first, as Vue reads a `[String, Boolean]` prop: "" is an
    // error with no words, as React's `error=""` is, not `true`.
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    thumbCount: { type: Number, default: undefined },
    /** Each thumb's accessible name, in order, in the product's language. */
    thumbLabels: { type: Array as PropType<string[]>, default: undefined },
    wrapperClassName: { type: String, default: undefined },
    /** The current value in a bubble on the thumb. */
    showValueTooltip: { type: Boolean, default: false },
    /** The current value at the slider's end, at rest too (GAP-163). */
    showValue: { type: Boolean, default: false },
    form: { type: String, default: undefined },
    defaultValue: { type: Array as PropType<number[]>, default: undefined },
    dir: { type: String as PropType<Direction>, default: undefined },
    asChild: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    modelValue: { type: Array as PropType<number[]>, default: undefined },
    name: { type: String, default: undefined },
    max: { type: Number, default: undefined },
    min: { type: Number, default: undefined },
    orientation: {
      type: String as PropType<Orientation>,
      default: undefined,
    },
    inverted: { type: Boolean, default: undefined },
    step: { type: Number, default: undefined },
    minStepsBetweenThumbs: { type: Number, default: undefined },
  },
  emits: {
    /** React's `onValueChange`: the thumbs' values as they move. */
    "update:modelValue": (_value: number[]) => true,
    /** React's `onValueCommit`: the values once a drag or a key ends. */
    valueCommit: (_value: number[]) => true,
  },
  slots: Object as SlotsType<{
    /**
     * React's `formatValue(value)`: the value's words for the readout and
     * the bubble, given `{ value }`. Only text is said by the thumb.
     */
    formatValue?: (props: { value: number }) => VNode[];
    /** Taken and not drawn: React's Slider draws its own track and thumbs. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots, emit }) {
    const { trackEvent } = useKozmosAnalytics();
    const errorId = useId();
    const generatedInputId = useId();
    const serverRender = inject(ssrContextKey, null) !== null;
    const providerDirection = useDirection(computed(() => props.dir));
    const min = () => props.min ?? 0;
    const max = () => props.max ?? 100;
    const step = () => props.step ?? 1;
    const orientation = () => props.orientation ?? "horizontal";
    const count = () =>
      sliderThumbCount({
        thumbCount: props.thumbCount,
        value: props.modelValue,
        defaultValue: props.defaultValue,
      });
    const fallback = sliderFallbackValue({
      thumbCount: props.thumbCount,
      count: count(),
      value: props.modelValue,
      defaultValue: props.defaultValue,
      min: min(),
      max: max(),
    });

    const root = shallowRef<HTMLElement | null>(null);
    // The thumbs' elements, by index, once drawn.
    const thumbs: (HTMLElement | null)[] = [];
    const sizes = ref<({ width: number; height: number } | undefined)[]>([]);
    const mounted = ref(false);
    const isFormControl = computed(() =>
      root.value ? !!props.form || !!root.value.closest("form") : true,
    );
    let valueIndexToChange = 0;
    let valuesBeforeSlideStart: number[] = [];
    let rect: DOMRect | undefined;

    const values = useControllable<number[]>(
      () => props.modelValue,
      props.defaultValue ?? fallback ?? [min()],
      (next) => {
        thumbs[valueIndexToChange]?.focus();
        emit("update:modelValue", next);
      },
    );
    const commit = (next: number[]) => {
      trackEvent("Slider", "slider_value_changed", { value: next });
      emit("valueCommit", next);
    };
    const update = (
      value: number,
      atIndex: number,
      { commit: commits } = { commit: false },
    ) => {
      const snapped = roundValue(
        Math.round((value - min()) / step()) * step() + min(),
        decimalCount(step()),
      );
      const nextValue = clamp(snapped, [min(), max()]);
      const previous = values.value.value ?? [];
      const next = nextSorted(previous, nextValue, atIndex);
      if (!hasMinSteps(next, (props.minStepsBetweenThumbs ?? 0) * step()))
        return;
      valueIndexToChange = next.indexOf(nextValue);
      const changed = String(next) !== String(previous);
      if (changed && commits) commit(next);
      if (changed) values.set(next);
    };

    // Where a pointer is on the track, as a value.
    const direction = () =>
      orientation() === "horizontal"
        ? (providerDirection.value as Direction)
        : undefined;
    const slidingForward = () =>
      orientation() === "horizontal"
        ? (direction() === "ltr" && !props.inverted) ||
          (direction() !== "ltr" && !!props.inverted)
        : !props.inverted;
    const edges = () =>
      orientation() === "horizontal"
        ? slidingForward()
          ? { start: "left", end: "right", size: "width" as const }
          : { start: "right", end: "left", size: "width" as const }
        : slidingForward()
          ? { start: "bottom", end: "top", size: "height" as const }
          : { start: "top", end: "bottom", size: "height" as const };
    const valueAt = (event: PointerEvent) => {
      const box = rect || root.value!.getBoundingClientRect();
      rect = box;
      if (orientation() === "horizontal") {
        const output: [number, number] = slidingForward()
          ? [min(), max()]
          : [max(), min()];
        return linearScale([0, box.width], output)(event.clientX - box.left);
      }
      const output: [number, number] = slidingForward()
        ? [max(), min()]
        : [min(), max()];
      return linearScale([0, box.height], output)(event.clientY - box.top);
    };

    // Which thumb shows its bubble: hovered or focused, or dragged, tracked
    // to the document so the bubble survives the pointer leaving the thumb.
    const hoveredThumb = ref<number | null>(null);
    const draggingThumb = ref<number | null>(null);
    const endDrag = () => (draggingThumb.value = null);
    watch(draggingThumb, (now, before) => {
      if (before === null && now !== null) {
        document.addEventListener("pointerup", endDrag);
        document.addEventListener("pointercancel", endDrag);
      } else if (now === null) {
        document.removeEventListener("pointerup", endDrag);
        document.removeEventListener("pointercancel", endDrag);
      }
    });

    let observers: ResizeObserver[] = [];
    onMounted(() => {
      mounted.value = true;
      sizes.value = thumbs.map((thumb) =>
        thumb
          ? { width: thumb.offsetWidth, height: thumb.offsetHeight }
          : undefined,
      );
      if (typeof ResizeObserver === "undefined") return;
      observers = thumbs.map((thumb, index) => {
        const observer = new ResizeObserver((entries) => {
          const box = entries[0]?.borderBoxSize;
          const first = Array.isArray(box) ? box[0] : box;
          const next = [...sizes.value];
          next[index] = first
            ? { width: first.inlineSize, height: first.blockSize }
            : { width: thumb!.offsetWidth, height: thumb!.offsetHeight };
          sizes.value = next;
        });
        if (thumb) observer.observe(thumb, { box: "border-box" });
        return observer;
      });
    });
    onBeforeUnmount(() => {
      for (const observer of observers) observer.disconnect();
      endDrag();
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);
    });

    // Each thumb's form input says its value as it changes, as Radix's.
    const inputs: (HTMLInputElement | null)[] = [];
    watch(
      () => [...(values.value.value ?? [])],
      (next, previous) => {
        next.forEach((value, index) => {
          const input = inputs[index];
          if (!input || previous?.[index] === value) return;
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set;
          if (!setter) return;
          setter.call(input, value);
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });
      },
    );

    return () => {
      const {
        class: className,
        id,
        style,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy,
        "aria-describedby": ariaDescribedBy,
        "aria-invalid": ariaInvalid,
        onKeydown,
        onPointerdown,
        onPointermove,
        onPointerup,
        ...rest
      } = attrs as Record<string, unknown>;
      const hasError = !!props.error;
      const isStringError = typeof props.error === "string";
      const inputId = (id as string | undefined) || generatedInputId;
      const disabled = !!props.disabled;
      const total = count();
      const live = values.value.value ?? [];
      const { start, end, size } = edges();
      const shown = (index: number): (VNode | string)[] => {
        const value = live[index] ?? min();
        return slots.formatValue
          ? slots.formatValue({ value })
          : [String(value)];
      };
      const spoken = (index: number) =>
        slots.formatValue
          ? wordsOf(slots.formatValue({ value: live[index] ?? min() }))
          : undefined;

      const percentages = live.map((value) => toPercent(value, min(), max()));
      const offsetStart = live.length > 1 ? Math.min(...percentages) : 0;
      const offsetEnd = 100 - Math.max(...percentages);
      const thumbNodes = Array.from({ length: total }, (_, index) => {
        // Radix finds a thumb's place once it is mounted: until then it is
        // drawn hidden, as React's server render draws it.
        const at = mounted.value ? index : -1;
        const value = live[at];
        const percent =
          value === undefined ? 0 : toPercent(value, min(), max());
        const measured = sizes.value[index]?.[size];
        const offset = measured
          ? inBoundsOffset(measured, percent, slidingForward() ? 1 : -1)
          : 0;
        // Kozmos's name for the thumb is its name, Radix's own left unused,
        // as React's thumb props replace it.
        const label = sliderThumbLabel({
          index,
          count: total,
          thumbLabels: props.thumbLabels,
          single: (ariaLabel as string | undefined) ?? props.label,
        });
        const formName = props.name
          ? props.name + (live.length > 1 ? "[]" : "")
          : undefined;
        return h(
          "span",
          {
            key: index,
            style: {
              transform: "var(--radix-slider-thumb-transform)",
              position: "absolute",
              [start]: `calc(${percent}% + ${offset}px)`,
            },
          },
          [
            h(
              "span",
              {
                role: "slider",
                "aria-label": label,
                "aria-valuemin": min(),
                "aria-valuenow": value,
                "aria-valuemax": max(),
                "aria-orientation": orientation(),
                "data-orientation": orientation(),
                "data-disabled": disabled ? "" : undefined,
                tabindex: disabled ? undefined : 0,
                "aria-labelledby": props.thumbLabels?.[index]
                  ? undefined
                  : ariaLabelledBy,
                "aria-describedby": mergeAriaIds(
                  ariaDescribedBy as string | undefined,
                  hasError && isStringError ? errorId : undefined,
                ),
                "aria-invalid": hasError || ariaInvalid,
                "aria-valuetext": spoken(index),
                class: sliderThumbClass(hasError),
                "data-radix-collection-item": "",
                // Hidden until it is placed. Placed, React leaves the
                // emptied attribute, `style=""`, and so does this.
                style: value === undefined ? { display: "none" } : "",
                ref: (element: unknown) => {
                  thumbs[index] = element as HTMLElement | null;
                },
                onBlur: () => (hoveredThumb.value = null),
                onFocus: () => {
                  hoveredThumb.value = index;
                  valueIndexToChange = at;
                },
                onPointerdown: () => (draggingThumb.value = index),
                onPointerenter: () => (hoveredThumb.value = index),
                onPointerleave: () => (hoveredThumb.value = null),
              },
              props.showValueTooltip &&
                (hoveredThumb.value === index || draggingThumb.value === index)
                ? [
                    h(
                      "span",
                      { class: SLIDER_TOOLTIP_CLASS, role: "tooltip" },
                      shown(index),
                    ),
                  ]
                : [],
            ),
            isFormControl.value
              ? h("input", {
                  style: { display: "none" },
                  name: formName,
                  form: props.form,
                  ...(serverRender ? { value } : { defaultValue: value }),
                  ref: (element: unknown) => {
                    inputs[index] = element as HTMLInputElement | null;
                  },
                })
              : null,
          ],
        );
      });

      const slider = h(
        Primitive,
        {
          as: "span",
          asChild: props.asChild,
          ...(orientation() === "horizontal" ? { dir: direction() } : {}),
          "data-orientation": orientation(),
          "aria-disabled": disabled,
          "data-disabled": disabled ? "" : undefined,
          id: inputId,
          "aria-invalid": hasError,
          "aria-describedby": hasError && isStringError ? errorId : undefined,
          class: sliderClass({
            hasError,
            showValue: props.showValue,
            className: normalizeClass(className),
          }),
          ...rest,
          ...(orientation() === "vertical" && props.dir
            ? { dir: props.dir }
            : {}),
          style: [
            style,
            {
              "--radix-slider-thumb-transform":
                orientation() === "horizontal"
                  ? "translateX(-50%)"
                  : "translateY(50%)",
            },
          ],
          ref: (element: unknown) => {
            root.value =
              (element as { $el?: HTMLElement } | null)?.$el ??
              (element as HTMLElement | null);
          },
          onKeydown: (event: KeyboardEvent) => {
            callAll(onKeydown, event);
            if (event.defaultPrevented) return;
            if (event.key === "Home") {
              if (!disabled) update(min(), 0, { commit: true });
              event.preventDefault();
            } else if (event.key === "End") {
              if (!disabled) update(max(), live.length - 1, { commit: true });
              event.preventDefault();
            } else if (PAGE_KEYS.concat(ARROW_KEYS).includes(event.key)) {
              if (!disabled) {
                const slide =
                  orientation() === "horizontal"
                    ? slidingForward()
                      ? "from-left"
                      : "from-right"
                    : slidingForward()
                      ? "from-bottom"
                      : "from-top";
                const back = BACK_KEYS[slide].includes(event.key);
                const skip =
                  PAGE_KEYS.includes(event.key) ||
                  (event.shiftKey && ARROW_KEYS.includes(event.key));
                const atIndex = valueIndexToChange;
                update(
                  live[atIndex] + step() * (skip ? 10 : 1) * (back ? -1 : 1),
                  atIndex,
                  { commit: true },
                );
              }
              event.preventDefault();
            }
          },
          onPointerdown: (event: PointerEvent) => {
            callAll(onPointerdown, event);
            if (event.defaultPrevented) return;
            if (!disabled) valuesBeforeSlideStart = live;
            const target = event.target as HTMLElement;
            target.setPointerCapture?.(event.pointerId);
            event.preventDefault();
            if (thumbs.includes(target)) target.focus();
            else if (!disabled) {
              const value = valueAt(event);
              update(value, closestIndex(live, value));
            }
          },
          onPointermove: (event: PointerEvent) => {
            callAll(onPointermove, event);
            if (event.defaultPrevented) return;
            const target = event.target as HTMLElement;
            if (target.hasPointerCapture?.(event.pointerId) && !disabled)
              update(valueAt(event), valueIndexToChange);
          },
          onPointerup: (event: PointerEvent) => {
            callAll(onPointerup, event);
            if (event.defaultPrevented) return;
            const target = event.target as HTMLElement;
            if (!target.hasPointerCapture?.(event.pointerId)) return;
            target.releasePointerCapture(event.pointerId);
            rect = undefined;
            if (disabled) return;
            const before = valuesBeforeSlideStart[valueIndexToChange];
            const after = (values.value.value ?? [])[valueIndexToChange];
            if (after !== before) commit(values.value.value ?? []);
          },
        },
        {
          default: () => [
            h(
              "span",
              {
                "data-disabled": disabled ? "" : undefined,
                "data-orientation": orientation(),
                class: SLIDER_TRACK_CLASS,
              },
              [
                h("span", {
                  "data-orientation": orientation(),
                  "data-disabled": disabled ? "" : undefined,
                  class: sliderRangeClass(hasError),
                  style: {
                    [start]: `${offsetStart}%`,
                    [end]: `${offsetEnd}%`,
                  },
                }),
              ],
            ),
            ...thumbNodes,
          ],
        },
      );

      // The readout lies beside the track, at the row's end; hidden from
      // screen readers, which hear the value from the thumb.
      const body = props.showValue
        ? h("div", { class: sliderRowClass(normalizeClass(className)) }, [
            slider,
            h(
              "span",
              {
                "aria-hidden": "true",
                class: SLIDER_READOUT_CLASS,
                "data-disabled": props.disabled ? "" : undefined,
              },
              Array.from({ length: total }, (_, index) => [
                index > 0 ? SLIDER_READOUT_SEPARATOR : null,
                ...shown(index),
              ]).flat(),
            ),
          ])
        : slider;

      return h(
        KozmosFieldWrapper,
        {
          error: props.error,
          errorId,
          label: props.label,
          inputId,
          class: props.wrapperClassName,
        },
        () => [body],
      );
    };
  },
});
