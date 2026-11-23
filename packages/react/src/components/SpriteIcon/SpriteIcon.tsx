import React from "react";
import { cn } from "../../utils";
import {
  loadSpriteAtlas,
  screenPixelRatio,
  SPRITE_ICON_CLASS,
  spriteCellLayout,
  spriteCellStyle,
  spriteSuffix,
  type SpriteAtlas,
} from "../../recipes/sprite-icon";

/**
 * One cell of a published MapLibre sprite atlas, drawn as published (GAP-150,
 * decisions 86 and 219): a taxonomy type's full-colour bubble, its glyph and
 * its marker dot, scaled to 16, 20 or 24 with its aspect ratio kept. No tint,
 * no recolouring. The product passes the atlas's version-pinned base URL;
 * Kozmos names no version.
 */
export interface SpriteIconProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /**
   * The atlas's base URL, to which MapLibre's suffixes are added: `.json`
   * and `.png`, or `@2x.json` and `@2x.png` on a 2x screen. For example
   * `https://mapscdn.pointr.tech/sprite/10.17.0/light/sprite`.
   */
  sprite: string;
  /** The cell's name in the atlas's index, such as a taxonomy subType. */
  name: string;
  /** The box the cell is drawn in, square. 24 by default. */
  size?: 16 | 20 | 24;
  /** Names the icon for assistive technology; without it the icon is decorative. */
  label?: string;
}

// The atlas's reading and the cell's layout are shared with Vue's
// KozmosSpriteIcon (recipes/sprite-icon.ts).
export {
  loadSpriteAtlas,
  spriteCellLayout,
  spriteSuffix,
  type SpriteAtlas,
  type SpriteCell,
} from "../../recipes/sprite-icon";

export const SpriteIcon = React.forwardRef<HTMLSpanElement, SpriteIconProps>(
  ({ className, label, name, size = 24, sprite, style, ...props }, ref) => {
    const [atlas, setAtlas] = React.useState<SpriteAtlas | null>(null);
    const suffix = spriteSuffix(screenPixelRatio());

    React.useEffect(() => {
      let current = true;
      setAtlas(null);
      void loadSpriteAtlas(sprite, suffix).then((loaded) => {
        if (current) setAtlas(loaded);
      });
      return () => {
        current = false;
      };
    }, [sprite, suffix]);

    const cell = atlas?.cells[name];
    const layout = atlas && cell ? spriteCellLayout(atlas, cell, size) : null;

    return (
      <span
        ref={ref}
        // Named, it is an image; otherwise it is decoration.
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={cn(SPRITE_ICON_CLASS, className)}
        data-slot="sprite-icon"
        data-state={layout ? "drawn" : "empty"}
        style={{ width: size, height: size, ...style }}
        {...props}
      >
        {layout && atlas ? (
          <span
            data-slot="sprite-icon-cell"
            style={spriteCellStyle(atlas, layout)}
          />
        ) : null}
      </span>
    );
  },
);

SpriteIcon.displayName = "SpriteIcon";
