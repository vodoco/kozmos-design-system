import React from "react";
import { clsx } from "clsx";
import { InfoCircle, Trash01 } from "@kozmos-ds/icons";
import { IconButton } from "../../components/IconButton/IconButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/Popover/Popover";
import { Text } from "../../components/Text/Text";

export interface PropertyFieldProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** The property's name: the group's caption, and its accessible name. */
  name: string;
  /**
   * What the property is, opened from the info button beside the caption
   * (a click, Enter or Space, as a toggletip: a tooltip cannot be reached by
   * touch). Unset, no info button.
   */
  info?: React.ReactNode;
  /** The info button's name. Default `About <name>`. */
  infoLabel?: string;
  /**
   * Removes the property from the item. Drawn as the red trash button
   * beside the group, Kozmos's destructive tone (`emotion="danger"`).
   * Unset, no button.
   */
  onRemove?: () => void;
  /** The remove button's name. Default `Remove <name>`. */
  removeLabel?: string;
  /** The property's editor: a field, or one of the Dashboard editors. */
  children?: React.ReactNode;
}

/**
 * The frame every property added to a Pointr Cloud item sits in
 * (CLOUD-UI-004): a bordered group with the property's name as its caption,
 * an info button for what the property is, and a red trash button that
 * removes it. The group is named by its caption, and both buttons have a
 * name, `About <name>` and `Remove <name>` (Cloud's had none).
 *
 * A Dashboard module (decision 183): import it from
 * `@kozmos-ds/react/dashboard`, with `@kozmos-ds/react/dashboard.css` after
 * the package's style.css.
 */
const PropertyField = React.forwardRef<HTMLDivElement, PropertyFieldProps>(
  (
    {
      className,
      name,
      info,
      infoLabel,
      onRemove,
      removeLabel,
      children,
      ...props
    },
    ref,
  ) => {
    const captionId = React.useId();
    return (
      <div
        ref={ref}
        className={clsx("kozmos-property-field", className)}
        {...props}
      >
        <div
          role="group"
          aria-labelledby={captionId}
          className="kozmos-property-field-box"
        >
          <div className="kozmos-property-field-header">
            <Text id={captionId} as="span" size="xs" color="muted">
              {name}
            </Text>
            {info ? (
              <Popover>
                <PopoverTrigger asChild>
                  <IconButton
                    size="sm"
                    aria-label={infoLabel ?? `About ${name}`}
                  >
                    <InfoCircle aria-hidden="true" />
                  </IconButton>
                </PopoverTrigger>
                <PopoverContent align="end">
                  <Text as="div" size="sm">
                    {info}
                  </Text>
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
          {children}
        </div>
        {onRemove ? (
          <IconButton
            emotion="danger"
            aria-label={removeLabel ?? `Remove ${name}`}
            onClick={onRemove}
          >
            <Trash01 aria-hidden="true" />
          </IconButton>
        ) : null}
      </div>
    );
  },
);
PropertyField.displayName = "PropertyField";

export { PropertyField };
