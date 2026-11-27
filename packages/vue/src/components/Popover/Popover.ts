import {
  computed,
  defineComponent,
  h,
  inject,
  nextTick,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  provide,
  shallowRef,
  watch,
  type InjectionKey,
  type PropType,
  type ShallowRef,
  type SlotsType,
  type VNode,
  useId,
} from "vue";
import {
  PopoverAnchor as RekaPopoverAnchor,
  PopoverArrow as RekaPopoverArrow,
  PopoverContent as RekaPopoverContent,
  PopoverPortal as RekaPopoverPortal,
  PopoverRoot as RekaPopoverRoot,
  PopoverTrigger as RekaPopoverTrigger,
  injectPopoverRootContext,
} from "reka-ui";
import {
  cn,
  focusIfFocusable,
  POPOVER_ARROW_CLASS,
  POPOVER_CONTENT_CLASS,
} from "#kozmos-recipes";
import { CONTENT_EVENTS, contentListeners } from "../Dialog/Dialog";
import { POPPER_PROPS, popperProps } from "../Tooltip/Tooltip";
import { radixArrow, triggerChild, useOverlayPortal } from "../shared/layers";
import type { KozmosOverlayAlign } from "../Tooltip/types";

/** Anything a popover can be placed beside: an element, or a rect. */
export interface KozmosMeasurable {
  getBoundingClientRect(): DOMRect;
  /** The element the rect is drawn in, which the popover follows as it scrolls. */
  readonly contextElement?: Element;
}
/** What `virtual-ref` takes: React's ref object, a Vue ref, or the rect itself. */
export type KozmosVirtualRef =
  | { current: KozmosMeasurable | null }
  | { value: KozmosMeasurable | null }
  | KozmosMeasurable;

/** The element PopoverContent gives focus back to when nothing else can take it. */
const AnchorKey: InjectionKey<ShallowRef<HTMLElement | null>> = Symbol(
  "KozmosPopoverAnchor",
);

/** The rect a virtual ref names, read as React reads `virtualRef.current`. */
function measurable(virtual: KozmosVirtualRef | undefined) {
  if (!virtual) return undefined;
  if ("getBoundingClientRect" in virtual) return virtual;
  if ("current" in virtual) return virtual.current ?? undefined;
  if ("value" in virtual) return virtual.value ?? undefined;
  return undefined;
}

/**
 * Vue's counterpart of React's Popover: a popover's root, on Reka UI's
 * PopoverRoot, holding its open state (`v-model:open`). It draws no element.
 * Not modal unless `modal`.
 */
export const KozmosPopover = defineComponent({
  name: "KozmosPopover",
  props: {
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    modal: { type: Boolean, default: undefined },
  },
  emits: {
    /** React's onOpenChange: the popover asks to open or to close. */
    "update:open": (_open: boolean) => true,
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { emit, slots }) {
    provide(AnchorKey, shallowRef<HTMLElement | null>(null));
    return () =>
      h(
        RekaPopoverRoot,
        {
          open: props.open,
          defaultOpen: props.defaultOpen,
          modal: props.modal,
          "onUpdate:open": (open: boolean) => emit("update:open", open),
        },
        () => slots.default?.(),
      );
  },
});

/**
 * Takes off what Reka writes and Radix does not, once drawn: Reka writes
 * each only as it first draws it, so it stays off.
 */
function unwrite(
  element: unknown,
  names: string[],
  kept: Record<string, unknown>,
) {
  if (typeof Element === "undefined" || !(element instanceof Element)) return;
  for (const name of names)
    if (kept[name] === undefined) element.removeAttribute(name);
}

/**
 * What opens the popover: a `<button>`, or with `as-child` the element in its
 * slot. As Radix's, it names the panel in `aria-controls` open or closed and
 * has no id of its own (Reka's names the panel only while open, and gives
 * the trigger an id it labels the panel by).
 */
export const KozmosPopoverTrigger = defineComponent({
  name: "KozmosPopoverTrigger",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const root = injectPopoverRootContext();
    root.contentId ||= `reka-popover-content-${useId()}`;
    const own = shallowRef<{ $el?: unknown } | null>(null);
    // Reka's trigger is drawn onto its child by a Slot whose own props win,
    // so these are written once it has drawn, and again as it opens and
    // closes (it takes aria-controls off as it closes).
    const tidy = () =>
      nextTick(() => {
        const element = own.value?.$el;
        unwrite(element, ["id"], attrs);
        if (
          typeof Element !== "undefined" &&
          element instanceof Element &&
          attrs["aria-controls"] === undefined
        )
          element.setAttribute("aria-controls", root.contentId);
      });
    onMounted(tidy);
    onUpdated(tidy);
    watch(() => root.open.value, tidy);
    return () => {
      // An app's id is the trigger's, as Reka names the panel by it.
      if (typeof attrs.id === "string") root.triggerId = attrs.id;
      return h(
        RekaPopoverTrigger,
        {
          ref: (instance: unknown) => {
            own.value = instance as { $el?: unknown } | null;
          },
          asChild: true,
        },
        () => triggerChild(props.asChild, "button", attrs, slots.default),
      );
    };
  },
});

/**
 * What a popover sits beside when no trigger opens it (GAP-190), as React's
 * PopoverAnchor: with `as-child`, the control in its slot, which keeps its
 * own role and gains nothing (no `aria-haspopup`, no toggling click); the
 * product opens the popover itself through `v-model:open`. With
 * `virtual-ref`, a rect (a point on a map), it draws nothing at all. Closed
 * with focus lost, PopoverContent gives focus to this element when what had
 * focus as it opened is gone.
 */
export const KozmosPopoverAnchor = defineComponent({
  name: "KozmosPopoverAnchor",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
    /** A rect to sit beside, in place of an element: `{ current }`, a Vue ref, or the rect. */
    virtualRef: {
      type: Object as PropType<KozmosVirtualRef>,
      default: undefined,
    },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const anchor = inject(AnchorKey, undefined);
    const own = shallowRef<{ $el?: unknown } | null>(null);
    const sync = () => {
      if (!anchor) return;
      const virtual = measurable(props.virtualRef);
      const element = own.value?.$el;
      // A rect has nothing to focus, unless the rect is an element.
      anchor.value = props.virtualRef
        ? virtual instanceof HTMLElement
          ? virtual
          : null
        : element instanceof HTMLElement
          ? element
          : null;
    };
    onMounted(sync);
    onUpdated(sync);
    onBeforeUnmount(() => {
      if (anchor) anchor.value = null;
    });
    return () => {
      if (props.virtualRef)
        // Reka places by `reference`; as a child with nothing in its slot it
        // draws no element, as Radix's virtual anchor draws none.
        return h(RekaPopoverAnchor, {
          asChild: true,
          reference: measurable(props.virtualRef) as never,
        });
      return h(
        RekaPopoverAnchor,
        {
          ref: (instance: unknown) => {
            own.value = instance as { $el?: unknown } | null;
          },
          asChild: props.asChild,
          ...attrs,
        },
        () => slots.default?.(),
      );
    };
  },
});

/** What a popover's panel takes, React's PopoverContent's props. */
const CONTENT_PROPS = {
  portalContainer: {
    type: null as unknown as PropType<Element | DocumentFragment | null>,
    default: undefined,
  },
  asChild: { type: Boolean, default: undefined },
  /** Keeps it drawn while closed, for an exit the app animates itself. */
  forceMount: {
    type: Boolean as unknown as PropType<true>,
    default: undefined,
  },
  ...POPPER_PROPS,
  sideOffset: { type: Number, default: 4 },
  align: { type: String as PropType<KozmosOverlayAlign>, default: "center" },
} as const;

/**
 * The popover's panel, in the theme's portal (or `portal-container`),
 * carrying the density where it opened, a layer of the overlays' stack
 * (`shared/layers.ts`): a Select or Combobox in it opens above it, which
 * Escape and a press outside close first.
 *
 * Closed with focus lost (Escape, or a button in it that closes it), it
 * gives focus back to what had it as it opened, or, when that is gone or
 * nothing had it, to its KozmosPopoverAnchor's element, as React's does. A
 * trigger gets its own focus back; a next popover that took focus keeps it;
 * a press outside leaves focus where it landed. `@close-auto-focus` with
 * `event.preventDefault()` takes it over.
 */
export const KozmosPopoverContent = defineComponent({
  name: "KozmosPopoverContent",
  inheritAttrs: false,
  props: CONTENT_PROPS,
  emits: CONTENT_EVENTS,
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, emit, slots }) {
    const anchor = inject(AnchorKey, undefined);
    const portal = useOverlayPortal(() => props.portalContainer);
    const root = injectPopoverRootContext();
    // Radix names the panel only as an app does; Reka names it by its
    // trigger, which would outrank an app's aria-label.
    const tidy = () =>
      nextTick(() =>
        unwrite(
          root.contentId ? document.getElementById(root.contentId) : null,
          ["aria-labelledby"],
          attrs,
        ),
      );
    watch(() => root.open.value, tidy);
    onMounted(tidy);
    onUpdated(tidy);
    // Reka 2.11's popover content tells its interactOutside and
    // closeAutoFocus twice each (its own emit, and the one it forwards):
    // heard once, as Radix tells each.
    // By event and name: Reka tells interactOutside with the same event as
    // pointerDownOutside or focusOutside.
    const told = new WeakMap<Event, Set<string>>();
    const once =
      <E extends Event>(name: string, handler: (event: E) => void) =>
      (event: E) => {
        const names = told.get(event) ?? new Set<string>();
        if (names.has(name)) return;
        names.add(name);
        told.set(event, names);
        handler(event);
      };
    // What had focus as it opened, before Reka moved it in.
    let invoker: Element | null = null;
    // A press outside leaves focus where it landed.
    let pressedOutside = false;
    return () => {
      const to = portal.to.value;
      if (to === null) return null;
      const { class: className, ...rest } = attrs as Record<string, unknown>;
      return h(RekaPopoverPortal, { to: to as HTMLElement | string }, () => [
        h(
          RekaPopoverContent,
          {
            ...popperProps(props),
            sideOffset: props.sideOffset,
            align: props.align,
            asChild: props.asChild,
            forceMount: props.forceMount,
            class: cn(POPOVER_CONTENT_CLASS, normalizeClass(className)),
            "data-kozmos-density": portal.density.value,
            onOpenAutoFocus: once("onOpenAutoFocus", (event: Event) => {
              invoker =
                (event.currentTarget as Node | null)?.ownerDocument
                  ?.activeElement ?? document.activeElement;
              pressedOutside = false;
              emit("openAutoFocus", event);
            }),
            onInteractOutside: once(
              "onInteractOutside",
              (event: CustomEvent) => {
                emit("interactOutside", event as never);
                if (
                  !event.defaultPrevented &&
                  event.detail?.originalEvent?.type === "pointerdown"
                )
                  pressedOutside = true;
              },
            ),
            onCloseAutoFocus: once("onCloseAutoFocus", (event: Event) => {
              emit("closeAutoFocus", event);
              if (event.defaultPrevented) return;
              // After Reka's own handler, which gives a trigger its focus.
              queueMicrotask(() => {
                if (pressedOutside) return;
                const active = document.activeElement;
                // Only lost focus: a next step that took it keeps it.
                if (active && active !== document.body) return;
                if (!focusIfFocusable(invoker)) focusIfFocusable(anchor?.value);
              });
            }),
            onEscapeKeyDown: once("onEscapeKeyDown", (event: KeyboardEvent) =>
              emit("escapeKeyDown", event),
            ),
            onPointerDownOutside: once(
              "onPointerDownOutside",
              (event: CustomEvent) =>
                emit("pointerDownOutside", event as never),
            ),
            onFocusOutside: once("onFocusOutside", (event: CustomEvent) =>
              emit("focusOutside", event as never),
            ),
            ...rest,
          },
          () => slots.default?.(),
        ),
      ]);
    };
  },
});

/**
 * The pointer tying a popover to what opened it, as React's PopoverArrow:
 * opt-in, a filled triangle 8 by 4 that overlaps the bordered body by 1px
 * (site GAP-74).
 */
export const KozmosPopoverArrow = defineComponent({
  name: "KozmosPopoverArrow",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    return () => {
      const {
        class: className,
        width = 8,
        height = 4,
        ...rest
      } = attrs as Record<string, unknown>;
      return h(
        RekaPopoverArrow,
        {
          asChild: true,
          width: Number(width),
          height: Number(height),
          class: cn(POPOVER_ARROW_CLASS, normalizeClass(className)),
          ...rest,
        },
        props.asChild ? () => slots.default?.() : radixArrow,
      );
    };
  },
});

type Rect = { getBoundingClientRect(): DOMRect };

/** The element or rect `anchor` names, or null while it has none yet. */
function resolveAnchor(anchor: unknown): Element | Rect | null {
  // A server has no elements: the anchor is resolved once mounted.
  if (typeof Element === "undefined") return null;
  let node: unknown =
    anchor && typeof anchor === "object" && "$el" in anchor
      ? (anchor as { $el: unknown }).$el
      : anchor;
  // A box that draws nothing (display: contents): its element is the first
  // one inside it.
  while (
    node instanceof Element &&
    node.ownerDocument.defaultView?.getComputedStyle(node).display ===
      "contents"
  )
    node = node.firstElementChild;
  if (node instanceof Element) return node;
  return node && typeof (node as Rect).getBoundingClientRect === "function"
    ? (node as Rect)
    : null;
}

/**
 * GAP-190, Vue's: a popover the product opens beside an element or rect it
 * does not own, in one part: KozmosPopover, a KozmosPopoverAnchor on
 * `anchor` and a KozmosPopoverContent, with the content's props and events.
 * `anchor` is an element, a component (a template ref on KozmosButton: its
 * element), or anything with a getBoundingClientRect(); `v-model:open` opens
 * and closes it. Focus is React's PopoverContent's: a close that loses it
 * gives it back to what had it, else to an element anchor.
 */
export const KozmosAnchoredPopover = defineComponent({
  name: "KozmosAnchoredPopover",
  inheritAttrs: false,
  props: {
    /** What it sits beside: an element, a component, or a rect. */
    anchor: { type: null as unknown as PropType<unknown>, default: undefined },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    modal: { type: Boolean, default: undefined },
    ...CONTENT_PROPS,
  },
  emits: {
    /** The popover asks to open or to close. */
    "update:open": (_open: boolean) => true,
    ...CONTENT_EVENTS,
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, emit, slots }) {
    const resolved = shallowRef<Element | Rect | null>(null);
    const resolve = () => {
      const next = resolveAnchor(props.anchor);
      if (next !== resolved.value) resolved.value = next;
    };
    watch(() => props.anchor, resolve, { immediate: true });
    onMounted(resolve);
    onUpdated(resolve);
    // A bridged part's element arrives when its own React root draws it,
    // inside a box that draws nothing: watched until then.
    let observer: MutationObserver | undefined;
    watch(
      () => props.anchor,
      (anchor) => {
        observer?.disconnect();
        observer = undefined;
        const box =
          anchor && typeof anchor === "object" && "$el" in anchor
            ? (anchor as { $el: unknown }).$el
            : null;
        if (typeof MutationObserver !== "undefined" && box instanceof Element) {
          observer = new MutationObserver(resolve);
          observer.observe(box, { childList: true, subtree: true });
        }
      },
      { immediate: true },
    );
    onBeforeUnmount(() => observer?.disconnect());
    const virtual = computed(() =>
      resolved.value ? { current: resolved.value as KozmosMeasurable } : null,
    );
    return () =>
      h(
        KozmosPopover,
        {
          open: props.open,
          defaultOpen: props.defaultOpen,
          modal: props.modal,
          "onUpdate:open": (open: boolean) => emit("update:open", open),
        },
        () => [
          virtual.value
            ? h(KozmosPopoverAnchor, { virtualRef: virtual.value })
            : null,
          h(
            KozmosPopoverContent,
            {
              ...Object.fromEntries(
                Object.keys(CONTENT_PROPS).map((name) => [
                  name,
                  (props as Record<string, unknown>)[name],
                ]),
              ),
              ...contentListeners(emit as never),
              ...attrs,
            },
            () => slots.default?.(),
          ),
        ],
      );
  },
});
