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
  LIST_CLASS,
  LIST_ITEM_CLASS,
  LIST_ITEM_SELECTED_CLASS,
  LIST_ITEM_SLOT_CLASSES,
  LIST_ITEM_SLOTTED_CLASS,
  LIST_ITEM_STATUS_CLASSES,
  LIST_ITEM_STATUS_LABELS,
  listDensityClasses,
} from "#kozmos-recipes";
import { drawn } from "../drawn";
import { glyph } from "../glyphs";
import type { KozmosListDensity, KozmosListItemStatusValue } from "./types";

/**
 * Vue's counterpart of React's List: a `<ul>` of rows with a line between
 * each, drawn from the same recipe (`LIST_CLASS`, `listDensityClasses`).
 * `density` sets every row's height and inset: `default` 48, `compact` 40.
 * Its rows are `KozmosListItem`s in the default slot.
 */
export const KozmosList = defineComponent({
  name: "KozmosList",
  inheritAttrs: false,
  props: {
    density: {
      type: String as PropType<KozmosListDensity>,
      default: "default",
    },
  },
  /** The rows, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "ul",
        {
          "data-density": props.density,
          class: cn(
            LIST_CLASS,
            listDensityClasses[props.density],
            normalizeClass(className),
          ),
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});

/**
 * Vue's counterpart of React's ListItem: one `<li>` row. Given any of its
 * slots (GAP-195, decision 135) — `#leading`, `#title`, `#titleAddon`,
 * `#description`, `#meta`, `#trailing` — the row is drawn as React's is: a
 * mark at the start, read first; a title with something beside it; a
 * description and a meta line under it, then the default slot; and one
 * control at the end. Given none, the row is its default slot, as it always
 * was. A slot that draws nothing (all `v-if`'d away) is no slot, as React's
 * null prop is none. `selected` tints the row (it is drawn only: the row's
 * control says it is checked).
 */
export const KozmosListItem = defineComponent({
  name: "KozmosListItem",
  inheritAttrs: false,
  props: {
    selected: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    /** At the start, centred on the title's line: a ListItemStatus, an icon. */
    leading?: () => VNode[];
    /** The row's name, 14 medium in the foreground colour. */
    title?: () => VNode[];
    /** Beside the title, on its line: a role Tag, an info IconButton. */
    titleAddon?: () => VNode[];
    /** Under the title, 14 in the muted colour. */
    description?: () => VNode[];
    /** Under the description, 12 in the muted colour: a duration, a date. */
    meta?: () => VNode[];
    /** At the end, centred on the row: the row's one control. */
    trailing?: () => VNode[];
    /** The row's content, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      const leading = drawn(slots.leading?.());
      const title = drawn(slots.title?.());
      const titleAddon = drawn(slots.titleAddon?.());
      const description = drawn(slots.description?.());
      const meta = drawn(slots.meta?.());
      const trailing = drawn(slots.trailing?.());
      const children = slots.default?.();
      const slotted = !!(
        leading ||
        title ||
        titleAddon ||
        description ||
        meta ||
        trailing
      );
      const C = LIST_ITEM_SLOT_CLASSES;
      return h(
        "li",
        {
          "data-selected": props.selected ? "" : undefined,
          class: cn(
            LIST_ITEM_CLASS,
            slotted && LIST_ITEM_SLOTTED_CLASS,
            props.selected && LIST_ITEM_SELECTED_CLASS,
            normalizeClass(className),
          ),
          ...rest,
        },
        slotted
          ? [
              leading
                ? h(
                    "span",
                    { class: C.leading, "data-slot": "leading" },
                    leading,
                  )
                : null,
              h("div", { class: C.body }, [
                title || titleAddon
                  ? h("div", { class: C.heading }, [
                      title
                        ? h(
                            "span",
                            { class: C.title, "data-slot": "title" },
                            title,
                          )
                        : null,
                      titleAddon
                        ? h(
                            "span",
                            { class: C.titleAddon, "data-slot": "title-addon" },
                            titleAddon,
                          )
                        : null,
                    ])
                  : null,
                description
                  ? h(
                      "div",
                      { class: C.description, "data-slot": "description" },
                      description,
                    )
                  : null,
                meta
                  ? h("div", { class: C.meta, "data-slot": "meta" }, meta)
                  : null,
                children,
              ]),
              trailing
                ? h(
                    "div",
                    { class: C.trailing, "data-slot": "trailing" },
                    trailing,
                  )
                : null,
            ]
          : children,
      );
    };
  },
});

/**
 * Vue's counterpart of React's ListItemStatus: a checklist row's status mark,
 * for KozmosListItem's `#leading`. Done is the theme fill with a check; in
 * progress a theme ring around a dot; not started a ring in the muted line
 * colour. The mark is drawn only; its words are read, first in the row, so
 * a screen reader hears the status with the name: English by default ("Not
 * started", "In progress", "Done"), or `label`.
 */
export const KozmosListItemStatus = defineComponent({
  name: "KozmosListItemStatus",
  inheritAttrs: false,
  props: {
    status: {
      type: String as PropType<KozmosListItemStatusValue>,
      required: true,
    },
    label: { type: String, default: undefined },
  },
  slots: Object as SlotsType<Record<never, never>>,
  setup(props, { attrs }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "span",
        {
          "data-status": props.status,
          class: cn(LIST_ITEM_STATUS_CLASSES.root, normalizeClass(className)),
          ...rest,
        },
        [
          props.status === "done"
            ? glyph("Check", {
                "aria-hidden": "true",
                class: LIST_ITEM_STATUS_CLASSES.check,
              })
            : props.status === "inProgress"
              ? h("span", {
                  "aria-hidden": "true",
                  class: LIST_ITEM_STATUS_CLASSES.dot,
                })
              : null,
          h(
            "span",
            { class: "sr-only" },
            props.label ?? LIST_ITEM_STATUS_LABELS[props.status],
          ),
        ],
      );
    };
  },
});
