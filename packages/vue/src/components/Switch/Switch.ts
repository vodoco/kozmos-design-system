import {
  defineComponent,
  h,
  normalizeClass,
  ref,
  useId,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { Primitive } from "reka-ui";
import { Minus } from "@kozmos-ds/icons/vue";
import {
  cn,
  mergeAriaIds,
  SWITCH_CLASS,
  SWITCH_CONTROL_TEXT_CLASS,
  SWITCH_ERROR_CLASS,
  SWITCH_ERROR_TEXT_CLASS,
  SWITCH_LABEL_CLASS,
  SWITCH_LABEL_ERROR_CLASS,
  SWITCH_STATE_LABEL_CLASS,
  SWITCH_THUMB_CHECKED_CLASS,
  SWITCH_THUMB_CLASS,
  SWITCH_WRAPPER_CLASS,
  switchMixedClass,
  switchMixedDashClass,
  switchRowClass,
  FIELD_RESET_CLASS,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { useListens } from "../FieldWrapper/fieldModel";
import { KozmosLabel } from "../Label/Label";
import { useBubbleInput } from "../shared/bubbleInput";
import { callAll } from "../shared/listeners";
import { controlText } from "../shared/choiceText";

/**
 * Vue's counterpart of React's Switch: the row React's draws, from the same
 * recipe (`recipes/switch.ts`), around the track Radix's Switch draws. The
 * track is drawn here as Radix 1.2 draws it, not on Reka UI's SwitchRoot,
 * which differs from it where an app can see: Reka names the switch from
 * its label's text in `aria-label`, draws the form's hidden input only with
 * a `name`, and toggles on Enter in its own keydown, where Radix's leaves
 * Enter to the button's native click.
 *
 * `v-model:checked` is React's `checked` and `onCheckedChange`; an
 * uncontrolled switch starts at `default-checked` and keeps its own state,
 * which the state words (`show-state-label`, `on-label`, `off-label`)
 * follow. Each toggle is reported as `switch_toggled`, with React's
 * properties, before `update:checked` is emitted.
 *
 * Mixed (decision 188), it stands for several settings that differ: drawn
 * neither on nor off, the theme fill with a dash and no thumb, off to a
 * screen reader with `mixed-label` as its description. A click turns it on.
 * Not mixed, a `@reset-mixed` listener draws the reset under it, which,
 * pressed, focuses the switch and emits `resetMixed`.
 *
 * `label` names it, and `description` is read as its description, never
 * its name; `error` marks it invalid, and a string error is drawn under it
 * and read as its description too. The app's `class`, `id` and attributes
 * reach the track; `wrapper-class-name` the column.
 */
export const KozmosSwitch = defineComponent({
  name: "KozmosSwitch",
  inheritAttrs: false,
  props: {
    label: { type: String, default: undefined },
    /**
     * A line under the label, read as the switch's description
     * (`aria-describedby`), never as part of its name (GAP-162).
     */
    description: { type: String, default: undefined },
    /** Draws the state in words beside the track (GAP-162); they are not read. */
    showStateLabel: { type: Boolean, default: false },
    onLabel: { type: String, default: "On" },
    offLabel: { type: String, default: "Off" },
    // String first, as Vue reads a `[String, Boolean]` prop: "" is an
    // error with no words, as React's `error=""` is, not `true`.
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    wrapperClassName: { type: String, default: undefined },
    /** It stands for several settings that differ (decision 188). */
    mixed: { type: Boolean, default: false },
    mixedLabel: { type: String, default: "Multiple values" },
    resetMixedLabel: { type: String, default: "Reset to multiple values" },
    defaultChecked: { type: Boolean, default: undefined },
    asChild: { type: Boolean, default: undefined },
    checked: { type: Boolean, default: undefined },
    required: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
  },
  emits: {
    /** React's `onCheckedChange`: the state a press asks for. */
    "update:checked": (_checked: boolean) => true,
    /**
     * The reset under a switch that is not mixed was pressed, after focus
     * went to the switch: React's `onResetMixed`. Drawn only while
     * something listens.
     */
    resetMixed: () => true,
  },
  slots: Object as SlotsType<{
    /** Taken and not drawn: React's Switch draws its own thumb there. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, emit }) {
    const { trackEvent } = useKozmosAnalytics();
    const defaultId = useId();
    const errorId = useId();
    const descriptionId = useId();
    const mixedId = useId();
    const resettable = useListens("onResetMixed");
    // The state words follow the switch whether the app controls it or not,
    // so an uncontrolled switch's state is kept here, and the track is
    // always given it. Mixed, the track is off, so a click turns it on.
    const own = ref(props.defaultChecked ?? false);
    const isChecked = () =>
      props.checked !== undefined ? props.checked : own.value;
    const shown = () => (props.mixed ? false : isChecked());
    const bubble = useBubbleInput({
      type: "checkbox",
      checked: shown,
      form: () => attrs.form,
    });
    const toggle = (checked: boolean) => {
      trackEvent("Switch", "switch_toggled", { checked });
      own.value = checked;
      emit("update:checked", checked);
    };

    return () => {
      const {
        class: className,
        id,
        name,
        value = "on",
        form,
        "aria-describedby": ariaDescribedBy,
        "aria-invalid": ariaInvalid,
        onClick,
        ...rest
      } = attrs as Record<string, unknown>;
      const inputId = (id as string | undefined) || defaultId;
      const hasError = !!props.error;
      const isStringError = typeof props.error === "string";
      const checked = shown();
      const state = checked ? "checked" : "unchecked";
      const track = h(
        Primitive,
        {
          as: "button",
          asChild: props.asChild,
          type: "button",
          role: "switch",
          "aria-checked": checked,
          "aria-required": props.required,
          "data-state": state,
          "data-disabled": props.disabled ? "" : undefined,
          disabled: props.disabled,
          value,
          id: inputId,
          class: cn(
            SWITCH_CLASS,
            hasError && SWITCH_ERROR_CLASS,
            props.mixed && switchMixedClass(hasError),
            normalizeClass(className),
          ),
          ...rest,
          "data-mixed": props.mixed ? "" : undefined,
          "aria-invalid": hasError || ariaInvalid,
          "aria-describedby": mergeAriaIds(
            ariaDescribedBy as string | undefined,
            props.description ? descriptionId : undefined,
            props.mixed ? mixedId : undefined,
            hasError && isStringError ? errorId : undefined,
          ),
          ref: bubble.setControl,
          onClick: (event: MouseEvent) => {
            callAll(onClick, event);
            if (event.defaultPrevented) return;
            toggle(!checked);
            bubble.onControlClick(event);
          },
        },
        {
          default: () => [
            props.mixed
              ? h(Minus, {
                  "aria-hidden": "true",
                  "data-slot": "mixed-dash",
                  class: switchMixedDashClass(hasError),
                })
              : h("span", {
                  "data-state": state,
                  "data-disabled": props.disabled ? "" : undefined,
                  class: cn(
                    SWITCH_THUMB_CLASS,
                    !hasError && SWITCH_THUMB_CHECKED_CLASS,
                  ),
                }),
          ],
        },
      );
      const words = props.description
        ? controlText({
            inputId,
            label: props.label,
            description: props.description,
            descriptionId,
            class: SWITCH_CONTROL_TEXT_CLASS,
            labelClass: cn(hasError && SWITCH_LABEL_ERROR_CLASS),
          })
        : props.label
          ? h(
              KozmosLabel,
              {
                for: inputId,
                class: cn(
                  SWITCH_LABEL_CLASS,
                  hasError && SWITCH_LABEL_ERROR_CLASS,
                ),
              },
              () => props.label,
            )
          : null;
      return h(
        "div",
        { class: cn(SWITCH_WRAPPER_CLASS, props.wrapperClassName) },
        [
          h("div", { class: switchRowClass(!!props.description) }, [
            track,
            bubble.render({
              name,
              value,
              required: props.required,
              disabled: props.disabled,
              form,
            }),
            props.showStateLabel
              ? // Hidden from assistive technology: the role="switch"
                // already says its state.
                h(
                  "span",
                  {
                    "aria-hidden": "true",
                    "data-slot": "state-label",
                    class: SWITCH_STATE_LABEL_CLASS,
                  },
                  props.mixed
                    ? props.mixedLabel
                    : isChecked()
                      ? props.onLabel
                      : props.offLabel,
                )
              : null,
            words,
          ]),
          // Hidden, and still the switch's description: aria-describedby
          // reads a hidden element.
          props.mixed
            ? h("span", { id: mixedId, hidden: true }, props.mixedLabel)
            : null,
          !props.mixed && resettable() && !props.disabled
            ? h(
                "button",
                {
                  type: "button",
                  class: FIELD_RESET_CLASS,
                  "data-slot": "reset-mixed",
                  onClick: () => {
                    // Focus goes to the switch first, which is then read
                    // with its several values, not lost to the page.
                    bubble.control.value?.focus();
                    emit("resetMixed");
                  },
                },
                props.resetMixedLabel,
              )
            : null,
          isStringError
            ? h(
                "p",
                { id: errorId, class: SWITCH_ERROR_TEXT_CLASS },
                props.error as string,
              )
            : null,
        ],
      );
    };
  },
});
