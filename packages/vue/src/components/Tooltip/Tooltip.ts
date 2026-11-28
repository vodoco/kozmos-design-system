import {
  defineComponent,
  h,
  inject,
  normalizeClass,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  TooltipArrow as RekaTooltipArrow,
  TooltipContent as RekaTooltipContent,
  TooltipPortal as RekaTooltipPortal,
  TooltipProvider as RekaTooltipProvider,
  TooltipRoot as RekaTooltipRoot,
  TooltipTrigger as RekaTooltipTrigger,
  injectTooltipProviderContext,
} from "reka-ui";
import {
  cn,
  TOOLTIP_ARROW_CLASSES,
  TOOLTIP_ARROW_SIZE,
  TOOLTIP_CONTENT_CLASS,
  TOOLTIP_CONTENT_MOTION_CLASS,
  TOOLTIP_DISABLED_TRIGGER_CLASS,
  TOOLTIP_TONE_CLASSES,
  tooltipTone,
} from "#kozmos-recipes";
import { ThemeKey } from "../../theme/injection";
import {
  layerEscape,
  radixArrow,
  triggerChild,
  useOverlayPortal,
} from "../shared/layers";
import type {
  KozmosOverlayAlign,
  KozmosOverlaySide,
  KozmosTooltipTone,
} from "./types";

/** The placement props Radix's (and Reka's) popper content takes. */
export const POPPER_PROPS = {
  side: { type: String as PropType<KozmosOverlaySide>, default: undefined },
  sideOffset: { type: Number, default: undefined },
  align: { type: String as PropType<KozmosOverlayAlign>, default: undefined },
  alignOffset: { type: Number, default: undefined },
  arrowPadding: { type: Number, default: undefined },
  avoidCollisions: { type: Boolean, default: undefined },
  collisionBoundary: {
    type: null as unknown as PropType<Element | null | (Element | null)[]>,
    default: undefined,
  },
  collisionPadding: {
    type: [Number, Object] as PropType<
      number | Partial<Record<KozmosOverlaySide, number>>
    >,
    default: undefined,
  },
  sticky: {
    type: String as PropType<"partial" | "always">,
    default: undefined,
  },
  hideWhenDetached: { type: Boolean, default: undefined },
  updatePositionStrategy: {
    type: String as PropType<"optimized" | "always">,
    default: undefined,
  },
} as const;

/** The popper props given, unset ones left to the primitive's defaults. */
export function popperProps(props: Record<string, unknown>) {
  const placed: Record<string, unknown> = {};
  for (const name of Object.keys(POPPER_PROPS))
    if (props[name] !== undefined) placed[name] = props[name];
  return placed;
}

/**
 * Sets the delays for the tooltips inside it, as React's TooltipProvider
 * (Radix's): how long a pointer rests before one opens, and how soon after
 * one closes the next opens at once.
 */
export const KozmosTooltipProvider = defineComponent({
  name: "KozmosTooltipProvider",
  props: {
    delayDuration: { type: Number, default: 700 },
    skipDelayDuration: { type: Number, default: 300 },
    disableHoverableContent: { type: Boolean, default: false },
  },
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(props, { slots }) {
    return () =>
      h(
        RekaTooltipProvider,
        {
          delayDuration: props.delayDuration,
          skipDelayDuration: props.skipDelayDuration,
          disableHoverableContent: props.disableHoverableContent,
        },
        () => slots.default?.(),
      );
  },
});

/**
 * Vue's counterpart of React's Tooltip: one tooltip's root, on Reka UI's
 * TooltipRoot, holding its open state (`v-model:open`). Its delays are its
 * KozmosTooltipProvider's unless it sets its own. Radix's needs a provider
 * around it; Vue's, as the bridged one did, draws one of its own when it has
 * none, at the provider's defaults.
 */
export const KozmosTooltip = defineComponent({
  name: "KozmosTooltip",
  props: {
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    /** Unset, the provider's (700 by default). */
    delayDuration: { type: Number, default: undefined },
    /** Unset, the provider's (false by default). */
    disableHoverableContent: { type: Boolean, default: undefined },
  },
  emits: {
    /** React's onOpenChange: the tooltip opens or closes. */
    "update:open": (_open: boolean) => true,
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { emit, slots }) {
    const provided = injectTooltipProviderContext(null);
    const root = () =>
      h(
        RekaTooltipRoot,
        {
          open: props.open,
          defaultOpen: props.defaultOpen,
          delayDuration: props.delayDuration,
          disableHoverableContent: props.disableHoverableContent,
          "onUpdate:open": (open: boolean) => emit("update:open", open),
        },
        () => slots.default?.(),
      );
    return () => (provided ? root() : h(RekaTooltipProvider, null, root));
  },
});

/**
 * What the tooltip describes: a `<button>`, or with `as-child` the element in
 * its slot. `disabled` wraps a disabled control in a focusable `<span>`
 * (`data-disabled-trigger`, a tab stop), which the tooltip listens on: a
 * disabled `<button>` takes no pointer and no focus, and the reason it is
 * unavailable must reach a keyboard too.
 */
export const KozmosTooltipTrigger = defineComponent({
  name: "KozmosTooltipTrigger",
  inheritAttrs: false,
  props: {
    disabled: { type: Boolean, default: false },
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    return () => {
      if (!props.disabled)
        return h(RekaTooltipTrigger, { asChild: true }, () =>
          triggerChild(props.asChild, "button", attrs, slots.default),
        );
      const { class: className, ...rest } = attrs;
      return h(RekaTooltipTrigger, { asChild: true }, () =>
        h(
          "span",
          {
            class: cn(
              TOOLTIP_DISABLED_TRIGGER_CLASS,
              normalizeClass(className),
            ),
            "data-disabled-trigger": "",
            tabindex: 0,
            ...rest,
          },
          slots.default?.(),
        ),
      );
    };
  },
});

/**
 * The tooltip: its words beside the trigger, with an 8 by 4 tip that
 * overlaps the body by 1px, in a `tone` (decision 192): `default`, the
 * popover's surface, or `inverse`. In the theme's portal (or
 * `portal-container`); outside every provider, in place. A layer of the
 * overlays' stack (`shared/layers.ts`): inside a Dialog, Escape closes it
 * before the Dialog.
 */
export const KozmosTooltipContent = defineComponent({
  name: "KozmosTooltipContent",
  inheritAttrs: false,
  props: {
    /** Defaults to the owning ThemeProvider; without a provider, remains inline. */
    portalContainer: {
      type: null as unknown as PropType<Element | DocumentFragment | null>,
      default: undefined,
    },
    /** The tooltip's surface, and its arrow's (decision 192, GAP-210). */
    tone: {
      type: String as PropType<KozmosTooltipTone>,
      default: "default",
    },
    /** What a screen reader reads for it, in place of its words. */
    ariaLabel: { type: String, default: undefined },
    asChild: { type: Boolean, default: undefined },
    /** Keeps it drawn while closed, for an exit the app animates itself. */
    forceMount: {
      type: Boolean as unknown as PropType<true>,
      default: undefined,
    },
    ...POPPER_PROPS,
    sideOffset: { type: Number, default: 4 },
  },
  emits: {
    /** Escape, while this is the highest layer. */
    escapeKeyDown: (_event: KeyboardEvent) => true,
    /** A press outside the tooltip. */
    pointerDownOutside: (
      _event: CustomEvent<{ originalEvent: PointerEvent }>,
    ) => true,
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, emit, slots }) {
    const theme = inject(ThemeKey, undefined);
    const portal = useOverlayPortal(() => props.portalContainer);
    return () => {
      const surface = tooltipTone(props.tone);
      const { class: className, ...rest } = attrs;
      const content = h(
        RekaTooltipContent,
        {
          ...popperProps(props),
          sideOffset: props.sideOffset,
          ariaLabel: props.ariaLabel,
          asChild: props.asChild,
          forceMount: props.forceMount,
          "data-tone": surface === "inverse" ? "inverse" : undefined,
          class: cn(
            TOOLTIP_CONTENT_CLASS,
            TOOLTIP_TONE_CLASSES[surface],
            TOOLTIP_CONTENT_MOTION_CLASS,
            normalizeClass(className),
          ),
          "data-kozmos-density": portal.density.value,
          onEscapeKeyDown: layerEscape((event: KeyboardEvent) =>
            emit("escapeKeyDown", event),
          ),
          onPointerDownOutside: (event: Event) =>
            emit(
              "pointerDownOutside",
              event as CustomEvent<{ originalEvent: PointerEvent }>,
            ),
          ...rest,
        },
        () => [
          slots.default?.(),
          h(
            RekaTooltipArrow,
            {
              asChild: true,
              width: TOOLTIP_ARROW_SIZE.width,
              height: TOOLTIP_ARROW_SIZE.height,
              class: TOOLTIP_ARROW_CLASSES[surface],
            },
            radixArrow,
          ),
        ],
      );
      if (props.portalContainer === undefined && !theme) return content;
      const to = portal.to.value;
      if (to === null) return null;
      return h(RekaTooltipPortal, { to: to as HTMLElement | string }, () => [
        content,
      ]);
    };
  },
});
