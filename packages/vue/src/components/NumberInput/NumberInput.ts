import {
  defineComponent,
  h,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
  type PropType,
  type SlotsType,
} from "vue";
import { Minus, Plus } from "@kozmos-ds/icons/vue";
import {
  cn,
  FIELD_ACTION_ICON_CLASS,
  fieldDescribedBy,
  inputVariants,
  mergeAriaIds,
  NUMBER_CONTROL_CLASS,
  NUMBER_DECREMENT_CLASS,
  NUMBER_FIELD_CLASS,
  NUMBER_INCREMENT_CLASS,
  NUMBER_INPUT_CLASS,
  NUMBER_STEP_TONE_CLASSES,
  NUMBER_UNIT_CLASS,
  NUMBER_UNIT_FIELD_CLASS,
  NUMBER_WITH_STEPPERS_CLASS,
  NUMBER_WITH_UNIT_CLASS,
  numberUnitWidth,
  numericValueFromInput,
  stepValue,
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
import type { KozmosInputStatus } from "../Input/types";

/** The number a field's text says, as the field reports it: "" is null. */
function numberOf(text: string) {
  if (text.trim() === "") return null;
  const typed = Number(text.trim().replace(",", "."));
  return Number.isFinite(typed) ? typed : null;
}

/**
 * Vue's counterpart of React's NumberInput: a number field, the `<input
 * type="number">` React's draws inside a KozmosFieldWrapper between its
 * steppers, on Input's recipe and NumberInput's. `v-model` is its number,
 * as React's `value` and `onValueChange`: each edit and each step emits the
 * number, and a cleared field `null`; without one, it starts with
 * `default-value` and keeps what is typed. `show-steppers` false draws no
 * steppers. `unit` ("m", "%") is drawn inside the field after the value,
 * never part of it, and read after it as `unit-label` (GAP-098).
 *
 * Mixed (GAP-153), the field is empty with `mixed-label`, a text field with
 * the numeric keyboard and its steppers disabled, so nothing steps it from
 * nothing over every feature's own; a typed number edits it, kept as typed
 * until the field loses focus. Every other attribute and listener reaches
 * the `<input>`; `wrapper-class-name` reaches the field around it.
 */
export const KozmosNumberInput = defineComponent({
  name: "KozmosNumberInput",
  inheritAttrs: false,
  props: {
    /** The field's number, `v-model`: React's `value`. */
    modelValue: {
      type: [Number, String] as PropType<number | string | null>,
      default: undefined,
    },
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    helperText: { type: String, default: undefined },
    label: { type: String, default: undefined },
    showSteppers: { type: Boolean, default: true },
    status: {
      type: String as PropType<KozmosInputStatus>,
      default: "default",
    },
    wrapperClassName: { type: String, default: undefined },
    /**
     * A unit drawn inside the field after the value, "m" or "%" (GAP-098).
     * It is never part of the value, and it is read after the value, as
     * `unit-label` when one is given.
     */
    unit: { type: String, default: undefined },
    /** The unit's spoken name, in the page's language: "metres" for "m". */
    unitLabel: { type: String, default: undefined },
    /** The field stands for several values that differ, and shows none (GAP-153). */
    mixed: { type: Boolean, default: false },
    /** Shown in the empty field, and said with it. */
    mixedLabel: { type: String, default: "Multiple values" },
    /** The reset's words. Default "Reset to multiple values". */
    resetMixedLabel: { type: String, default: undefined },
  },
  emits: {
    /** The number, or null for a cleared field: React's `onValueChange`. */
    "update:modelValue": (_value: number | null) => true,
    /** The reset was pressed: set `mixed` again (React's `onResetMixed`). */
    resetMixed: () => true,
  },
  slots: Object as SlotsType<Record<never, never>>,
  setup(props, { attrs, emit }) {
    const listensForReset = useListens("onResetMixed");
    const unitId = useId();
    const errorId = useId();
    const helperId = useId();
    const defaultInputId = useId();
    // What the visitor types into a mixed field, kept as typed until the
    // field loses focus (GAP-153). The field stays a text field meanwhile:
    // turned into a number field by the product's first value, it would
    // drop a "-" or a "-0." the visitor is still typing.
    const draft = ref<string | null>(null);
    watch(
      () => props.mixed,
      (mixed) => {
        // Back to mixed (a reset): the typed text is gone.
        if (mixed) draft.value = null;
      },
    );
    const asText = () => props.mixed || draft.value !== null;
    const model = useTextModel({
      model: () => props.modelValue,
      attrs,
      mixed: () => props.mixed,
      // A number field keeps "4." or "-" as typed while it reads as the
      // model's number.
      matches: (text, value) =>
        numberOf(text) ===
        (value === undefined || value === null || value === ""
          ? null
          : Number(value)),
      emit: (text, field) => {
        if (asText()) {
          // A mixed field reports a value only once the text is a number:
          // "-", "." or "-." report nothing, so the product keeps every
          // feature's own value until there is one to write over it.
          draft.value = text;
          const typed =
            text.trim() === ""
              ? null
              : numericValueFromInput(field as HTMLInputElement);
          if (typed !== null) emit("update:modelValue", typed);
          return;
        }
        emit(
          "update:modelValue",
          numericValueFromInput(field as HTMLInputElement),
        );
      },
    });

    // The text keeps clear of the unit, whatever its length: the room is
    // the unit's own width, measured, so "m" and "km/h" each get theirs.
    const unitRef = ref<HTMLSpanElement | null>(null);
    const unitWidth = ref<number | null>(null);
    let observer: ResizeObserver | undefined;
    const observeUnit = () => {
      observer?.disconnect();
      observer = undefined;
      const node = unitRef.value;
      if (!node) return;
      const measure = () => {
        unitWidth.value = node.getBoundingClientRect().width;
      };
      measure();
      if (typeof ResizeObserver === "undefined") return;
      observer = new ResizeObserver(measure);
      observer.observe(node);
    };
    onMounted(observeUnit);
    watch(() => props.unit, observeUnit, { flush: "post" });
    onBeforeUnmount(() => observer?.disconnect());

    return () => {
      const {
        class: className,
        "aria-describedby": callerDescribedBy,
        "aria-invalid": callerInvalid,
        onInput,
        onChange,
        onBlur,
        ...rest
      } = withoutModelAttributes(attrs);
      const disabled = attributeFlag(attrs.disabled);
      const readOnly = readOnlyOf(attrs);
      const hasUnit = Boolean(props.unit);
      const inputId = (attrs.id as string | undefined) || defaultInputId;
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
      const text = asText();
      const stepperDisabled = disabled || readOnly || text;
      const tone = NUMBER_STEP_TONE_CLASSES[resolvedStatus];
      const shown =
        draft.value !== null && model.controlled()
          ? draft.value
          : model.value();

      const step = (direction: "decrement" | "increment") => {
        const input = model.field.value as HTMLInputElement | null;
        if (!input || stepperDisabled) return;
        const previousValue = input.value;
        let value: number | null;
        try {
          value = stepValue(input, direction);
        } catch {
          value = numericValueFromInput(input);
        } finally {
          // Native stepping changes the field. A controlled field shows a
          // new value only when the parent takes it, as a typed one.
          if (model.controlled()) input.value = previousValue;
          else model.sync(input.value);
        }
        emit("update:modelValue", value);
      };
      const stepper = (direction: "decrement" | "increment") =>
        h(
          "button",
          {
            type: "button",
            "aria-label":
              direction === "decrement" ? "Decrease value" : "Increase value",
            class: cn(
              direction === "decrement"
                ? NUMBER_DECREMENT_CLASS
                : NUMBER_INCREMENT_CLASS,
              tone,
            ),
            disabled: stepperDisabled,
            onClick: () => step(direction),
          },
          [
            h(direction === "decrement" ? Minus : Plus, {
              class: FIELD_ACTION_ICON_CLASS,
              "aria-hidden": "true",
            }),
          ],
        );

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
          default: () =>
            h("div", { class: NUMBER_FIELD_CLASS }, [
              props.showSteppers ? stepper("decrement") : null,
              // One wrapper, with a unit or without, so the input keeps its
              // place in the tree as a unit comes and goes. Without a unit
              // it draws no box of its own.
              h(
                "div",
                {
                  class: hasUnit
                    ? NUMBER_UNIT_FIELD_CLASS
                    : NUMBER_CONTROL_CLASS,
                  // Before it is measured (a server render, the first
                  // paint), the room is the unit's length in the font's
                  // "0" widths, a wide character two; then its measured
                  // width. A style only when there is one: an empty one is
                  // written as style="".
                  ...(hasUnit
                    ? {
                        style: {
                          "--kozmos-number-unit-width": numberUnitWidth(
                            props.unit ?? "",
                            unitWidth.value,
                          ),
                        },
                      }
                    : {}),
                },
                [
                  h("input", {
                    // Mixed (GAP-153), a text field with the numeric
                    // keyboard, not a spinbutton: the arrow keys, the wheel
                    // and a screen reader's increment would each step it
                    // from nothing. The unit stays drawn.
                    type: text ? "text" : "number",
                    inputmode: text ? "decimal" : undefined,
                    id: inputId,
                    class: cn(
                      inputVariants({ status: resolvedStatus }),
                      NUMBER_INPUT_CLASS,
                      props.showSteppers && NUMBER_WITH_STEPPERS_CLASS,
                      hasUnit && NUMBER_WITH_UNIT_CLASS,
                      normalizeClass(className),
                    ),
                    ref: model.field,
                    "aria-invalid": isInvalid
                      ? "true"
                      : (callerInvalid as string),
                    // The unit is read after the value, first among the
                    // descriptions; the drawn unit is hidden, so it is
                    // read once.
                    "aria-describedby": mergeAriaIds(
                      hasUnit ? unitId : undefined,
                      callerDescribedBy as string | undefined,
                      describedBy,
                    ),
                    ...rest,
                    ...(shown === undefined ? {} : { value: shown }),
                    ...(props.mixed
                      ? { placeholder: props.mixedLabel, "data-mixed": "" }
                      : {}),
                    onInput: listeners(model.onInput, onInput),
                    onChange: listeners(model.onChange, onChange),
                    onBlur: listeners(() => {
                      draft.value = null;
                    }, onBlur),
                  }),
                  hasUnit
                    ? [
                        h(
                          "span",
                          {
                            ref: unitRef,
                            "aria-hidden": "true",
                            class: NUMBER_UNIT_CLASS,
                            "data-disabled": disabled ? "" : undefined,
                          },
                          props.unit,
                        ),
                        h(
                          "span",
                          { id: unitId, hidden: true },
                          props.unitLabel ?? props.unit,
                        ),
                      ]
                    : null,
                ],
              ),
              props.showSteppers ? stepper("increment") : null,
            ]),
        },
      );
    };
  },
});
