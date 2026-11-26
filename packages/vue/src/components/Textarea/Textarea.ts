import {
  defineComponent,
  h,
  normalizeClass,
  onMounted,
  onUpdated,
  useId,
  type PropType,
  type SlotsType,
} from "vue";
import {
  cn,
  mergeAriaIds,
  resolveCharacterCount,
  TEXTAREA_ERROR_CLASS,
  textareaVariants,
} from "#kozmos-recipes";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import {
  defaultValueOf,
  listeners,
  useTextModel,
  withoutModelAttributes,
} from "../FieldWrapper/fieldModel";
import type { KozmosCharacterCount } from "../Input/types";

/**
 * Vue's counterpart of React's Textarea: a multi-line field, the
 * `<textarea>` React's draws inside a KozmosFieldWrapper, from the same
 * recipe (`textareaVariants`), with its `label` and `error` drawn around
 * it. `v-model` is its value, as React's `value` and `onChange`; without
 * one, it starts with `default-value` and keeps what is typed. Every other
 * attribute and listener reaches the `<textarea>`; `wrapper-class-name`
 * reaches the field around it.
 *
 * `count` draws a character count under the field and says when it is
 * wrong: `limit` is a soft maximum, an error the visitor is told about and
 * not a keystroke the browser swallows. Use `maxlength` as well only when
 * truncating silently is what you want.
 */
export const KozmosTextarea = defineComponent({
  name: "KozmosTextarea",
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
    label: { type: String, default: undefined },
    wrapperClassName: { type: String, default: undefined },
    /** Draw a character count under the field, and say when it is wrong. */
    count: {
      type: Object as PropType<KozmosCharacterCount>,
      default: undefined,
    },
  },
  emits: {
    /** The text typed, as React's `onChange` hears it in `event.target.value`. */
    "update:modelValue": (_value: string) => true,
  },
  slots: Object as SlotsType<Record<never, never>>,
  setup(props, { attrs, emit }) {
    const errorId = useId();
    const countId = useId();
    const defaultInputId = useId();
    const model = useTextModel({
      model: () => props.modelValue,
      attrs,
      emit: (text) => emit("update:modelValue", text),
    });
    // A <textarea>'s text is its default value, as React draws it (its
    // `defaultValue`, or a controlled field's value): the field's text,
    // in a server render too. A controlled field's value is then the
    // model's, set on the element: Vue writes a `value` attribute, which
    // a textarea does not have.
    const initial = defaultValueOf(attrs);
    const initialText =
      initial === undefined || initial === null ? undefined : String(initial);
    const showModel = () => {
      const field = model.field.value;
      const value = model.value();
      if (field && model.controlled() && value !== undefined)
        if (field.value !== value) field.value = value;
    };
    onMounted(showModel);
    onUpdated(showModel);
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
      const isStringError = typeof resolvedError === "string";
      const inputId = (attrs.id as string | undefined) || defaultInputId;
      const text = model.controlled() ? model.value() : initialText;
      return h(
        KozmosFieldWrapper,
        {
          error: resolvedError,
          errorId,
          label: props.label,
          inputId,
          countId,
          class: props.wrapperClassName,
        },
        {
          ...(counted ? { count: () => counted.text } : {}),
          default: () =>
            h(
              "textarea",
              {
                id: inputId,
                class: cn(
                  textareaVariants(),
                  hasError && TEXTAREA_ERROR_CLASS,
                  normalizeClass(className),
                ),
                ref: model.field,
                "aria-invalid": hasError
                  ? "true"
                  : String((callerInvalid as string | boolean) ?? false),
                "aria-describedby": mergeAriaIds(
                  callerDescribedBy as string | undefined,
                  hasError && isStringError ? errorId : undefined,
                  !hasError && counted ? countId : undefined,
                ),
                ...rest,
                onInput: listeners(model.onInput, onInput),
                onChange: listeners(model.onChange, onChange),
              },
              text,
            ),
        },
      );
    };
  },
});
