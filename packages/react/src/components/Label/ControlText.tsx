import { cn } from "../../utils";
import { Label } from "./Label";

/**
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
    <span
      className={cn(
        "flex min-w-0 flex-col gap-0.5 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
    >
      {label && (
        <Label
          htmlFor={inputId}
          className={cn("text-sm font-medium leading-5", labelClassName)}
        >
          {label}
        </Label>
      )}
      <span
        id={descriptionId}
        className="text-sm leading-5 text-muted-foreground"
      >
        {description}
      </span>
    </span>
  );
}
