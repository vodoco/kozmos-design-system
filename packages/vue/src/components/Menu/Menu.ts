import {
  computed,
  defineComponent,
  h,
  inject,
  mergeProps,
  normalizeClass,
  provide,
  shallowRef,
  useId,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  DropdownMenuCheckboxItem as RekaCheckboxItem,
  DropdownMenuContent as RekaContent,
  DropdownMenuItem as RekaItem,
  DropdownMenuItemIndicator as RekaItemIndicator,
  DropdownMenuPortal as RekaPortal,
  DropdownMenuRadioGroup as RekaRadioGroup,
  DropdownMenuRadioItem as RekaRadioItem,
  DropdownMenuRoot as RekaRoot,
  DropdownMenuSub as RekaSub,
  DropdownMenuSubContent as RekaSubContent,
  DropdownMenuSubTrigger as RekaSubTrigger,
  Primitive,
  injectDropdownMenuRootContext,
} from "reka-ui";
import { cn, menuContentClass } from "#kozmos-recipes";
import { POPPER_PROPS, popperProps } from "../Tooltip/Tooltip";
import type { KozmosOverlayAlign } from "../Tooltip/types";
import {
  composed,
  createMenuParts,
  elementOf,
  markDismissing,
  MenuModalKey,
  PANEL_EVENTS,
  panelOf,
  usePanel,
} from "./menuParts";
import type { KozmosMenuDirection } from "./types";

/**
 * Vue's counterpart of React's Menu (Radix's DropdownMenu): a menu's root,
 * on Reka UI's DropdownMenuRoot, holding its open state (`v-model:open`). It
 * draws no element. Modal unless `:modal="false"`: open, it traps focus,
 * keeps the page's pointer out and keeps the page out of reach (GAP-193).
 */
export const KozmosMenu = defineComponent({
  name: "KozmosMenu",
  props: {
    dir: {
      type: String as PropType<KozmosMenuDirection>,
      default: undefined,
    },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    modal: { type: Boolean, default: true },
  },
  emits: {
    /** React's onOpenChange: the menu asks to open or to close. */
    "update:open": (_open: boolean) => true,
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { emit, slots }) {
    provide(
      MenuModalKey,
      computed(() => props.modal),
    );
    return () =>
      h(
        RekaRoot,
        {
          open: props.open,
          defaultOpen: props.defaultOpen ?? false,
          dir: props.dir,
          modal: props.modal,
          "onUpdate:open": (open: boolean) => emit("update:open", open),
        },
        () => slots.default?.(),
      );
  },
});

/**
 * What opens the menu: a `<button>`, or with `as-child` the element in its
 * slot, as Radix's trigger draws it: Radix's attributes first, the app's
 * winning. As Radix's, it opens on the pointer's press (Reka's opens on the
 * click after it), without taking focus, so the menu takes it; Enter and
 * Space toggle it, ArrowDown opens it.
 */
export const KozmosMenuTrigger = defineComponent({
  name: "KozmosMenuTrigger",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, slots }) {
    const root = injectDropdownMenuRootContext();
    const triggerId = `reka-dropdown-menu-trigger-${useId()}`;
    root.triggerId = triggerId;
    root.contentId ||= `reka-dropdown-menu-content-${useId()}`;
    // The trigger Reka's content gives focus back to, and is placed beside.
    const element = shallowRef<HTMLElement | undefined>(undefined);
    root.triggerElement = element as never;
    const setElement = (instance: unknown) => {
      element.value = elementOf(instance) ?? undefined;
    };
    return () => {
      const open = !!root.open.value;
      const disabled = attrs.disabled === true || attrs.disabled === "";
      const { onPointerdown, onKeydown, ...rest } = attrs as Record<
        string,
        unknown
      >;
      return h(
        Primitive,
        {
          ref: setElement,
          as: "button",
          asChild: props.asChild,
          type: "button",
          id: triggerId,
          "aria-haspopup": "menu",
          "aria-expanded": String(open),
          "aria-controls": open ? root.contentId : undefined,
          "data-state": open ? "open" : "closed",
          "data-disabled": disabled ? "" : undefined,
          disabled,
          ...rest,
          onPointerdown: composed(onPointerdown, (event: PointerEvent) => {
            if (disabled || event.button !== 0 || event.ctrlKey) return;
            const wasOpen = root.open.value;
            root.onOpenToggle();
            // Opening, the trigger does not take focus: the menu does.
            if (!wasOpen) event.preventDefault();
          }),
          onKeydown: composed(onKeydown, (event: KeyboardEvent) => {
            if (disabled) return;
            if (event.key === "Enter" || event.key === " ") root.onOpenToggle();
            if (event.key === "ArrowDown") root.onOpenChange(true);
            if (["Enter", " ", "ArrowDown"].includes(event.key))
              event.preventDefault();
          }),
        },
        () => slots.default?.(),
      );
    };
  },
});

const parts = createMenuParts(
  "Menu",
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
    const root = injectDropdownMenuRootContext();
    return () => !!root.open.value;
  },
);

/** A portal of the theme's, which MenuContent draws itself in. */
export const KozmosMenuPortal = parts.Portal;

/**
 * The open menu: React's panel, from the shared recipe, beside its trigger
 * (`side-offset` 4), in the theme's portal (or `portal-container`). Closed,
 * focus goes back to the trigger, unless a press outside a menu that is not
 * modal took it elsewhere.
 */
export const KozmosMenuContent = defineComponent({
  name: "KozmosMenuContent",
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
    ...POPPER_PROPS,
    sideOffset: { type: Number, default: 4 },
    align: { type: String as PropType<KozmosOverlayAlign>, default: undefined },
    loop: { type: Boolean, default: false },
  },
  emits: {
    /** Focus is about to go back as the menu closes. */
    closeAutoFocus: (_event: Event) => true,
    ...PANEL_EVENTS,
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { attrs, emit, slots }) {
    const root = injectDropdownMenuRootContext();
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
    // Radix gives focus back at once, unless a press outside a menu that
    // is not modal, or a right click, took it; Reka a task later.
    let interacted = false;
    return () => {
      const to = panel.portal.to.value;
      if (to === null) return null;
      const { class: className, ...rest } = attrs;
      return h(
        RekaPortal,
        { to: to as HTMLElement | string, forceMount: props.forceMount },
        () => [
          h(
            RekaContent,
            mergeProps(
              {
                ref: (instance: unknown) => {
                  self.value = instance;
                },
                ...popperProps(props),
                sideOffset: props.sideOffset,
                asChild: props.asChild,
                forceMount: props.forceMount,
                loop: props.loop,
                reference: root.triggerElement.value,
                class: cn(menuContentClass, normalizeClass(className)),
                "data-kozmos-density": panel.portal.density.value,
                ...panel.listeners,
                onInteractOutside: panel.once(
                  "onInteractOutside",
                  (event: CustomEvent) => {
                    emit("interactOutside", event as never);
                    markDismissing(event);
                    if (event.defaultPrevented) return;
                    const original = event.detail?.originalEvent as
                      | PointerEvent
                      | undefined;
                    const rightClick =
                      original?.button === 2 ||
                      (original?.button === 0 && original.ctrlKey === true);
                    if (!root.modal.value || rightClick) interacted = true;
                    // Focus moving to the trigger closes a menu that is not
                    // modal, as Radix's dismisses on any focus outside; Reka
                    // keeps it open (it opens on the click after the press,
                    // and so takes the trigger's focus as its own).
                    if (
                      !root.modal.value &&
                      original?.type === "focusin" &&
                      root.triggerElement.value?.contains(
                        event.target as Node | null,
                      )
                    )
                      queueMicrotask(() => root.onOpenChange(false));
                  },
                ),
                onCloseAutoFocus: panel.once(
                  "onCloseAutoFocus",
                  (event: Event) => {
                    emit("closeAutoFocus", event);
                    if (event.defaultPrevented) {
                      interacted = false;
                      return;
                    }
                    if (!interacted) root.triggerElement.value?.focus();
                    interacted = false;
                  },
                ),
              },
              rest,
            ),
            () => slots.default?.(),
          ),
        ],
      );
    };
  },
});

export const KozmosMenuGroup = parts.Group;
export const KozmosMenuLabel = parts.Label;
export const KozmosMenuItem = parts.Item;
export const KozmosMenuCheckboxItem = parts.CheckboxItem;
export const KozmosMenuRadioGroup = parts.RadioGroup;
export const KozmosMenuRadioItem = parts.RadioItem;
export const KozmosMenuSeparator = parts.Separator;
export const KozmosMenuShortcut = parts.Shortcut;
export const KozmosMenuSub = parts.Sub;
export const KozmosMenuSubTrigger = parts.SubTrigger;
export const KozmosMenuSubContent = parts.SubContent;
