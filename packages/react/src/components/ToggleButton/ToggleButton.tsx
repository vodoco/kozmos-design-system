import React from "react";
import { cn } from "../../utils";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { Minus } from "@kozmos-ds/icons";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface ToggleButtonProps extends React.ComponentPropsWithoutRef<
  typeof TogglePrimitive.Root
> {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  /**
   * The toggle stands for several features that differ (decision 190): a
   * property of a multi-selection pressed on some and not on others. It is
   * drawn with a dashed theme edge on the muted fill and a dash before its
   * label, and announced as mixed, `aria-pressed="mixed"`. A press turns it
   * pressed: `onPressedChange` gets `true`, and the product clears `mixed`.
   */
  mixed?: boolean;
  /**
   * Offer to go back to the several values: drawn after the toggle, in the
   * same parent, while it is not `mixed`, never while it is disabled.
   * Pressed, focus returns to the toggle, and the product sets `mixed`
   * again.
   */
  onResetMixed?: () => void;
  /** The reset's words. Default "Reset to multiple values". */
  resetMixedLabel?: string;
}

const ToggleButton = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleButtonProps
>(
  (
    {
      className,
      variant = "default",
      size = "default",
      onPressedChange,
      pressed: pressedProp,
      defaultPressed,
      mixed = false,
      onResetMixed,
      resetMixedLabel = "Reset to multiple values",
      children,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    // Radix is always given the state, kept here for an uncontrolled
    // toggle: mixed (decision 190) it is given unpressed, so a press turns
    // it pressed, and the kept state holds that press once it is not mixed.
    const [uncontrolledPressed, setUncontrolledPressed] = React.useState(
      defaultPressed ?? false,
    );
    const isPressed = pressedProp ?? uncontrolledPressed;
    const own = React.useRef<HTMLButtonElement | null>(null);
    const toggleRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        own.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    const toggle = (
      <TogglePrimitive.Root
        ref={toggleRef}
        className={cn(
          // Its look is owned CSS, kozmos-toggle-button (GAP-262), so the
          // pressed fill, the focus ring and the disabled half-strength hold
          // in a host where no @scope rule applies. Pressed is read from
          // aria-pressed, never data-state (GAP-261): a trigger this button
          // is the child of (TooltipTrigger asChild) writes its own
          // data-state over Toggle's "on", and the pressed fill was lost.
          // Mixed is aria-pressed="mixed", which ARIA gives a toggle button.
          // The sizes stay utilities.
          "kozmos-toggle-button",
          variant === "outline" && "kozmos-toggle-button-outline",
          size === "default" && "h-9 px-3",
          size === "sm" && "h-8 px-2",
          size === "lg" && "h-10 px-3",
          className,
        )}
        onPressedChange={(pressed) => {
          trackEvent("ToggleButton", "toggle_pressed", { pressed });
          setUncontrolledPressed(pressed);
          onPressedChange?.(pressed);
        }}
        {...props}
        pressed={mixed ? false : isPressed}
        {...(mixed ? { "aria-pressed": "mixed" as const } : null)}
      >
        {mixed ? (
          // Checkbox's mixed mark, the minus at 16, before the label.
          <Minus
            aria-hidden="true"
            data-slot="mixed-dash"
            className="h-4 w-4 shrink-0"
          />
        ) : null}
        {children}
      </TogglePrimitive.Root>
    );
    if (mixed || !onResetMixed || props.disabled) return toggle;
    return (
      <>
        {toggle}
        <button
          type="button"
          className="kozmos-reset kozmos-field-reset"
          data-slot="reset-mixed"
          onClick={() => {
            // The button goes as the toggle turns mixed again: focus goes to
            // the toggle first, which is then read as mixed, not lost to the
            // page.
            own.current?.focus();
            onResetMixed();
          }}
        >
          {resetMixedLabel}
        </button>
      </>
    );
  },
);
ToggleButton.displayName = TogglePrimitive.Root.displayName;

export { ToggleButton };
