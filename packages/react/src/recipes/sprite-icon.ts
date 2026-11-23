/**
 * SpriteIcon's recipe: one cell of a published MapLibre sprite atlas, drawn
 * as published (GAP-150, decisions 86 and 219), for every framework that
 * draws one. React's `SpriteIcon` and Vue's `KozmosSpriteIcon` both read the
 * atlas and lay the cell out from it. Framework-free
 * (`recipes.framework-free.test.ts`): it reads the atlas with the browser's
 * own `fetch` and `Image`.
 */

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

/** The sizes a SpriteIcon's square box comes in. */
export type SpriteIconSize = 16 | 20 | 24;

/** The box a cell is drawn in. */
export const SPRITE_ICON_CLASS =
  "inline-flex shrink-0 items-center justify-center";

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

/** The drawn cell's style: just that cell of the atlas, at its laid-out size. */
export function spriteCellStyle(
  atlas: Pick<SpriteAtlas, "image">,
  layout: ReturnType<typeof spriteCellLayout>,
) {
  return {
    display: "block",
    width: `${layout.width}px`,
    height: `${layout.height}px`,
    backgroundImage: `url("${atlas.image}")`,
    backgroundRepeat: "no-repeat",
    backgroundSize: layout.backgroundSize,
    backgroundPosition: layout.backgroundPosition,
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

/** The screen's pixel ratio: 1 where there is no window (a server render). */
export function screenPixelRatio() {
  return typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
}
