import { useId, type HTMLAttributes } from "react";
import { Check } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { Avatar, AvatarFallback, AvatarImage } from "../Avatar/Avatar";
import type { ComboboxOption } from "../Combobox";

/**
 * A label's initials: the first letter of its first two words, "PC" for
 * "Pointr Cloud", "A" for "Acme", in the label's own script.
 */
export function optionInitials(label: string) {
  return label
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

/** Shared rendering contract for standalone and combobox list options. No focus
 * or selection state is owned here; the containing widget owns interaction. */
export function OptionRow({
  option,
  selected,
  active,
  disabled,
  className,
  id,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  option: ComboboxOption;
  selected: boolean;
  active: boolean;
  disabled?: boolean;
}) {
  const ownId = useId();
  const hasTrailing = option.trailing != null && option.trailing !== false;
  // The trailing words are the option's description, not its name: drawn
  // after the label, they would run into it ("NameText").
  const trailingId = `${id ?? ownId}-trailing`;
  return (
    <div
      {...props}
      id={id}
      aria-describedby={hasTrailing ? trailingId : undefined}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-active={active && !disabled ? "true" : undefined}
      className={cn("kozmos-reset kozmos-option", className)}
    >
      {option.media && (
        // Decoration: the label names the option (decision 215).
        <Avatar aria-hidden="true" className="kozmos-option-media">
          {option.media.src && <AvatarImage src={option.media.src} alt="" />}
          <AvatarFallback>
            {option.media.initials ?? optionInitials(option.label)}
          </AvatarFallback>
        </Avatar>
      )}
      <span className="kozmos-reset kozmos-option-content">
        <span className="kozmos-reset kozmos-option-label">{option.label}</span>
        {option.description && (
          <span className="kozmos-reset kozmos-option-description">
            {option.description}
          </span>
        )}
      </span>
      {hasTrailing && (
        <span
          id={trailingId}
          aria-hidden="true"
          className="kozmos-reset kozmos-option-trailing"
        >
          {option.trailing}
        </span>
      )}
      {selected && (
        <Check
          className="kozmos-reset kozmos-option-check"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
