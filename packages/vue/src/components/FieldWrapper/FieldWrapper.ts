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
  FIELD_CLASS,
  FIELD_DESCRIPTION_CLASS,
  FIELD_HEADING_CLASS,
  FIELD_OPTIONAL_CLASS,
  FIELD_REQUIRED_CLASS,
  FIELD_RESET_CLASS,
  fieldLabelClass,
  fieldMessage,
  fieldMessageClass,
} from "#kozmos-recipes";
import { KozmosLabel } from "../Label/Label";
import { useListens } from "./fieldModel";
import type { KozmosFieldStatus } from "./types";

/**
 * Vue's counterpart of React's FieldWrapper: the field a label, a
 * description, a control and its message are drawn in, the `<div>` React's
 * draws, from the same recipe (`recipes/field.ts`). Every Kozmos field draws
 * inside one (Input, Textarea, PasswordInput, NumberInput, OTPInput), and a
 * control that draws no label of its own can be put in one.
 *
 * `label` names the control `input-id` names, with a `*` for `required` and
 * `optional-text` at its end where the field is not required (or the
 * `#label-action` slot in its place). `group` names a group of individually
 * labelled controls instead: the box is a `role="group"` labelled by the
 * words. The message line says a string `error` (an assertive alert), else
 * `helper-text`, in `status`'s tone; `#count` draws a character count on that
 * line, before the message and never inside the alert while it is alone.
 *
 * Mixed (GAP-153), `mixed-label` is kept hidden under `mixed-id` for the
 * control's aria-describedby; not mixed, a `@reset-mixed` listener draws
 * `reset-mixed-label` under the control, which, pressed, focuses the control
 * and then emits `resetMixed`, as React's calls `onResetMixed`.
 */
export const KozmosFieldWrapper = defineComponent({
  name: "KozmosFieldWrapper",
  inheritAttrs: false,
  props: {
    descriptionId: { type: String, default: undefined },
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    errorId: { type: String, default: undefined },
    helperText: { type: String, default: undefined },
    helperId: { type: String, default: undefined },
    hideLabel: { type: Boolean, default: undefined },
    label: { type: String, default: undefined },
    inputId: { type: String, default: undefined },
    /** Name a group of individually labelled controls, not one input. */
    group: { type: Boolean, default: false },
    optionalText: { type: String, default: undefined },
    required: { type: Boolean, default: undefined },
    status: {
      type: String as PropType<KozmosFieldStatus>,
      default: "default",
    },
    countId: { type: String, default: undefined },
    /**
     * The field is mixed (GAP-153): `mixed-label` is kept, hidden, under
     * `mixed-id`, for the field's aria-describedby.
     */
    mixed: { type: Boolean, default: false },
    mixedLabel: { type: String, default: "Multiple values" },
    mixedId: { type: String, default: undefined },
    resetMixedLabel: { type: String, default: "Reset to multiple values" },
  },
  emits: {
    /**
     * The reset under a field that is not mixed was pressed, after focus
     * went to the control `input-id` names: React's `onResetMixed`. The
     * reset is drawn only while something listens.
     */
    resetMixed: () => true,
  },
  slots: Object as SlotsType<{
    /** Supporting guidance under the label, as React's `description`. */
    description?: () => VNode[];
    /** Drawn at the label's end in place of `optional-text`, as React's `labelAction`. */
    labelAction?: () => VNode[];
    /** A character count on the message line, as React's `count`. */
    count?: () => VNode[];
    /** The control, as React's `children`. */
    default: () => VNode[];
  }>,
  setup(props, { attrs, slots, emit }) {
    const groupLabelId = useId();
    const resettable = useListens("onResetMixed");
    const reset = (event: MouseEvent) => {
      // The button goes as the field turns mixed again: focus goes to the
      // field first, which is then read with its several values, not lost
      // to the page.
      if (props.inputId)
        (event.currentTarget as HTMLElement).ownerDocument
          .getElementById(props.inputId)
          ?.focus();
      emit("resetMixed");
    };
    return () => {
      const { class: className, ...rest } = attrs;
      const { message, messageId, messageStatus } = fieldMessage({
        error: props.error,
        errorId: props.errorId,
        helperText: props.helperText,
        helperId: props.helperId,
        status: props.status,
      });
      const showRequiredMark = props.required && !props.hideLabel;
      const showOptionalText = Boolean(
        !props.required &&
        props.optionalText &&
        props.label &&
        !props.hideLabel,
      );
      const labelAction = slots.labelAction?.();
      const words = [
        props.label,
        showRequiredMark
          ? h(
              "span",
              {
                "aria-hidden": "true",
                class: FIELD_REQUIRED_CLASS,
                "data-slot": "required-mark",
              },
              "*",
            )
          : null,
      ];
      const count = slots.count?.();
      return h(
        "div",
        {
          class: cn(FIELD_CLASS, normalizeClass(className)),
          "data-status": messageStatus,
          role: props.group ? "group" : undefined,
          "aria-labelledby":
            props.group && props.label ? groupLabelId : undefined,
          ...rest,
        },
        [
          props.label
            ? h("div", { class: FIELD_HEADING_CLASS }, [
                props.group
                  ? h(
                      "span",
                      {
                        id: groupLabelId,
                        class: fieldLabelClass(props.hideLabel),
                      },
                      words,
                    )
                  : h(
                      KozmosLabel,
                      {
                        for: props.inputId,
                        class: fieldLabelClass(props.hideLabel),
                      },
                      () => words,
                    ),
                showOptionalText || labelAction
                  ? h(
                      "span",
                      { class: FIELD_OPTIONAL_CLASS },
                      labelAction ?? props.optionalText,
                    )
                  : null,
              ])
            : null,
          slots.description
            ? h(
                "p",
                { id: props.descriptionId, class: FIELD_DESCRIPTION_CLASS },
                slots.description(),
              )
            : null,
          slots.default?.(),
          // Hidden, and still the field's description: aria-describedby
          // reads a hidden element. Seen, the words are the placeholder.
          props.mixed && props.mixedId
            ? h("span", { id: props.mixedId, hidden: true }, props.mixedLabel)
            : null,
          !props.mixed && resettable()
            ? h(
                "button",
                {
                  type: "button",
                  class: FIELD_RESET_CLASS,
                  "data-slot": "reset-mixed",
                  onClick: reset,
                },
                props.resetMixedLabel,
              )
            : null,
          message
            ? h(
                "p",
                {
                  id: messageId,
                  class: fieldMessageClass(messageStatus),
                  role: messageStatus === "error" ? "alert" : undefined,
                  // Said as well as implied by the role: an open Select
                  // hides every box not marked aria-live, its own field's
                  // error too (GAP-193).
                  "aria-live":
                    messageStatus === "error" ? "assertive" : undefined,
                },
                [
                  count
                    ? [
                        h("span", { "data-slot": "count" }, count),
                        h("span", { "aria-hidden": "true" }, " · "),
                      ]
                    : null,
                  message,
                ],
              )
            : count
              ? // No role, and no live region: this changes on every keystroke.
                h(
                  "p",
                  {
                    id: props.countId,
                    "data-slot": "count",
                    class: fieldMessageClass(messageStatus),
                  },
                  count,
                )
              : null,
        ],
      );
    };
  },
});
