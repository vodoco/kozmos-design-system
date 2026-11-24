import {
  defineComponent,
  h,
  normalizeClass,
  type SlotsType,
  type VNode,
} from "vue";
import {
  cn,
  META_STRIP_CLASS,
  META_STRIP_ITEM_CLASS,
  META_STRIP_LABEL_HIDDEN_CLASS,
  META_STRIP_LABEL_CLASS,
  META_STRIP_VALUE_CLASS,
  META_STRIP_ICON_CLASS,
  scrollHorizontalWithKeyboard,
} from "#kozmos-recipes";
import { drawn } from "../drawn";

type KeydownListener = (event: KeyboardEvent) => void;

/** An app's own `@keydown`, one listener or several, as Vue hands it on. */
function callListeners(listeners: unknown, event: KeyboardEvent) {
  for (const listener of [listeners].flat())
    if (typeof listener === "function") (listener as KeydownListener)(event);
}

/**
 * Vue's counterpart of React's MetaStrip: a row of small facts about one
 * thing, each a label and a value, drawn from the same recipe
 * (`META_STRIP_CLASS`). A `<dl>`, because every tile pairs a label with a
 * value; a tile may hide its label visually, but the label is always in the
 * accessible name. It scrolls rather than wraps: it is a stop for Tab, and
 * its arrow keys, Home and End scroll it while it has focus (the shared
 * `scrollHorizontalWithKeyboard`, after an app's own `@keydown`, as React's
 * runs its `onKeyDown` first). Domain-neutral: it knows nothing about
 * POIs, only about facts.
 */
export const KozmosMetaStrip = defineComponent({
  name: "KozmosMetaStrip",
  inheritAttrs: false,
  /** The tiles, `KozmosMetaStripItem`s, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_props, { attrs, slots }) {
    return () => {
      const { class: className, onKeydown, ...rest } = attrs;
      return h(
        "dl",
        {
          tabindex: 0,
          onKeydown: (event: KeyboardEvent) => {
            callListeners(onKeydown, event);
            scrollHorizontalWithKeyboard(event);
          },
          class: cn(META_STRIP_CLASS, normalizeClass(className)),
          "data-slot": "meta-strip",
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});

/**
 * Vue's counterpart of React's MetaStripItem: one fact. `label` says what
 * the value is and is always read out, even when it is not drawn;
 * `show-label` draws it under the value. `#icon` is a glyph in front of the
 * value, hidden from assistive technology: the label carries the meaning.
 * The value is the default slot. The `<dt>` comes before its `<dd>`, so the
 * pair is read as a pair, and the stylesheet draws the label under it.
 */
export const KozmosMetaStripItem = defineComponent({
  name: "KozmosMetaStripItem",
  inheritAttrs: false,
  props: {
    label: { type: String, required: true },
    showLabel: { type: Boolean, default: false },
  },
  slots: Object as SlotsType<{
    /** A glyph in front of the value, as React's `icon`. */
    icon?: () => VNode[];
    /** The value, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      const icon = drawn(slots.icon?.());
      return h(
        "div",
        {
          class: cn(META_STRIP_ITEM_CLASS, normalizeClass(className)),
          "data-slot": "meta-strip-item",
          ...rest,
        },
        [
          h(
            "dt",
            {
              class: cn(
                META_STRIP_LABEL_CLASS,
                !props.showLabel && META_STRIP_LABEL_HIDDEN_CLASS,
              ),
            },
            props.label,
          ),
          h("dd", { class: META_STRIP_VALUE_CLASS }, [
            icon
              ? h(
                  "span",
                  { "aria-hidden": "true", class: META_STRIP_ICON_CLASS },
                  icon,
                )
              : null,
            slots.default?.(),
          ]),
        ],
      );
    };
  },
});
