import {
  computed,
  defineComponent,
  h,
  inject,
  isVNode,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  Text,
  type InjectionKey,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { useDirection } from "reka-ui";
import { X } from "@kozmos-ds/icons/vue";
import {
  CHIP_ICON_CLASS,
  CHIP_LABEL_CLASS,
  CHIP_REMOVE_ICON_CLASS,
  chipClass,
  chipContentClass,
  chipGroupClass,
  chipLabelText,
  chipRemoveClass,
  chipRemoveLabel,
  emotionSurfaceVariables,
} from "#kozmos-recipes";
import { useListens, without } from "../FieldWrapper/fieldModel";
import { useBubbleInput } from "../shared/bubbleInput";
import { callAll } from "../shared/listeners";
import {
  useRovingFocusGroup,
  useRovingFocusItem,
  type RovingDirection,
} from "../shared/rovingFocus";
import { styleAttribute } from "../style";
import { drawn } from "../drawn";
import type { KozmosEmotion } from "../Tag/types";
import type {
  KozmosChipGroupSelectionMode,
  KozmosChipSize,
  KozmosChipVariant,
} from "./types";

/**
 * What a single-choice group tells its chips, as React's ChipChoiceContext
 * and Radix's RadioGroup context together: the chosen value, and how to
 * choose.
 */
interface ChipChoice {
  /** Whether the group is one choice: a group of toggles tells its chips nothing. */
  single: () => boolean;
  value: () => string;
  choose: (value: string) => void;
  disabled: () => boolean;
  required: () => boolean;
  name: () => unknown;
}
const CHOICE: InjectionKey<ChipChoice> = Symbol("KozmosChipChoice");

const ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

/** A label that is text alone, as React's `children` is a string or a number. */
function labelText(nodes: VNode[] | undefined): string | undefined {
  const node = nodes?.length === 1 ? nodes[0] : undefined;
  return isVNode(node) &&
    node.type === Text &&
    typeof node.children === "string"
    ? node.children
    : undefined;
}

/**
 * Vue's counterpart of React's Chip: a pill that filters, chooses or holds
 * an entry, drawn as the `<span>` React's draws, from the same recipe
 * (`recipes/chip.ts`). Its label is the default slot, its icon the `#icon`
 * slot, hidden from assistive technology; a long label truncates, still
 * naming the chip and its remove whole.
 *
 * With a `@click` listener it is a toggle: the press area inside it is a
 * `<button aria-pressed>`, `selected` (or the legacy `active`) its state,
 * and the click is heard there, as React's `onClick`. Listen for `remove`
 * (`@remove`) and it draws React's remove button after it, named by
 * `remove-label` or "Remove" and the label. Inside a single-choice
 * KozmosChipGroup, a chip given a `value` is one of the group's radios, as
 * Radix's RadioGroupItem draws one: the group decides whether it is
 * selected, and it offers no remove. `emotion` decides its colour whatever
 * the `variant`; the app's own `style` wins over the emotion's properties.
 */
export const KozmosChip = defineComponent({
  name: "KozmosChip",
  inheritAttrs: false,
  props: {
    active: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: false },
    /** What the chip means (GAP-170, decision 200): one of Tag's six emotions. */
    emotion: { type: String as PropType<KozmosEmotion>, default: undefined },
    removeLabel: { type: String, default: undefined },
    selected: { type: Boolean, default: undefined },
    /** In a single-choice KozmosChipGroup, what choosing this chip picks. */
    value: { type: String, default: undefined },
    size: { type: String as PropType<KozmosChipSize>, default: undefined },
    variant: {
      type: String as PropType<KozmosChipVariant>,
      default: undefined,
    },
  },
  emits: {
    /** React's `onRemove`: the remove button was pressed. */
    remove: () => true,
  },
  slots: Object as SlotsType<{
    /** The icon before the label, hidden from assistive technology. */
    icon?: () => VNode[];
    /** The label, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, emit, slots }) {
    const choice = inject(CHOICE, null);
    // React draws the remove only for an `onRemove`; a declared event is not
    // an attribute, so it is read from what the app bound.
    const removable = useListens("onRemove");
    const isChoice = () =>
      choice !== null && choice.single() && props.value !== undefined;
    const isSelected = () =>
      isChoice()
        ? choice!.value() === props.value
        : (props.selected ?? props.active ?? false);
    const choiceDisabled = () =>
      (choice?.disabled() ?? false) || props.disabled;

    // A choice is one of the group's radios, as Radix's RadioGroupItem:
    // the group's one Tab stop and its arrows, and a hidden input in a form.
    const roving = choice
      ? useRovingFocusItem({
          focusable: () => !choiceDisabled(),
          active: isSelected,
        })
      : null;
    const bubble = choice
      ? useBubbleInput({
          type: "radio",
          checked: isSelected,
          form: () => attrs.form,
        })
      : null;
    // An arrow moves focus, and the chip it reaches is chosen as Radix's
    // radio is: while an arrow key is down.
    let isArrowKeyPressed = false;
    const keydown = (event: KeyboardEvent) => {
      if (ARROW_KEYS.includes(event.key)) isArrowKeyPressed = true;
    };
    const keyup = () => {
      isArrowKeyPressed = false;
    };
    if (choice) {
      onMounted(() => {
        document.addEventListener("keydown", keydown);
        document.addEventListener("keyup", keyup);
      });
      onBeforeUnmount(() => {
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("keyup", keyup);
      });
    }

    return () => {
      const {
        class: className,
        style,
        onClick,
        onKeydown,
        ...rest
      } = attrs as Record<string, unknown>;
      const children = slots.default?.();
      const icon = drawn(slots.icon?.());
      const chosen = isSelected();
      const asChoice = isChoice();
      const hasRemove = removable();
      const interactive = asChoice || !!onClick;
      const label = chipLabelText(labelText(children));
      const content = [
        icon
          ? h(
              "span",
              {
                "aria-hidden": "true",
                class: CHIP_ICON_CLASS,
                "data-slot": "chip-icon",
              },
              icon,
            )
          : null,
        h(
          "span",
          { class: CHIP_LABEL_CLASS, "data-slot": "chip-label" },
          children,
        ),
      ];
      const pressable = chipContentClass(props.size, hasRemove, true);

      let inner: VNode;
      if (asChoice) {
        const disabled = choiceDisabled();
        const state = chosen ? "checked" : "unchecked";
        inner = h(
          "button",
          {
            type: "button",
            role: "radio",
            "aria-checked": chosen,
            "data-state": state,
            "data-disabled": disabled ? "" : undefined,
            disabled,
            value: props.value,
            ...roving!.attributes(),
            class: pressable,
            ref: (element: unknown) => {
              bubble!.setControl(element);
              roving!.setElement(element);
            },
            onClick: (event: MouseEvent) => {
              callAll(onClick, event);
              if (event.defaultPrevented) return;
              if (!chosen) choice!.choose(props.value!);
              bubble!.onControlClick(event);
            },
            // An app's keydown is called, then Enter is prevented, as
            // Radix's radio does (a radio is chosen by Space and the
            // arrows), and the arrows move focus.
            onKeydown: (event: KeyboardEvent) => {
              callAll(onKeydown, event);
              if (event.key === "Enter") event.preventDefault();
              if (!event.defaultPrevented) roving!.listeners.onKeydown(event);
            },
            onFocus: (event: FocusEvent) => {
              if (isArrowKeyPressed)
                (event.currentTarget as HTMLElement).click();
              roving!.listeners.onFocus();
            },
            onMousedown: (event: MouseEvent) =>
              roving!.listeners.onMousedown(event),
          },
          content,
        );
      } else if (interactive) {
        inner = h(
          "button",
          {
            "aria-pressed": chosen,
            class: pressable,
            disabled: props.disabled,
            onClick: (event: MouseEvent) => callAll(onClick, event),
            onKeydown: (event: KeyboardEvent) => callAll(onKeydown, event),
            type: "button",
          },
          content,
        );
      } else {
        inner = h(
          "span",
          {
            class: chipContentClass(props.size, hasRemove, false),
            onKeydown: onKeydown
              ? (event: KeyboardEvent) => callAll(onKeydown, event)
              : undefined,
            tabindex: onKeydown && !props.disabled ? 0 : undefined,
          },
          content,
        );
      }
      const hidden =
        asChoice && bubble
          ? bubble.render({
              name: choice!.name(),
              value: props.value,
              required: choice!.required(),
              disabled: choiceDisabled(),
              form: attrs.form,
            })
          : null;

      return h(
        "span",
        {
          "aria-disabled": props.disabled || undefined,
          class: chipClass(
            {
              variant: props.variant,
              size: props.size,
              emotion: props.emotion,
              selected: chosen,
              interactive,
              disabled: props.disabled,
              removable: hasRemove,
              choice: asChoice,
            },
            normalizeClass(className),
          ),
          "data-slot": "chip",
          "data-emotion": props.emotion,
          // The caller's own style wins, as on Tag: the emotion sets a default.
          ...styleAttribute(
            props.emotion && emotionSurfaceVariables(props.emotion),
            style,
          ),
          ...rest,
        },
        [
          inner,
          hidden,
          hasRemove && !asChoice
            ? h(
                "button",
                {
                  "aria-label": chipRemoveLabel(label, props.removeLabel),
                  class: chipRemoveClass(props.variant, props.emotion, chosen),
                  disabled: props.disabled,
                  onClick: (event: MouseEvent) => {
                    event.stopPropagation();
                    emit("remove");
                  },
                  type: "button",
                },
                [
                  h(X, {
                    "aria-hidden": "true",
                    class: CHIP_REMOVE_ICON_CLASS,
                  }),
                ],
              )
            : null,
        ],
      );
    };
  },
});

/**
 * Vue's counterpart of React's ChipGroup: the row chips wrap in, the `<div>`
 * React's draws from the same recipe. `multiple`, the default, leaves each
 * chip its own toggle. `single` makes the chips one choice, a radio group
 * as Radix's RadioGroup draws it, with one Tab stop and the arrow keys
 * moving the choice in the writing direction: give each chip a `value`,
 * and the group an `aria-label` that names the choice.
 *
 * `v-model` is React's `value` and `onValueChange`: the chosen chip's
 * value, emitted as a chip is chosen (a choice cannot be emptied);
 * `default-value` starts a group that holds its own choice. `dir` sets the
 * arrows' direction; the KozmosThemeProvider's otherwise.
 */
export const KozmosChipGroup = defineComponent({
  name: "KozmosChipGroup",
  inheritAttrs: false,
  props: {
    selectionMode: {
      type: String as PropType<KozmosChipGroupSelectionMode>,
      default: "multiple",
    },
    /** The chosen chip's value, with `selection-mode="single"`: controlled. */
    modelValue: { type: String, default: undefined },
    /** The chip chosen at first, when the group holds its own choice. */
    defaultValue: { type: String, default: undefined },
    /** Reading direction for the arrow keys; the KozmosThemeProvider's otherwise. */
    dir: { type: String as PropType<"ltr" | "rtl">, default: undefined },
  },
  emits: {
    /** React's `onValueChange`: the chosen chip's value. */
    "update:modelValue": (_value: string) => true,
  },
  slots: Object as SlotsType<{
    /** The chips, KozmosChip, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, emit, slots }) {
    const held = ref(props.defaultValue);
    // Always a string, as React's group gives Radix "" for no choice.
    const chosen = () =>
      (props.modelValue !== undefined ? props.modelValue : held.value) ?? "";
    const direction = useDirection(computed(() => props.dir));
    const roving = useRovingFocusGroup({
      orientation: () => undefined,
      dir: () => direction.value as RovingDirection,
      loop: () => true,
    });
    provide(CHOICE, {
      single: () => props.selectionMode === "single",
      value: chosen,
      choose: (next) => {
        if (next === chosen()) return;
        if (props.modelValue === undefined) held.value = next;
        emit("update:modelValue", next);
      },
      disabled: () => attrs.disabled === "" || attrs.disabled === true,
      required: () => attrs.required === "" || attrs.required === true,
      name: () => attrs.name,
    });

    return () => {
      const {
        class: className,
        style,
        onFocus,
        onBlur,
        onMousedown,
        ...rest
      } = attrs as Record<string, unknown>;
      const classes = chipGroupClass(normalizeClass(className));
      if (props.selectionMode !== "single")
        return h(
          "div",
          {
            class: classes,
            "data-slot": "chip-group",
            dir: props.dir,
            ...styleAttribute(style),
            onFocus,
            onBlur,
            onMousedown,
            ...rest,
          },
          slots.default?.(),
        );
      // Radix's RadioGroup takes these as its own, never as attributes.
      const others = without(rest, "disabled", "required", "name");
      const disabled = attrs.disabled === "" || attrs.disabled === true;
      const required = attrs.required === "" || attrs.required === true;
      return h(
        "div",
        {
          ...roving.attributes(),
          role: "radiogroup",
          "aria-required": required,
          "data-disabled": disabled ? "" : undefined,
          dir: direction.value,
          class: classes,
          "data-slot": "chip-group",
          ...others,
          style: [{ outline: "none" }, style],
          ref: roving.setGroup,
          onFocus: (event: FocusEvent) => {
            callAll(onFocus, event);
            if (!event.defaultPrevented) roving.listeners.onFocus(event);
          },
          onBlur: (event: FocusEvent) => {
            callAll(onBlur, event);
            if (!event.defaultPrevented) roving.listeners.onBlur();
          },
          onMousedown: (event: MouseEvent) => {
            callAll(onMousedown, event);
            if (!event.defaultPrevented) roving.listeners.onMousedown();
          },
        },
        slots.default?.(),
      );
    };
  },
});
