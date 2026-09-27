import type { HTMLAttributes } from "react";
import { Check } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import type { ComboboxOption } from "../Combobox";

/** Shared rendering contract for standalone and combobox list options. No focus
 * or selection state is owned here; the containing widget owns interaction. */
export function OptionRow({
  option,
  selected,
  active,
  disabled,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  option: ComboboxOption;
  selected: boolean;
  active: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      {...props}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-active={active && !disabled ? "true" : undefined}
      className={cn("kozmos-reset kozmos-option", className)}
    >
      <span className="kozmos-reset kozmos-option-content">
        <span className="kozmos-reset kozmos-option-label">{option.label}</span>
        {option.description && (
          <span className="kozmos-reset kozmos-option-description">
            {option.description}
          </span>
        )}
      </span>
      {selected && (
        <Check
          className="kozmos-reset kozmos-option-check"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
