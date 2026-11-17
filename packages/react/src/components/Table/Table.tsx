import React from "react";
import { cn } from "../../utils";
import { scrollHorizontalWithKeyboard } from "../../utils/keyboard-scroll";

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /**
   * A 1px border round the table and the control radius, 16, at its corners
   * (decision 159), as Figma, SwiftUI and Compose draw it. The header and the
   * rows are clipped inside it, so a row's hover and selected fills keep its
   * corners, and a caption sits inside the frame, at its foot. Off by
   * default: a dense page's table runs edge to edge.
   */
  framed?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, framed = false, ...props }, ref) => (
    <div
      tabIndex={0}
      onKeyDown={scrollHorizontalWithKeyboard}
      className={cn(
        "relative w-full overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        framed && "rounded-control border border-border",
      )}
    >
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm",
          framed && "[&>caption]:mb-4",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

/**
 * A row's passing highlight (GAP-276): `"new"`, a row just added, drawn on
 * the informative surface that holds, then fades.
 */
export type TableRowHighlight = "new";

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * `"new"` tints a row just added in the informative surface
   * (`--semantics-emotion-informative-surface`) so the eye finds it, then
   * fades it (GAP-276): held three deliberate durations, faded over one
   * (`--semantics-motion-duration-deliberate`, 1.84 s in all). Under reduced
   * motion, the system's or the design config's, the tint shows and clears
   * at the same time with no fade. It plays once, when the row is drawn
   * with it or is given it; give it again, after taking it away, to play it
   * again.
   */
  highlight?: TableRowHighlight;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, highlight, ...props }, ref) => (
    <tr
      ref={ref}
      data-highlight={highlight}
      className={cn(
        "border-b transition-colors hover:bg-hover-fill/50 data-[state=selected]:bg-hover-fill",
        highlight && "kozmos-table-row-highlight",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle text-xs font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
