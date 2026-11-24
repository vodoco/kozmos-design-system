import {
  defineComponent,
  h,
  normalizeClass,
  type SlotsType,
  type VNode,
} from "vue";
import { Slot } from "reka-ui";
import {
  ChevronRight,
  DotsHorizontal as MoreHorizontal,
} from "@kozmos-ds/icons/vue";
import {
  BREADCRUMB_ELLIPSIS_CLASS,
  BREADCRUMB_ELLIPSIS_ICON_CLASS,
  BREADCRUMB_ELLIPSIS_LABEL_CLASS,
  BREADCRUMB_ITEM_CLASS,
  BREADCRUMB_LINK_CLASS,
  BREADCRUMB_LIST_CLASS,
  BREADCRUMB_PAGE_CLASS,
  BREADCRUMB_SEPARATOR_CLASS,
  BREADCRUMB_SEPARATOR_ICON_CLASS,
  cn,
} from "#kozmos-recipes";

/** A part that is one element with the recipe's class, as React's are. */
const element = (name: string, tag: string, recipe: string) =>
  defineComponent({
    name,
    inheritAttrs: false,
    /** Its content, as React's `children`. */
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(_props, { attrs, slots }) {
      return () => {
        const { class: className, ...rest } = attrs;
        return h(
          tag,
          { class: cn(recipe, normalizeClass(className)), ...rest },
          slots.default?.(),
        );
      };
    },
  });

/**
 * Vue's counterpart of React's Breadcrumb: the `<nav>` named "breadcrumb"
 * that holds a KozmosBreadcrumbList. An app's `aria-label` replaces the name,
 * as in React. React's Breadcrumb takes a `separator` it never draws; the
 * slot is taken and ignored here alike: give each KozmosBreadcrumbSeparator
 * its own.
 */
export const KozmosBreadcrumb = defineComponent({
  name: "KozmosBreadcrumb",
  inheritAttrs: false,
  slots: Object as SlotsType<{
    /** Taken and never drawn, as React's `separator` is. */
    separator?: () => VNode[];
    /** The list, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(_props, { attrs, slots }) {
    return () =>
      h("nav", { "aria-label": "breadcrumb", ...attrs }, slots.default?.());
  },
});

/** Vue's counterpart of React's BreadcrumbList: the `<ol>` of the trail. */
export const KozmosBreadcrumbList = element(
  "KozmosBreadcrumbList",
  "ol",
  BREADCRUMB_LIST_CLASS,
);

/** Vue's counterpart of React's BreadcrumbItem: one place, an `<li>`. */
export const KozmosBreadcrumbItem = element(
  "KozmosBreadcrumbItem",
  "li",
  BREADCRUMB_ITEM_CLASS,
);

/**
 * Vue's counterpart of React's BreadcrumbLink: an `<a>` to a place on the
 * way. `as-child` draws the recipe on the one child instead (a router's
 * link), as Radix's Slot does in React.
 */
export const KozmosBreadcrumbLink = defineComponent({
  name: "KozmosBreadcrumbLink",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  /** The place's name, or with `as-child` the element to draw as the link. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      const own = {
        class: cn(BREADCRUMB_LINK_CLASS, normalizeClass(className)),
        ...rest,
      };
      return props.asChild
        ? h(Slot, own, slots.default)
        : h("a", own, slots.default?.());
    };
  },
});

/**
 * Vue's counterpart of React's BreadcrumbPage: the page the trail ends on,
 * not a link, said as the current page.
 */
export const KozmosBreadcrumbPage = defineComponent({
  name: "KozmosBreadcrumbPage",
  inheritAttrs: false,
  /** The page's name, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "span",
        {
          role: "link",
          "aria-disabled": "true",
          "aria-current": "page",
          class: cn(BREADCRUMB_PAGE_CLASS, normalizeClass(className)),
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});

/**
 * Vue's counterpart of React's BreadcrumbSeparator: an `<li>` hidden from
 * assistive technology between two places, drawing a chevron, mirrored right
 * to left, unless its slot draws another mark.
 */
export const KozmosBreadcrumbSeparator = defineComponent({
  name: "KozmosBreadcrumbSeparator",
  inheritAttrs: false,
  /** Another mark, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "li",
        {
          role: "presentation",
          "aria-hidden": "true",
          class: cn(BREADCRUMB_SEPARATOR_CLASS, normalizeClass(className)),
          ...rest,
        },
        slots.default?.() ?? [
          h(ChevronRight, { class: BREADCRUMB_SEPARATOR_ICON_CLASS }),
        ],
      );
    };
  },
});

/**
 * Vue's counterpart of React's BreadcrumbEllipsis: the places a long trail
 * leaves out, drawn as three dots and hidden from assistive technology, as
 * React's is.
 */
export const KozmosBreadcrumbEllipsis = defineComponent({
  name: "KozmosBreadcrumbEllipsis",
  inheritAttrs: false,
  slots: Object as SlotsType<{
    /**
     * Taken and never drawn, as React's `children` is: React's draws its own
     * dots and words over them.
     */
    default?: () => VNode[];
  }>,
  setup(_props, { attrs }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "span",
        {
          role: "presentation",
          "aria-hidden": "true",
          class: cn(BREADCRUMB_ELLIPSIS_CLASS, normalizeClass(className)),
          ...rest,
        },
        [
          h(MoreHorizontal, { class: BREADCRUMB_ELLIPSIS_ICON_CLASS }),
          h("span", { class: BREADCRUMB_ELLIPSIS_LABEL_CLASS }, "More"),
        ],
      );
    };
  },
});
