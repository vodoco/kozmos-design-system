import { h, type VNode } from "vue";
import {
  cn,
  CONTROL_TEXT_CLASS,
  CONTROL_TEXT_DESCRIPTION_CLASS,
  CONTROL_TEXT_LABEL_CLASS,
  FIELD_RESET_CLASS,
  MIXED_GROUP_LABEL_CLASS,
  mixedGroupFocusTarget,
} from "#kozmos-recipes";
import { KozmosLabel } from "../Label/Label";

/**
 * What Switch and RadioGroupItem draw as React's internal ControlText does
 * (recipes/control-text.ts): a control's label with a description under
 * it (GAP-162), the label for the control `inputId` names. Internal: the
 * package exports none of it.
 */
export function controlText(options: {
  inputId: string;
  label?: string;
  description: string;
  descriptionId: string;
  labelClass?: string;
  class?: string;
}): VNode {
  return h("span", { class: cn(CONTROL_TEXT_CLASS, options.class) }, [
    options.label
      ? h(
          KozmosLabel,
          {
            for: options.inputId,
            class: cn(CONTROL_TEXT_LABEL_CLASS, options.labelClass),
          },
          () => options.label,
        )
      : null,
    h(
      "span",
      { id: options.descriptionId, class: CONTROL_TEXT_DESCRIPTION_CLASS },
      options.description,
    ),
  ]);
}

/**
 * What a mixed group draws under its options, as React's internal
 * MixedGroupLine does (recipes/mixed-group.ts), for RadioGroup and
 * SegmentedControl: while mixed, a line of `mixedLabel`, said as the
 * group's description (`mixedId`); once a choice ends it, the reset, if
 * something listens for it and the group is usable. Pressed, focus goes to
 * the group's option that holds its Tab stop, then `onReset` is called.
 */
export function mixedGroupLine(options: {
  mixed: boolean;
  mixedLabel: string;
  mixedId: string;
  resettable: boolean;
  resetMixedLabel: string;
  disabled?: boolean;
  group: () => HTMLElement | null;
  onReset: () => void;
}): VNode | null {
  if (options.mixed)
    return h(
      "p",
      {
        id: options.mixedId,
        "data-slot": "mixed-label",
        class: MIXED_GROUP_LABEL_CLASS,
      },
      options.mixedLabel,
    );
  if (!options.resettable || options.disabled) return null;
  return h(
    "button",
    {
      type: "button",
      class: FIELD_RESET_CLASS,
      "data-slot": "reset-mixed",
      onClick: () => {
        mixedGroupFocusTarget(options.group())?.focus();
        options.onReset();
      },
    },
    options.resetMixedLabel,
  );
}
