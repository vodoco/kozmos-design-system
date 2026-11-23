import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
} from "vue";
import {
  getIconComponent,
  type KozmosIconComponent,
  type KozmosIconKey,
} from "@kozmos-ds/icons/vue";
import { cn, iconAriaHidden, iconVariants } from "#kozmos-recipes";
import type { KozmosIconColor, KozmosIconSize } from "./types";

/**
 * Vue's counterpart of React's Icon: a glyph from `@kozmos-ds/icons`, drawn
 * as the `<svg>` React's draws, sized and coloured from the same recipe
 * (`iconVariants`). Name it by its registry key (`name="home-line"`), or
 * hand it an icon component from `@kozmos-ds/icons/vue` (`:icon="Settings01"`),
 * where React's takes the React entry's. It is decoration, hidden from
 * assistive technology, unless `aria-label` or `aria-labelledby` names it.
 * A name the registry does not have draws nothing.
 */
export const KozmosIcon = defineComponent({
  name: "KozmosIcon",
  inheritAttrs: false,
  props: {
    icon: {
      type: [Object, Function] as PropType<KozmosIconComponent>,
      default: undefined,
    },
    name: { type: String as PropType<KozmosIconKey>, default: undefined },
    absoluteStrokeWidth: { type: Boolean, default: undefined },
    color: { type: String as PropType<KozmosIconColor>, default: undefined },
    size: { type: String as PropType<KozmosIconSize>, default: undefined },
  },
  // It takes no content: React's takes no children. `{}` is how the
  // contract reads "no slots" (read-contract.ts); a record type reads untyped.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  slots: Object as SlotsType<{}>,
  setup(props, { attrs }) {
    return () => {
      const Glyph =
        props.icon ?? (props.name ? getIconComponent(props.name) : undefined);
      if (!Glyph) return null;
      const { class: className, ...rest } = attrs;
      return h(Glyph, {
        "aria-hidden": iconAriaHidden(
          attrs["aria-label"],
          attrs["aria-labelledby"],
        ),
        class: cn(
          iconVariants({
            size: props.size,
            color: props.color,
            className: normalizeClass(className),
          }),
        ),
        ...(props.absoluteStrokeWidth === undefined
          ? {}
          : { absoluteStrokeWidth: props.absoluteStrokeWidth }),
        ...rest,
      });
    };
  },
});
