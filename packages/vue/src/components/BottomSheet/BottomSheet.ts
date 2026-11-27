import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { DialogClose as RekaDialogClose } from "reka-ui";
import { X } from "@kozmos-ds/icons/vue";
import {
  BOTTOM_SHEET_CLOSE_CLASS,
  BOTTOM_SHEET_CLOSE_LABEL,
  BOTTOM_SHEET_CONTENT_CLASS,
  BOTTOM_SHEET_GRIP_CLASS,
  cn,
  MODAL_CLOSE_ICON_CLASS,
  MODAL_CLOSE_NAME_CLASS,
} from "#kozmos-recipes";
import { CONTENT_EVENTS, contentListeners } from "../Dialog/Dialog";
import {
  KozmosDrawer,
  KozmosDrawerClose,
  KozmosDrawerContent,
  KozmosDrawerDescription,
  KozmosDrawerFooter,
  KozmosDrawerHeader,
  KozmosDrawerTitle,
  KozmosDrawerTrigger,
} from "../Drawer/Drawer";
import type { KozmosDrawerPlacement, KozmosDrawerSide } from "../Drawer/types";

/**
 * Vue's counterpart of React's BottomSheet: a Drawer (React's is the same
 * component), its props and defaults left to KozmosDrawer's when unset.
 */
export const KozmosBottomSheet = defineComponent({
  name: "KozmosBottomSheet",
  props: {
    placement: {
      type: String as PropType<KozmosDrawerPlacement>,
      default: undefined,
    },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    modal: { type: Boolean, default: undefined },
  },
  emits: {
    /** React's onOpenChange: the sheet asks to open or to close. */
    "update:open": (_open: boolean) => true,
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { emit, slots }) {
    return () => {
      const given: Record<string, unknown> = {};
      for (const [name, value] of Object.entries(props))
        if (value !== undefined) given[name] = value;
      return h(
        KozmosDrawer,
        {
          ...given,
          "onUpdate:open": (open: boolean) => emit("update:open", open),
        },
        () => slots.default?.(),
      );
    };
  },
});

/** React's BottomSheetTrigger is DrawerTrigger. */
export const KozmosBottomSheetTrigger = KozmosDrawerTrigger;
/** React's BottomSheetClose is DrawerClose. */
export const KozmosBottomSheetClose = KozmosDrawerClose;
/** React's BottomSheetTitle is DrawerTitle. */
export const KozmosBottomSheetTitle = KozmosDrawerTitle;
/** React's BottomSheetHeader is DrawerHeader. */
export const KozmosBottomSheetHeader = KozmosDrawerHeader;
/** React's BottomSheetFooter is DrawerFooter. */
export const KozmosBottomSheetFooter = KozmosDrawerFooter;
/** React's BottomSheetDescription is DrawerDescription. */
export const KozmosBottomSheetDescription = KozmosDrawerDescription;

/**
 * The sheet: a bottom KozmosDrawerContent with its grip, drawn and hidden
 * from readers, and its own close at the top end, "Close bottom sheet",
 * unless `:show-close="false"`. `title` names it for assistive technology
 * and draws it nowhere; to show a title, draw a KozmosBottomSheetTitle in
 * it and leave `title` unset.
 */
export const KozmosBottomSheetContent = defineComponent({
  name: "KozmosBottomSheetContent",
  inheritAttrs: false,
  props: {
    /** The sheet's accessible name, drawn nowhere. */
    title: { type: String, default: undefined },
    side: { type: String as PropType<KozmosDrawerSide>, default: undefined },
    closeLabel: { type: String, default: undefined },
    portalContainer: {
      type: null as unknown as PropType<Element | DocumentFragment | null>,
      default: undefined,
    },
    showClose: { type: Boolean, default: true },
    asChild: { type: Boolean, default: undefined },
    /** Keeps it drawn while closed, for an exit the app animates itself. */
    forceMount: {
      type: Boolean as unknown as PropType<true>,
      default: undefined,
    },
  },
  emits: CONTENT_EVENTS,
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, emit, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      const given: Record<string, unknown> = {};
      for (const name of [
        "side",
        "closeLabel",
        "portalContainer",
        "asChild",
        "forceMount",
      ] as const)
        if (props[name] !== undefined) given[name] = props[name];
      return h(
        KozmosDrawerContent,
        {
          side: "bottom",
          showClose: false,
          class: cn(BOTTOM_SHEET_CONTENT_CLASS, normalizeClass(className)),
          ...contentListeners(emit as never),
          ...rest,
          ...given,
        },
        () => [
          h("div", { "aria-hidden": "true", class: BOTTOM_SHEET_GRIP_CLASS }),
          props.title
            ? h(KozmosDrawerTitle, { class: "sr-only" }, () => props.title)
            : null,
          slots.default?.(),
          props.showClose
            ? h(RekaDialogClose, { class: BOTTOM_SHEET_CLOSE_CLASS }, () => [
                h(X, { "aria-hidden": "true", class: MODAL_CLOSE_ICON_CLASS }),
                h(
                  "span",
                  { class: MODAL_CLOSE_NAME_CLASS },
                  BOTTOM_SHEET_CLOSE_LABEL,
                ),
              ])
            : null,
        ],
      );
    };
  },
});
