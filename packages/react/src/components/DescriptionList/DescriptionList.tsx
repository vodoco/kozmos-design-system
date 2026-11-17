import React from "react";
import { cn } from "../../utils";

/**
 * How a DescriptionList's items go (GAP-221, decision 199): `"stack"`, one
 * under another; `"row"`, side by side, as many to a line as fit, each at
 * least 10rem wide, wrapping onto the next.
 */
export type DescriptionListLayout = "stack" | "row";

export interface DescriptionListProps extends React.HTMLAttributes<HTMLDListElement> {
  /** `"stack"` (the default) or `"row"`. */
  layout?: DescriptionListLayout;
}

/**
 * A set of values each under its label, with no field chrome (GAP-221,
 * decision 199): a record's read-only view, such as MAP-619's unit for a
 * Read-Only user. A `<dl>`, each `DescriptionListItem` a `<dt>` and its
 * `<dd>`, so a screen reader hears each label with its value. Not MetaStrip,
 * which draws a few facts as tiles in a strip that scrolls sideways.
 */
const DescriptionList = React.forwardRef<
  HTMLDListElement,
  DescriptionListProps
>(({ className, layout = "stack", ...props }, ref) => (
  <dl
    ref={ref}
    data-layout={layout}
    className={cn("kozmos-description-list", className)}
    {...props}
  />
));
DescriptionList.displayName = "DescriptionList";

export interface DescriptionListItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** The label, over the value: its `<dt>`. */
  label: React.ReactNode;
  /**
   * The value: words, tags (Badges or Chips) or any other part. `true` and
   * `false` are a yes or a no, written as `yesLabel` and `noLabel`.
   * `children` is the value too, where `value` is not given.
   */
  value?: React.ReactNode | boolean;
  children?: React.ReactNode;
  /**
   * A part after the value, on its line, such as an `IconButton` that
   * copies it. It is part of the `<dd>`, read after the value.
   */
  action?: React.ReactNode;
  /** The words for a `true` value: "Yes" by default. */
  yesLabel?: string;
  /** The words for a `false` value: "No" by default. */
  noLabel?: string;
}

/**
 * One label and its value (GAP-221): the label 12/16 in the muted
 * foreground over the value 14/20 in the foreground, 4 apart, with no
 * border, fill or field around them.
 */
const DescriptionListItem = React.forwardRef<
  HTMLDivElement,
  DescriptionListItemProps
>(
  (
    {
      action,
      children,
      className,
      label,
      noLabel = "No",
      value,
      yesLabel = "Yes",
      ...props
    },
    ref,
  ) => {
    const given = value === undefined ? children : value;
    const shown = given === true ? yesLabel : given === false ? noLabel : given;
    return (
      <div
        ref={ref}
        className={cn("kozmos-description-list-item", className)}
        {...props}
      >
        <dt className="kozmos-description-list-label">{label}</dt>
        <dd className="kozmos-description-list-value">
          <span className="kozmos-description-list-content">{shown}</span>
          {action !== undefined && action !== null && (
            <span className="kozmos-description-list-action">{action}</span>
          )}
        </dd>
      </div>
    );
  },
);
DescriptionListItem.displayName = "DescriptionListItem";

export { DescriptionList, DescriptionListItem };
