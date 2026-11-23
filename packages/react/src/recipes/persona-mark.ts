/**
 * PersonaMark's recipe: a persona's diamond and a row of them, for every
 * framework that draws one. React's `PersonaMark` and `PersonaMarkGroup` and
 * Vue's `KozmosPersonaMark` and `KozmosPersonaMarkGroup` build their elements
 * from it. Framework-free (`recipes.framework-free.test.ts`).
 *
 * The colour is product data, the persona's own (Cloud's Customer is
 * #FF9800), so it is taken as given, as CategoryTile takes a category's
 * tint: a CSS colour set on --kozmos-persona-color, never mapped to a token.
 * The shape is the owned .kozmos-persona-mark rule's: 12 by 12, a square
 * turned an eighth, its points on the box's edges.
 */

/** The diamond: its points on the 12 box's edge midpoints. */
export const PERSONA_MARK_DIAMOND = "M6 0 12 6 6 12 0 6Z";

/** The diamond's drawing box. */
export const PERSONA_MARK_VIEWBOX = "0 0 12 12";

/** The mark's elements' classes, and the group's, each a constant. */
export const PERSONA_MARK_CLASS = "kozmos-persona-mark";
export const PERSONA_MARK_SHAPE_CLASS = "kozmos-persona-mark-shape";
export const PERSONA_MARKS_CLASS = "kozmos-persona-marks";

/** The persona's colour, as the property the owned rule reads. */
export const personaMarkVariables = (color: string) => ({
  "--kozmos-persona-color": color,
});

/**
 * What a group is to assistive technology: one image, named by its label
 * and every persona's name, "Assigned personas: Customer, Visitor".
 */
export const personaMarkGroupLabel = (
  label: string,
  personas: readonly { name: string }[],
) => `${label}: ${personas.map((persona) => persona.name).join(", ")}`;
