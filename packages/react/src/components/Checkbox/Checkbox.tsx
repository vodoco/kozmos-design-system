import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "../../utils";
import { Label } from "../Label";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  label?: string;
  error?: boolean | string;
  wrapperClassName?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, error, wrapperClassName, ...props }, ref) => {
  const defaultId = React.useId();
  const inputId = props.id || defaultId;
  const errorId = React.useId();
  const hasError = !!error;
  const isStringError = typeof error === "string";
  const { trackEvent } = useKozmosAnalytics();

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", wrapperClassName)}>
      <div className="flex min-h-11 items-center gap-2">
        <CheckboxPrimitive.Root
          id={inputId}
          ref={ref}
          className={cn(
            // `indeterminate` is painted exactly like `checked` — same border, same fill. It is a
            // real answer ("these disagree"), not a disabled or half-pressed control, so it must not
            // read as weaker than the other two. Only the mark inside differs.
            "peer h-5 w-5 shrink-0 rounded-marker border border-input ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
            hasError && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          aria-invalid={hasError}
          aria-describedby={hasError && isStringError ? errorId : undefined}
          onCheckedChange={(checked) => {
            trackEvent("Checkbox", "checkbox_toggled", { checked });
            props.onCheckedChange?.(checked);
          }}
          {...props}
        >
          {/*
            Radix renders this for BOTH `checked` and `indeterminate`, so the mark has to say which
            one it is. Before this it always drew a tick, and an indeterminate box was
            indistinguishable from a checked one — the third state existed in the API and nowhere on
            screen.
          */}
          <CheckboxPrimitive.Indicator
            className={cn("flex items-center justify-center text-current")}
          >
            {props.checked === "indeterminate" ? (
              <Minus className="h-4 w-4" aria-hidden />
            ) : (
              <Check className="h-4 w-4" aria-hidden />
            )}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {label && (
          <Label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            {label}
          </Label>
        )}
      </div>
      {isStringError && (
        <p id={errorId} className="text-sm text-destructive-text">
          {error}
        </p>
      )}
    </div>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
