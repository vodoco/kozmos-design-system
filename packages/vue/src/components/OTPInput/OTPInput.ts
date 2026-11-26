import {
  defineComponent,
  h,
  nextTick,
  normalizeClass,
  onMounted,
  ref,
  useId,
  watch,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  cn,
  fieldDescribedBy,
  inputVariants,
  isDecimalDigit,
  isOtpComplete,
  normalizeOtpLength,
  OTP_CELL_CLASS,
  OTP_ROW_CLASS,
  otpCellId,
  otpCellLabel,
  sanitizeOtpValue,
  toOtpCells,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import {
  attributeFlag,
  useControlled,
  without,
} from "../FieldWrapper/fieldModel";
import type { KozmosInputStatus } from "../Input/types";

/**
 * Vue's counterpart of React's OTPInput: a one-time code, a row of
 * one-digit cells (`length` of them, 6 by default) inside a
 * KozmosFieldWrapper, each the `<input>` React's draws, on Input's recipe.
 * `v-model` is the code, as React's `value` and `onChange`: a digit typed
 * fills its cell and moves on, a digit typed into a filled cell replaces
 * its digit, Backspace in an empty cell goes back, and a paste fills the
 * code. Digits in any script are entered as ASCII; anything else is
 * dropped. Without `v-model`, `default-value` starts the code, read on
 * mount only. An IME's composition is entered once, when it ends.
 *
 * When the visitor's typing or paste fills the last empty cell, it is
 * reported to the nearest KozmosAnalyticsProvider as `otp_code_completed`,
 * with React's properties. Every other attribute and listener reaches the
 * row of cells, as React's `...props`; `wrapper-class-name` reaches the
 * field around it.
 */
export const KozmosOTPInput = defineComponent({
  name: "KozmosOTPInput",
  inheritAttrs: false,
  props: {
    /**
     * The code an uncontrolled field starts with, read on mount only: its
     * decimal digits in any script, as ASCII and at most `length` of them.
     * `v-model` wins when both are given. It emits nothing and is no
     * completion the user made.
     */
    defaultValue: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    helperText: { type: String, default: undefined },
    label: { type: String, default: undefined },
    length: { type: Number, default: 6 },
    readOnly: { type: Boolean, default: undefined },
    status: {
      type: String as PropType<KozmosInputStatus>,
      default: "default",
    },
    /** The code, `v-model`: React's `value`. */
    modelValue: { type: String, default: undefined },
    wrapperClassName: { type: String, default: undefined },
  },
  emits: {
    /** The code as the cells hold it, as React's `onChange`. */
    "update:modelValue": (_value: string) => true,
  },
  slots: Object as SlotsType<{
    /**
     * React's `children`, which its type takes from the row's attributes
     * and its row never draws, the cells being its children: declared, and
     * drawn by neither.
     */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, emit }) {
    const controlled = useControlled();
    /** React's `value`: a model bound to nothing yet is an empty code. */
    const value = () =>
      controlled() ? (props.modelValue ?? "") : props.modelValue;
    const cellCount = () => normalizeOtpLength(props.length);
    const readOnly = () => !!props.readOnly || attributeFlag(attrs.readonly);
    const otp = ref(
      toOtpCells(value() ?? props.defaultValue ?? "", cellCount()),
    );
    // The cells follow the model and the cell count. Without a model, a new
    // count keeps the digits typed so far, closed up into the first cells
    // and as many as fit. Cells that already spell the new code stay as
    // they are, so a digit typed into a later cell keeps its place when its
    // code comes back as the model.
    watch([value, cellCount], ([next, count]) => {
      const current = otp.value;
      const nextOtp = toOtpCells(next ?? current.join(""), count);
      if (
        nextOtp.length === current.length &&
        nextOtp.join("") === current.join("")
      )
        return;
      otp.value = nextOtp;
    });
    const inputs: (HTMLInputElement | null)[] = [];
    const errorId = useId();
    const helperId = useId();
    const defaultInputId = useId();
    const { trackEvent } = useKozmosAnalytics();

    // autofocus puts the caret where the next digit goes: the first empty
    // cell, or the last when the code is full.
    onMounted(() => {
      if (!attributeFlag(attrs.autofocus ?? attrs.autoFocus)) return;
      const cells = inputs.filter(
        (input): input is HTMLInputElement => !!input?.isConnected,
      );
      const firstEmpty = cells.findIndex((input) => input.value === "");
      cells[firstEmpty === -1 ? cells.length - 1 : firstEmpty]?.focus();
    });

    // Analytics hears a code completed once: when the user's typing or
    // paste fills the last empty cell.
    const trackCompletion = (previous: string[], nextOtp: string[]) => {
      if (!isOtpComplete(previous) && isOtpComplete(nextOtp))
        trackEvent("OTPInput", "otp_code_completed", { length: cellCount() });
    };

    // An IME's composition is entered once, when it ends: until
    // compositionend, the cell draws the IME's text as it is, and the
    // focus stays.
    let composingCell: number | null = null;
    const composition = ref<{ index: number; text: string } | null>(null);
    // A composition never heard to end leaves no cell composing: one in a
    // cell that is disabled or made read-only, or in a cell a shorter
    // `length` removes.
    const composingGone = (index: number | null) =>
      index !== null &&
      (!!props.disabled || readOnly() || index >= cellCount());
    watch([() => props.disabled, readOnly, cellCount], () => {
      if (composingGone(composingCell)) composingCell = null;
      if (composition.value && composingGone(composition.value.index))
        composition.value = null;
    });

    /** What a cell draws: the IME's text while it composes, else its digit. */
    const shown = (index: number) =>
      composition.value?.index === index
        ? composition.value.text
        : (otp.value[index] ?? "");
    /** A cell the page changed that the cells do not hold is put back. */
    const restore = (cell: HTMLInputElement, index: number) =>
      void nextTick(() => {
        if (cell.isConnected && cell.value !== shown(index))
          cell.value = shown(index);
      });

    const enterDigits = (nextValue: string, index: number) => {
      const count = cellCount();
      const filteredValue = sanitizeOtpValue(nextValue, count - index);
      if (!filteredValue && nextValue) return;
      const previous = otp.value;
      const nextOtp = [...previous];
      filteredValue.split("").forEach((digit, offset) => {
        if (index + offset < count) nextOtp[index + offset] = digit;
      });
      if (!filteredValue) nextOtp[index] = "";
      otp.value = nextOtp;
      emit("update:modelValue", nextOtp.join(""));
      trackCompletion(previous, nextOtp);
      if (filteredValue && index < count - 1)
        inputs[Math.min(index + filteredValue.length, count - 1)]?.focus();
    };

    const onInput = (event: Event, index: number) => {
      const cell = event.currentTarget as HTMLInputElement;
      const { data, inputType, isComposing } = event as InputEvent;
      // The same digit typed over a selected one changes nothing, so no
      // change is heard: the focus still moves on.
      const digit = otp.value[index];
      if (
        inputType === "insertText" &&
        data &&
        digit &&
        sanitizeOtpValue(data, 1) === digit &&
        cell.value === digit &&
        index < cellCount() - 1
      )
        inputs[index + 1]?.focus();
      // A change, as React hears one: the cell's text is not what it drew.
      if (cell.value === shown(index)) return;
      if (readOnly()) return restore(cell, index);
      if (isComposing || composingCell === index) {
        composition.value = { index, text: cell.value };
        return;
      }
      // Input Events Level 2 sends a composition's text again after
      // compositionend, which has already entered it.
      if (
        inputType === "insertFromComposition" ||
        inputType === "deleteCompositionText"
      )
        return restore(cell, index);
      enterDigits(cell.value, index);
      restore(cell, index);
    };

    const onCompositionEnd = (event: CompositionEvent, index: number) => {
      composingCell = null;
      composition.value = null;
      const cell = event.currentTarget as HTMLInputElement;
      if (readOnly()) return restore(cell, index);
      // A composition cancelled, or one that left the cell as it was,
      // enters nothing.
      if (cell.value === otp.value[index]) return;
      enterDigits(cell.value, index);
      restore(cell, index);
    };

    // A composition the focus leaves without its compositionend is over.
    const onBlur = (index: number) => {
      if (composingCell !== index) return;
      composingCell = null;
      composition.value = null;
    };

    const onKeydown = (event: KeyboardEvent, index: number) => {
      // Backspace inside a composition edits the IME's text. Safari's
      // keydown that ends a composition has keyCode 229 and no isComposing.
      if (event.isComposing || event.keyCode === 229) return;
      // A digit typed into a filled cell replaces its digit and moves on
      // (GAP-239). A touch keyboard's, which names no key, comes through
      // the selection.
      if (
        !readOnly() &&
        otp.value[index] &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        isDecimalDigit(event.key)
      ) {
        event.preventDefault();
        enterDigits(event.key, index);
        return;
      }
      if (event.key === "Backspace" && !otp.value[index] && index > 0)
        inputs[index - 1]?.focus();
    };

    const onPaste = (event: ClipboardEvent) => {
      if (readOnly()) return;
      event.preventDefault();
      const pastedData = sanitizeOtpValue(
        event.clipboardData?.getData("text/plain") ?? "",
        cellCount(),
      );
      if (!pastedData) return;
      const previous = otp.value;
      const nextOtp = pastedData.split("");
      while (nextOtp.length < cellCount()) nextOtp.push("");
      otp.value = nextOtp;
      emit("update:modelValue", nextOtp.join(""));
      trackCompletion(previous, nextOtp);
    };

    return () => {
      const {
        class: className,
        id,
        ...rest
      } = without(attrs, "autofocus", "autoFocus", "readonly");
      const count = cellCount();
      const inputId = (id as string | undefined) || defaultInputId;
      const hasError = !!props.error;
      const resolvedStatus: KozmosInputStatus = hasError
        ? "error"
        : props.status;
      const isInvalid = resolvedStatus === "error";
      const describedBy = fieldDescribedBy({
        error: props.error,
        errorId,
        helperText: props.helperText,
        helperId,
      });
      const isReadOnly = readOnly();
      inputs.length = count;
      return h(
        KozmosFieldWrapper,
        {
          error: props.error,
          errorId,
          helperId,
          helperText: props.helperText,
          label: props.label,
          inputId,
          status: resolvedStatus,
          class: props.wrapperClassName,
        },
        {
          default: () =>
            h(
              "div",
              { class: cn(OTP_ROW_CLASS, normalizeClass(className)), ...rest },
              otp.value.map((_digit, index) =>
                h("input", {
                  key: index,
                  id: otpCellId(inputId, index),
                  ref: (element: unknown) => {
                    inputs[index] = element as HTMLInputElement | null;
                  },
                  type: "text",
                  inputmode: "numeric",
                  autocomplete: index === 0 ? "one-time-code" : "off",
                  maxlength: 1,
                  value: shown(index),
                  onInput: (event: Event) => onInput(event, index),
                  onCompositionstart: () => {
                    composingCell = index;
                  },
                  onCompositionend: (event: CompositionEvent) =>
                    onCompositionEnd(event, index),
                  onBlur: () => onBlur(index),
                  // A focused cell's digit is selected, as Tab selects it,
                  // so typing replaces it (GAP-239).
                  onFocus: (event: FocusEvent) =>
                    (event.currentTarget as HTMLInputElement).select(),
                  onMouseup: (event: MouseEvent) => {
                    // A click places the caret after the focus selected
                    // the digit: WebKit as its mouseup ends, unless refused.
                    const cell = event.currentTarget as HTMLInputElement;
                    if (cell.value) {
                      event.preventDefault();
                      cell.select();
                    }
                  },
                  onKeydown: (event: KeyboardEvent) => onKeydown(event, index),
                  onPaste,
                  disabled: props.disabled,
                  readonly: isReadOnly,
                  "aria-invalid": isInvalid ? "true" : undefined,
                  "aria-describedby": describedBy,
                  "aria-label": otpCellLabel(index, count),
                  // The cell's square, padding and centred digit are owned
                  // CSS (GAP-174).
                  class: cn(
                    inputVariants({ status: resolvedStatus }),
                    OTP_CELL_CLASS,
                  ),
                }),
              ),
            ),
        },
      );
    };
  },
});
