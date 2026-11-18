import React from "react";
import { cn } from "../../utils";

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

export interface SpriteCell {
  x: number;
  y: number;
  width: number;
  height: number;
  pixelRatio?: number;
}

export interface SpriteAtlas {
  /** The atlas image's URL, matching the index's scale. */
  image: string;
  /** The atlas image's size in its own pixels. */
  width: number;
  height: number;
  cells: Record<string, SpriteCell>;
}

/** MapLibre's suffix for a screen's pixel ratio: `@2x` at 2 and above. */
export function spriteSuffix(pixelRatio: number) {
  return pixelRatio >= 2 ? "@2x" : "";
}

/**
 * Where a cell is drawn in a `size` box, in CSS pixels: scaled to fit with
 * its aspect ratio kept, centred, and the atlas's background size and offset
 * that show just that cell.
 */
export function spriteCellLayout(
  atlas: Pick<SpriteAtlas, "width" | "height">,
  cell: SpriteCell,
  size: number,
) {
  const scale = size / Math.max(cell.width, cell.height);
  return {
    width: cell.width * scale,
    height: cell.height * scale,
    backgroundSize: `${atlas.width * scale}px ${atlas.height * scale}px`,
    backgroundPosition: `${-cell.x * scale}px ${-cell.y * scale}px`,
  };
}

const atlases = new Map<string, Promise<SpriteAtlas | null>>();

/** Reads an atlas once per URL and scale; null when it cannot be read. */
export function loadSpriteAtlas(base: string, suffix: string) {
  const key = `${base}${suffix}`;
  let pending = atlases.get(key);
  if (!pending) {
    const image = `${key}.png`;
    pending = Promise.all([
      fetch(`${key}.json`).then((response) =>
        response.ok ? (response.json() as Promise<SpriteAtlas["cells"]>) : null,
      ),
      new Promise<{ width: number; height: number } | null>((resolve) => {
        const img = new Image();
        img.onload = () =>
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve(null);
        img.src = image;
      }),
    ])
      .then(([cells, dimensions]) =>
        cells && dimensions ? { image, cells, ...dimensions } : null,
      )
      .catch(() => null);
    atlases.set(key, pending);
  }
  return pending;
}

function screenPixelRatio() {
  return typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
}

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
        className={cn(
          "inline-flex shrink-0 items-center justify-center",
          className,
        )}
        data-slot="sprite-icon"
        data-state={layout ? "drawn" : "empty"}
        style={{ width: size, height: size, ...style }}
        {...props}
      >
        {layout && atlas ? (
          <span
            data-slot="sprite-icon-cell"
            style={{
              display: "block",
              width: layout.width,
              height: layout.height,
              backgroundImage: `url("${atlas.image}")`,
              backgroundRepeat: "no-repeat",
              backgroundSize: layout.backgroundSize,
              backgroundPosition: layout.backgroundPosition,
            }}
          />
        ) : null}
      </span>
    );
  },
);

SpriteIcon.displayName = "SpriteIcon";
