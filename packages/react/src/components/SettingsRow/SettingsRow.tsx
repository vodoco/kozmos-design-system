import React from "react";
import { cn, mergeAriaIds } from "../../utils";
import { ListItem } from "../List/List";
import { Tag } from "../Tag/Tag";

/**
 * Where a setting's value comes from (GAP-040, decision 135). `inherited`:
 * the system's value, which the site has not changed. `overridden`: the
 * site's own, which Reset to default gives back to the system's.
 */
export type SettingsRowState = "inherited" | "overridden";

export interface SettingsRowProps extends Omit<
  React.LiHTMLAttributes<HTMLLIElement>,
  "title"
> {
  /** The setting's name. It names the control. */
  label: React.ReactNode;
  /** What the setting does, under the name. It describes the control. */
  description?: React.ReactNode;
  /**
   * The setting's one control, at the row's end: a Switch, a Checkbox, an
   * Input, a NumberInput. Give it no label of its own: an element is given
   * the row's name (`aria-labelledby`) unless it has an `aria-label` or
   * `aria-labelledby`, and the description, the state and the disabled
   * reason join its `aria-describedby`; while the row is `disabled`, it is
   * given `disabled` too.
   */
  control?: React.ReactNode;
  /**
   * Inherited or overridden: drawn as a tag beside the name and read with
   * the control. Unset, the setting has no system value and no tag.
   */
  state?: SettingsRowState;
  /** The inherited tag's words. Default "Inherited". */
  inheritedLabel?: string;
  /** The overridden tag's words. Default "Overridden". */
  overriddenLabel?: string;
  /**
   * Offer Reset to default while the row is `overridden` and not disabled.
   * Pressed, focus goes to the control first, then this is called: the
   * product sets the system's value and `state="inherited"`, and the reset
   * goes, as the row is no longer overridden.
   */
  onReset?: () => void;
  /** The reset's words. Default "Reset to default". */
  resetLabel?: string;
  /** The setting cannot be changed: its control is disabled. */
  disabled?: boolean;
  /**
   * Why it cannot be changed, drawn under the description while the row is
   * `disabled`, and read with the control.
   */
  disabledReason?: React.ReactNode;
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A settings row (GAP-040, decision 135): a name and a description, one
 * control at the end, the value's state (inherited from the system, or
 * overridden by the site, with Reset to default) and a reason when it is
 * disabled. It is a ListItem filled in, so it goes in a List, which draws
 * the divider between rows.
 */
const SettingsRow = React.forwardRef<HTMLLIElement, SettingsRowProps>(
  (
    {
      label,
      description,
      control,
      state,
      inheritedLabel = "Inherited",
      overriddenLabel = "Overridden",
      onReset,
      resetLabel = "Reset to default",
      disabled,
      disabledReason,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const ownId = React.useId();
    const baseId = id ?? ownId;
    const labelId = `${baseId}-label`;
    const descriptionId = description != null ? `${baseId}-description` : "";
    const stateId = state ? `${baseId}-state` : "";
    const showReason = Boolean(disabled) && disabledReason != null;
    const reasonId = showReason ? `${baseId}-reason` : "";
    const showReset = state === "overridden" && Boolean(onReset) && !disabled;
    const trailingRef = React.useRef<HTMLDivElement>(null);

    // A control that does not take the props handed to it (a fragment, or
    // Vue's slot through the bridge) is named and described where it is
    // drawn: its first field or button, unless it is named already. One
    // that took them is named already, and is left as it is.
    React.useEffect(() => {
      const field = trailingRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button, [role="switch"], [role="checkbox"], [role="combobox"]',
      );
      if (!field) return;
      if (
        !field.hasAttribute("aria-label") &&
        !field.hasAttribute("aria-labelledby")
      )
        field.setAttribute("aria-labelledby", labelId);
      const described = mergeAriaIds(
        field.getAttribute("aria-describedby") ?? undefined,
        descriptionId,
        stateId,
        reasonId,
      );
      if (described) field.setAttribute("aria-describedby", described);
      // Disabled by the row, and enabled again only by it.
      if (!("disabled" in field)) return;
      const input = field as HTMLInputElement;
      if (disabled && !input.disabled) {
        input.disabled = true;
        input.setAttribute("data-kozmos-row-disabled", "");
      } else if (!disabled && input.hasAttribute("data-kozmos-row-disabled")) {
        input.disabled = false;
        input.removeAttribute("data-kozmos-row-disabled");
      }
    });

    let drawnControl = control;
    if (
      React.isValidElement<Record<string, unknown>>(control) &&
      control.type !== React.Fragment
    ) {
      const own = control.props;
      const named = own["aria-label"] != null || own["aria-labelledby"] != null;
      drawnControl = React.cloneElement(control, {
        "aria-labelledby": named
          ? (own["aria-labelledby"] as string | undefined)
          : labelId,
        "aria-describedby": mergeAriaIds(
          own["aria-describedby"] as string | undefined,
          descriptionId,
          stateId,
          reasonId,
        ),
        ...(disabled ? { disabled: true } : {}),
      });
    }

    const tag = state ? (
      <Tag
        id={stateId}
        variant={state === "overridden" ? "secondary" : "outline"}
        className="kozmos-settings-row-state"
        data-state={state}
      >
        {state === "overridden" ? overriddenLabel : inheritedLabel}
      </Tag>
    ) : undefined;

    const meta =
      showReason || showReset ? (
        <>
          {showReason ? (
            <span id={reasonId} className="kozmos-settings-row-reason">
              {disabledReason}
            </span>
          ) : null}
          {showReset ? (
            <button
              type="button"
              className="kozmos-reset kozmos-field-reset"
              data-slot="reset"
              onClick={(event) => {
                // The reset goes as the row turns inherited: focus goes to
                // the control first, which is then read with its new state,
                // not lost to the page.
                const target =
                  trailingRef.current?.querySelector<HTMLElement>(FOCUSABLE);
                if (target) target.focus();
                else event.currentTarget.blur();
                onReset?.();
              }}
            >
              {resetLabel}
            </button>
          ) : null}
        </>
      ) : undefined;

    return (
      <ListItem
        ref={ref}
        id={id}
        data-state={state}
        data-disabled={disabled ? "" : undefined}
        className={cn("kozmos-settings-row", className)}
        title={<span id={labelId}>{label}</span>}
        titleAddon={tag}
        description={
          description != null ? (
            <span id={descriptionId}>{description}</span>
          ) : undefined
        }
        meta={meta}
        trailing={
          drawnControl != null ? (
            <div ref={trailingRef} className="kozmos-settings-row-control">
              {drawnControl}
            </div>
          ) : undefined
        }
        {...props}
      />
    );
  },
);
SettingsRow.displayName = "SettingsRow";

export { SettingsRow };
