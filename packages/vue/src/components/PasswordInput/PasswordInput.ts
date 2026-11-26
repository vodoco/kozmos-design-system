import {
  defineComponent,
  h,
  normalizeClass,
  ref,
  useId,
  type PropType,
  type SlotsType,
} from "vue";
import { Eye, EyeOff } from "@kozmos-ds/icons/vue";
import {
  cn,
  FIELD_ACTION_ICON_CLASS,
  fieldDescribedBy,
  inputVariants,
  mergeAriaIds,
  PASSWORD_FIELD_CLASS,
  PASSWORD_TOGGLE_CLASS,
  PASSWORD_WITH_TOGGLE_CLASS,
} from "#kozmos-recipes";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import {
  attributeFlag,
  listeners,
  useTextModel,
  without,
  withoutModelAttributes,
} from "../FieldWrapper/fieldModel";
import type { KozmosInputStatus } from "../Input/types";

/**
 * Vue's counterpart of React's PasswordInput: a password field, the
 * `<input>` React's draws inside a KozmosFieldWrapper, on Input's recipe,
 * with a button inside its end that shows and hides what is typed (a
 * pressed button named `show-password-label` or `hide-password-label`).
 * `v-model` is its value, as React's `value` and `onChange`, and
 * `v-model:visible` whether it is shown, as React's `visible` and
 * `onVisibleChange`; without one, it starts as `default-visible` says.
 * `show-toggle` false draws no button. Every other attribute and listener
 * reaches the `<input>`; `wrapper-class-name` reaches the field around it.
 */
export const KozmosPasswordInput = defineComponent({
  name: "KozmosPasswordInput",
  inheritAttrs: false,
  props: {
    /** The field's value, `v-model`: React's `value`. */
    modelValue: {
      type: [String, Number] as PropType<string | number>,
      default: undefined,
    },
    defaultVisible: { type: Boolean, default: false },
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    helperText: { type: String, default: undefined },
    hidePasswordLabel: { type: String, default: "Hide password" },
    label: { type: String, default: undefined },
    showPasswordLabel: { type: String, default: "Show password" },
    showToggle: { type: Boolean, default: true },
    status: {
      type: String as PropType<KozmosInputStatus>,
      default: "default",
    },
    /** Whether what is typed is shown, `v-model:visible`. */
    visible: { type: Boolean, default: undefined },
    wrapperClassName: { type: String, default: undefined },
  },
  emits: {
    /** Shown or hidden, as React's `onVisibleChange`. */
    "update:visible": (_visible: boolean) => true,
    /** The text typed, as React's `onChange` hears it in `event.target.value`. */
    "update:modelValue": (_value: string) => true,
  },
  slots: Object as SlotsType<Record<never, never>>,
  setup(props, { attrs, emit }) {
    const internalVisible = ref(props.defaultVisible);
    const errorId = useId();
    const helperId = useId();
    const defaultInputId = useId();
    const model = useTextModel({
      model: () => props.modelValue,
      attrs,
      emit: (text) => emit("update:modelValue", text),
    });
    const isVisible = () => props.visible ?? internalVisible.value;
    const toggle = () => {
      const nextVisible = !isVisible();
      if (props.visible === undefined) internalVisible.value = nextVisible;
      emit("update:visible", nextVisible);
    };
    return () => {
      const {
        class: className,
        "aria-describedby": callerDescribedBy,
        "aria-invalid": callerInvalid,
        onInput,
        onChange,
        ...rest
      } = without(withoutModelAttributes(attrs), "disabled", "type");
      const disabled = attributeFlag(attrs.disabled);
      const visible = isVisible();
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
      const value = model.value();
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
            h("div", { class: PASSWORD_FIELD_CLASS }, [
              h("input", {
                ...rest,
                ...(value === undefined ? {} : { value }),
                type: visible ? "text" : "password",
                id: inputId,
                class: cn(
                  inputVariants({ status: resolvedStatus }),
                  // Room for the toggle (decision 82).
                  props.showToggle && PASSWORD_WITH_TOGGLE_CLASS,
                  normalizeClass(className),
                ),
                ref: model.field,
                disabled,
                "aria-invalid": isInvalid ? "true" : (callerInvalid as string),
                "aria-describedby": mergeAriaIds(
                  callerDescribedBy as string | undefined,
                  describedBy,
                ),
                onInput: listeners(model.onInput, onInput),
                onChange: listeners(model.onChange, onChange),
              }),
              props.showToggle
                ? h(
                    "button",
                    {
                      type: "button",
                      "aria-label": visible
                        ? props.hidePasswordLabel
                        : props.showPasswordLabel,
                      "aria-pressed": String(visible),
                      class: PASSWORD_TOGGLE_CLASS,
                      disabled,
                      onClick: toggle,
                    },
                    [
                      h(visible ? EyeOff : Eye, {
                        class: FIELD_ACTION_ICON_CLASS,
                        "aria-hidden": "true",
                      }),
                    ],
                  )
                : null,
            ]),
        },
      );
    };
  },
});
