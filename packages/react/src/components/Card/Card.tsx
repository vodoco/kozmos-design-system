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

/**
 * `lead` is the top a part pays when it is the card's first child.
 *
 * CardContent and CardFooter pad their sides and bottom only, as a header
 * above has already paid the top. With no header, content (or a footer) was
 * the card's first child and touched its top edge (GAP-194). The card now
 * sets the top on whichever box is its own first child, as a custom
 * property, and the part reads it as its own `pt-*`: so a header-led card is
 * drawn as before, a part inside a wrapper (a form) is not the card's first
 * child and is left alone, and a caller's own `p-*`, `py-*` or `pt-*` on the
 * part still wins, through tailwind-merge, as it does for the sides.
 */
const PADDING: Record<
  CardPadding,
  { all: string; sides: string; lead: string }
> = {
  default: {
    all: "p-6",
    sides: "px-6 pb-6",
    lead: "[&>:first-child]:[--kozmos-card-lead:1.5rem]",
  },
  compact: {
    all: "p-4",
    sides: "px-4 pb-4",
    lead: "[&>:first-child]:[--kozmos-card-lead:1rem]",
  },
};

/** A part's own top: none, unless the card says it is its first child. Its
 * own `0px` keeps a part in a nested card, or under a wrapper, from
 * inheriting the top of an outer one. */
const LEAD = "[--kozmos-card-lead:0px] pt-[var(--kozmos-card-lead)]";

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
        // kozmos-card: an opaque card of its own, on glass too (site GAP-94).
        className={cn(
          "kozmos-card rounded-container border bg-card text-card-foreground shadow-raised",
          PADDING[padding].lead,
          className,
        )}
        {...props}
      />
    </CardPaddingContext.Provider>
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      PADDING[React.useContext(CardPaddingContext)].all,
      className,
    )}
    {...props}
  />
));
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
    // Sides and bottom, and the top only as the card's first child: a header
    // above has already paid it (GAP-194).
    className={cn(
      PADDING[React.useContext(CardPaddingContext)].sides,
      LEAD,
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
    // As CardContent: the top only as the card's first child (GAP-194).
    className={cn(
      "flex items-center",
      PADDING[React.useContext(CardPaddingContext)].sides,
      LEAD,
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
