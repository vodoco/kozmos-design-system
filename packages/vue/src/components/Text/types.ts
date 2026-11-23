/**
 * Text's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a size, weight, alignment or colour added there fails the
 * typecheck here.
 */
export type KozmosTextSize =
  | "xs"
  | "sm"
  | "base"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "display";

export type KozmosTextWeight = "normal" | "medium" | "semibold" | "bold";

export type KozmosTextAlign =
  | "start"
  | "end"
  | "left"
  | "center"
  | "right"
  | "justify";

export type KozmosTextColor =
  | "default"
  | "muted"
  | "primary"
  | "destructive"
  | "white";

/** The tags a Text may draw as; `p` by default. */
export type KozmosTextTag =
  | "span"
  | "p"
  | "div"
  | "label"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";
