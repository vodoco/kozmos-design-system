import * as React from "react";
import { cn } from "../../utils";
import { Text } from "../Text";

/**
 * The density a surrounding slot asks for.
 *
 * A slot that already draws a padded box around its child knows the child
 * should not pad itself again; the product placing an EmptyState there does
 * not, and would have no reason to look. So the slot says so, and an explicit
 * `size` on the component still wins.
 */
const EmptyStateDensityContext = React.createContext<
  "default" | "compact" | undefined
>(undefined);

/** Used by slots that draw their own box — see `POIResultList`. */
export const EmptyStateDensity = EmptyStateDensityContext.Provider;

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /**
   * How much room it takes.
   *
   * `default` fills its region and pads itself by 32, which is right when the
   * empty state IS the screen. `compact` is for a slot that already draws a
   * box around it — a result list's empty slot, a card, a panel section.
   *
   * Measured on the MAP-474 boards: a no-result state with an icon came to
   * 258px inside `POIResultList`, of which 48 was the slot's own padding
   * (removed 2026-09-25) and 64 this component's. `compact` brings the same
   * content to about 150 (GAP-009).
   */
  size?: "default" | "compact";
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, size, ...props }, ref) => {
    const fromSlot = React.useContext(EmptyStateDensityContext);
    const resolved = size ?? fromSlot ?? "default";
    // Every compact class is layered AFTER the default one and resolved by
    // tailwind-merge, so the default strings stay whole — `w-16 h-16
    // rounded-pill bg-muted` is asserted verbatim as the Figma geometry by
    // `pnpm components:contract:check`, and splitting it into a conditional
    // broke that check the first time this prop was written.
    const compact = resolved === "compact";
    return (
      <div
        ref={ref}
        data-size={resolved}
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center h-full w-full",
          compact && "h-auto p-4",
          className,
        )}
        {...props}
      >
        {icon && (
          <div
            className={cn(
              "mb-4 flex items-center justify-center text-muted-foreground w-16 h-16 rounded-pill bg-muted",
              compact && "mb-2 h-10 w-10",
            )}
          >
            {icon}
          </div>
        )}
        {/* align="center" on both, explicitly: Text aligns from the start, and
          a block that centres itself does not centre the text inside it. The
          description wrapped to two lines and the second sat against the
          leading edge. */}
        <Text
          align="center"
          size="base"
          weight="medium"
          className={cn("mb-1 text-foreground", compact && "mb-0.5")}
        >
          {title}
        </Text>
        {description && (
          <Text
            align="center"
            size="sm"
            className={cn(
              "mb-4 text-muted-foreground max-w-[280px]",
              compact && "mb-0",
            )}
          >
            {description}
          </Text>
        )}
        {action && <div className={cn(compact && "mt-3")}>{action}</div>}
      </div>
    );
  },
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
