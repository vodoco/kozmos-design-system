import {
  defineComponent,
  h,
  normalizeClass,
  useId,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  DialogClose as RekaDialogClose,
  DialogContent as RekaDialogContent,
  DialogDescription as RekaDialogDescription,
  DialogOverlay as RekaDialogOverlay,
  DialogPortal as RekaDialogPortal,
  DialogRoot as RekaDialogRoot,
  DialogTitle as RekaDialogTitle,
  DialogTrigger as RekaDialogTrigger,
  injectDialogRootContext,
} from "reka-ui";
import { X } from "@kozmos-ds/icons/vue";
import {
  cn,
  DIALOG_CLOSE_CLASS,
  DIALOG_CONTENT_CLASS,
  DIALOG_DESCRIPTION_CLASS,
  DIALOG_FOOTER_CLASS,
  DIALOG_HEADER_CLASS,
  DIALOG_MEDIA_CLASS,
  DIALOG_OVERLAY_CLASS,
  DIALOG_TITLE_CLASS,
  dialogContentSizeClass,
  dialogFooterLayoutClass,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { KozmosIconButton } from "../IconButton/IconButton";
import {
  KozmosWithoutGenericClick,
  layerEscape,
  useOverlayPortal,
} from "../shared/layers";
import type { KozmosDialogContentSize } from "./types";

/** The events Radix's (and Reka's) modal content reports, React's names. */
export const CONTENT_EVENTS = {
  /** Focus is about to move into the content as it opens. */
  openAutoFocus: (_event: Event) => true,
  /** Focus is about to go back as the content closes. */
  closeAutoFocus: (_event: Event) => true,
  /** Escape, while this is the highest layer. */
  escapeKeyDown: (_event: KeyboardEvent) => true,
  /** A press outside the content. */
  pointerDownOutside: (_event: CustomEvent<{ originalEvent: PointerEvent }>) =>
    true,
  /** Focus moving outside the content. */
  focusOutside: (_event: CustomEvent<{ originalEvent: FocusEvent }>) => true,
  /** A press or focus outside the content. */
  interactOutside: (
    _event:
      | CustomEvent<{ originalEvent: PointerEvent }>
      | CustomEvent<{ originalEvent: FocusEvent }>,
  ) => true,
};

/** The listeners that hand Reka's content events on under React's names. */
export function contentListeners(
  emit: (event: keyof typeof CONTENT_EVENTS, payload: never) => void,
) {
  return {
    onOpenAutoFocus: (event: Event) => emit("openAutoFocus", event as never),
    onCloseAutoFocus: (event: Event) => emit("closeAutoFocus", event as never),
    onEscapeKeyDown: layerEscape((event: KeyboardEvent) =>
      emit("escapeKeyDown", event as never),
    ),
    onPointerDownOutside: (event: CustomEvent) =>
      emit("pointerDownOutside", event as never),
    onFocusOutside: (event: CustomEvent) =>
      emit("focusOutside", event as never),
    onInteractOutside: (event: CustomEvent) =>
      emit("interactOutside", event as never),
  };
}

/**
 * Vue's counterpart of React's Dialog: the root of a modal dialog, on Reka
 * UI's DialogRoot, holding its open state (`v-model:open`, or
 * `default-open`). It draws no element. Each change of the open state reports
 * `dialog_opened` or `dialog_closed`, as React's does.
 */
export const KozmosDialog = defineComponent({
  name: "KozmosDialog",
  inheritAttrs: false,
  props: {
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    modal: { type: Boolean, default: undefined },
  },
  emits: {
    /** React's onOpenChange: the dialog asks to open or to close. */
    "update:open": (_open: boolean) => true,
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { emit, slots }) {
    const { trackEvent } = useKozmosAnalytics();
    return () =>
      h(
        RekaDialogRoot,
        {
          open: props.open,
          defaultOpen: props.defaultOpen,
          modal: props.modal,
          "onUpdate:open": (open: boolean) => {
            trackEvent("Dialog", open ? "dialog_opened" : "dialog_closed");
            emit("update:open", open);
          },
        },
        () => slots.default?.(),
      );
  },
});

/**
 * What opens the dialog: a `<button>`, or with `as-child` the element in its
 * slot (a KozmosButton). It names the dialog's content in `aria-controls`
 * whether open or not, as Radix's does (Reka's names it only while open).
 */
export const KozmosDialogTrigger = defineComponent({
  name: "KozmosDialogTrigger",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const root = injectDialogRootContext();
    // Named before the first render, the server's too: Reka's trigger names
    // it only as it sets itself up, after this render reads it.
    root.contentId ||= `reka-dialog-content-${useId()}`;
    return () =>
      h(
        RekaDialogTrigger,
        {
          asChild: props.asChild,
          "aria-controls": root.contentId,
          ...attrs,
        },
        () => slots.default?.(),
      );
  },
});

/**
 * A button that closes the dialog: a `<button>`, or with `as-child` the
 * element in its slot.
 */
export const KozmosDialogClose = defineComponent({
  name: "KozmosDialogClose",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    return () =>
      h(RekaDialogClose, { asChild: props.asChild, ...attrs }, () =>
        slots.default?.(),
      );
  },
});

/**
 * The dialog, in the theme's portal (or `portal-container`) over its scrim,
 * carrying the density where it opened, with the persistent close, an
 * outline KozmosIconButton named `close-label`, at its corner. `size="full"`
 * fills the window less 16 each side (decision 202). Modal by default, as
 * Reka's and Radix's are: focus is held in it, the page behind is hidden
 * from assistive technology and takes no pointer, the body does not scroll,
 * and a Select, Combobox, Popover or Tooltip inside it opens a layer above
 * it, which Escape and a press outside close first (`shared/layers.ts`).
 */
export const KozmosDialogContent = defineComponent({
  name: "KozmosDialogContent",
  inheritAttrs: false,
  props: {
    /** Localized name of the persistent dismiss control. */
    closeLabel: { type: String, default: "Close" },
    portalContainer: {
      type: null as unknown as PropType<Element | DocumentFragment | null>,
      default: undefined,
    },
    /** `default`, at most 512 wide; `full`, the window less 16 each side. */
    size: {
      type: String as PropType<KozmosDialogContentSize>,
      default: "default",
    },
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
    const portal = useOverlayPortal(() => props.portalContainer);
    return () => {
      const to = portal.to.value;
      // Not in the body briefly and again once the provider's portal exists.
      if (to === null) return null;
      const { class: className, ...rest } = attrs;
      const density = portal.density.value;
      return h(RekaDialogPortal, { to: to as HTMLElement | string }, () => [
        h(RekaDialogOverlay, {
          class: DIALOG_OVERLAY_CLASS,
          "data-kozmos-density": density,
        }),
        h(
          RekaDialogContent,
          {
            "data-size": props.size,
            class: cn(
              DIALOG_CONTENT_CLASS,
              dialogContentSizeClass(props.size),
              normalizeClass(className),
            ),
            asChild: props.asChild,
            forceMount: props.forceMount,
            "data-kozmos-density": density,
            ...contentListeners(emit as never),
            ...rest,
          },
          () => [
            slots.default?.(),
            h(KozmosWithoutGenericClick, null, () =>
              h(RekaDialogClose, { asChild: true }, () =>
                h(
                  KozmosIconButton,
                  {
                    type: "button",
                    variant: "outline",
                    class: DIALOG_CLOSE_CLASS,
                    "aria-label": props.closeLabel,
                  },
                  () => h(X, { "aria-hidden": "true" }),
                ),
              ),
            ),
          ],
        ),
      ]);
    };
  },
});

/**
 * The dialog's title and description, and media above them (`#media`, an
 * illustration or photo, decision 195): decorative unless `media-label`
 * names it, and reaching the dialog's edges with `media-bleed`.
 */
export const KozmosDialogHeader = defineComponent({
  name: "KozmosDialogHeader",
  inheritAttrs: false,
  props: {
    /** The media's name, read as one image. Without it the media is decorative. */
    mediaLabel: { type: String, default: undefined },
    /** The media reaches the dialog's edges and top corners, past its padding. */
    mediaBleed: { type: Boolean, default: false },
  },
  slots: Object as SlotsType<{
    /** An illustration or a photo above the title. */
    media?: () => VNode[];
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "div",
        { class: cn(DIALOG_HEADER_CLASS, normalizeClass(className)), ...rest },
        [
          slots.media
            ? h(
                "div",
                {
                  class: DIALOG_MEDIA_CLASS,
                  "data-bleed": props.mediaBleed ? "" : undefined,
                  ...(props.mediaLabel
                    ? { role: "img", "aria-label": props.mediaLabel }
                    : { "aria-hidden": "true" }),
                },
                slots.media(),
              )
            : null,
          slots.default?.(),
        ],
      );
    };
  },
});

/** The dialog's actions: responsive by default, or `stacked`. */
export const KozmosDialogFooter = defineComponent({
  name: "KozmosDialogFooter",
  inheritAttrs: false,
  props: {
    /** Stacked keeps DOM, reading and visual order aligned; put the recommended action first. */
    layout: {
      type: String as PropType<"responsive" | "stacked">,
      default: "responsive",
    },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "div",
        {
          "data-layout": props.layout,
          class: cn(
            DIALOG_FOOTER_CLASS,
            dialogFooterLayoutClass(props.layout),
            normalizeClass(className),
          ),
          ...rest,
        },
        slots.default?.(),
      );
    };
  },
});

/** The dialog's name: an `<h2>` its content is labelled by. */
export const KozmosDialogTitle = defineComponent({
  name: "KozmosDialogTitle",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        RekaDialogTitle,
        {
          asChild: props.asChild,
          class: cn(DIALOG_TITLE_CLASS, normalizeClass(className)),
          ...rest,
        },
        () => slots.default?.(),
      );
    };
  },
});

/** What the dialog is for: a `<p>` its content is described by. */
export const KozmosDialogDescription = defineComponent({
  name: "KozmosDialogDescription",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        RekaDialogDescription,
        {
          asChild: props.asChild,
          class: cn(DIALOG_DESCRIPTION_CLASS, normalizeClass(className)),
          ...rest,
        },
        () => slots.default?.(),
      );
    };
  },
});
