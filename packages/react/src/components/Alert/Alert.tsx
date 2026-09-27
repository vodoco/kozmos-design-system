import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";

const alertVariants = cva(
  "relative w-full rounded-container border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive-text dark:border-destructive [&>svg]:text-destructive-text",
        success:
          "border-success/50 text-success-text dark:border-success [&>svg]:text-success-text",
        warning:
          "border-warning/50 text-warning-text dark:border-warning [&>svg]:text-warning-text",
        info: "border-info/50 text-info-text dark:border-info [&>svg]:text-info-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Whether a screen reader should interrupt for this alert, and how hard.
 *
 * `off` is no live region at all, which is right for a notice that is simply
 * part of the page — "View only. Only Dashboard admins can change these
 * settings." That is the default because it is what this component is used
 * for, and because it is what SwiftUI and Compose already do: neither native
 * Alert announces anything.
 *
 * `polite` is `role="status"`: a notice that appeared in response to something
 * the visitor did, read when the reader next pauses.
 *
 * `assertive` is `role="alert"`, which interrupts whatever is being read. Only
 * for something that has just gone wrong and cannot wait.
 */
export type AlertLiveness = "off" | "polite" | "assertive";

const LIVE_ROLE: Record<AlertLiveness, string | undefined> = {
  off: undefined,
  polite: "status",
  assertive: "alert",
};

export interface AlertProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  live?: AlertLiveness;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, live = "off", role, ...props }, ref) => (
    <div
      ref={ref}
      // Hard-coded `role="alert"` until 2026-09-25, with no way out: an
      // assertive live region, so a static page notice was read out the
      // moment the page opened, over whatever the visitor was doing
      // (GAP-006). A caller's own `role` still wins.
      role={role ?? LIVE_ROLE[live]}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  ),
);
Alert.displayName = "Alert";

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * The heading level, or `none` for no heading at all.
   *
   * `none` is the default, and what SwiftUI and Compose both do: an alert's
   * title labels a notice, it does not open a section of the document. The web
   * hard-coded `h5`, so a notice inside a page whose sections are `h2` put an
   * `h5` straight after them — a skipped level, which is the `heading-order`
   * failure and reads as a nested subsection that does not exist.
   *
   * Pass a level when the alert really is a region of the page, and pass the
   * level that follows the heading above it.
   */
  level?: 2 | 3 | 4 | 5 | 6 | "none";
}

const AlertTitle = React.forwardRef<HTMLParagraphElement, AlertTitleProps>(
  ({ className, level = "none", ...props }, ref) => {
    const Tag = (level === "none" ? "p" : `h${level}`) as "p";
    return (
      <Tag
        ref={ref}
        className={cn(
          // `text-base` explicitly. The reset makes every heading
          // `font-size: inherit`, and this carried no size at all, so the
          // title came out the size of the surrounding text — and the
          // description below it is `text-sm`. Title and description rendered
          // at the same size, separated only by weight (GAP-007). 16 is what
          // Compose already uses here (titleMedium).
          "mb-1 text-base font-medium leading-none tracking-tight",
          className,
        )}
        {...props}
      />
    );
  },
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
