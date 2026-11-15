import React from "react";
import { Check } from "@kozmos-ds/icons";
import { cn } from "../../utils";

export type ListDensity = "default" | "compact";

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  density?: ListDensity;
}

const listDensityClasses: Record<ListDensity, string> = {
  default: "[&>li]:min-h-12 [&>li]:px-4 [&>li]:py-3",
  compact: "[&>li]:min-h-10 [&>li]:px-4 [&>li]:py-2",
};

const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, density = "default", ...props }, ref) => (
    <ul
      ref={ref}
      data-density={density}
      className={cn(
        "m-0 flex w-full list-none flex-col overflow-hidden rounded-control border bg-background p-0 text-sm text-foreground",
        listDensityClasses[density],
        className,
      )}
      {...props}
    />
  ),
);
List.displayName = "List";

/**
 * A row's slots (GAP-195, decision 135): the checklist row and the settings
 * row are one ListItem, filled in. Give any of them and the row is drawn as
 * a mark at the start, a title with something beside it, a description and a
 * meta line under it, and one thing at the end; give none and the row is its
 * children, as it always was.
 */
export interface ListItemSlotProps {
  /**
   * At the start, centred on the title's line: a ListItemStatus, an icon, a
   * persona's mark. It is read first, so a status is heard with the name.
   */
  leading?: React.ReactNode;
  /** The row's name, 14 medium in the foreground colour. */
  title?: React.ReactNode;
  /**
   * Beside the title, on its line, wrapping under it when the row is
   * narrow: a role Tag, an info IconButton, a settings row's state.
   */
  titleAddon?: React.ReactNode;
  /** Under the title, 14 in the muted colour. */
  description?: React.ReactNode;
  /** Under the description, 12 in the muted colour: a duration, a date. */
  meta?: React.ReactNode;
  /**
   * At the end, centred on the row: one action, a Checkbox, a Switch, a
   * field. It is the row's one control; the row itself is not pressable.
   */
  trailing?: React.ReactNode;
}

export interface ListItemProps
  extends
    Omit<React.LiHTMLAttributes<HTMLLIElement>, "title">,
    ListItemSlotProps {
  /**
   * Tinted, theme 0 (CardHeader's subtle strip): a row whose box is ticked,
   * as Pointr Cloud's Map Persona Visibility rows are. It is drawn only:
   * the row's control says it is checked.
   */
  selected?: boolean;
}

const hasSlots = (props: ListItemSlotProps) =>
  props.leading != null ||
  props.title != null ||
  props.titleAddon != null ||
  props.description != null ||
  props.meta != null ||
  props.trailing != null;

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  (
    {
      className,
      leading,
      title,
      titleAddon,
      description,
      meta,
      trailing,
      selected,
      children,
      ...props
    },
    ref,
  ) => {
    const slotted = hasSlots({
      leading,
      title,
      titleAddon,
      description,
      meta,
      trailing,
    });
    return (
      <li
        ref={ref}
        data-selected={selected ? "" : undefined}
        className={cn(
          "flex items-center border-b last:border-b-0",
          slotted && "kozmos-list-item-slotted",
          selected && "kozmos-list-item-selected",
          className,
        )}
        {...props}
      >
        {slotted ? (
          <>
            {leading != null ? (
              <span className="kozmos-list-item-leading" data-slot="leading">
                {leading}
              </span>
            ) : null}
            <div className="kozmos-list-item-body">
              {title != null || titleAddon != null ? (
                <div className="kozmos-list-item-heading">
                  {title != null ? (
                    <span className="kozmos-list-item-title" data-slot="title">
                      {title}
                    </span>
                  ) : null}
                  {titleAddon != null ? (
                    <span
                      className="kozmos-list-item-title-addon"
                      data-slot="title-addon"
                    >
                      {titleAddon}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {description != null ? (
                <div
                  className="kozmos-list-item-description"
                  data-slot="description"
                >
                  {description}
                </div>
              ) : null}
              {meta != null ? (
                <div className="kozmos-list-item-meta" data-slot="meta">
                  {meta}
                </div>
              ) : null}
              {children}
            </div>
            {trailing != null ? (
              <div className="kozmos-list-item-trailing" data-slot="trailing">
                {trailing}
              </div>
            ) : null}
          </>
        ) : (
          children
        )}
      </li>
    );
  },
);
ListItem.displayName = "ListItem";

export type ListItemStatusValue = "todo" | "inProgress" | "done";

const STATUS_LABELS: Record<ListItemStatusValue, string> = {
  todo: "Not started",
  inProgress: "In progress",
  done: "Done",
};

export interface ListItemStatusProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /** Not started, in progress or done: a checklist row's mark (GAP-195). */
  status: ListItemStatusValue;
  /**
   * What a screen reader hears before the row's title. English by default:
   * "Not started", "In progress", "Done".
   */
  label?: string;
}

/**
 * A checklist row's status mark, for ListItem's `leading`: Stepper's step
 * marks at 20. Done is the theme fill with a check; in progress a theme
 * ring around a dot; not started a ring in the muted line colour. The mark
 * is drawn only; its words are read, first in the row, so a screen reader
 * hears the status with the name.
 */
const ListItemStatus = React.forwardRef<HTMLSpanElement, ListItemStatusProps>(
  ({ status, label, className, ...props }, ref) => (
    <span
      ref={ref}
      data-status={status}
      className={cn("kozmos-list-item-status", className)}
      {...props}
    >
      {status === "done" ? (
        <Check aria-hidden="true" className="kozmos-list-item-status-check" />
      ) : status === "inProgress" ? (
        <span aria-hidden="true" className="kozmos-list-item-status-dot" />
      ) : null}
      <span className="sr-only">{label ?? STATUS_LABELS[status]}</span>
    </span>
  ),
);
ListItemStatus.displayName = "ListItemStatus";

export { List, ListItem, ListItemStatus };
