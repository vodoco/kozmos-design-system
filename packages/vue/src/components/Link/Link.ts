import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { LinkExternal01 } from "@kozmos-ds/icons/vue";
import {
  cn,
  LINK_EXTERNAL_CLASS,
  LINK_EXTERNAL_ICON_CLASS,
  LINK_EXTERNAL_JOINER,
  LINK_EXTERNAL_LABEL_CLASS,
  LINK_NEW_TAB_REL,
  LINK_NEW_TAB_TARGET,
  linkClasses,
  linkOpensNewTab,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";

/**
 * Vue's counterpart of React's Link: the `<a>` React's draws, from the same
 * recipe (`recipes/link.ts`), in the theme's colour or, `subtle`, muted.
 *
 * `external` opens it in a new tab (GAP-202, decision 122): `target="_blank"`
 * and `rel="noopener noreferrer"`, an app's own `target` and `rel` still
 * winning; the new-tab icon at its inline end, which never wraps onto a line
 * of its own; and `external-label`, read after its name ("opens in a new
 * tab" unless the product gives its own words). An app's `target` that keeps
 * it in this tab opens no new tab, and adds none of these. A bare `external`
 * in a template is true.
 *
 * Each click is reported to the nearest KozmosAnalyticsProvider as
 * `link_clicked`, with its `href`, before the click's own listeners run, as
 * React's Link reports it.
 */
export const KozmosLink = defineComponent({
  name: "KozmosLink",
  inheritAttrs: false,
  props: {
    variant: {
      type: String as PropType<"default" | "subtle">,
      default: "default",
    },
    external: { type: Boolean, default: false },
    externalLabel: { type: String, default: "opens in a new tab" },
  },
  /** The link's name, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const { trackEvent } = useKozmosAnalytics();
    return () => {
      const {
        class: className,
        href,
        target,
        rel,
        onClick,
        ...rest
      } = attrs as Record<string, unknown> & {
        href?: string;
        target?: string;
        rel?: string;
      };
      const newTab = linkOpensNewTab(props.external, target);
      const track = () => trackEvent("Link", "link_clicked", { href });
      return h(
        "a",
        {
          href,
          target: target ?? (newTab ? LINK_NEW_TAB_TARGET : undefined),
          rel: rel ?? (newTab ? LINK_NEW_TAB_REL : undefined),
          onClick: onClick ? [track, onClick] : track,
          class: cn(...linkClasses(props.variant), normalizeClass(className)),
          ...rest,
        },
        [
          slots.default?.(),
          newTab
            ? h("span", { class: LINK_EXTERNAL_CLASS }, [
                LINK_EXTERNAL_JOINER,
                h(LinkExternal01, {
                  "aria-hidden": "true",
                  size: "1em",
                  class: LINK_EXTERNAL_ICON_CLASS,
                }),
                props.externalLabel
                  ? h(
                      "span",
                      { class: LINK_EXTERNAL_LABEL_CLASS },
                      props.externalLabel,
                    )
                  : null,
              ])
            : null,
        ],
      );
    };
  },
});
