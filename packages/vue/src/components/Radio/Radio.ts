import {
  computed,
  defineComponent,
  h,
  inject,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  useId,
  watch,
  type InjectionKey,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { Primitive, useDirection } from "reka-ui";
import { Check, Circle } from "@kozmos-ds/icons/vue";
import {
  cn,
  mergeAriaIds,
  RADIO_CARD_DESCRIPTION_CLASS,
  RADIO_CARD_LINE_CLASS,
  RADIO_CARD_TITLE_CLASS,
  RADIO_CARD_WORDS_CLASS,
  RADIO_CLASS,
  RADIO_DOT_CLASS,
  RADIO_ERROR_CLASS,
  RADIO_GROUP_CLASS,
  RADIO_INDICATOR_CLASS,
  RADIO_LABEL_CLASS,
  RADIO_LABEL_ERROR_CLASS,
  RADIO_TILE_CHECK_MARK_CLASS,
  RADIO_TILE_DESCRIPTION_CLASS,
  RADIO_TILE_TITLE_CLASS,
  radioBoxClass,
  radioCardMarkClass,
  radioMediaClass,
  radioRowClass,
  radioTileCheckClass,
  untitledRadioBoxWarning,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import { useListens } from "../FieldWrapper/fieldModel";
import { KozmosLabel } from "../Label/Label";
import { useBubbleInput } from "../shared/bubbleInput";
import { controlText, mixedGroupLine } from "../shared/choiceText";
import { useControllable } from "../shared/controllable";
import { callAll } from "../shared/listeners";
import {
  useRovingFocusGroup,
  useRovingFocusItem,
  type RovingDirection,
  type RovingOrientation,
} from "../shared/rovingFocus";
import { drawn } from "../drawn";
import type { KozmosRadioGroupItemVariant } from "./types";

/** What a group tells its options, as Radix's RadioGroup context. */
interface RadioGroupContext {
  name: () => string | undefined;
  required: () => boolean;
  disabled: () => boolean;
  value: () => string | null | undefined;
  onValueChange: (value: string) => void;
}
const GROUP: InjectionKey<RadioGroupContext> = Symbol("KozmosRadioGroup");

/** An app's listener, then the part's own unless the app prevented it. */
const composed =
  (theirs: unknown, ours: (event: Event) => void) => (event: Event) => {
    callAll(theirs, event);
    if (!event.defaultPrevented) ours(event);
  };

const ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

/**
 * Vue's counterpart of React's RadioGroup: the field React's draws, from
 * the same recipe (`recipes/radio.ts`), around the radiogroup Radix's
 * RadioGroup draws. The group and its options are drawn here as Radix 1.3
 * draws them, not on Reka UI's RadioGroupRoot and RadioGroupItem, which
 * differ from it where an app can see: Reka names each option from its
 * label's text in `aria-label`, writes `name` and `required` on the option
 * and `disabled=""` where Radix writes them on its form input, draws that
 * input only with a `name`, chooses on focus a tick after an arrow moved it
 * where Radix chooses at once, and moves focus with its own RovingFocusGroup
 * (`../shared/rovingFocus.ts` says how that differs).
 *
 * `v-model` is React's `value` and `onValueChange`: the chosen option's
 * value; `default-value` starts an uncontrolled group. It is one Tab stop;
 * the arrows move along its options and choose as they move. Each choice
 * is reported as `radio_selection_changed`, with React's properties,
 * before `update:modelValue` is emitted.
 *
 * `label` names the field; `error` marks the group invalid, and a string
 * error is drawn under it and read as its description. Mixed (decisions
 * 188 and 191), no option is chosen and `mixed-label` is drawn under the
 * group and said as its description; given at all, `mixed` makes the group
 * hold an uncontrolled choice itself. Not mixed, a `@reset-mixed` listener
 * draws the reset, which, pressed, focuses the group's option and emits
 * `resetMixed`. The app's `class` and attributes reach the radiogroup;
 * `wrapper-class-name` the field.
 */
export const KozmosRadioGroup = defineComponent({
  name: "KozmosRadioGroup",
  inheritAttrs: false,
  props: {
    label: { type: String, default: undefined },
    // String first, as Vue reads a `[String, Boolean]` prop: "" is an
    // error with no words, as React's `error=""` is, not `true`.
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    wrapperClassName: { type: String, default: undefined },
    /**
     * It stands for several values that differ (decisions 188 and 191).
     * Given at all, true or false, the group holds an uncontrolled choice
     * itself: none while mixed, the visitor's after.
     */
    mixed: { type: Boolean, default: undefined },
    mixedLabel: { type: String, default: "Multiple values" },
    resetMixedLabel: { type: String, default: "Reset to multiple values" },
    defaultValue: { type: String, default: undefined },
    dir: { type: String as PropType<RovingDirection>, default: undefined },
    asChild: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    modelValue: { type: String, default: undefined },
    name: { type: String, default: undefined },
    /** The arrows go round from the last option to the first; Radix's default. */
    loop: { type: Boolean, default: undefined },
    orientation: {
      type: String as PropType<RovingOrientation>,
      default: undefined,
    },
    required: { type: Boolean, default: undefined },
  },
  emits: {
    /** React's `onValueChange`: the option chosen. */
    "update:modelValue": (_value: string) => true,
    /**
     * The reset under a group that is not mixed was pressed, after focus
     * went to its option: React's `onResetMixed`. Drawn only while
     * something listens.
     */
    resetMixed: () => true,
  },
  slots: Object as SlotsType<{
    /** The options, KozmosRadioGroupItem, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots, emit }) {
    const { trackEvent } = useKozmosAnalytics();
    const errorId = useId();
    const mixedId = useId();
    const resettable = useListens("onResetMixed");
    const direction = useDirection(computed(() => props.dir));
    const takesMixed = () => props.mixed !== undefined;
    const isMixed = () => props.mixed === true;
    // A group given `mixed` at all holds an uncontrolled choice itself, as
    // React's does: `default-value` while it is not mixed, none while it is,
    // and the visitor's choice after. A choice held before it turned mixed
    // is dropped, never shown again.
    const held = ref(isMixed() ? "" : (props.defaultValue ?? ""));
    // React drops it as it draws a mixed group; this before each drawing.
    watch(
      [isMixed, () => held.value],
      ([now, choice]) => {
        if (takesMixed() && now && choice !== "") held.value = "";
      },
      { immediate: true },
    );
    const choice = useControllable<string | null>(
      () =>
        takesMixed()
          ? isMixed()
            ? ""
            : (props.modelValue ?? held.value)
          : props.modelValue,
      takesMixed() ? null : (props.defaultValue ?? null),
      (next) => {
        trackEvent("RadioGroup", "radio_selection_changed", { value: next });
        if (takesMixed()) held.value = next ?? "";
        emit("update:modelValue", next as string);
      },
    );
    const roving = useRovingFocusGroup({
      orientation: () => props.orientation,
      dir: () => direction.value as RovingDirection,
      loop: () => props.loop ?? true,
    });
    provide(GROUP, {
      name: () => props.name,
      required: () => props.required ?? false,
      disabled: () => props.disabled ?? false,
      value: () => choice.value.value,
      onValueChange: (value) => choice.set(value),
    });

    return () => {
      const {
        class: className,
        style,
        "aria-describedby": ariaDescribedBy,
        onFocus,
        onBlur,
        onMousedown,
        ...rest
      } = attrs as Record<string, unknown>;
      const hasError = !!props.error;
      const group = h(
        Primitive,
        {
          as: "div",
          asChild: props.asChild,
          ...roving.attributes(),
          role: "radiogroup",
          "aria-required": props.required ?? false,
          "aria-orientation": props.orientation,
          "data-disabled": props.disabled ? "" : undefined,
          dir: direction.value,
          class: cn(RADIO_GROUP_CLASS, normalizeClass(className)),
          "aria-invalid": hasError,
          "aria-describedby": mergeAriaIds(
            ariaDescribedBy as string | undefined,
            isMixed() ? mixedId : undefined,
            hasError && typeof props.error === "string" ? errorId : undefined,
          ),
          "data-mixed": isMixed() ? "" : undefined,
          ...rest,
          style: [{ outline: "none" }, style],
          ref: roving.setGroup,
          onFocus: composed(onFocus, roving.listeners.onFocus as never),
          onBlur: composed(onBlur, roving.listeners.onBlur),
          onMousedown: composed(onMousedown, roving.listeners.onMousedown),
        },
        { default: () => slots.default?.() },
      );
      return h(
        KozmosFieldWrapper,
        {
          label: props.label,
          error: props.error,
          errorId,
          class: props.wrapperClassName,
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

// Once a page: a card or tile with no title and no name of its own.
let warnedUntitledBox = false;

/**
 * Vue's counterpart of React's RadioGroupItem: one option of a
 * KozmosRadioGroup, drawn from the same recipe as React's. `default` is the
 * ring beside its label (and its `description`, read as the option's
 * description, never its name); `card` and `tile` draw the whole box as the
 * one radio (GAP-158), named by its title alone, with the `#media` slot's
 * image or icon over it, hidden from assistive technology. An icon-only
 * tile, or a card without a title, needs `aria-label`: it says so once in
 * development.
 *
 * `value` is what the group's `v-model` holds when it is chosen; `error`
 * marks it invalid. The app's `class`, `id` and attributes reach the radio.
 */
export const KozmosRadioGroupItem = defineComponent({
  name: "KozmosRadioGroupItem",
  inheritAttrs: false,
  props: {
    /**
     * The option's name; a card's or a tile's title. An icon-only tile, or a
     * card without a title, needs `aria-label` instead.
     */
    label: { type: String, default: undefined },
    /** A line under the label, read as the option's description. */
    description: { type: String, default: undefined },
    /** `card` and `tile` draw the option as a box (GAP-158). */
    variant: {
      type: String as PropType<KozmosRadioGroupItemVariant>,
      default: "default",
    },
    error: { type: Boolean, default: false },
    asChild: { type: Boolean, default: undefined },
    value: { type: String, required: true },
    /** Radix's: chosen whatever the group holds, when given. */
    checked: { type: Boolean, default: undefined },
    required: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    /** A card's image or a tile's icon: decoration, hidden from assistive technology. */
    media?: () => VNode[];
    /** Taken and not drawn: React's option draws its own indicator there. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    const context = inject(GROUP)!;
    const defaultId = useId();
    const isDisabled = () => context.disabled() || !!props.disabled;
    const isChecked = () =>
      props.checked !== undefined
        ? props.checked
        : context.value() === props.value;
    const roving = useRovingFocusItem({
      focusable: () => !isDisabled(),
      active: isChecked,
    });
    const bubble = useBubbleInput({
      type: "radio",
      checked: isChecked,
      form: () => attrs.form,
    });
    // An arrow moves focus, and the option it reaches is chosen as Radix's
    // is: while an arrow key is down.
    let isArrowKeyPressed = false;
    const keydown = (event: KeyboardEvent) => {
      if (ARROW_KEYS.includes(event.key)) isArrowKeyPressed = true;
    };
    const keyup = () => {
      isArrowKeyPressed = false;
    };
    onMounted(() => {
      document.addEventListener("keydown", keydown);
      document.addEventListener("keyup", keyup);
      const boxed = props.variant === "card" || props.variant === "tile";
      const named = Boolean(
        props.label || attrs["aria-label"] || attrs["aria-labelledby"],
      );
      if (
        process.env.NODE_ENV === "production" ||
        !boxed ||
        named ||
        warnedUntitledBox
      )
        return;
      warnedUntitledBox = true;
      console.warn(untitledRadioBoxWarning(props.variant as "card" | "tile"));
    });
    onBeforeUnmount(() => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("keyup", keyup);
    });

    return () => {
      const {
        class: className,
        id,
        form,
        "aria-describedby": ariaDescribedBy,
        onClick,
        onFocus,
        onKeydown,
        onMousedown,
        ...rest
      } = attrs as Record<string, unknown>;
      const inputId = (id as string | undefined) || defaultId;
      const titleId = `${inputId}-title`;
      const descriptionId = `${inputId}-description`;
      const describedBy = mergeAriaIds(
        ariaDescribedBy as string | undefined,
        props.description ? descriptionId : undefined,
      );
      const checked = isChecked();
      const disabled = isDisabled();
      const state = checked ? "checked" : "unchecked";
      const boxed = props.variant === "card" || props.variant === "tile";
      const tile = props.variant === "tile";
      const indicator = (classes: string, children: VNode[]) =>
        checked
          ? h(
              "span",
              {
                "data-state": state,
                "data-disabled": disabled ? "" : undefined,
                class: classes,
              },
              children,
            )
          : null;
      const own = boxed
        ? {
            id: inputId,
            "data-variant": props.variant,
            "data-error": props.error ? "" : undefined,
            "aria-invalid": props.error || undefined,
            "aria-labelledby": props.label ? titleId : undefined,
            "aria-describedby": describedBy,
            class: radioBoxClass(
              props.variant as "card" | "tile",
              props.error,
              normalizeClass(className),
            ),
          }
        : {
            id: inputId,
            class: cn(
              RADIO_CLASS,
              props.error && RADIO_ERROR_CLASS,
              normalizeClass(className),
            ),
            "aria-invalid": props.error || undefined,
            "aria-describedby": describedBy,
          };
      const media = drawn(slots.media?.());
      const children = !boxed
        ? [
            indicator(RADIO_INDICATOR_CLASS, [
              h(Circle, { class: RADIO_DOT_CLASS }),
            ]),
          ]
        : [
            media
              ? h(
                  "span",
                  {
                    "aria-hidden": "true",
                    "data-slot": "media",
                    class: radioMediaClass(props.variant as "card" | "tile"),
                  },
                  media,
                )
              : null,
            ...(tile
              ? [
                  props.label
                    ? h(
                        "span",
                        {
                          id: titleId,
                          "aria-hidden": "true",
                          class: RADIO_TILE_TITLE_CLASS,
                        },
                        props.label,
                      )
                    : null,
                  props.description
                    ? h(
                        "span",
                        {
                          id: descriptionId,
                          "aria-hidden": "true",
                          class: RADIO_TILE_DESCRIPTION_CLASS,
                        },
                        props.description,
                      )
                    : null,
                  checked
                    ? h(
                        "span",
                        {
                          "data-state": state,
                          "data-disabled": disabled ? "" : undefined,
                          "aria-hidden": "true",
                          "data-slot": "check",
                          class: radioTileCheckClass(props.error),
                        },
                        [h(Check, { class: RADIO_TILE_CHECK_MARK_CLASS })],
                      )
                    : null,
                ]
              : [
                  h("span", { class: RADIO_CARD_LINE_CLASS }, [
                    h(
                      "span",
                      {
                        "aria-hidden": "true",
                        "data-slot": "mark",
                        class: radioCardMarkClass(props.error),
                      },
                      [
                        indicator(RADIO_INDICATOR_CLASS, [
                          h(Circle, { class: RADIO_DOT_CLASS }),
                        ]),
                      ],
                    ),
                    h(
                      "span",
                      { "aria-hidden": "true", class: RADIO_CARD_WORDS_CLASS },
                      [
                        props.label
                          ? h(
                              "span",
                              { id: titleId, class: RADIO_CARD_TITLE_CLASS },
                              props.label,
                            )
                          : null,
                        props.description
                          ? h(
                              "span",
                              {
                                id: descriptionId,
                                class: RADIO_CARD_DESCRIPTION_CLASS,
                              },
                              props.description,
                            )
                          : null,
                      ],
                    ),
                  ]),
                ]),
          ];
      const radio = h(
        Primitive,
        {
          as: "button",
          asChild: props.asChild,
          ...roving.attributes(),
          type: "button",
          role: "radio",
          "aria-checked": checked,
          "data-state": state,
          "data-disabled": disabled ? "" : undefined,
          disabled,
          value: props.value,
          ...own,
          ...rest,
          ref: (element: unknown) => {
            bubble.setControl(element);
            roving.setElement(element);
          },
          onClick: composed(onClick, (event) => {
            if (!checked) context.onValueChange(props.value);
            bubble.onControlClick(event as MouseEvent);
          }),
          // An app's keydown is called, then Enter is prevented, as Radix's
          // option does (a radio is chosen by Space and the arrows), and the
          // arrows move focus.
          onKeydown: (event: KeyboardEvent) => {
            callAll(onKeydown, event);
            if (event.key === "Enter") event.preventDefault();
            if (!event.defaultPrevented) roving.listeners.onKeydown(event);
          },
          onFocus: (event: FocusEvent) => {
            callAll(onFocus, event);
            if (!event.defaultPrevented && isArrowKeyPressed)
              (event.currentTarget as HTMLElement).click();
            if (!event.defaultPrevented) roving.listeners.onFocus();
          },
          onMousedown: composed(onMousedown, (event) =>
            roving.listeners.onMousedown(event as MouseEvent),
          ),
        },
        { default: () => children },
      );
      const input = bubble.render({
        name: context.name(),
        value: props.value,
        required: props.required ?? context.required(),
        disabled,
        form,
      });
      if (boxed) return [radio, input];
      const words = props.description
        ? controlText({
            inputId,
            label: props.label,
            description: props.description,
            descriptionId,
            labelClass: cn(props.error && RADIO_LABEL_ERROR_CLASS),
          })
        : props.label
          ? h(
              KozmosLabel,
              {
                for: inputId,
                class: cn(
                  RADIO_LABEL_CLASS,
                  props.error && RADIO_LABEL_ERROR_CLASS,
                ),
              },
              () => props.label,
            )
          : null;
      return h("div", { class: radioRowClass(!!props.description) }, [
        radio,
        input,
        words,
      ]);
    };
  },
});
