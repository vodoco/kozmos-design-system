import React from "react";
import { cn } from "../../utils";
import { Button, type ButtonProps } from "../Button/Button";
import { Counter } from "../Counter/Counter";

export interface IconButtonProps extends ButtonProps {
  /**
   * A count at the button's top-end corner (GAP-197): the tours left on a
   * help button, unread notices. A Counter in the theme fill, not a Badge,
   * which is a status (decision 93). The count is read with the button's
   * name, "Help, 3" by default, in `counterLabel`'s words when given; the
   * number drawn is hidden from readers, so it is not read twice. Unset, no
   * counter: pass `undefined` rather than 0 to hide it.
   */
  counter?: number;
  /**
   * What the count is read as, after the button's name: `(count) =>
   * \`${count} tours left\``, in the product's language. Defaults to the
   * number alone.
   */
  counterLabel?: (count: number) => string;
}

function iconButtonSizeClass(size: ButtonProps["size"]) {
  // The density's sizes (decision 82): 44, 44 and 48 in touch; 28, 32 and 40
  // in compact.
  if (size === "sm") return "h-icon-control-sm w-icon-control-sm px-0";
  // The large size is the prototype's 48: Filters and the AI search beside a 44 field.
  if (size === "lg")
    return "h-icon-control-lg w-icon-control-lg px-0 [&>svg]:h-5 [&>svg]:w-5";
  return "h-icon-control w-icon-control px-0";
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      size = "icon",
      variant = "ghost",
      counter,
      counterLabel = String,
      children,
      "aria-label": label,
      ...props
    },
    ref,
  ) => {
    const said = counter === undefined ? undefined : counterLabel(counter);
    return (
      <Button
        ref={ref}
        size={size}
        variant={variant}
        aria-label={said && label ? `${label}, ${said}` : label}
        className={cn(
          iconButtonSizeClass(size),
          said !== undefined && "kozmos-icon-button-counted",
          className,
        )}
        {...props}
      >
        {children}
        {said === undefined ? null : (
          <>
            <Counter
              aria-hidden="true"
              tone="brand"
              size="sm"
              className="kozmos-icon-button-counter"
            >
              {counter}
            </Counter>
            {/* Named by its content, the count is read from here. */}
            {label ? null : <span className="sr-only">{`, ${said}`}</span>}
          </>
        )}
      </Button>
    );
  },
);
IconButton.displayName = "IconButton";

export { IconButton };
