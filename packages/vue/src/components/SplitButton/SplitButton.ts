import {
  defineComponent,
  h,
  isVNode,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { ChevronDown } from "@kozmos-ds/icons/vue";
import {
  cn,
  SPLIT_BUTTON_CHEVRON_CLASS,
  SPLIT_BUTTON_CLASS,
  SPLIT_BUTTON_ITEM_ICON_CLASS,
  SPLIT_BUTTON_ITEM_WITH_ICON_CLASS,
  SPLIT_BUTTON_MAIN_CLASS,
  SPLIT_BUTTON_MENU_CLASS,
  splitButtonSeamClass,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { KozmosButton } from "../Button/Button";
import type { KozmosButtonSize, KozmosButtonVariant } from "../Button/types";
import {
  KozmosMenu,
  KozmosMenuContent,
  KozmosMenuItem,
  KozmosMenuSeparator,
  KozmosMenuTrigger,
} from "../Menu/Menu";
import { KozmosWithoutGenericClick } from "../shared/layers";
import type { KozmosSplitButtonMenuItem } from "./types";

/**
 * Vue's counterpart of React's SplitButton: a main action and, beside it, a
 * chevron that opens a menu of the others (GAP-168), each half a
 * KozmosButton of the same variant and size, joined at a seam (site GAP-73,
 * GAP-200). `menu-items` are its menu's rows in order, actions and
 * `{ type: "separator" }` lines; the `#menu-content` slot draws Menu's own
 * parts after them. `@main-click` is React's onMainClick. The main half
 * reports `split_button_main_clicked`, and no `button_clicked`; each item
 * chosen `split_button_menu_item_clicked`, with its label.
 */
export const KozmosSplitButton = defineComponent({
  name: "KozmosSplitButton",
  inheritAttrs: false,
  props: {
    /** The menu's items, in order: actions and separators (GAP-168). */
    menuItems: {
      type: Array as PropType<KozmosSplitButtonMenuItem[]>,
      default: () => [],
    },
    variant: {
      type: String as PropType<KozmosButtonVariant>,
      default: "default",
    },
    size: { type: String as PropType<KozmosButtonSize>, default: "default" },
    disabled: { type: Boolean, default: undefined },
    /** The menu half's accessible name: it shows only a chevron. */
    menuLabel: { type: String, default: "More options" },
  },
  emits: {
    /** The main half was pressed: React's onMainClick. */
    mainClick: (_event: MouseEvent) => true,
  },
  slots: Object as SlotsType<{
    /** The main half's words, as React's `children`. */
    default?: () => VNode[];
    /** Menu's own parts, drawn after `menu-items`: React's `menuContent`. */
    menuContent?: () => VNode[];
  }>,
  setup(props, { attrs, emit, slots }) {
    const { trackEvent } = useKozmosAnalytics();
    return () => {
      const { class: className, ...rest } = attrs;
      const rows = props.menuItems.map((item, index) => {
        if (item.type === "separator")
          return h(KozmosMenuSeparator, { key: index });
        const icon = item.icon
          ? h(
              "span",
              { "aria-hidden": "true", class: SPLIT_BUTTON_ITEM_ICON_CLASS },
              [isVNode(item.icon) ? item.icon : h(item.icon)],
            )
          : null;
        return h(
          KozmosMenuItem,
          {
            key: index,
            disabled: item.disabled,
            textValue: item.textValue,
            class: item.icon ? SPLIT_BUTTON_ITEM_WITH_ICON_CLASS : undefined,
            // On select, not click: a disabled item is never chosen.
            onSelect: () => {
              trackEvent("SplitButton", "split_button_menu_item_clicked", {
                label:
                  typeof item.label === "string"
                    ? item.label
                    : (item.textValue ?? ""),
              });
              item.onClick?.();
            },
          },
          () => [icon, item.label],
        );
      });
      return h(
        "div",
        { class: cn(SPLIT_BUTTON_CLASS, normalizeClass(className)), ...rest },
        [
          h(KozmosWithoutGenericClick, null, () =>
            h(
              KozmosButton,
              {
                class: cn(
                  SPLIT_BUTTON_MAIN_CLASS,
                  splitButtonSeamClass(props.variant),
                ),
                onClick: (event: MouseEvent) => {
                  trackEvent("SplitButton", "split_button_main_clicked");
                  emit("mainClick", event);
                },
                variant: props.variant,
                size: props.size,
                disabled: props.disabled,
              },
              () => slots.default?.(),
            ),
          ),
          h(KozmosMenu, null, () => [
            h(KozmosMenuTrigger, { asChild: true }, () =>
              h(
                KozmosButton,
                {
                  class: SPLIT_BUTTON_MENU_CLASS,
                  variant: props.variant,
                  size: props.size,
                  disabled: props.disabled,
                  "aria-label": props.menuLabel,
                },
                () => h(ChevronDown, { class: SPLIT_BUTTON_CHEVRON_CLASS }),
              ),
            ),
            h(KozmosMenuContent, { align: "end" }, () => [
              ...rows,
              ...(slots.menuContent?.() ?? []),
            ]),
          ]),
        ],
      );
    };
  },
});
