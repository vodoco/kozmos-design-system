import {
  defineComponent,
  h,
  inject,
  normalizeClass,
  provide,
  type InjectionKey,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  CARD_CLASS,
  CARD_DESCRIPTION_CLASS,
  CARD_FOOTER_CLASS,
  CARD_HEADER_ACTIONS_CLASS,
  CARD_HEADER_TEXT_CLASS,
  CARD_LEAD,
  CARD_PADDING,
  CARD_TITLE_CLASS,
  CARD_TITLE_SIZE,
  cardHeaderClasses,
  cardTitleDrawnSize,
  cn,
} from "#kozmos-recipes";
import { drawn } from "../drawn";
import type {
  KozmosCardHeaderTone,
  KozmosCardPadding,
  KozmosCardTitleLevel,
  KozmosCardTitleSize,
} from "./types";

/** The card's padding, for its parts: React's CardPaddingContext. */
const PADDING: InjectionKey<() => KozmosCardPadding> =
  Symbol("KozmosCardPadding");
/** The header's tone, for the title's size inside it. */
const TONE: InjectionKey<() => KozmosCardHeaderTone> = Symbol(
  "KozmosCardHeaderTone",
);

const usePadding = () => inject(PADDING, () => "default" as const);

/**
 * Vue's counterpart of React's Card: the `<div>` React's draws, from the same
 * recipe (`recipes/card.ts`). `padding` (24, or 16 `compact`) reaches its
 * header, content and footer, as React's context does, so a card is never
 * padded two amounts; whichever part is its first child also pays the top
 * (GAP-194).
 */
export const KozmosCard = defineComponent({
  name: "KozmosCard",
  inheritAttrs: false,
  props: {
    padding: {
      type: String as PropType<KozmosCardPadding>,
      default: "default",
    },
  },
  /** The card's parts, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    provide(PADDING, () => props.padding);
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "div",
        {
          "data-padding": props.padding,
          class: cn(
            CARD_CLASS,
            CARD_PADDING[props.padding].lead,
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
 * Vue's counterpart of React's CardHeader: its title and description in a
 * column, padded as the card says. With an `actions` slot, the text keeps
 * the room before them and the actions sit at the header's inline end
 * (GAP-169). `tone="subtle"` draws Pointr Cloud's pale strip, with its title
 * 14 unless the title says otherwise (decisions 135 and 139).
 */
export const KozmosCardHeader = defineComponent({
  name: "KozmosCardHeader",
  inheritAttrs: false,
  props: {
    tone: {
      type: String as PropType<KozmosCardHeaderTone>,
      default: "default",
    },
  },
  slots: Object as SlotsType<{
    /** What acts on the card, as React's `actions`. */
    actions?: () => VNode[];
    /** The title and description, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    const padding = usePadding();
    provide(TONE, () => props.tone);
    return () => {
      const { class: className, ...rest } = attrs;
      const actions = drawn(slots.actions?.());
      const children = slots.default?.();
      return h(
        "div",
        {
          "data-tone": props.tone === "subtle" ? props.tone : undefined,
          class: cn(
            ...cardHeaderClasses(padding(), props.tone, !!actions),
            normalizeClass(className),
          ),
          ...rest,
        },
        actions
          ? [
              h("div", { class: CARD_HEADER_TEXT_CLASS }, children),
              h(
                "div",
                {
                  "data-slot": "card-header-actions",
                  class: CARD_HEADER_ACTIONS_CLASS,
                },
                actions,
              ),
            ]
          : children,
      );
    };
  },
});

/**
 * Vue's counterpart of React's CardTitle: a heading, `h3` unless `as` says
 * which level the page's outline needs (GAP-205), at `size` (24, 18 `md`, 14
 * `sm`; GAP-035), and 14 in a subtle header when no size is given.
 */
export const KozmosCardTitle = defineComponent({
  name: "KozmosCardTitle",
  inheritAttrs: false,
  props: {
    as: {
      type: String as PropType<KozmosCardTitleLevel>,
      default: "h3",
    },
    size: {
      type: String as PropType<KozmosCardTitleSize>,
      default: undefined,
    },
  },
  /** The title, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const tone = inject(TONE, () => "default" as const);
    return () => {
      const { class: className, ...rest } = attrs;
      const size = cardTitleDrawnSize(props.size, tone());
      return h(
        props.as,
        {
          "data-size": size === "lg" ? undefined : size,
          class: cn(
            CARD_TITLE_SIZE[size],
            CARD_TITLE_CLASS,
            normalizeClass(className),
          ),
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});

/** Vue's counterpart of React's CardDescription: the header's muted line. */
export const KozmosCardDescription = defineComponent({
  name: "KozmosCardDescription",
  inheritAttrs: false,
  /** The description, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "p",
        {
          class: cn(CARD_DESCRIPTION_CLASS, normalizeClass(className)),
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});

/**
 * Vue's counterpart of React's CardContent: padded on its sides and bottom,
 * and on its top only as the card's first child (GAP-194).
 */
export const KozmosCardContent = defineComponent({
  name: "KozmosCardContent",
  inheritAttrs: false,
  /** The content, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_props, { attrs, slots }) {
    const padding = usePadding();
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "div",
        {
          class: cn(
            CARD_PADDING[padding()].sides,
            CARD_LEAD,
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
 * Vue's counterpart of React's CardFooter: a row, padded as CardContent is.
 */
export const KozmosCardFooter = defineComponent({
  name: "KozmosCardFooter",
  inheritAttrs: false,
  /** The footer's content, as React's `children`. */
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_props, { attrs, slots }) {
    const padding = usePadding();
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "div",
        {
          class: cn(
            CARD_FOOTER_CLASS,
            CARD_PADDING[padding()].sides,
            CARD_LEAD,
            normalizeClass(className),
          ),
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});
