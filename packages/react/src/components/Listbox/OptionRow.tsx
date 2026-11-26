import { useId, type HTMLAttributes } from "react";
import { Check } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import {
  hasOptionTrailing,
  OPTION_CHECK_CLASS,
  OPTION_CLASS,
  OPTION_CONTENT_CLASS,
  OPTION_DESCRIPTION_CLASS,
  OPTION_LABEL_CLASS,
  OPTION_MEDIA_CLASS,
  OPTION_TRAILING_CLASS,
  optionInitials,
  optionTrailingId,
} from "../../recipes/option";
import { Avatar, AvatarFallback, AvatarImage } from "../Avatar/Avatar";
import type { ComboboxOption } from "../Combobox";

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
  const hasTrailing = hasOptionTrailing(option.trailing);
  // The trailing words are the option's description, not its name: drawn
  // after the label, they would run into it ("NameText").
  const trailingId = optionTrailingId(id ?? ownId);
  return (
    <div
      {...props}
      id={id}
      aria-describedby={hasTrailing ? trailingId : undefined}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-active={active && !disabled ? "true" : undefined}
      className={cn(OPTION_CLASS, className)}
    >
      {option.media && (
        // Decoration: the label names the option (decision 215).
        <Avatar size="sm" aria-hidden="true" className={OPTION_MEDIA_CLASS}>
          {option.media.src && <AvatarImage src={option.media.src} alt="" />}
          <AvatarFallback>
            {option.media.initials ?? optionInitials(option.label)}
          </AvatarFallback>
        </Avatar>
      )}
      <span className={OPTION_CONTENT_CLASS}>
        <span className={OPTION_LABEL_CLASS}>{option.label}</span>
        {option.description && (
          <span className={OPTION_DESCRIPTION_CLASS}>{option.description}</span>
        )}
      </span>
      {hasTrailing && (
        <span
          id={trailingId}
          aria-hidden="true"
          className={OPTION_TRAILING_CLASS}
        >
          {option.trailing}
        </span>
      )}
      {selected && <Check className={OPTION_CHECK_CLASS} aria-hidden="true" />}
    </div>
  );
}
