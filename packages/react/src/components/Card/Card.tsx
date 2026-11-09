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
  { all: string; sides: string; lead: string; below: string }
> = {
  default: {
    all: "p-6",
    sides: "px-6 pb-6",
    lead: "[&>:first-child]:[--kozmos-card-lead:1.5rem]",
    below: "mb-6",
  },
  compact: {
    all: "p-4",
    sides: "px-4 pb-4",
    lead: "[&>:first-child]:[--kozmos-card-lead:1rem]",
    below: "mb-4",
  },
};

/** A part's own top: none, unless the card says it is its first child. Its
 * own `0px` keeps a part in a nested card, or under a wrapper, from
 * inheriting the top of an outer one. */
const LEAD = "[--kozmos-card-lead:0px] pt-[var(--kozmos-card-lead)]";

const CardPaddingContext = React.createContext<CardPadding>("default");

/**
 * How a CardHeader is drawn. `default` is the header as it always was, on
 * the card's own surface. `subtle` is Pointr Cloud's form panel header
 * (CLOUD-UI-001, GAP-169; decisions 135 and 139): a pale theme strip, theme
 * 0, full-bleed to the card's edges and inside its top corners, at least 52
 * tall, and its title 14 unless the title says otherwise.
 */
export type CardHeaderTone = "default" | "subtle";

/**
 * CardTitle's size (GAP-035, decision 132; the owner's ruling of 9 Nov).
 * `lg` is 24, the default, the card's title as it always was; `md` is 18,
 * for a compact card on a phone or a dashboard's section card; `sm` is 14,
 * the subtle header strip's title (decision 139), as `sm` is 14 on Text.
 * The weight, the tight tracking and the one-line leading stay at every
 * size.
 */
export type CardTitleSize = "lg" | "md" | "sm";

const TITLE_SIZE: Record<CardTitleSize, string> = {
  lg: "text-2xl",
  md: "text-lg",
  sm: "text-sm",
};

/** The header's tone, for the title's size inside it. */
const CardHeaderToneContext = React.createContext<CardHeaderTone>("default");

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

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * `subtle` draws the header as a pale theme strip, theme 0, full-bleed
   * inside the card's top corners, at least 52 tall, with its title 14
   * (CLOUD-UI-001; decisions 135 and 139): the form side panel's header.
   * Its sides follow the card's `padding`. `default`, the header on the
   * card's own surface, without it.
   */
  tone?: CardHeaderTone;
  /**
   * What acts on the card, at the header's inline end (GAP-169): an edit
   * IconButton beside the site's name, a menu. The title and description
   * keep the room before it, and the actions are centred on the title's
   * line: at the left in right to left.
   */
  actions?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, actions, tone = "default", children, ...props }, ref) => {
    const padding = PADDING[React.useContext(CardPaddingContext)];
    return (
      <CardHeaderToneContext.Provider value={tone}>
        <div
          ref={ref}
          data-tone={tone === "subtle" ? tone : undefined}
          className={cn(
            actions ? "kozmos-card-header" : "flex flex-col space-y-1.5",
            padding.all,
            // The strip's block padding is its own, 12, so a 14 title sits in
            // its 52; its sides stay the card's. Below the tint it keeps the
            // card's padding, as a header's own bottom padding does, so the
            // content under it starts where it starts under any header.
            tone === "subtle" && [
              "kozmos-card-header-subtle py-3",
              padding.below,
            ],
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
      </CardHeaderToneContext.Provider>
    );
  },
);
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * The heading element the title is, as `Heading` takes it, and `h3`
   * without it. The level follows the page's outline (GAP-205): under a page
   * titled with an `h1`, a card's title is `h2`, or a screen reader's list of
   * headings skips a level. It changes what a screen reader hears, not how
   * the title looks. There is no `h1`: that is the page's own title.
   */
  as?: "h2" | "h3" | "h4" | "h5" | "h6";
  /**
   * How large the title is drawn (GAP-035): `lg` 24, `md` 18 for a
   * compact or dashboard card, `sm` 14. Unset, it is `lg`, and `sm` in a
   * `tone="subtle"` header, the strip's title (decision 139). It changes
   * how the title looks, not its heading level, which is `as`.
   */
  size?: CardTitleSize;
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Tag = "h3", size, className, ...props }, ref) => {
    const tone = React.useContext(CardHeaderToneContext);
    const drawn = size ?? (tone === "subtle" ? "sm" : "lg");
    return (
      <Tag
        ref={ref}
        data-size={drawn === "lg" ? undefined : drawn}
        className={cn(
          TITLE_SIZE[drawn],
          "font-semibold leading-none tracking-tight",
          className,
        )}
        {...props}
      />
    );
  },
);
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
