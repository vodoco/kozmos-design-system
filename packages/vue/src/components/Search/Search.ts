import {
  defineComponent,
  h,
  normalizeClass,
  ref,
  useId,
  type PropType,
  type SlotsType,
} from "vue";
import { SearchMd, X } from "@kozmos-ds/icons/vue";
import {
  cn,
  emptySearchField,
  FIELD_ACTION_ICON_CLASS,
  INPUT_ACTION_CLASS,
  INPUT_WITH_ACTION_CLASS,
  inputVariants,
  mergeAriaIds,
  SEARCH_BOX_CLASS,
  SEARCH_ICON_CLASS,
  SEARCH_INPUT_CLASS,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import {
  attributeFlag,
  listeners,
  readOnlyOf,
  useTextModel,
  withoutModelAttributes,
} from "../FieldWrapper/fieldModel";

/**
 * Vue's counterpart of React's Search: a search field, the `<input
 * type="search">` React's draws inside a KozmosFieldWrapper, on Input's
 * recipe, with the search icon at its inline start. `v-model` is its value,
 * as React's `value` and `onChange`; without one, it starts with
 * `default-value` and keeps what is typed. Every other attribute and
 * listener reaches the `<input>`; `wrapper-class-name` reaches the field
 * around it.
 *
 * `clearable` (GAP-161) draws a clear at its end while it holds text: it,
 * or Escape in the field, empties it through its own input event (so
 * `v-model` hears ""), emits `clear`, reports `search_cleared` and puts the
 * focus back in the field. The Escape it clears with is prevented, which
 * the overlays' layers dismiss nothing on (`shared/layers.ts`), so the
 * first Escape in a Dialog or Popover clears and the next closes, as
 * React's empty layer makes it.
 */
export const KozmosSearch = defineComponent({
  name: "KozmosSearch",
  inheritAttrs: false,
  props: {
    /** The field's value, `v-model`: React's `value`. */
    modelValue: {
      type: [String, Number] as PropType<string | number>,
      default: undefined,
    },
    label: { type: String, default: undefined },
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    wrapperClassName: { type: String, default: undefined },
    /** Draw a clear at the field's end while it holds text (GAP-161). */
    clearable: { type: Boolean, default: false },
    /** The clear's name, in the page's language. */
    clearLabel: { type: String, default: "Clear search" },
  },
  emits: {
    /** The text typed, as React's `onChange` hears it in `event.target.value`. */
    "update:modelValue": (_value: string) => true,
    /** The field was cleared, after its `update:modelValue`: React's onClear. */
    clear: () => true,
  },
  slots: Object as SlotsType<Record<never, never>>,
  setup(props, { attrs, emit }) {
    const { trackEvent } = useKozmosAnalytics();
    const errorId = useId();
    const defaultInputId = useId();
    const focused = ref(false);
    const model = useTextModel({
      model: () => props.modelValue,
      attrs,
      emit: (text) => emit("update:modelValue", text),
    });
    const clear = () => {
      const input = model.field.value as HTMLInputElement | null;
      if (!input) return;
      emptySearchField(input);
      // The focus goes back to the field before the product hears it,
      // which may move it on deliberately.
      input.focus();
      emit("clear");
      trackEvent("Search", "search_cleared");
    };
    return () => {
      const {
        class: className,
        "aria-describedby": callerDescribedBy,
        "aria-invalid": callerInvalid,
        onInput,
        onChange,
        onFocus,
        onBlur,
        onKeydown,
        ...rest
      } = withoutModelAttributes(attrs);
      const hasError = !!props.error;
      const inputId = (attrs.id as string | undefined) || defaultInputId;
      const disabled = attributeFlag(attrs.disabled);
      const readOnly = readOnlyOf(attrs);
      const canClear =
        props.clearable &&
        !disabled &&
        !readOnly &&
        String(model.counted() ?? "").length > 0;
      const value = model.value();
      const input = h("input", {
        ref: model.field,
        id: inputId,
        class: cn(
          inputVariants({ error: hasError }),
          SEARCH_INPUT_CLASS,
          // Room for the clear, as Input keeps for its action.
          canClear && INPUT_WITH_ACTION_CLASS,
          normalizeClass(className),
        ),
        type: "search",
        ...rest,
        ...(value === undefined ? {} : { value }),
        onFocus: listeners(() => (focused.value = true), onFocus),
        onBlur: listeners(() => (focused.value = false), onBlur),
        // The app's input listener first, then the model's change, as
        // React calls a field's onInput before its onChange.
        onInput: (event: Event) => {
          for (const handler of [onInput].flat())
            if (typeof handler === "function") handler(event);
          model.onInput(event);
        },
        onChange: listeners(model.onChange, onChange),
        onKeydown: (event: KeyboardEvent) => {
          for (const handler of [onKeydown].flat())
            if (typeof handler === "function") handler(event);
          // Escape empties a field holding text, as the clear does; an
          // empty field leaves the key to what holds it (a dialog closes).
          // Taken from the browser too, which empties a search field
          // itself in Chrome and Safari, past `clear`.
          if (
            event.key === "Escape" &&
            canClear &&
            !event.defaultPrevented &&
            !event.isComposing
          ) {
            event.preventDefault();
            clear();
          }
        },
        // The caller's description is joined with the error's, and a
        // caller cannot clear an error the field is showing.
        "aria-invalid": hasError ? true : (callerInvalid as string | undefined),
        "aria-describedby": mergeAriaIds(
          callerDescribedBy as string | undefined,
          hasError && typeof props.error === "string" ? errorId : undefined,
        ),
      });
      return h(
        KozmosFieldWrapper,
        {
          error: props.error,
          errorId,
          label: props.label,
          inputId,
          class: props.wrapperClassName,
        },
        () =>
          h("div", { class: SEARCH_BOX_CLASS }, [
            h(SearchMd, { class: SEARCH_ICON_CLASS }),
            input,
            // React's empty Radix layer, which its first Escape needs
            // (Radix's layers hear Escape before the field): drawn as it
            // is, a hidden span that takes the pointer a modal took from
            // the page. Reka's layers need none (`shared/layers.ts`).
            canClear && focused.value
              ? h("span", {
                  hidden: "",
                  style:
                    model.field.value?.ownerDocument.body.style
                      .pointerEvents === "none"
                      ? { pointerEvents: "auto" }
                      : undefined,
                })
              : null,
            canClear
              ? // Drawn as Input's action is (decision 164).
                h(
                  "button",
                  {
                    type: "button",
                    "aria-label": props.clearLabel,
                    class: INPUT_ACTION_CLASS,
                    onClick: clear,
                  },
                  [
                    h(X, {
                      class: FIELD_ACTION_ICON_CLASS,
                      "aria-hidden": "true",
                    }),
                  ],
                )
              : null,
          ]),
      );
    };
  },
});
