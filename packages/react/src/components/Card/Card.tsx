import React from "react";
import { cn } from "../../utils";

/**
 * How much room a card gives its content.
 *
 * `default` is 24 on every side, which is the card as the system has always
 * drawn it. `compact` is 16, for a card that is one setting in a column of
 * settings rather than a thing on its own — Pointr Cloud's SDK Configuration
 * asked for it and had no way to say so, so the only route was a caller
 * passing `className="p-4"`, which overrides the component's own class from
 * outside and only exists on the web (GAP-034).
 *
 * It lives on `Card` and reaches the parts through context, because a caller
 * setting it on the card and not on its header would get a card padded two
 * different amounts — which is the bug, not the fix.
 */
export type CardPadding = "default" | "compact";

const PADDING: Record<CardPadding, { all: string; sides: string }> = {
  default: { all: "p-6", sides: "px-6 pb-6" },
  compact: { all: "p-4", sides: "px-4 pb-4" },
};

const CardPaddingContext = React.createContext<CardPadding>("default");

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = "default", ...props }, ref) => (
    <CardPaddingContext.Provider value={padding}>
      <div
        ref={ref}
        data-padding={padding}
        className={cn(
          "rounded-container border bg-card text-card-foreground shadow-raised",
          className,
        )}
        {...props}
      />
    </CardPaddingContext.Provider>
  ),
);
Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * What acts on the card, at the header's inline end (GAP-169): an edit
   * IconButton beside the site's name, a menu. The title and description
   * keep the room before it, and the actions are centred on the title's
   * line: at the left in right to left.
   */
  actions?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, actions, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        actions ? "kozmos-card-header" : "flex flex-col space-y-1.5",
        PADDING[React.useContext(CardPaddingContext)].all,
        className,
      )}
      {...props}
    >
      {actions ? (
        <>
          <div className="kozmos-card-header-text">{children}</div>
          <div
            data-slot="card-header-actions"
            className="kozmos-card-header-actions"
          >
            {actions}
          </div>
        </>
      ) : (
        children
      )}
    </div>
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // Sides and bottom only: a header above has already paid the top.
    className={cn(
      PADDING[React.useContext(CardPaddingContext)].sides,
      className,
    )}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center",
      PADDING[React.useContext(CardPaddingContext)].sides,
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
