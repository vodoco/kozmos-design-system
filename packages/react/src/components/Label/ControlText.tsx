import { cn } from "../../utils";
import {
  CONTROL_TEXT_CLASS,
  CONTROL_TEXT_DESCRIPTION_CLASS,
  CONTROL_TEXT_LABEL_CLASS,
} from "../../recipes/control-text";
import { Label } from "./Label";

/**
 * The recipe is shared with Vue's KozmosCheckbox (recipes/control-text.ts).
 *
 * A control's label with a description under it (GAP-162), for Checkbox,
 * Switch and a default radio. It follows the control as the `peer` it reads:
 * disabled, the words are drawn at half with it. The label is 20 tall, the
 * control's own height, so the control sits beside its first line.
 */
export function ControlText({
  inputId,
  label,
  description,
  descriptionId,
  labelClassName,
  className,
}: {
  inputId: string;
  label?: string;
  description: string;
  descriptionId: string;
  labelClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn(CONTROL_TEXT_CLASS, className)}>
      {label && (
        <Label
          htmlFor={inputId}
          className={cn(CONTROL_TEXT_LABEL_CLASS, labelClassName)}
        >
          {label}
        </Label>
      )}
      <span id={descriptionId} className={CONTROL_TEXT_DESCRIPTION_CLASS}>
        {description}
      </span>
    </span>
  );
}
