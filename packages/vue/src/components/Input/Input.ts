import {
  defineComponent,
  h,
  isVNode,
  normalizeClass,
  onBeforeUnmount,
  ref,
  useId,
  watch,
  type Component,
  type PropType,
  type SlotsType,
} from "vue";
import { Check, Copy01, Pencil01 } from "@kozmos-ds/icons/vue";
import {
  cn,
  FIELD_ACTION_ICON_CLASS,
  INPUT_ACTION_CLASS,
  INPUT_ACTION_FIELD_CLASS,
  INPUT_CONTROL_CLASS,
  INPUT_COPIED_MS,
  INPUT_WITH_ACTION_CLASS,
  inputActionLabel,
  inputCopiedSaid,
  inputVariants,
  mergeAriaIds,
  resolveCharacterCount,
} from "#kozmos-recipes";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import {
  attributeFlag,
  listeners,
  readOnlyOf,
  useListens,
  useTextModel,
  withoutModelAttributes,
} from "../FieldWrapper/fieldModel";
import type {
  KozmosCharacterCount,
  KozmosInputAction,
  KozmosInputStatus,
} from "./types";

/**
 * Vue's counterpart of React's Input: a single-line field, the `<input>`
 * React's draws inside a KozmosFieldWrapper, from the same recipe
 * (`inputVariants`), with its `label`, `helper-text` and `error` drawn
 * around it. `v-model` is its value, as React's `value` and `onChange`;
 * without one, it starts with `default-value` and keeps what is typed.
 * Every other attribute and listener reaches the `<input>`, as React's
 * `...props`; `wrapper-class-name` reaches the field around it.
 *
 * `count` draws a character count under the field and says when it is
 * wrong (a soft limit, never a swallowed keystroke). `action` draws a
 * button inside the field's end (GAP-154, GAP-212): a copy that says
 * "Copied", a pressed toggle, or an edit pencil. `mixed` (GAP-153) shows
 * none of its value, `mixed-label` as its placeholder, and a
 * `@reset-mixed` listener draws the reset once it is edited.
 */
export const KozmosInput = defineComponent({
  name: "KozmosInput",
  inheritAttrs: false,
  props: {
    /** The field's value, `v-model`: React's `value`. */
    modelValue: {
      type: [String, Number] as PropType<string | number>,
      default: undefined,
    },
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    helperText: { type: String, default: undefined },
    label: { type: String, default: undefined },
    status: {
      type: String as PropType<KozmosInputStatus>,
      default: "default",
    },
    wrapperClassName: { type: String, default: undefined },
    /**
     * Draw a character count under the field, and say when it is wrong.
     * `limit` is a soft maximum: going over is an error the visitor is told
     * about, not a keystroke the browser swallows.
     */
    count: {
      type: Object as PropType<KozmosCharacterCount>,
      default: undefined,
    },
    /** A copy, toggle or edit button inside the field's end (GAP-154, GAP-212). */
    action: {
      type: Object as PropType<KozmosInputAction>,
      default: undefined,
    },
    /** The field stands for several values that differ, and shows none (GAP-153). */
    mixed: { type: Boolean, default: false },
    /** Shown in the empty field, and said with it. */
    mixedLabel: { type: String, default: "Multiple values" },
    /** The reset's words. Default "Reset to multiple values". */
    resetMixedLabel: { type: String, default: undefined },
  },
  emits: {
    /** The text typed, as React's `onChange` hears it in `event.target.value`. */
    "update:modelValue": (_value: string) => true,
    /** The reset was pressed: set `mixed` again (React's `onResetMixed`). */
    resetMixed: () => true,
  },
  slots: Object as SlotsType<Record<never, never>>,
  setup(props, { attrs, emit }) {
    const listensForReset = useListens("onResetMixed");
    const errorId = useId();
    const helperId = useId();
    const countId = useId();
    const defaultInputId = useId();
    const model = useTextModel({
      model: () => props.modelValue,
      attrs,
      mixed: () => props.mixed,
      emit: (text) => emit("update:modelValue", text),
    });

    // The action's "Copied", said for two seconds.
    const said = ref("");
    let timer: ReturnType<typeof setTimeout> | undefined;
    watch(said, (now) => {
      clearTimeout(timer);
      if (now) timer = setTimeout(() => (said.value = ""), INPUT_COPIED_MS);
    });
    onBeforeUnmount(() => clearTimeout(timer));

    const act = async (action: KozmosInputAction, event: MouseEvent) => {
      if (action.kind === "edit") return action.onEdit();
      if (action.kind === "toggle")
        return action.onPressedChange(!action.pressed);
      const value = (
        (event.currentTarget as HTMLElement)
          .previousElementSibling as HTMLInputElement
      ).value;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        return;
      }
      said.value = inputCopiedSaid(said.value, action.copiedLabel ?? "Copied");
      action.onCopy?.(value);
    };

    const fieldAction = (action: KozmosInputAction, disabled: boolean) => {
      const icon = {
        class: FIELD_ACTION_ICON_CLASS,
        "aria-hidden": "true" as const,
      };
      const glyph =
        action.kind === "edit"
          ? h(Pencil01, icon)
          : action.kind === "toggle"
            ? isVNode(action.icon)
              ? action.icon
              : h(action.icon as Component)
            : said.value
              ? h(Check, icon)
              : h(Copy01, icon);
      return [
        h(
          "button",
          {
            type: "button",
            "aria-label": inputActionLabel(action),
            "aria-pressed":
              action.kind === "toggle" ? String(action.pressed) : undefined,
            class: INPUT_ACTION_CLASS,
            disabled,
            onClick: (event: MouseEvent) => act(action, event),
          },
          [glyph],
        ),
        // In the page from the start, so the change is read.
        action.kind === "copy"
          ? h(
              "span",
              { class: "sr-only", role: "status", "aria-live": "polite" },
              said.value,
            )
          : null,
      ];
    };

    return () => {
      const {
        class: className,
        "aria-describedby": callerDescribedBy,
        "aria-invalid": callerInvalid,
        onInput,
        onChange,
        ...rest
      } = withoutModelAttributes(attrs);
      const counted = resolveCharacterCount(props.count, model.counted());
      // A caller's own error wins: it knows something the count does not.
      const resolvedError = props.error || counted?.message;
      const hasError = !!resolvedError;
      const resolvedStatus: KozmosInputStatus = hasError
        ? "error"
        : props.status;
      const isInvalid = resolvedStatus === "error";
      const describedBy =
        hasError && typeof resolvedError === "string"
          ? errorId
          : props.helperText
            ? helperId
            : counted
              ? countId
              : undefined;
      const inputId = (attrs.id as string | undefined) || defaultInputId;
      const disabled = attributeFlag(attrs.disabled);
      const readOnly = readOnlyOf(attrs);
      const action = props.action;
      const value = model.value();
      const input = h("input", {
        type: attrs.type as string | undefined,
        id: inputId,
        class: cn(
          inputVariants({ status: resolvedStatus }),
          // Room for the action, as PasswordInput keeps for its toggle.
          action && INPUT_WITH_ACTION_CLASS,
          normalizeClass(className),
        ),
        ref: model.field,
        "aria-invalid": isInvalid ? "true" : (callerInvalid as string),
        "aria-describedby": mergeAriaIds(
          callerDescribedBy as string | undefined,
          describedBy,
        ),
        ...rest,
        ...(value === undefined ? {} : { value }),
        ...(props.mixed
          ? { placeholder: props.mixedLabel, "data-mixed": "" }
          : {}),
        onInput: listeners(model.onInput, onInput),
        onChange: listeners(model.onChange, onChange),
      });
      return h(
        KozmosFieldWrapper,
        {
          error: resolvedError,
          errorId,
          countId,
          helperId,
          helperText: props.helperText,
          label: props.label,
          inputId,
          status: resolvedStatus,
          class: props.wrapperClassName,
          mixed: props.mixed,
          onResetMixed:
            listensForReset() && !disabled && !readOnly
              ? () => {
                  model.clear();
                  emit("resetMixed");
                }
              : undefined,
          resetMixedLabel: props.resetMixedLabel,
        },
        {
          ...(counted ? { count: () => counted.text } : {}),
          // One wrapper, with an action or without, so the input keeps its
          // place in the tree as an action comes and goes. Without an
          // action the wrapper draws no box of its own.
          default: () =>
            h(
              "div",
              {
                class: action ? INPUT_ACTION_FIELD_CLASS : INPUT_CONTROL_CLASS,
              },
              [
                input,
                action
                  ? fieldAction(
                      action,
                      // Mixed (GAP-153), there is no value of its own to
                      // copy: the copy is disabled, never "Copied" over
                      // nothing.
                      disabled || (props.mixed && action.kind === "copy"),
                    )
                  : null,
              ],
            ),
        },
      );
    };
  },
});
