import {
  computed,
  defineComponent,
  h,
  inject,
  mergeProps,
  normalizeClass,
  onBeforeUnmount,
  provide,
  shallowRef,
  watch,
  type InjectionKey,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  ContextMenuCheckboxItem as RekaCheckboxItem,
  ContextMenuContent as RekaContent,
  ContextMenuItem as RekaItem,
  ContextMenuItemIndicator as RekaItemIndicator,
  ContextMenuPortal as RekaPortal,
  ContextMenuRadioGroup as RekaRadioGroup,
  ContextMenuRadioItem as RekaRadioItem,
  ContextMenuRoot as RekaRoot,
  ContextMenuSub as RekaSub,
  ContextMenuSubContent as RekaSubContent,
  ContextMenuSubTrigger as RekaSubTrigger,
  Primitive,
  injectContextMenuRootContext,
} from "reka-ui";
import {
  cn,
  menuContentClass,
  openContextMenuAt,
  opensContextMenuFromKeyboard,
} from "#kozmos-recipes";
import {
  composed,
  createMenuParts,
  elementOf,
  given,
  MenuModalKey,
  PANEL_EVENTS,
  panelOf,
  POINT_POPPER_PROPS,
  usePanel,
} from "../Menu/menuParts";
import type { KozmosMenuDirection } from "../Menu/types";

/** A rect at a point: where a right click opened the menu. */
interface Point {
  x: number;
  y: number;
}
const PointKey: InjectionKey<{
  point: { value: Point };
  reference: { getBoundingClientRect: () => DOMRect };
}> = Symbol("KozmosContextMenuPoint");

/**
 * Vue's counterpart of React's ContextMenu (GAP-155): Menu's panel and
 * rows, opened where it is asked for: a right click at the pointer, a long
 * press on touch, and the keyboard's context-menu key or Shift+F10 at the
 * focused item. Its root, on Reka UI's ContextMenuRoot, draws no element;
 * `@open-change` is React's onOpenChange. Modal unless `:modal="false"`.
 */
export const KozmosContextMenu = defineComponent({
  name: "KozmosContextMenu",
  props: {
    dir: {
      type: String as PropType<KozmosMenuDirection>,
      default: undefined,
    },
    modal: { type: Boolean, default: true },
  },
  emits: {
    /** React's onOpenChange: the menu opens or closes. */
    openChange: (_open: boolean) => true,
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { emit, slots }) {
    provide(
      MenuModalKey,
      computed(() => props.modal),
    );
    const point = shallowRef<Point>({ x: 0, y: 0 });
    provide(PointKey, {
      point,
      reference: {
        getBoundingClientRect: () =>
          DOMRect.fromRect({ width: 0, height: 0, ...point.value }),
      },
    });
    return () =>
      h(
        RekaRoot,
        {
          dir: props.dir,
          modal: props.modal,
          "onUpdate:open": (open: boolean) => emit("openChange", open),
        },
        () => slots.default?.(),
      );
  },
});

const isTouchOrPen = (event: PointerEvent) => event.pointerType !== "mouse";

/**
 * The area a right click opens the menu in: a `<span>`, or with `as-child`
 * the element in its slot, drawn as Radix's trigger draws it. A right click
 * opens the menu at the pointer, a long press (700 ms) on touch or a pen at
 * the press, and the context-menu key or Shift+F10 at the focused item's
 * inline start, below it (React's own). Reka's trigger also turns the
 * pointer back on over itself while a modal menu is open, and cancels the
 * browser's menu a microtask late; Radix's does neither, nor does this one.
 */
export const KozmosContextMenuTrigger = defineComponent({
  name: "KozmosContextMenuTrigger",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const root = injectContextMenuRootContext();
    const at = inject(PointKey)!;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clearLongPress = () => clearTimeout(timer);
    onBeforeUnmount(clearLongPress);
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) clearLongPress();
      },
    );
    const open = (event: { clientX: number; clientY: number }) => {
      at.point.value = { x: event.clientX, y: event.clientY };
      root.onOpenChange(true);
    };
    const setElement = (instance: unknown) => {
      const element = elementOf(instance);
      if (element) root.triggerElement.value = element;
    };
    return () => {
      const disabled = !!props.disabled;
      const {
        style,
        onContextmenu,
        onPointerdown,
        onPointermove,
        onPointercancel,
        onPointerup,
        onKeydown,
        ...rest
      } = attrs as Record<string, unknown>;
      const touch =
        (handler: unknown, ours: (event: PointerEvent) => void) =>
        (event: PointerEvent) =>
          disabled
            ? composed(handler, () => {})(event)
            : composed(handler, (e: PointerEvent) => {
                if (isTouchOrPen(e)) ours(e);
              })(event);
      return h(
        Primitive,
        {
          ref: setElement,
          as: "span",
          asChild: props.asChild,
          "data-state": root.open.value ? "open" : "closed",
          "data-disabled": disabled ? "" : undefined,
          ...rest,
          style: [{ "-webkit-touch-callout": "none" }, style],
          onContextmenu: disabled
            ? onContextmenu
            : composed(onContextmenu, (event: MouseEvent) => {
                clearLongPress();
                open(event);
                event.preventDefault();
              }),
          onPointerdown: touch(onPointerdown, (event) => {
            clearLongPress();
            const { clientX, clientY } = event;
            timer = setTimeout(() => open({ clientX, clientY }), 700);
          }),
          onPointermove: touch(onPointermove, clearLongPress),
          onPointercancel: touch(onPointercancel, clearLongPress),
          onPointerup: touch(onPointerup, clearLongPress),
          // React's own: the keyboard opens it at the focused item.
          onKeydown: composed(onKeydown, (event: KeyboardEvent) => {
            if (disabled || !opensContextMenuFromKeyboard(event)) return;
            event.preventDefault();
            openContextMenuAt(event.target as HTMLElement);
          }),
        },
        () => slots.default?.(),
      );
    };
  },
});

const parts = createMenuParts(
  "ContextMenu",
  {
    Sub: RekaSub,
    SubTrigger: RekaSubTrigger,
    SubContent: RekaSubContent,
    Item: RekaItem,
    CheckboxItem: RekaCheckboxItem,
    RadioGroup: RekaRadioGroup,
    RadioItem: RekaRadioItem,
    ItemIndicator: RekaItemIndicator,
    Portal: RekaPortal,
  },
  () => {
    const root = injectContextMenuRootContext();
    return () => !!root.open.value;
  },
);

/** A portal of the theme's, which ContextMenuContent draws itself in. */
export const KozmosContextMenuPortal = parts.Portal;

/**
 * The open menu: Menu's panel, at the point it was opened at (to the
 * inline end of it, its start aligned), in the theme's portal (or
 * `portal-container`). The browser's own menu stays shut over it: Chromium
 * on Windows fires `contextmenu` on the menu key's keyup, after its keydown
 * opened this menu and moved focus into it.
 */
export const KozmosContextMenuContent = defineComponent({
  name: "KozmosContextMenuContent",
  inheritAttrs: false,
  props: {
    portalContainer: {
      type: null as unknown as PropType<Element | DocumentFragment | null>,
      default: undefined,
    },
    asChild: { type: Boolean, default: undefined },
    forceMount: {
      type: Boolean as unknown as PropType<true>,
      default: undefined,
    },
    ...POINT_POPPER_PROPS,
    loop: { type: Boolean, default: false },
  },
  emits: {
    /** Focus is about to go back as the menu closes. */
    closeAutoFocus: (_event: Event) => true,
    ...PANEL_EVENTS,
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, emit, slots }) {
    const root = injectContextMenuRootContext();
    const at = inject(PointKey)!;
    const modal = inject(MenuModalKey, undefined);
    const self = shallowRef<unknown>(null);
    const panel = usePanel({
      props,
      attrs,
      emit: emit as never,
      loop: () => props.loop,
      element: () => panelOf(self.value),
      modal: () => !!modal?.value,
      open: () => root.open.value,
    });
    return () => {
      const to = panel.portal.to.value;
      if (to === null) return null;
      const {
        class: className,
        onContextmenu,
        ...others
      } = attrs as Record<string, unknown>;
      // Radix places it to the point's inline end, its start aligned,
      // whatever an app asks.
      const rest = { ...others };
      for (const name of ["side", "sideOffset", "side-offset", "align"])
        delete rest[name];
      return h(
        RekaPortal,
        { to: to as HTMLElement | string, forceMount: props.forceMount },
        () => [
          h(
            RekaContent,
            mergeProps(
              {
                ...given(props, Object.keys(POINT_POPPER_PROPS)),
                asChild: props.asChild,
                forceMount: props.forceMount,
                loop: props.loop,
                ref: (instance: unknown) => {
                  self.value = instance;
                },
                reference: at.reference,
                class: cn(menuContentClass, normalizeClass(className)),
                "data-kozmos-density": panel.portal.density.value,
                ...panel.listeners,
                onCloseAutoFocus: panel.once(
                  "onCloseAutoFocus",
                  (event: Event) => emit("closeAutoFocus", event),
                ),
              },
              rest,
              {
                onContextmenu: (event: MouseEvent) => {
                  for (const handler of [onContextmenu].flat())
                    if (typeof handler === "function") handler(event);
                  event.preventDefault();
                },
              },
            ),
            () => slots.default?.(),
          ),
        ],
      );
    };
  },
});

export const KozmosContextMenuGroup = parts.Group;
export const KozmosContextMenuLabel = parts.Label;
export const KozmosContextMenuItem = parts.Item;
export const KozmosContextMenuCheckboxItem = parts.CheckboxItem;
export const KozmosContextMenuRadioGroup = parts.RadioGroup;
export const KozmosContextMenuRadioItem = parts.RadioItem;
export const KozmosContextMenuSeparator = parts.Separator;
export const KozmosContextMenuShortcut = parts.Shortcut;
export const KozmosContextMenuSub = parts.Sub;
export const KozmosContextMenuSubTrigger = parts.SubTrigger;
export const KozmosContextMenuSubContent = parts.SubContent;
