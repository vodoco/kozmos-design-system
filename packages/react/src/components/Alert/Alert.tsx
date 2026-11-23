import React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";
import {
  ALERT_DESCRIPTION_CLASS,
  ALERT_TITLE_CLASS,
  alertVariants,
  type AlertLiveness,
} from "../../recipes/alert";
import { impliedLive, LIVE_ROLES } from "../../recipes/live-region";

export type { AlertLiveness };

export interface AlertProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  live?: AlertLiveness;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, live = "off", role, ...props }, ref) => {
    // Hard-coded `role="alert"` until 2026-09-25, with no way out: an
    // assertive live region, so a static page notice was read out the
    // moment the page opened, over whatever the visitor was doing
    // (GAP-006). A caller's own `role` still wins.
    const resolved = role ?? LIVE_ROLES[live];
    return (
      <div
        ref={ref}
        role={resolved}
        // The role's own liveness, said as well: a Select or Menu open hides
        // every box but those marked aria-live (GAP-193).
        aria-live={impliedLive(resolved)}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      />
    );
  },
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
      <Tag ref={ref} className={cn(ALERT_TITLE_CLASS, className)} {...props} />
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
    className={cn(ALERT_DESCRIPTION_CLASS, className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
