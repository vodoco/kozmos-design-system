import React from "react";
import { cn } from "../../utils";

// A persona's colour mark (GAP-106, decision 132): a small diamond in the
// persona's colour, as Pointr Cloud marks each persona in its Map Persona
// Visibility list, and, in a group, each persona a tree row is visible to.
//
// The colour is product data, the persona's own (Cloud's Customer is
// #FF9800), so it is taken as given, as CategoryTile takes a category's tint:
// a CSS colour set on --kozmos-persona-color, never mapped to a token. The
// shape is the owned .kozmos-persona-mark rule's: 12 by 12, a square turned an
// eighth, its points on the box's edges. In forced colours, where the page's
// own colours replace the product's, it is drawn in CanvasText, so the shape
// survives and nothing reads it by colour alone: beside its name the mark is
// decoration, hidden from assistive technology, and standing alone it is an
// image named by the persona.

/** The diamond: its points on the 12 box's edge midpoints. */
const DIAMOND = "M6 0 12 6 6 12 0 6Z";

function Diamond() {
  return (
    <svg
      aria-hidden="true"
      className="kozmos-persona-mark-shape"
      focusable="false"
      viewBox="0 0 12 12"
    >
      <path d={DIAMOND} />
    </svg>
  );
}

export interface PersonaMarkProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "color" | "children"
> {
  /**
   * The persona's colour, as the product holds it: any CSS colour, such as
   * `"#FF9800"`. Drawn as given, in both themes.
   */
  color: string;
  /**
   * The persona's name, for a mark that stands alone: it is then an image
   * named by it. Leave it out when the name is shown beside the mark, as in a
   * Checkbox's label: the mark is then hidden from assistive technology, so
   * the name is not read twice.
   */
  name?: string;
}

const PersonaMark = React.forwardRef<HTMLSpanElement, PersonaMarkProps>(
  ({ className, color, name, style, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("kozmos-persona-mark", className)}
      style={
        { "--kozmos-persona-color": color, ...style } as React.CSSProperties
      }
      {...(name
        ? { role: "img", "aria-label": name }
        : { "aria-hidden": true })}
      {...props}
    >
      <Diamond />
    </span>
  ),
);
PersonaMark.displayName = "PersonaMark";

/** One persona in a group: its name and its colour. */
export interface PersonaMarkPersona {
  name: string;
  color: string;
}

export interface PersonaMarkGroupProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /** The personas, each drawn as its mark, in this order. */
  personas: readonly PersonaMarkPersona[];
  /**
   * What the group is, read before the personas' names: "Assigned personas:
   * Customer, Visitor". English by default; pass the product's own words.
   */
  label?: string;
}

/**
 * The personas something is visible to, as a row of marks 2 apart: a tree
 * row's "Assigned personas". One image to assistive technology, named by
 * `label` and every persona's name. With no persona it draws nothing.
 */
const PersonaMarkGroup = React.forwardRef<
  HTMLSpanElement,
  PersonaMarkGroupProps
>(({ className, personas, label = "Assigned personas", ...props }, ref) => {
  if (personas.length === 0) return null;
  return (
    <span
      ref={ref}
      aria-label={`${label}: ${personas.map((persona) => persona.name).join(", ")}`}
      className={cn("kozmos-persona-marks", className)}
      role="img"
      {...props}
    >
      {personas.map((persona, index) => (
        <PersonaMark key={`${index}-${persona.name}`} color={persona.color} />
      ))}
    </span>
  );
});
PersonaMarkGroup.displayName = "PersonaMarkGroup";

export { PersonaMark, PersonaMarkGroup };
