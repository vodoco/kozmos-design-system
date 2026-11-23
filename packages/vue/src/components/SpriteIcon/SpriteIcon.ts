import {
  defineComponent,
  h,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
  type PropType,
  type SlotsType,
  type StyleValue,
} from "vue";
import {
  cn,
  loadSpriteAtlas,
  screenPixelRatio,
  SPRITE_ICON_CLASS,
  spriteCellLayout,
  spriteCellStyle,
  spriteSuffix,
  type SpriteAtlas,
} from "#kozmos-recipes";
import type { KozmosSpriteIconSize } from "./types";

/**
 * Vue's counterpart of React's SpriteIcon: one cell of a published MapLibre
 * sprite atlas, drawn as published (GAP-150, decisions 86 and 219), the
 * `<span>` React's draws from the same recipe: a taxonomy type's full-colour
 * bubble, its glyph and its marker dot, scaled to 16, 20 or 24 with its
 * aspect ratio kept. No tint, no recolouring. The product passes the atlas's
 * version-pinned base URL as `sprite` (`.json` and `.png` are added, `@2x`
 * on a 2x screen); Kozmos names no version. Named by `label`, it is an
 * image; otherwise it is decoration. Until the atlas is read, and for a
 * name it does not have, the box is empty.
 */
export const KozmosSpriteIcon = defineComponent({
  name: "KozmosSpriteIcon",
  inheritAttrs: false,
  props: {
    /**
     * The atlas's base URL, to which MapLibre's suffixes are added: `.json`
     * and `.png`, or `@2x.json` and `@2x.png` on a 2x screen. For example
     * `https://mapscdn.pointr.tech/sprite/10.17.0/light/sprite`.
     */
    sprite: { type: String, required: true },
    /** The cell's name in the atlas's index, such as a taxonomy subType. */
    name: { type: String, required: true },
    /** The box the cell is drawn in, square. 24 by default. */
    size: { type: Number as PropType<KozmosSpriteIconSize>, default: 24 },
    /** Names the icon for assistive technology; without it the icon is decorative. */
    label: { type: String, default: undefined },
  },
  // It takes no content: React's takes no children. `{}` is how the
  // contract reads "no slots" (read-contract.ts); a record type reads untyped.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  slots: Object as SlotsType<{}>,
  setup(props, { attrs }) {
    // Read in the browser only, as React's effect reads it: a server render
    // draws the empty box.
    const atlas = shallowRef<SpriteAtlas | null>(null);
    let reading = 0;
    const read = () => {
      const mine = ++reading;
      atlas.value = null;
      void loadSpriteAtlas(props.sprite, spriteSuffix(screenPixelRatio())).then(
        (loaded) => {
          if (mine === reading) atlas.value = loaded;
        },
      );
    };
    onMounted(() => {
      read();
      watch(() => props.sprite, read);
    });
    onBeforeUnmount(() => {
      reading++;
    });

    return () => {
      const { class: className, style, ...rest } = attrs;
      const cell = atlas.value?.cells[props.name];
      const layout =
        atlas.value && cell
          ? spriteCellLayout(atlas.value, cell, props.size)
          : null;
      return h(
        "span",
        {
          // Named, it is an image; otherwise it is decoration.
          role: props.label ? "img" : undefined,
          "aria-label": props.label,
          "aria-hidden": props.label ? undefined : "true",
          class: cn(SPRITE_ICON_CLASS, normalizeClass(className)),
          "data-slot": "sprite-icon",
          "data-state": layout ? "drawn" : "empty",
          style: [
            { width: `${props.size}px`, height: `${props.size}px` },
            style as StyleValue,
          ],
          ...rest,
        },
        layout && atlas.value
          ? [
              h("span", {
                "data-slot": "sprite-icon-cell",
                style: spriteCellStyle(atlas.value, layout),
              }),
            ]
          : undefined,
      );
    };
  },
});
