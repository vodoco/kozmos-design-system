import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  cn,
  PAGE_HEADER_ACTIONS_CLASS,
  PAGE_HEADER_BLOCK,
  PAGE_HEADER_BREADCRUMB_CLASS,
  PAGE_HEADER_INFO_CLASS,
  PAGE_HEADER_ROW_CLASS,
  PAGE_HEADER_TEXT_CLASS,
  PAGE_HEADER_TITLE_ADDON_CLASS,
  PAGE_HEADER_TITLE_CLASS,
  pageHeaderClasses,
  pageHeaderTitleLevel,
} from "#kozmos-recipes";
import { KozmosContainer } from "../Container/Container";
import { KozmosHeading } from "../Heading/Heading";
import { KozmosText } from "../Text/Text";
import { drawn } from "../drawn";

/**
 * Vue's counterpart of React's PageHeader (GAP-036, decision 135): a page's
 * breadcrumb, its title (the page's one `h1`) with an addon and an info
 * button beside it, a description and the page's actions, on a tinted band
 * that spans the page (`tone="subtle"`, the default) or on the page's own
 * background (`default`). Its content sits in the Container React's sits in,
 * drawn from Container's recipe, so it lines up with the page under it, 32
 * above and 24 below (GAP-116). The title is Heading 3's size (`md`) or
 * Heading 2's (`lg`), drawn from Text's recipe as React's Heading draws it.
 */
export const KozmosPageHeader = defineComponent({
  name: "KozmosPageHeader",
  inheritAttrs: false,
  props: {
    tone: { type: String as PropType<"subtle" | "default">, default: "subtle" },
    size: { type: String as PropType<"lg" | "md">, default: "md" },
    /** The content's side padding, as Container's `inset`. */
    inset: { type: String as PropType<"window" | "panel">, default: "window" },
    /** Whether the content is centred at Container's widest. */
    centered: { type: Boolean, default: true },
  },
  slots: Object as SlotsType<{
    /** The page's title, as React's `title`: the page's one `h1`. */
    title: () => VNode[];
    /** Above the title: the page's place, a KozmosBreadcrumb. */
    breadcrumb?: () => VNode[];
    /** Beside the title, outside the `h1`: a status Tag (decision 210). */
    titleAddon?: () => VNode[];
    /** Beside the title: a button that says more about the page. */
    info?: () => VNode[];
    /** Under the title, in the muted small text. */
    description?: () => VNode[];
    /** At the end of the title's line: the page's buttons. */
    actions?: () => VNode[];
    /** React's PageHeader takes `children` and draws none; nor does this. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      const breadcrumb = drawn(slots.breadcrumb?.());
      const titleAddon = drawn(slots.titleAddon?.());
      const info = drawn(slots.info?.());
      const description = drawn(slots.description?.());
      const actions = drawn(slots.actions?.());
      return h(
        "div",
        {
          "data-slot": "page-header",
          "data-tone": props.tone,
          "data-size": props.size,
          class: cn(
            ...pageHeaderClasses(props.tone),
            normalizeClass(className),
          ),
          ...rest,
        },
        [
          h(
            KozmosContainer,
            {
              inset: props.inset,
              centered: props.centered,
              block: PAGE_HEADER_BLOCK,
            },
            () => [
              breadcrumb
                ? h(
                    "div",
                    {
                      "data-slot": "page-header-breadcrumb",
                      class: PAGE_HEADER_BREADCRUMB_CLASS,
                    },
                    breadcrumb,
                  )
                : null,
              h("div", { class: PAGE_HEADER_ROW_CLASS }, [
                h("div", { class: PAGE_HEADER_TEXT_CLASS }, [
                  h(
                    "div",
                    {
                      class: PAGE_HEADER_TITLE_CLASS,
                      "data-addon": titleAddon ? "" : undefined,
                    },
                    [
                      h(
                        KozmosHeading,
                        { as: "h1", level: pageHeaderTitleLevel(props.size) },
                        () => slots.title?.(),
                      ),
                      titleAddon
                        ? h(
                            "div",
                            {
                              "data-slot": "page-header-title-addon",
                              class: PAGE_HEADER_TITLE_ADDON_CLASS,
                            },
                            titleAddon,
                          )
                        : null,
                      info
                        ? h(
                            "div",
                            {
                              "data-slot": "page-header-info",
                              class: PAGE_HEADER_INFO_CLASS,
                            },
                            info,
                          )
                        : null,
                    ],
                  ),
                  description
                    ? h(
                        KozmosText,
                        {
                          as: "p",
                          size: "sm",
                          color: "muted",
                          "data-slot": "page-header-description",
                        },
                        () => description,
                      )
                    : null,
                ]),
                actions
                  ? h(
                      "div",
                      {
                        "data-slot": "page-header-actions",
                        class: PAGE_HEADER_ACTIONS_CLASS,
                      },
                      actions,
                    )
                  : null,
              ]),
            ],
          ),
        ],
      );
    };
  },
});
