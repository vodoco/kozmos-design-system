import React from "react";
import { cn } from "../../utils";
import {
  CARD_CLASS,
  CARD_DESCRIPTION_CLASS,
  CARD_FOOTER_CLASS,
  CARD_HEADER_ACTIONS_CLASS,
  CARD_HEADER_TEXT_CLASS,
  CARD_LEAD,
  CARD_PADDING,
  CARD_TITLE_CLASS,
  CARD_TITLE_SIZE,
  cardHeaderClasses,
  cardTitleDrawnSize,
  type CardHeaderTone,
  type CardPadding,
  type CardTitleSize,
} from "../../recipes/card";

export type { CardHeaderTone, CardPadding, CardTitleSize };

const CardPaddingContext = React.createContext<CardPadding>("default");

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
        className={cn(CARD_CLASS, CARD_PADDING[padding].lead, className)}
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
    const padding = React.useContext(CardPaddingContext);
    return (
      <CardHeaderToneContext.Provider value={tone}>
        <div
          ref={ref}
          data-tone={tone === "subtle" ? tone : undefined}
          className={cn(
            ...cardHeaderClasses(padding, tone, !!actions),
            className,
          )}
          {...props}
        >
          {actions ? (
            <>
              <div className={CARD_HEADER_TEXT_CLASS}>{children}</div>
              <div
                data-slot="card-header-actions"
                className={CARD_HEADER_ACTIONS_CLASS}
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
    const drawn = cardTitleDrawnSize(size, tone);
    return (
      <Tag
        ref={ref}
        data-size={drawn === "lg" ? undefined : drawn}
        className={cn(CARD_TITLE_SIZE[drawn], CARD_TITLE_CLASS, className)}
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
  <p ref={ref} className={cn(CARD_DESCRIPTION_CLASS, className)} {...props} />
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
      CARD_PADDING[React.useContext(CardPaddingContext)].sides,
      CARD_LEAD,
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
      CARD_FOOTER_CLASS,
      CARD_PADDING[React.useContext(CardPaddingContext)].sides,
      CARD_LEAD,
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
