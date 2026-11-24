// Card's recipe: the classes a Kozmos card and its parts draw with, for every
// framework that draws one. React's `Card`, `CardHeader`, `CardTitle`,
// `CardDescription`, `CardContent` and `CardFooter`, and Vue's `KozmosCard…`
// parts, all build their elements from it. Framework-free
// (`recipes.framework-free.test.ts`).

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
export const CARD_PADDING: Record<
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
export const CARD_LEAD =
  "[--kozmos-card-lead:0px] pt-[var(--kozmos-card-lead)]";

/** The card's own box. kozmos-card: an opaque card of its own, on glass too
 * (site GAP-94). */
export const CARD_CLASS =
  "kozmos-card rounded-container border bg-card text-card-foreground shadow-raised";

/**
 * How a CardHeader is drawn. `default` is the header as it always was, on
 * the card's own surface. `subtle` is Pointr Cloud's form panel header
 * (CLOUD-UI-001, GAP-169; decisions 135 and 139): a pale theme strip, theme
 * 0, full-bleed to the card's edges and inside its top corners, at least 52
 * tall, and its title 14 unless the title says otherwise.
 */
export type CardHeaderTone = "default" | "subtle";

/**
 * A CardHeader's classes, before a caller's: a flex column of its title and
 * description, or with `actions` the header's row of text and actions.
 */
export function cardHeaderClasses(
  padding: CardPadding,
  tone: CardHeaderTone,
  hasActions: boolean,
) {
  const room = CARD_PADDING[padding];
  return [
    hasActions ? "kozmos-card-header" : "flex flex-col space-y-1.5",
    room.all,
    // The strip's block padding is its own, 12, so a 14 title sits in
    // its 52; its sides stay the card's. Below the tint it keeps the
    // card's padding, as a header's own bottom padding does, so the
    // content under it starts where it starts under any header.
    tone === "subtle" && ["kozmos-card-header-subtle py-3", room.below],
  ];
}

/** The header's text, before its actions, when it has actions. */
export const CARD_HEADER_TEXT_CLASS = "kozmos-card-header-text";
/** The header's actions, at its inline end. */
export const CARD_HEADER_ACTIONS_CLASS = "kozmos-card-header-actions";

/**
 * CardTitle's size (GAP-035, decision 132; the owner's ruling of 9 Nov).
 * `lg` is 24, the default, the card's title as it always was; `md` is 18,
 * for a compact card on a phone or a dashboard's section card; `sm` is 14,
 * the subtle header strip's title (decision 139), as `sm` is 14 on Text.
 * The weight, the tight tracking and the one-line leading stay at every
 * size.
 */
export type CardTitleSize = "lg" | "md" | "sm";

export const CARD_TITLE_SIZE: Record<CardTitleSize, string> = {
  lg: "text-2xl",
  md: "text-lg",
  sm: "text-sm",
};

/** The title's size as drawn: its own, else `sm` in a subtle header, else `lg`. */
export function cardTitleDrawnSize(
  size: CardTitleSize | undefined,
  tone: CardHeaderTone,
): CardTitleSize {
  return size ?? (tone === "subtle" ? "sm" : "lg");
}

/** The title's classes after its size. */
export const CARD_TITLE_CLASS = "font-semibold leading-none tracking-tight";

export const CARD_DESCRIPTION_CLASS = "text-sm text-muted-foreground";

/** CardFooter's own classes, before its padding. */
export const CARD_FOOTER_CLASS = "flex items-center";
