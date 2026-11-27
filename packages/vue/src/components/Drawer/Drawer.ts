import {
  computed,
  defineComponent,
  h,
  inject,
  normalizeClass,
  onMounted,
  provide,
  ref,
  shallowRef,
  useId,
  watch,
  type ComputedRef,
  type InjectionKey,
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
  FocusScope as RekaFocusScope,
  Presence as RekaPresence,
  injectDialogRootContext,
} from "reka-ui";
import { X } from "@kozmos-ds/icons/vue";
import {
  cn,
  DRAWER_CLOSE_CLASS,
  DRAWER_DESCRIPTION_CLASS,
  DRAWER_FOOTER_CLASS,
  DRAWER_HEADER_CLASS,
  DRAWER_OVERLAY_CLASS,
  DRAWER_OVERLAY_INLINE_CLASS,
  DRAWER_TITLE_CLASS,
  DRAWER_UNNAMED_PANEL_WARNING,
  drawerContentClasses,
  focusIfStillThere,
  MODAL_CLOSE_ICON_CLASS,
  MODAL_CLOSE_NAME_CLASS,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { CONTENT_EVENTS, contentListeners } from "../Dialog/Dialog";
import {
  layerAbove,
  useOutsideInteractions,
  useOverlayPortal,
  type OutsideEvent,
} from "../shared/layers";
import type { KozmosDrawerPlacement, KozmosDrawerSide } from "./types";

/** What a Drawer gives its parts, as React's DrawerContext. */
interface DrawerState {
  placement: ComputedRef<KozmosDrawerPlacement>;
  modal: ComputedRef<boolean>;
  /** Inline and not modal: a panel beside the page, not a dialog. */
  panel: ComputedRef<boolean>;
  open: ComputedRef<boolean>;
  setOpen: (open: boolean) => void;
  /** A panel's ids: Reka's own are only for its content, which a panel isn't. */
  panelId: string;
  /** The trigger, and whether a press on it is what is opening the panel. */
  trigger: { element: HTMLElement | null; opening: boolean };
}

const DrawerKey: InjectionKey<DrawerState> = Symbol("KozmosDrawer");

function useDrawer(): DrawerState {
  const state = inject(DrawerKey, undefined);
  if (state) return state;
  // Outside a Drawer, as React's context default: fixed, modal and closed.
  return {
    placement: computed(() => "fixed"),
    modal: computed(() => true),
    panel: computed(() => false),
    open: computed(() => false),
    setOpen: () => {},
    panelId: "",
    trigger: { element: null, opening: false },
  };
}

/**
 * Vue's counterpart of React's Drawer: the root of a panel that slides in
 * from an edge, on Reka UI's DialogRoot, holding its open state
 * (`v-model:open`, or `default-open`). It draws no element. Each change of
 * the open state reports `drawer_opened` or `drawer_closed`.
 *
 * `placement` (GAP-198): `fixed`, the default, slides over the window from
 * its edge, in the theme's portal, and is modal unless `:modal="false"`.
 * `inline` draws it in place, absolute against the nearest positioned box,
 * not modal unless `modal` says so, and then a panel beside the page, not a
 * dialog (React's DrawerProps say how it behaves; this port does as it
 * does): it takes focus only when its trigger opens it, Tab leaves it, a
 * press or focus outside leaves it open (close it in `@interact-outside`,
 * which a press on its trigger doesn't reach), and Escape closes it only
 * from inside.
 */
export const KozmosDrawer = defineComponent({
  name: "KozmosDrawer",
  props: {
    /** Where the drawer is drawn: over the window, or in place. */
    placement: {
      type: String as PropType<KozmosDrawerPlacement>,
      default: "fixed",
    },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: false },
    /** Unset, modal when fixed and not when inline. */
    modal: { type: Boolean, default: undefined },
  },
  emits: {
    /** React's onOpenChange: the drawer asks to open or to close. */
    "update:open": (_open: boolean) => true,
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { emit, slots }) {
    const { trackEvent } = useKozmosAnalytics();
    const uncontrolled = ref(props.defaultOpen);
    const open = computed(() => props.open ?? uncontrolled.value);
    const setOpen = (next: boolean) => {
      uncontrolled.value = next;
      trackEvent("Drawer", next ? "drawer_opened" : "drawer_closed");
      emit("update:open", next);
    };
    const placement = computed(() => props.placement);
    const modal = computed(() => props.modal ?? props.placement === "fixed");
    const panel = computed(() => props.placement === "inline" && !modal.value);
    provide(DrawerKey, {
      placement,
      modal,
      panel,
      open,
      setOpen,
      panelId: `kozmos-drawer-${useId()}`,
      trigger: { element: null, opening: false },
    });
    return () =>
      h(
        RekaDialogRoot,
        {
          modal: modal.value,
          open: open.value,
          "onUpdate:open": setOpen,
        },
        () => slots.default?.(),
      );
  },
});

/**
 * What opens the drawer: a `<button>`, or with `as-child` the element in its
 * slot. It names the drawer in `aria-controls`; a panel's (inline, not
 * modal) says it opens no dialog.
 */
export const KozmosDrawerTrigger = defineComponent({
  name: "KozmosDrawerTrigger",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const drawer = useDrawer();
    const root = injectDialogRootContext();
    root.contentId ||= `reka-dialog-content-${useId()}`;
    const own = shallowRef<{ $el?: unknown } | null>(null);
    onMounted(() => {
      const element = own.value?.$el;
      drawer.trigger.element = element instanceof HTMLElement ? element : null;
    });
    return () => {
      const { onClick, ...rest } = attrs as Record<string, unknown>;
      return h(
        RekaDialogTrigger,
        {
          ref: (instance: unknown) => {
            own.value = instance as { $el?: unknown } | null;
            const element = own.value?.$el;
            if (element instanceof HTMLElement)
              drawer.trigger.element = element;
          },
          asChild: props.asChild,
          "aria-controls": drawer.panel.value
            ? `${drawer.panelId}-content`
            : root.contentId,
          // Reka names the dialog's content here; a panel is neither.
          ...(drawer.panel.value ? { "aria-haspopup": undefined } : {}),
          onClick: (event: MouseEvent) => {
            drawer.trigger.opening =
              (event.currentTarget as Element | null)?.getAttribute(
                "data-state",
              ) === "closed";
            if (typeof onClick === "function") onClick(event);
            else if (Array.isArray(onClick))
              for (const handler of onClick) handler(event);
            // The opening is done by now, or it isn't coming.
            if (drawer.panel.value)
              setTimeout(() => {
                drawer.trigger.opening = false;
              });
          },
          ...rest,
        },
        () => slots.default?.(),
      );
    };
  },
});

/** A button that closes the drawer: a `<button>`, or with `as-child` the element in its slot. */
export const KozmosDrawerClose = defineComponent({
  name: "KozmosDrawerClose",
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
 * The drawer: at its `side`, over its scrim, with a close named
 * `close-label` at its corner unless `:show-close="false"`. Fixed, in the
 * theme's portal (or `portal-container`), carrying the density where it
 * opened; inline, in place over the nearest positioned box. Modal, it is
 * Reka's dialog content and a layer of the overlays' stack
 * (`shared/layers.ts`): a Select, Combobox, Popover or Tooltip inside it
 * opens above it, which Escape and a press outside close first. A panel
 * (inline, not modal) is a labelled `complementary` landmark beside the
 * page, as React's.
 */
export const KozmosDrawerContent = defineComponent({
  name: "KozmosDrawerContent",
  inheritAttrs: false,
  props: {
    /** The close's accessible name, "Close drawer" by default, as Dialog's. */
    closeLabel: { type: String, default: "Close drawer" },
    portalContainer: {
      type: null as unknown as PropType<Element | DocumentFragment | null>,
      default: undefined,
    },
    showClose: { type: Boolean, default: true },
    side: { type: String as PropType<KozmosDrawerSide>, default: "right" },
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
    const drawer = useDrawer();
    const portal = useOverlayPortal(() => props.portalContainer);
    const panelElement = ref<HTMLElement | null>(null);
    // The panel as last drawn, which its unmount still asks about.
    let lastPanel: HTMLElement | null = null;
    watch(panelElement, (element) => {
      if (element) lastPanel = element;
    });
    // Whether focus is in the panel: closing gives back only focus it took.
    let focusInside = false;
    const listened = (name: string) => {
      const handler = (attrs as Record<string, unknown>)[name];
      return (event: unknown) => {
        if (typeof handler === "function") handler(event);
        else if (Array.isArray(handler)) for (const one of handler) one(event);
      };
    };
    // A press on the trigger isn't outside: it toggles the panel on its
    // click. WebKit focuses no button for a mouse, and the focusable box
    // round it takes it.
    const skippingTrigger =
      (handler: (event: OutsideEvent) => void) => (event: OutsideEvent) => {
        const trigger = drawer.trigger.element;
        const target = event.target as Node;
        if (
          trigger?.contains(target) ||
          (trigger &&
            event.detail.originalEvent.type === "focusin" &&
            target.contains(trigger))
        )
          return;
        handler(event);
      };
    const outside = (kind: "pointerDownOutside" | "focusOutside") =>
      skippingTrigger((event) => {
        (emit as (name: string, payload: unknown) => void)(kind, event);
        emit("interactOutside", event as never);
        // Closed by this press with no exit to run, it goes before the
        // press can move focus: this isn't focus to give back.
        if (!event.defaultPrevented) focusInside = false;
      });
    useOutsideInteractions(
      panelElement,
      () => drawer.panel.value && drawer.open.value,
      {
        pointerDownOutside: outside("pointerDownOutside"),
        focusOutside: outside("focusOutside"),
      },
    );
    onMounted(() => {
      if (
        process.env.NODE_ENV === "production" ||
        !drawer.panel.value ||
        !panelElement.value ||
        attrs["aria-label"] ||
        attrs["aria-labelledby"] ||
        panelElement.value.ownerDocument.getElementById(
          `${drawer.panelId}-title`,
        )
      )
        return;
      console.warn(DRAWER_UNNAMED_PANEL_WARNING);
    });

    const close = () =>
      props.showClose
        ? h(RekaDialogClose, { class: DRAWER_CLOSE_CLASS }, () => [
            h(X, { "aria-hidden": "true", class: MODAL_CLOSE_ICON_CLASS }),
            h("span", { class: MODAL_CLOSE_NAME_CLASS }, props.closeLabel),
          ])
        : null;

    return () => {
      const inline = drawer.placement.value === "inline";
      const { class: className, ...rest } = attrs as Record<string, unknown>;
      const shape = cn(
        ...drawerContentClasses(props.side, inline),
        normalizeClass(className),
      );
      const density = inline ? undefined : portal.density.value;
      if (drawer.panel.value) {
        // Its own handlers call the app's (listened): taken out of what is
        // spread, so each runs once.
        const own = Object.fromEntries(
          Object.entries(rest).filter(
            ([name]) =>
              !["onKeydown", "onFocusCapture", "onBlurCapture"].includes(name),
          ),
        );
        return h(
          RekaPresence,
          { present: !!props.forceMount || drawer.open.value },
          () =>
            h(
              RekaFocusScope,
              {
                asChild: true,
                onMountAutoFocus: (event: Event) => {
                  emit("openAutoFocus", event);
                  // A panel the product opens takes no focus; one its
                  // trigger opens does.
                  if (!drawer.trigger.opening) event.preventDefault();
                  drawer.trigger.opening = false;
                },
                onUnmountAutoFocus: (event: Event) => {
                  emit("closeAutoFocus", event);
                  const wasInside = focusInside;
                  focusInside = false;
                  if (event.defaultPrevented) return;
                  const doc = document;
                  // Focus never in the panel isn't the panel's to give
                  // back, and focus put elsewhere stays there. Focus that
                  // left with it goes to the trigger; with no trigger, to
                  // what had it as the panel opened.
                  // Reka tells of the unmount as the panel leaves, with
                  // focus perhaps still on an element in it; React's is told
                  // once it is gone.
                  const active = doc.activeElement;
                  const elsewhere =
                    !!active &&
                    active !== doc.body &&
                    active.isConnected &&
                    !lastPanel?.contains(active);
                  if (
                    !wasInside ||
                    elsewhere ||
                    focusIfStillThere(drawer.trigger.element)
                  )
                    event.preventDefault();
                },
              },
              () =>
                h(
                  "div",
                  {
                    ref: panelElement,
                    id: `${drawer.panelId}-content`,
                    role: "complementary",
                    "aria-labelledby": `${drawer.panelId}-title`,
                    "aria-describedby": `${drawer.panelId}-description`,
                    class: shape,
                    "data-side": props.side,
                    "data-state": drawer.open.value ? "open" : "closed",
                    ...own,
                    // In the bubble phase, from inside: Escape in the page is
                    // the page's, and a layer opened above this panel (a
                    // Popover in it) takes it first.
                    onKeydown: (event: KeyboardEvent) => {
                      listened("onKeydown")(event);
                      if (
                        event.key !== "Escape" ||
                        !drawer.open.value ||
                        event.defaultPrevented ||
                        (panelElement.value && layerAbove(panelElement.value))
                      )
                        return;
                      emit("escapeKeyDown", event);
                      if (event.defaultPrevented) return;
                      event.preventDefault();
                      drawer.setOpen(false);
                    },
                    onFocusCapture: (event: FocusEvent) => {
                      listened("onFocusCapture")(event);
                      focusInside = true;
                    },
                    onBlurCapture: (event: FocusEvent) => {
                      listened("onBlurCapture")(event);
                      focusInside = false;
                    },
                  },
                  [slots.default?.(), close()],
                ),
            ),
        );
      }
      const overlay = h(RekaDialogOverlay, {
        class: cn(DRAWER_OVERLAY_CLASS, inline && DRAWER_OVERLAY_INLINE_CLASS),
        "data-kozmos-density": density,
      });
      const content = h(
        RekaDialogContent,
        {
          class: shape,
          "data-side": props.side,
          asChild: props.asChild,
          forceMount: props.forceMount,
          "data-kozmos-density": density,
          ...contentListeners(emit as never),
          ...rest,
        },
        () => [slots.default?.(), close()],
      );
      if (inline) return [overlay, content];
      const to = portal.to.value;
      if (to === null) return null;
      return h(RekaDialogPortal, { to: to as HTMLElement | string }, () => [
        overlay,
        content,
      ]);
    };
  },
});

/** The drawer's title and description, with room for the close. */
export const KozmosDrawerHeader = defineComponent({
  name: "KozmosDrawerHeader",
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "div",
        { class: cn(DRAWER_HEADER_CLASS, normalizeClass(className)), ...rest },
        slots.default?.(),
      );
    };
  },
});

/** The drawer's actions, at its end. */
export const KozmosDrawerFooter = defineComponent({
  name: "KozmosDrawerFooter",
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        "div",
        { class: cn(DRAWER_FOOTER_CLASS, normalizeClass(className)), ...rest },
        slots.default?.(),
      );
    };
  },
});

/** The drawer's name: an `<h2>`; a panel is labelled by it. */
export const KozmosDrawerTitle = defineComponent({
  name: "KozmosDrawerTitle",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const drawer = useDrawer();
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        RekaDialogTitle,
        {
          asChild: props.asChild,
          ...(drawer.panel.value ? { id: `${drawer.panelId}-title` } : {}),
          class: cn(DRAWER_TITLE_CLASS, normalizeClass(className)),
          ...rest,
        },
        () => slots.default?.(),
      );
    };
  },
});

/** What the drawer is for: a `<p>`; a panel is described by it. */
export const KozmosDrawerDescription = defineComponent({
  name: "KozmosDrawerDescription",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const drawer = useDrawer();
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        RekaDialogDescription,
        {
          asChild: props.asChild,
          ...(drawer.panel.value
            ? { id: `${drawer.panelId}-description` }
            : {}),
          class: cn(DRAWER_DESCRIPTION_CLASS, normalizeClass(className)),
          ...rest,
        },
        () => slots.default?.(),
      );
    };
  },
});
