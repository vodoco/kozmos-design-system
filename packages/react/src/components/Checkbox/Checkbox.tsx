import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { Label } from "../Label";
import { ControlText } from "../Label/ControlText";
import { useKozmosAnalytics } from "../../utils/analytics";
// The recipe is shared with Vue's KozmosCheckbox (recipes/checkbox.ts).
import {
  CHECKBOX_CLASS,
  CHECKBOX_ERROR_CLASS,
  CHECKBOX_ERROR_TEXT_CLASS,
  CHECKBOX_INDICATOR_CLASS,
  CHECKBOX_LABEL_CLASS,
  CHECKBOX_MARK_CLASS,
  CHECKBOX_WRAPPER_CLASS,
  checkboxRowClass,
} from "../../recipes/checkbox";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  label?: string;
  /**
   * A line under the label, read as the checkbox's description
   * (`aria-describedby`), never as part of its name (GAP-162).
   */
  description?: string;
  error?: boolean | string;
  wrapperClassName?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    { className, label, description, error, wrapperClassName, ...rest },
    ref,
  ) => {
    // The caller's description is joined with the error's rather than
    // replacing it, as Switch and Slider join theirs.
    const {
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    } = rest;
    const defaultId = React.useId();
    const inputId = props.id || defaultId;
    const errorId = React.useId();
    const descriptionId = React.useId();
    const hasError = !!error;
    const isStringError = typeof error === "string";
    const { trackEvent } = useKozmosAnalytics();

    return (
      <div className={cn(CHECKBOX_WRAPPER_CLASS, wrapperClassName)}>
        <div className={checkboxRowClass(!!description)}>
          <CheckboxPrimitive.Root
            id={inputId}
            ref={ref}
            className={cn(
              // `indeterminate` is painted exactly like `checked`: only the
              // mark inside differs (recipes/checkbox.ts).
              CHECKBOX_CLASS,
              hasError && CHECKBOX_ERROR_CLASS,
              className,
            )}
            // The caller's props first, then the handler that wraps theirs:
            // spread last, a caller's onCheckedChange replaced the wrapper and
            // the toggle was never reported.
            {...props}
            aria-invalid={hasError || ariaInvalid}
            aria-describedby={mergeAriaIds(
              ariaDescribedBy,
              description ? descriptionId : undefined,
              hasError && isStringError ? errorId : undefined,
            )}
            onCheckedChange={(checked) => {
              trackEvent("Checkbox", "checkbox_toggled", { checked });
              props.onCheckedChange?.(checked);
            }}
          >
            {/*
            Radix renders this for BOTH `checked` and `indeterminate`, so the mark has to say which
            one it is. Before this it always drew a tick, and an indeterminate box was
            indistinguishable from a checked one — the third state existed in the API and nowhere on
            screen.
          */}
            <CheckboxPrimitive.Indicator
              className={cn(CHECKBOX_INDICATOR_CLASS)}
            >
              {props.checked === "indeterminate" ? (
                <Minus className={CHECKBOX_MARK_CLASS} aria-hidden />
              ) : (
                <Check className={CHECKBOX_MARK_CLASS} aria-hidden />
              )}
            </CheckboxPrimitive.Indicator>
          </CheckboxPrimitive.Root>
          {description ? (
            <ControlText
              inputId={inputId}
              label={label}
              description={description}
              descriptionId={descriptionId}
            />
          ) : (
            label && (
              <Label htmlFor={inputId} className={CHECKBOX_LABEL_CLASS}>
                {label}
              </Label>
            )
          )}
        </div>
        {isStringError && (
          <p id={errorId} className={CHECKBOX_ERROR_TEXT_CLASS}>
            {error}
          </p>
        )}
      </div>
    );
  },
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
