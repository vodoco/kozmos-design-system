import {
  computed,
  defineComponent,
  h,
  normalizeClass,
  ref,
  useId,
  watch,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { Primitive, useDirection } from "reka-ui";
import {
  cn,
  mergeAriaIds,
  SEGMENTED_CONTROL_FOCUS_CLASS,
  SEGMENTED_CONTROL_LABEL_CLASS,
  segmentedControlItemClass,
  segmentedControlVariants,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import { useListens } from "../FieldWrapper/fieldModel";
import { mixedGroupLine } from "../shared/choiceText";
import { styleAttribute } from "../style";
import { useControllable } from "../shared/controllable";
import { callAll } from "../shared/listeners";
import {
  useRovingFocusGroup,
  useRovingFocusItem,
  type RovingDirection,
  type RovingOrientation,
} from "../shared/rovingFocus";
import type {
  KozmosSegmentedControlItem,
  KozmosSegmentedControlSize,
} from "./types";

/** An app's listener, then the part's own unless the app prevented it. */
const composed =
  (theirs: unknown, ours: (event: Event) => void) => (event: Event) => {
    callAll(theirs, event);
    if (!event.defaultPrevented) ours(event);
  };

/**
 * One segment, as Radix's ToggleGroup item draws it in a single-choice
 * group: a `role="radio"` button, `aria-checked` and `data-state` on or
 * off, in the group's roving focus when it has one.
 */
const Segment = defineComponent({
  name: "KozmosSegmentedControlSegment",
  props: {
    item: {
      type: Object as PropType<KozmosSegmentedControlItem>,
      required: true,
    },
    pressed: { type: Boolean, required: true },
    disabled: { type: Boolean, required: true },
    roving: { type: Boolean, required: true },
    segmentClass: { type: String, required: true },
    press: {
      type: Function as PropType<(pressed: boolean) => void>,
      required: true,
    },
  },
  setup(props) {
    const roving = useRovingFocusItem({
      focusable: () => !props.disabled,
      active: () => props.pressed,
    });
    return () => {
      const { item } = props;
      return h(
        "button",
        {
          ...(props.roving ? roving.attributes() : {}),
          type: "button",
          "data-state": props.pressed ? "on" : "off",
          "data-disabled": props.disabled ? "" : undefined,
          role: "radio",
          "aria-checked": props.pressed,
          class: props.segmentClass,
          disabled: props.disabled,
          ref: roving.setElement,
          onClick: () => {
            if (!props.disabled) props.press(!props.pressed);
          },
          onFocus: (event: FocusEvent) => {
            (event.currentTarget as HTMLElement).scrollIntoView?.({
              block: "nearest",
              inline: "nearest",
            });
            if (props.roving) roving.listeners.onFocus();
          },
          ...(props.roving
            ? {
                onMousedown: roving.listeners.onMousedown,
                onKeydown: roving.listeners.onKeydown,
              }
            : {}),
        },
        // One grid item, whatever the label holds.
        [h("span", { class: SEGMENTED_CONTROL_LABEL_CLASS }, [item.label])],
      );
    };
  },
});

/**
 * Vue's counterpart of React's SegmentedControl: the field React's draws,
 * from the same recipe (`recipes/segmented-control.ts`), around the
 * single-choice group Radix's ToggleGroup draws. The group is drawn here as
 * Radix 1.1 draws it, not on Reka UI's ToggleGroupRoot, which differs from
 * it where an app can see: Reka's segments are `aria-pressed` toggles where
 * Radix's single-choice segments are `role="radio"` with `aria-checked`,
 * and its roving focus differs as `../shared/rovingFocus.ts` says.
 *
 * `items` are the segments, each a value, a label (text or a VNode) and
 * whether it is disabled. `v-model` is React's `value` and
 * `onValueChange`: the pressed value, `undefined` when the segment already
 * holding the pill is pressed again and the choice is taken back, and
 * `null` for a product holding nothing chosen; `undefined`, or no
 * `v-model` at all, leaves the choice to the control, from
 * `default-value`. Each choice is reported as `segmented_control_toggled`,
 * with React's properties, before `update:modelValue` is emitted; a choice
 * taken back is not reported.
 *
 * `label` names the group (else `aria-label`, else "Segmented control");
 * `error` marks it invalid, and a string error is drawn under it and read
 * as its description. Mixed (decisions 188 and 191), no segment is on and
 * `mixed-label` is drawn under it and said as its description; given at
 * all, `mixed` makes the control hold an uncontrolled choice itself. Not
 * mixed, a `@reset-mixed` listener draws the reset, which, pressed,
 * focuses the control's segment and emits `resetMixed`.
 */
export const KozmosSegmentedControl = defineComponent({
  name: "KozmosSegmentedControl",
  inheritAttrs: false,
  props: {
    defaultValue: { type: String, default: undefined },
    // String first, as Vue reads a `[String, Boolean]` prop: "" is an
    // error with no words, as React's `error=""` is, not `true`.
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    fullWidth: { type: Boolean, default: false },
    items: {
      type: Array as PropType<KozmosSegmentedControlItem[]>,
      required: true,
    },
    label: { type: String, default: undefined },
    size: {
      type: String as PropType<KozmosSegmentedControlSize>,
      default: "default",
    },
    /**
     * The chosen segment, for a product that holds the choice itself;
     * `null` is nothing chosen, and `undefined` leaves it to the control.
     */
    modelValue: {
      type: String as PropType<string | null>,
      default: undefined,
    },
    wrapperClassName: { type: String, default: undefined },
    mixed: { type: Boolean, default: undefined },
    mixedLabel: { type: String, default: "Multiple values" },
    resetMixedLabel: { type: String, default: "Reset to multiple values" },
    dir: { type: String as PropType<RovingDirection>, default: undefined },
    asChild: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: false },
    /** The arrows go round from the last segment to the first; Radix's default. */
    loop: { type: Boolean, default: undefined },
    orientation: {
      type: String as PropType<RovingOrientation>,
      default: undefined,
    },
    rovingFocus: { type: Boolean, default: true },
  },
  emits: {
    /** React's `onValueChange`: the pressed value, or `undefined` taken back. */
    "update:modelValue": (_value: string | undefined) => true,
    /**
     * The reset under a control that is not mixed was pressed, after focus
     * went to its segment: React's `onResetMixed`. Drawn only while
     * something listens.
     */
    resetMixed: () => true,
  },
  slots: Object as SlotsType<{
    /** Taken and not drawn: React's control draws its `items`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, emit }) {
    const { trackEvent } = useKozmosAnalytics();
    const generatedId = useId();
    const errorId = useId();
    const mixedId = useId();
    const resettable = useListens("onResetMixed");
    const direction = useDirection(computed(() => props.dir));
    const takesMixed = () => props.mixed !== undefined;
    const isMixed = () => props.mixed === true;
    // A control given `mixed` at all holds an uncontrolled choice itself,
    // as React's does: `default-value` while it is not mixed, none while it
    // is, and the visitor's choice after.
    const held = ref(isMixed() ? "" : (props.defaultValue ?? ""));
    // React drops it as it draws a mixed group; this before each drawing.
    watch(
      [isMixed, () => held.value],
      ([now, choice]) => {
        if (takesMixed() && now && choice !== "") held.value = "";
      },
      { immediate: true },
    );
    const choice = useControllable<string>(
      () =>
        takesMixed()
          ? isMixed()
            ? ""
            : props.modelValue === undefined
              ? held.value
              : (props.modelValue ?? "")
          : // `null` is a held empty choice, which Radix calls "";
            // `undefined` leaves the choice to the control.
            props.modelValue === null
            ? ""
            : props.modelValue,
      takesMixed() ? "" : (props.defaultValue ?? ""),
      (next) => {
        if (takesMixed()) held.value = next;
        // Radix reports a deselect as "": it is said as undefined, and not
        // reported to analytics.
        if (!next) {
          emit("update:modelValue", undefined);
          return;
        }
        trackEvent("SegmentedControl", "segmented_control_toggled", {
          value: next,
        });
        emit("update:modelValue", next);
      },
    );
    const roving = useRovingFocusGroup({
      orientation: () => props.orientation,
      dir: () => direction.value as RovingDirection,
      loop: () => props.loop ?? true,
    });

    return () => {
      const {
        class: className,
        style,
        id,
        "aria-label": ariaLabel,
        "aria-describedby": ariaDescribedBy,
        onFocus,
        onBlur,
        onMousedown,
        ...rest
      } = attrs as Record<string, unknown>;
      const inputId = (id as string | undefined) || generatedId;
      const hasError = Boolean(props.error);
      const isStringError = typeof props.error === "string";
      const usesRoving = props.rovingFocus;
      const itemClass = segmentedControlItemClass({
        fullWidth: props.fullWidth,
        size: props.size,
        hasError,
        disabled: props.disabled,
      });
      const group = h(
        Primitive,
        {
          as: "div",
          asChild: props.asChild,
          ...(usesRoving ? roving.attributes() : {}),
          role: "group",
          dir: direction.value,
          "aria-describedby": mergeAriaIds(
            ariaDescribedBy as string | undefined,
            isMixed() ? mixedId : undefined,
            hasError && isStringError ? errorId : undefined,
          ),
          "aria-invalid": hasError || undefined,
          "aria-label":
            (ariaLabel as string | undefined) ??
            props.label ??
            "Segmented control",
          class: cn(
            segmentedControlVariants({
              fullWidth: props.fullWidth,
              size: props.size,
            }),
            SEGMENTED_CONTROL_FOCUS_CLASS,
            normalizeClass(className),
          ),
          "data-disabled": props.disabled ? "true" : undefined,
          "data-mixed": isMixed() ? "" : undefined,
          // A disabled control, or one whose every segment is, keeps a Tab
          // stop, so its overflowing segments are still reached.
          ...(props.disabled || props.items.every((item) => item.disabled)
            ? { tabindex: 0 }
            : {}),
          id: inputId,
          ...rest,
          ...(usesRoving
            ? {
                style: [{ outline: "none" }, style],
                ref: roving.setGroup,
                onFocus: composed(onFocus, roving.listeners.onFocus as never),
                onBlur: composed(onBlur, roving.listeners.onBlur),
                onMousedown: composed(
                  onMousedown,
                  roving.listeners.onMousedown,
                ),
              }
            : { ...styleAttribute(style), onFocus, onBlur, onMousedown }),
        },
        {
          default: () =>
            props.items.map((item) =>
              h(Segment, {
                key: item.value,
                item,
                pressed: choice.value.value === item.value,
                disabled: props.disabled || !!item.disabled,
                roving: usesRoving,
                segmentClass: itemClass,
                press: (pressed: boolean) =>
                  choice.set(pressed ? item.value : ""),
              }),
            ),
        },
      );
      return h(
        KozmosFieldWrapper,
        {
          class: props.wrapperClassName,
          error: props.error,
          errorId,
          inputId,
          label: props.label,
        },
        () => [
          group,
          takesMixed()
            ? mixedGroupLine({
                mixed: isMixed(),
                mixedLabel: props.mixedLabel,
                mixedId,
                resettable: resettable(),
                resetMixedLabel: props.resetMixedLabel,
                disabled: props.disabled,
                group: () => roving.group.value,
                onReset: () => emit("resetMixed"),
              })
            : null,
        ],
      );
    };
  },
});
