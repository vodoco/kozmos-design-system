import {
  computed,
  defineComponent,
  h,
  inject,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  ssrContextKey,
  useId,
  watch,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { Primitive } from "reka-ui";
import { Check, Minus } from "@kozmos-ds/icons/vue";
import {
  CHECKBOX_CLASS,
  CHECKBOX_ERROR_CLASS,
  CHECKBOX_ERROR_TEXT_CLASS,
  CHECKBOX_INDICATOR_CLASS,
  CHECKBOX_LABEL_CLASS,
  CHECKBOX_MARK_CLASS,
  CHECKBOX_WRAPPER_CLASS,
  checkboxRowClass,
  cn,
  CONTROL_TEXT_CLASS,
  CONTROL_TEXT_DESCRIPTION_CLASS,
  CONTROL_TEXT_LABEL_CLASS,
  mergeAriaIds,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { KozmosLabel } from "../Label/Label";
import type { KozmosCheckboxCheckedState } from "./types";

type Handler = (event: Event) => void;

/** An app's listener, one or many as Vue's attrs hold them, called in order. */
function callAll(handler: unknown, event: Event) {
  for (const each of ([] as unknown[]).concat(handler ?? []))
    if (typeof each === "function") (each as Handler)(event);
}

const isIndeterminate = (
  checked: KozmosCheckboxCheckedState | undefined,
): checked is "indeterminate" => checked === "indeterminate";
const stateOf = (checked: KozmosCheckboxCheckedState) =>
  isIndeterminate(checked)
    ? "indeterminate"
    : checked
      ? "checked"
      : "unchecked";

/** A CSS length as React writes a number in a style: `0`, else `20px`. */
const px = (value: number) => (value === 0 ? "0" : `${value}px`);

/**
 * Vue's counterpart of React's Checkbox: the row React's draws, from the same
 * recipe (`recipes/checkbox.ts`), around the box Radix's Checkbox draws. The
 * box is drawn here as Radix 1.3 draws it, not on Reka UI's CheckboxRoot,
 * which differs from it where an app can see: Reka writes no `value` on the
 * button, draws the form's hidden input only with a `name`, adds
 * `aria-disabled`, and names the box from its label's text in `aria-label`.
 *
 * `v-model:checked` is React's `checked` and `onCheckedChange`: `true`,
 * `false` or `"indeterminate"`, the mixed state, read as
 * `aria-checked="mixed"` and painted as `checked` is, with a dash for its
 * mark where `checked` draws a tick (the dash follows the `checked` prop, as
 * React's does). A press of a mixed box checks it. `default-checked` starts
 * an uncontrolled box. Each toggle is reported as `checkbox_toggled`, with
 * React's properties, before `update:checked` is emitted.
 *
 * `label` names it, and `description` is read as its description, never its
 * name; `error` marks it invalid, and a string error is drawn under it and
 * read as its description too. The app's `class`, `id` and attributes reach
 * the box; `wrapper-class-name` the row's column. Outside a form the hidden
 * input Radix draws for a form is drawn only until it mounts, as Radix's is.
 */
export const KozmosCheckbox = defineComponent({
  name: "KozmosCheckbox",
  inheritAttrs: false,
  props: {
    label: { type: String, default: undefined },
    /**
     * A line under the label, read as the checkbox's description
     * (`aria-describedby`), never as part of its name (GAP-162).
     */
    description: { type: String, default: undefined },
    // String first, as Vue reads a `[String, Boolean]` prop: "" is an
    // error with no words, as React's `error=""` is, not `true`.
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    wrapperClassName: { type: String, default: undefined },
    defaultChecked: {
      type: [Boolean, String] as PropType<KozmosCheckboxCheckedState>,
      default: undefined,
    },
    asChild: { type: Boolean, default: undefined },
    checked: {
      type: [Boolean, String] as PropType<KozmosCheckboxCheckedState>,
      default: undefined,
    },
    required: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
  },
  emits: {
    /** React's `onCheckedChange`: the state a press asks for. */
    "update:checked": (_checked: KozmosCheckboxCheckedState) => true,
  },
  slots: Object as SlotsType<{
    /** Taken and not drawn: React's Checkbox draws its own mark there. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, emit }) {
    const { trackEvent } = useKozmosAnalytics();
    const defaultId = useId();
    const errorId = useId();
    const descriptionId = useId();
    const serverRender = inject(ssrContextKey, null) !== null;

    // Radix's useControllableState: the prop when given, else its own.
    const own = ref<KozmosCheckboxCheckedState>(props.defaultChecked ?? false);
    const checked = computed<KozmosCheckboxCheckedState>(() =>
      props.checked !== undefined ? props.checked : own.value,
    );
    // A change is told only when there is one: the controlled prop's, or
    // the box's own.
    const setChecked = (next: KozmosCheckboxCheckedState) => {
      if (next === checked.value) return;
      if (props.checked === undefined) own.value = next;
      trackEvent("Checkbox", "checkbox_toggled", { checked: next });
      emit("update:checked", next);
    };
    const initial = checked.value;

    // The button, once mounted: until then the box is taken to be in a form,
    // so a server render draws the hidden input a form without script needs.
    const control = shallowRef<HTMLButtonElement | null>(null);
    const bubbleInput = shallowRef<HTMLInputElement | null>(null);
    const isFormControl = computed(() =>
      control.value ? !!attrs.form || !!control.value.closest("form") : true,
    );
    let consumerStoppedPropagation = false;
    const size = ref<{ width: number; height: number } | undefined>();
    let observer: ResizeObserver | undefined;
    const reset = () => setChecked(initial);
    let form: HTMLFormElement | null = null;
    onMounted(() => {
      const element = control.value;
      if (!element) return;
      size.value = {
        width: element.offsetWidth,
        height: element.offsetHeight,
      };
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver((entries) => {
          const box = entries[0]?.borderBoxSize;
          const first = Array.isArray(box) ? box[0] : box;
          size.value = first
            ? { width: first.inlineSize, height: first.blockSize }
            : { width: element.offsetWidth, height: element.offsetHeight };
        });
        observer.observe(element, { box: "border-box" });
      }
      form = element.form;
      form?.addEventListener("reset", reset);
    });
    onBeforeUnmount(() => {
      observer?.disconnect();
      form?.removeEventListener("reset", reset);
    });
    // Radix's bubble input: a change of state clicks the hidden input, so a
    // form hears it as it hears a native checkbox.
    watch(checked, (next, previous) => {
      const input = bubbleInput.value;
      if (!input || next === previous) return;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "checked",
      )?.set;
      if (!setter) return;
      input.indeterminate = isIndeterminate(next);
      setter.call(input, isIndeterminate(next) ? false : next);
      input.dispatchEvent(
        new Event("click", { bubbles: !consumerStoppedPropagation }),
      );
    });

    return () => {
      const {
        class: className,
        id,
        name,
        value = "on",
        form: formId,
        "aria-describedby": ariaDescribedBy,
        "aria-invalid": ariaInvalid,
        onClick,
        onKeydown,
        ...rest
      } = attrs as Record<string, unknown>;
      const inputId = (id as string | undefined) || defaultId;
      const hasError = !!props.error;
      const isStringError = typeof props.error === "string";
      const state = checked.value;
      const shown = state === true || isIndeterminate(state);
      const defaultChecked = isIndeterminate(props.defaultChecked)
        ? false
        : (props.defaultChecked ??
          (isIndeterminate(initial) ? false : initial));
      const box = h(
        Primitive,
        {
          as: "button",
          asChild: props.asChild,
          type: "button",
          role: "checkbox",
          "aria-checked": isIndeterminate(state) ? "mixed" : state,
          "aria-required": props.required,
          "data-state": stateOf(state),
          "data-disabled": props.disabled ? "" : undefined,
          disabled: props.disabled,
          value,
          id: inputId,
          class: cn(
            CHECKBOX_CLASS,
            hasError && CHECKBOX_ERROR_CLASS,
            normalizeClass(className),
          ),
          ...rest,
          "aria-invalid": hasError || ariaInvalid,
          "aria-describedby": mergeAriaIds(
            ariaDescribedBy as string | undefined,
            props.description ? descriptionId : undefined,
            hasError && isStringError ? errorId : undefined,
          ),
          ref: (element: unknown) => {
            control.value =
              (element as { $el?: HTMLButtonElement } | null)?.$el ??
              (element as HTMLButtonElement | null);
          },
          onKeydown: (event: KeyboardEvent) => {
            callAll(onKeydown, event);
            if (event.defaultPrevented) return;
            if (event.key === "Enter") event.preventDefault();
          },
          onClick: (event: MouseEvent) => {
            callAll(onClick, event);
            if (event.defaultPrevented) return;
            setChecked(isIndeterminate(state) ? true : !state);
            if (bubbleInput.value && isFormControl.value) {
              consumerStoppedPropagation = event.cancelBubble;
              if (!consumerStoppedPropagation) event.stopPropagation();
            }
          },
        },
        {
          default: () =>
            shown
              ? [
                  h(
                    "span",
                    {
                      "data-state": stateOf(state),
                      "data-disabled": props.disabled ? "" : undefined,
                      class: cn(CHECKBOX_INDICATOR_CLASS),
                      style: { pointerEvents: "none" },
                    },
                    [
                      h(isIndeterminate(props.checked) ? Minus : Check, {
                        class: CHECKBOX_MARK_CLASS,
                        "aria-hidden": "true",
                      }),
                    ],
                  ),
                ]
              : [],
        },
      );
      const input = isFormControl.value
        ? h("input", {
            type: "checkbox",
            "aria-hidden": "true",
            // React writes defaultChecked as the attribute; on the client
            // Vue would set the property, which writes none.
            ...(serverRender
              ? { checked: defaultChecked }
              : { defaultChecked }),
            required: props.required,
            disabled: props.disabled,
            name,
            value,
            form: formId,
            tabindex: "-1",
            ref: (element: unknown) => {
              bubbleInput.value = element as HTMLInputElement | null;
            },
            style: {
              ...(size.value
                ? { width: px(size.value.width), height: px(size.value.height) }
                : {}),
              position: "absolute",
              pointerEvents: "none",
              opacity: 0,
              margin: 0,
              transform: "translateX(-100%)",
            },
          })
        : null;
      const words = props.description
        ? h("span", { class: cn(CONTROL_TEXT_CLASS) }, [
            props.label
              ? h(
                  KozmosLabel,
                  { for: inputId, class: cn(CONTROL_TEXT_LABEL_CLASS) },
                  () => props.label,
                )
              : null,
            h(
              "span",
              { id: descriptionId, class: CONTROL_TEXT_DESCRIPTION_CLASS },
              props.description,
            ),
          ])
        : props.label
          ? h(
              KozmosLabel,
              { for: inputId, class: CHECKBOX_LABEL_CLASS },
              () => props.label,
            )
          : null;
      return h(
        "div",
        { class: cn(CHECKBOX_WRAPPER_CLASS, props.wrapperClassName) },
        [
          h("div", { class: checkboxRowClass(!!props.description) }, [
            box,
            input,
            words,
          ]),
          isStringError
            ? h(
                "p",
                { id: errorId, class: CHECKBOX_ERROR_TEXT_CLASS },
                props.error as string,
              )
            : null,
        ],
      );
    };
  },
});
