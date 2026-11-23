/**
 * Heading's recipe: the Text size and the tag each heading level draws
 * with, for every framework that draws one. React's `Heading` and Vue's
 * `KozmosHeading` both draw a bold Text from it. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Each level's Text size: H1 the largest, H6 the body's. */
export const headingSizes = {
  1: "4xl",
  2: "3xl",
  3: "2xl",
  4: "xl",
  5: "lg",
  6: "base",
} as const;

/** Each level's tag. */
export const headingTags = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;
