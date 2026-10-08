import React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { FieldWrapper } from "../FieldWrapper";
import { Label } from "../Label";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface RadioGroupProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
> {
  label?: string;
  error?: boolean | string;
  wrapperClassName?: string;
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, label, error, wrapperClassName, ...props }, ref) => {
  const errorId = React.useId();
  const hasError = !!error;
  const { trackEvent } = useKozmosAnalytics();

  return (
    <FieldWrapper
      label={label}
      error={error}
      errorId={errorId}
      className={wrapperClassName}
    >
      <RadioGroupPrimitive.Root
        className={cn("grid gap-2", className)}
        aria-invalid={hasError}
        aria-describedby={
          hasError && typeof error === "string" ? errorId : undefined
        }
        {...props}
        onValueChange={(value) => {
          trackEvent("RadioGroup", "radio_selection_changed", { value });
          props.onValueChange?.(value);
        }}
        ref={ref}
      />
    </FieldWrapper>
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> {
  label?: string;
  error?: boolean;
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, label, id, error = false, ...props }, ref) => {
  const defaultId = React.useId();
  const inputId = id || defaultId;

  return (
    <div className="flex min-h-11 items-center gap-2">
      <RadioGroupPrimitive.Item
        ref={ref}
        id={inputId}
        className={cn(
          // The ring is a border on the surface, theme 600; the dot is a fill,
          // the theme fill, theme 500 in both themes (decision 59). The dot
          // draws in currentColor, so the text colour is the dot's.
          "peer aspect-square h-5 w-5 shrink-0 rounded-pill border border-input text-theme-fill ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:text-theme-fill",
          error &&
            "border-destructive text-destructive-text focus-visible:ring-destructive data-[state=checked]:border-destructive data-[state=checked]:text-destructive-text",
          className,
        )}
        aria-invalid={error || undefined}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <Circle className="h-2.5 w-2.5 fill-current text-current" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {label && (
        <Label
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            error && "text-destructive-text",
          )}
        >
          {label}
        </Label>
      )}
    </div>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
