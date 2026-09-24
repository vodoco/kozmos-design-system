import React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../../utils";
import { Label } from "../Label";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface SwitchProps extends React.ComponentPropsWithoutRef<
  typeof SwitchPrimitive.Root
> {
  label?: string;
  error?: boolean | string;
  wrapperClassName?: string;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
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
        <SwitchPrimitive.Root
          id={inputId}
          className={cn(
            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border-2 border-muted-foreground bg-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary",
            hasError &&
              "border-destructive focus-visible:ring-destructive data-[state=checked]:border-destructive data-[state=checked]:bg-destructive",
            className,
          )}
          {...props}
          onCheckedChange={(checked) => {
            trackEvent("Switch", "switch_toggled", { checked });
            props.onCheckedChange?.(checked);
          }}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={hasError && isStringError ? errorId : undefined}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              "pointer-events-none block h-5 w-5 rounded-pill bg-background shadow-raised ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
            )}
          />
        </SwitchPrimitive.Root>
        {label && (
          <Label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              hasError && "text-destructive-text",
            )}
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
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
