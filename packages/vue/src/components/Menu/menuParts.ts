import {
  cloneVNode,
  mergeProps,
  Comment,
  createTextVNode,
  defineComponent,
  Fragment,
  h,
  inject,
  isVNode,
  nextTick,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  provide,
  shallowRef,
  Text,
  watch,
  type Component,
  type ComputedRef,
  type InjectionKey,
  type PropType,
  type ShallowRef,
  type SlotsType,
  type VNode,
} from "vue";
import { Primitive } from "reka-ui";
import {
  Check,
  ChevronRight,
  Circle,
  LinkExternal01,
} from "@kozmos-ds/icons/vue";
import {
  cn,
  inertOutside,
  MENU_CHECK_ICON_CLASS,
  MENU_EXTERNAL_END_CLASS,
  MENU_EXTERNAL_ICON_CLASS,
  MENU_EXTERNAL_LABEL,
  MENU_INSET_CLASS,
  MENU_RADIO_ICON_CLASS,
  menuContentClass,
  menuIndicatorClass,
  menuIndicatorItemClass,
  menuItemClass,
  menuLabelClass,
  menuSeparatorClass,
  menuShortcutClass,
  menuSubIconClass,
  menuSubTriggerClass,
  menuTargetKeepsTab,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { useKozmosDensity } from "../../theme/injection";
import { layerEscape, useOverlayPortal } from "../shared/layers";

/**
 * What Menu's and ContextMenu's parts share (GAP-155): a context menu is
 * Menu's panel and rows, opened where it is asked for. Each part is drawn on
 * Reka UI's Menu primitives (its DropdownMenu* or ContextMenu* parts), onto
 * the element React's Radix part draws, with React's classes from the shared
 * recipe (`recipes/menu.ts`). Where Reka's menu behaves otherwise than
 * Radix's, the part does as Radix's does:
 *
 * - **Keys.** One keyboard handler per panel, heard before Reka's
 *   (`useRadixKeys`): the arrows, Home, End, PageUp and PageDown move among
 *   the panel's own enabled rows as Radix's roving focus does (from a row,
 *   a task later; from the panel, at once), never into an open submenu's
 *   rows, which Reka's query reached; type-ahead skips disabled rows and
 *   reads each row's `text-value` or its words, and Space while typing
 *   ahead types a space, where Reka's matched disabled rows and Space
 *   chose the row; Tab stays in the panel whether or not it is modal.
 * - **Rows.** A row is marked `data-highlighted` only while it has focus
 *   (Reka's also marks the row a pointer last rested on, so an open
 *   submenu's row stayed lit), takes `tabindex="0"` while it is the panel's
 *   current stop, and draws Radix's `data-orientation="vertical"`.
 * - **Groups.** A group is Radix's `role="group"`, named only as an app
 *   names it: Reka's names each group by its label's id.
 *
 * Internal: Menu.ts and ContextMenu.ts export the parts under their names.
 */

type Props = Record<string, unknown>;

/** The Reka parts one kind of menu is drawn on. */
export interface MenuPrimitives {
  Sub: Component;
  SubTrigger: Component;
  SubContent: Component;
  Item: Component;
  CheckboxItem: Component;
  RadioGroup: Component;
  RadioItem: Component;
  ItemIndicator: Component;
  Portal: Component;
}

/** Whether the menu is modal, as Radix's `modal` says: false outside a root. */
export const MenuModalKey: InjectionKey<ComputedRef<boolean>> =
  Symbol("KozmosMenuModal");

/** A panel's rows, for its keys: each row's element and what it is. */
interface RowEntry {
  disabled: () => boolean;
  textValue: () => string | undefined;
}
interface PanelState {
  rows: Map<HTMLElement, RowEntry>;
  /** The row that is the panel's tab stop, Radix's currentTabStopId. */
  current: ShallowRef<HTMLElement | null>;
}
const PanelKey: InjectionKey<PanelState> = Symbol("KozmosMenuPanel");
/** Whether the submenu around a part is open. */
const SubOpenKey: InjectionKey<() => boolean> = Symbol("KozmosMenuSubOpen");
/** Says the submenu around a part is about to close itself. */
const SubClosingKey: InjectionKey<() => void> = Symbol("KozmosMenuSubClosing");

/**
 * The presses and focus moves outside that a menu's panel took to dismiss
 * the menu, by the browser's event. Radix's panel dismisses at once, and a
 * submenu's panel, gone with it, never hears the same press or focus move;
 * Reka's tells each panel in turn, then dismisses. A submenu's panel says
 * nothing of one its menu's panel dismissed on.
 */
const dismissing = new WeakSet<Event>();
/** After a panel's interactOutside: the menu will close on it, unless prevented. */
export function markDismissing(event: CustomEvent) {
  const original = event.detail?.originalEvent as Event | undefined;
  // A press only: Radix dismisses on it at once (a discrete event), and
  // its submenu's panel is gone before it hears it; a focus move is told
  // to each panel, as Reka tells it.
  if (original?.type === "pointerdown" && !event.defaultPrevented)
    dismissing.add(original);
}
const dismissed = (event: CustomEvent) =>
  dismissing.has(event.detail?.originalEvent as Event);

/** A Radix panel's keys that move focus to a first or last row. */
const FIRST_KEYS = ["ArrowDown", "PageUp", "Home"];
const LAST_KEYS = ["ArrowUp", "PageDown", "End"];

/** Radix's (and Reka's) type-ahead match: the next row whose words start with the search. */
function nextMatch(values: string[], search: string, current?: string) {
  const repeated =
    search.length > 1 && Array.from(search).every((c) => c === search[0]);
  const normalized = repeated ? search[0] : search;
  const index = current ? values.indexOf(current) : -1;
  let wrapped = values.map(
    (_, i) => values[(Math.max(index, 0) + i) % values.length],
  );
  if (normalized.length === 1) wrapped = wrapped.filter((v) => v !== current);
  const match = wrapped.find((value) =>
    value.toLowerCase().startsWith(normalized.toLowerCase()),
  );
  return match !== current ? match : undefined;
}

function focusFirst(candidates: HTMLElement[]) {
  const previous = document.activeElement;
  for (const candidate of candidates) {
    if (candidate === previous) return;
    candidate.focus({ preventScroll: true });
    if (document.activeElement !== previous) return;
  }
}

/**
 * A panel's rows and keys, as Radix's MenuContentImpl and roving focus
 * group hold them. Returns what the panel's element is given.
 */
function useRadixKeys(loop: () => boolean) {
  const panel: PanelState = {
    rows: new Map(),
    current: shallowRef(null),
  };
  provide(PanelKey, panel);
  let search = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const setSearch = (value: string) => {
    search = value;
    clearTimeout(timer);
    if (value !== "") timer = setTimeout(() => setSearch(""), 1000);
  };
  onBeforeUnmount(() => clearTimeout(timer));

  /** The panel's own rows, in the page's order. */
  const ordered = () =>
    [...panel.rows.keys()]
      .filter((row) => row.isConnected)
      .sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1,
      );
  const enabled = () =>
    ordered().filter((row) => !panel.rows.get(row)!.disabled());
  const words = (row: HTMLElement) =>
    panel.rows.get(row)!.textValue() ?? (row.textContent ?? "").trim();

  let drawn: EventTarget | null = null;
  const onKeydown = (event: KeyboardEvent) => {
    const content = event.currentTarget as HTMLElement;
    const target = event.target as HTMLElement;
    // A panel drawn again (it opened again) starts with no search.
    if (content !== drawn) {
      drawn = content;
      setSearch("");
    }
    // A key in a submenu drawn inside this panel is the submenu's.
    if (target.closest('[role="menu"]') !== content) return;
    const modifier = event.ctrlKey || event.altKey || event.metaKey;
    if (event.key === "Tab") event.preventDefault();
    if (!modifier && event.key.length === 1) {
      const typing = search !== "";
      const next = search + event.key;
      const rows = enabled();
      const values = rows.map(words);
      const active = document.activeElement as HTMLElement | null;
      const current =
        active && rows.includes(active) ? words(active) : undefined;
      const match = nextMatch(values, next, current);
      const found = rows.find((row) => words(row) === match);
      setSearch(next);
      if (found) setTimeout(() => found.focus());
      // Space while typing ahead is a letter of the search, not a choice.
      if (event.key === " " && typing) {
        event.stopPropagation();
        return;
      }
      // Reka's own type-ahead is not heard.
      if (event.key !== " ") event.stopPropagation();
      return;
    }
    if (target === content) {
      const first = FIRST_KEYS.includes(event.key);
      if (!first && !LAST_KEYS.includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const rows = enabled();
      focusFirst(first ? rows : rows.reverse());
      return;
    }
    // From a row: Radix's roving focus, vertical.
    if (!panel.rows.has(target)) return;
    const intent =
      event.key === "ArrowUp"
        ? "prev"
        : event.key === "ArrowDown"
          ? "next"
          : event.key === "Home" || event.key === "PageUp"
            ? "first"
            : event.key === "End" || event.key === "PageDown"
              ? "last"
              : undefined;
    if (!intent) return;
    event.stopPropagation();
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
      return;
    event.preventDefault();
    let candidates = enabled();
    if (intent === "last" || intent === "prev") candidates.reverse();
    if (intent === "prev" || intent === "next") {
      const index = candidates.indexOf(target);
      candidates = loop()
        ? candidates.map(
            (_, i) => candidates[(index + 1 + i) % candidates.length],
          )
        : candidates.slice(index + 1);
    }
    setTimeout(() => focusFirst(candidates));
  };
  const onBlur = (event: FocusEvent) => {
    const content = event.currentTarget as HTMLElement;
    if (!content.contains(event.target as Node)) setSearch("");
  };
  /** The panel itself took focus: no row is its stop (Radix's onItemLeave). */
  const onFocus = (event: FocusEvent) => {
    if (event.target === event.currentTarget) panel.current.value = null;
  };
  /**
   * What the panel's element is given: its keys heard in the capture phase,
   * before Reka's own handler on the same element and the rows' below it.
   */
  return {
    panel,
    attrs: {
      onKeydownCapture: onKeydown,
      onFocusin: onFocus,
      onFocusout: onBlur,
    },
  };
}

/**
 * A row of a panel, as Radix's roving focus item marks it: its tab stop,
 * its orientation and, while it has focus, `data-highlighted`.
 */
function useRow(props: { disabled?: boolean; textValue?: string }) {
  const panel = inject(PanelKey, undefined);
  const element = shallowRef<HTMLElement | null>(null);
  const focused = shallowRef(false);
  const entry: RowEntry = {
    disabled: () => !!props.disabled,
    textValue: () => props.textValue,
  };
  const register = (node: HTMLElement | null) => {
    if (element.value && element.value !== node)
      panel?.rows.delete(element.value);
    element.value = node;
    if (node) panel?.rows.set(node, entry);
  };
  onBeforeUnmount(() => {
    if (element.value) panel?.rows.delete(element.value);
    if (panel && panel.current.value === element.value)
      panel.current.value = null;
  });
  /** What the row's element is given: Radix's roving item's own. */
  const own = () => ({
    // A row with focus is its panel's stop, as Radix's roving item makes it.
    tabindex:
      focused.value ||
      (panel && element.value && panel.current.value === element.value)
        ? "0"
        : "-1",
    "data-orientation": "vertical",
    "data-highlighted": focused.value ? "" : undefined,
    onFocus: (event: FocusEvent) => {
      focused.value = true;
      if (panel) panel.current.value = event.currentTarget as HTMLElement;
    },
    onBlur: () => {
      focused.value = false;
    },
    // Radix's roving item: a press on a disabled row takes no focus; on
    // another, the row is the panel's stop.
    onMousedown: (event: MouseEvent) => {
      if (props.disabled) event.preventDefault();
      else if (panel) panel.current.value = event.currentTarget as HTMLElement;
    },
  });
  return { register, own };
}

/** The first element a slot draws, past comments and empty text. */
function firstElement(nodes: VNode[] | undefined) {
  const flat: VNode[] = [];
  const walk = (list: VNode[]) => {
    for (const node of list)
      if (node.type === Fragment && Array.isArray(node.children))
        walk(node.children as VNode[]);
      else flat.push(node);
  };
  walk(nodes ?? []);
  const index = flat.findIndex(
    (node) =>
      node.type !== Comment &&
      !(node.type === Text && !String(node.children ?? "").trim()),
  );
  return { flat, index };
}

/** The element a component instance (or an element) draws. */
function elementOf(instance: unknown): HTMLElement | null {
  const node =
    instance && typeof instance === "object" && "$el" in instance
      ? (instance as { $el: unknown }).$el
      : instance;
  if (typeof HTMLElement === "undefined") return null;
  if (node instanceof HTMLElement) return node;
  // A component that draws a fragment: its first element.
  if (node instanceof Node) {
    let next: Node | null = node;
    while (next && !(next instanceof HTMLElement)) next = next.nextSibling;
    return next as HTMLElement | null;
  }
  return null;
}

/** A panel's `role="menu"` element, from what Reka's content part draws. */
export function panelOf(instance: unknown): HTMLElement | null {
  const node = elementOf(instance);
  if (!node) return null;
  return node.getAttribute("role") === "menu"
    ? node
    : (node.querySelector<HTMLElement>('[role="menu"]') ?? null);
}

/** The new-tab icon and the words read after the item's name. */
function externalDecoration(label: string | undefined) {
  const words = label ?? MENU_EXTERNAL_LABEL;
  return [
    h("span", { class: MENU_EXTERNAL_END_CLASS, "aria-hidden": "true" }, [
      h(LinkExternal01, {
        "aria-hidden": "true",
        class: MENU_EXTERNAL_ICON_CLASS,
        "data-kozmos-menu-external": "",
      }),
    ]),
    // A no-break space parts the name from the words, where WebKit runs a
    // visually hidden span into the word before it, as Link's does.
    words
      ? h("span", { class: "sr-only" }, [
          createTextVNode(" "),
          createTextVNode(words),
        ])
      : null,
  ];
}

/**
 * An item's children with `external`'s icon and words, and, around an app's
 * `<a>` (`as-child`), the link that opens the new tab, as React's
 * externalItemChildren.
 */
function externalChildren(
  external: boolean | undefined,
  label: string | undefined,
  asChild: boolean | undefined,
  children: VNode[] | undefined,
): VNode[] | undefined {
  if (!external) return children;
  if (!asChild)
    return [...(children ?? []), ...externalDecoration(label)].filter(
      Boolean,
    ) as VNode[];
  const { flat, index } = firstElement(children);
  if (index === -1) return children;
  const link = flat[index];
  if (!isVNode(link)) return children;
  const props = (link.props ?? {}) as Props;
  const target = props.target as string | undefined;
  if (menuTargetKeepsTab(target)) return children;
  const own =
    typeof link.children === "string"
      ? [createTextVNode(link.children)]
      : Array.isArray(link.children)
        ? (link.children as VNode[])
        : [];
  const copy = [...flat];
  copy[index] = h(
    link.type as string,
    {
      ...props,
      target: target ?? "_blank",
      rel: (props.rel as string | undefined) ?? "noopener noreferrer",
    },
    [...own, ...(externalDecoration(label).filter(Boolean) as VNode[])],
  );
  return copy;
}

/** The row Reka's item is drawn onto: React's element, or an app's child. */
const Row = defineComponent({
  name: "KozmosMenuRow",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
    register: {
      type: Function as PropType<(node: HTMLElement | null) => void>,
      required: true,
    },
  },
  setup(props, { attrs, slots }) {
    const self = shallowRef<unknown>(null);
    const sync = () => props.register(elementOf(self.value));
    onMounted(sync);
    onUpdated(sync);
    return () =>
      h(
        Primitive,
        {
          ref: (instance: unknown) => {
            self.value = instance;
          },
          as: "div",
          asChild: props.asChild,
          ...attrs,
        },
        () => slots.default?.(),
      );
  },
});

/** A handler that runs the app's listener first, then the part's unless prevented. */
export function composed<E extends Event>(
  theirs: unknown,
  ours: (event: E) => void,
) {
  return (event: E) => {
    for (const handler of [theirs].flat())
      if (typeof handler === "function") handler(event);
    if (!event.defaultPrevented) ours(event);
  };
}

/** Each event Reka tells, heard once (Reka 2.11 tells some twice). */
function onceEach() {
  const told = new WeakMap<Event, Set<string>>();
  return <E extends Event>(name: string, handler: (event: E) => void) =>
    (event: E) => {
      const names = told.get(event) ?? new Set<string>();
      if (names.has(name)) return;
      names.add(name);
      told.set(event, names);
      handler(event);
    };
}

/**
 * The popper props a context menu's panel takes, React's
 * ContextMenuContent's: its side, offset from the point and alignment are
 * Radix's own.
 */
export const POINT_POPPER_PROPS = {
  alignOffset: { type: Number, default: undefined },
  arrowPadding: { type: Number, default: undefined },
  avoidCollisions: { type: Boolean, default: undefined },
  collisionBoundary: {
    type: null as unknown as PropType<Element | null | (Element | null)[]>,
    default: undefined,
  },
  collisionPadding: {
    type: [Number, Object] as PropType<
      number | Partial<Record<"top" | "right" | "bottom" | "left", number>>
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

/** The popper props a submenu's panel takes, React's SubContent's. */
export const SUB_POPPER_PROPS = {
  sideOffset: { type: Number, default: undefined },
  ...POINT_POPPER_PROPS,
} as const;

/** The props given, the unset ones left to the primitive's defaults. */
export function given(props: Props, names: readonly string[]) {
  const placed: Props = {};
  for (const name of names)
    if (props[name] !== undefined) placed[name] = props[name];
  return placed;
}

/** What a panel reports, React's names: Radix's DismissableLayer's and FocusScope's. */
export const PANEL_EVENTS = {
  /** Escape, while this is the highest layer. */
  escapeKeyDown: (_event: KeyboardEvent) => true,
  /** A press outside the panel. */
  pointerDownOutside: (_event: CustomEvent<{ originalEvent: PointerEvent }>) =>
    true,
  /** Focus moving outside the panel. */
  focusOutside: (_event: CustomEvent<{ originalEvent: FocusEvent }>) => true,
  /** A press or focus outside the panel. */
  interactOutside: (
    _event:
      | CustomEvent<{ originalEvent: PointerEvent }>
      | CustomEvent<{ originalEvent: FocusEvent }>,
  ) => true,
};

/**
 * A menu's panel, on a Reka content part: in the theme's portal (or
 * `portal-container`), carrying the density where it opened; its keys as
 * Radix's (`useRadixKeys`); and, modal, the page outside kept out of reach
 * exactly where aria-hidden's hideOthers keeps it visible (GAP-193), as
 * React's does. `draw` gives the Reka part its props.
 */
export function usePanel(options: {
  props: Props;
  attrs: Props;
  emit: (name: string, event: Event) => void;
  loop: () => boolean;
  /** The panel's element, once drawn. */
  element: () => HTMLElement | null;
  modal: () => boolean;
  open: () => boolean;
}) {
  const { props, emit } = options;
  const portal = useOverlayPortal(() => props.portalContainer as never);
  const keys = useRadixKeys(options.loop);
  const once = onceEach();
  const element = options.element;
  let release: (() => void) | undefined;
  const giveBack = () => {
    release?.();
    release = undefined;
  };
  const hold = () =>
    nextTick(() => {
      const node = element();
      if (!options.open() || !node || !options.modal() || props.forceMount) {
        if (!options.open() || !node) giveBack();
        return;
      }
      if (!release)
        release = inertOutside(node, {
          mirrorAriaHidden: true,
          keep: "[data-reka-menu-content]",
        });
    });
  watch(options.open, (open) => {
    if (!open) giveBack();
    else hold();
  });
  onMounted(hold);
  onUpdated(hold);
  onBeforeUnmount(giveBack);
  const listeners = {
    onEscapeKeyDown: once(
      "onEscapeKeyDown",
      layerEscape((event: KeyboardEvent) => emit("escapeKeyDown", event)),
    ),
    onPointerDownOutside: once("onPointerDownOutside", (event: CustomEvent) =>
      emit("pointerDownOutside", event),
    ),
    onFocusOutside: once("onFocusOutside", (event: CustomEvent) =>
      emit("focusOutside", event),
    ),
    onInteractOutside: once("onInteractOutside", (event: CustomEvent) => {
      emit("interactOutside", event);
      markDismissing(event);
    }),
  };
  return { portal, listeners: { ...listeners, ...keys.attrs }, once };
}

/**
 * The parts every menu draws the same way, on `reka`'s primitives: its
 * group, label, item, checkbox and radio items, separator, shortcut,
 * submenu, its row and its panel, and the portal. `name` is the part's
 * (`Menu`, `ContextMenu`), which its analytics report.
 */
export function createMenuParts(
  name: "Menu" | "ContextMenu",
  reka: MenuPrimitives,
  /** Whether the menu's root is open, read in a part's setup. */
  useRootOpen: () => () => boolean,
) {
  const kozmos = (part: string) => `Kozmos${name}${part}`;

  const Group = defineComponent({
    name: kozmos("Group"),
    inheritAttrs: false,
    props: { asChild: { type: Boolean, default: undefined } },
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(props, { attrs, slots }) {
      // Radix's group: role="group", named only as an app names it.
      return () =>
        h(
          Primitive,
          { as: "div", asChild: props.asChild, role: "group", ...attrs },
          () => slots.default?.(),
        );
    },
  });

  const Label = defineComponent({
    name: kozmos("Label"),
    inheritAttrs: false,
    props: {
      inset: { type: Boolean, default: undefined },
      asChild: { type: Boolean, default: undefined },
    },
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(props, { attrs, slots }) {
      return () => {
        const { class: className, ...rest } = attrs;
        return h(
          Primitive,
          {
            as: "div",
            asChild: props.asChild,
            class: cn(
              menuLabelClass,
              props.inset && MENU_INSET_CLASS,
              normalizeClass(className),
            ),
            ...rest,
          },
          () => slots.default?.(),
        );
      };
    },
  });

  const Separator = defineComponent({
    name: kozmos("Separator"),
    inheritAttrs: false,
    props: { asChild: { type: Boolean, default: undefined } },
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(props, { attrs, slots }) {
      return () => {
        const { class: className, ...rest } = attrs;
        return h(
          Primitive,
          {
            as: "div",
            asChild: props.asChild,
            role: "separator",
            "aria-orientation": "horizontal",
            class: cn(menuSeparatorClass, normalizeClass(className)),
            ...rest,
          },
          () => slots.default?.(),
        );
      };
    },
  });

  const Shortcut = defineComponent({
    name: kozmos("Shortcut"),
    inheritAttrs: false,
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(_, { attrs, slots }) {
      return () => {
        const { class: className, ...rest } = attrs;
        return h(
          "span",
          { class: cn(menuShortcutClass, normalizeClass(className)), ...rest },
          slots.default?.(),
        );
      };
    },
  });

  /** A row's own and the app's attributes, the app's winning as React's. */
  const rowAttrs = (
    row: ReturnType<typeof useRow>,
    className: string,
    rest: Props,
  ) => {
    const own = row.own();
    const { onFocus, onBlur, onMousedown, ...others } = rest;
    return {
      class: className,
      ...own,
      ...others,
      onFocus: composedAll(onFocus, own.onFocus),
      onBlur: composedAll(onBlur, own.onBlur),
      onMousedown: composedAll(onMousedown, own.onMousedown),
    };
  };

  const Item = defineComponent({
    name: kozmos("Item"),
    inheritAttrs: false,
    props: {
      external: { type: Boolean, default: undefined },
      externalLabel: { type: String, default: undefined },
      inset: { type: Boolean, default: undefined },
      asChild: { type: Boolean, default: undefined },
      disabled: { type: Boolean, default: undefined },
      textValue: { type: String, default: undefined },
    },
    emits: {
      /** The item was chosen; `preventDefault()` keeps the menu open. */
      select: (_event: Event) => true,
    },
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(props, { attrs, emit, slots }) {
      const { trackEvent } = useKozmosAnalytics();
      const row = useRow(props);
      return () => {
        const { class: className, ...rest } = attrs;
        return h(
          reka.Item,
          {
            asChild: true,
            disabled: props.disabled,
            textValue: props.textValue,
            onSelect: (event: Event) => {
              trackEvent(name, "menu_item_selected");
              emit("select", event);
            },
          },
          () => [
            h(
              Row,
              {
                asChild: props.asChild,
                register: row.register,
                ...rowAttrs(
                  row,
                  cn(
                    menuItemClass,
                    props.inset && MENU_INSET_CLASS,
                    normalizeClass(className),
                  ),
                  rest,
                ),
              },
              () =>
                externalChildren(
                  props.external,
                  props.externalLabel,
                  props.asChild,
                  slots.default?.(),
                ),
            ),
          ],
        );
      };
    },
  });

  const CheckboxItem = defineComponent({
    name: kozmos("CheckboxItem"),
    inheritAttrs: false,
    props: {
      asChild: { type: Boolean, default: undefined },
      disabled: { type: Boolean, default: undefined },
      textValue: { type: String, default: undefined },
      checked: {
        type: [Boolean, String] as PropType<boolean | "indeterminate">,
        default: undefined,
      },
    },
    emits: {
      /** React's onCheckedChange: the item asks to be checked or not. */
      "update:checked": (_checked: boolean) => true,
      /** The item was chosen; `preventDefault()` keeps the menu open. */
      select: (_event: Event) => true,
    },
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(props, { attrs, emit, slots }) {
      const row = useRow(props);
      return () => {
        const { class: className, ...rest } = attrs;
        return h(
          reka.CheckboxItem,
          {
            asChild: true,
            disabled: props.disabled,
            textValue: props.textValue,
            // Radix's is unchecked until an app checks it.
            modelValue: props.checked ?? false,
            "onUpdate:modelValue": (checked: boolean) =>
              emit("update:checked", checked),
            onSelect: (event: Event) => emit("select", event),
          },
          () => [
            h(
              Row,
              {
                asChild: props.asChild,
                register: row.register,
                ...rowAttrs(
                  row,
                  cn(menuIndicatorItemClass, normalizeClass(className)),
                  rest,
                ),
              },
              () => [
                h("span", { class: menuIndicatorClass }, [
                  h(reka.ItemIndicator, null, () => [
                    h(Check, { class: MENU_CHECK_ICON_CLASS }),
                  ]),
                ]),
                ...(slots.default?.() ?? []),
              ],
            ),
          ],
        );
      };
    },
  });

  const RadioGroup = defineComponent({
    name: kozmos("RadioGroup"),
    inheritAttrs: false,
    props: {
      asChild: { type: Boolean, default: undefined },
      modelValue: { type: String, default: undefined },
    },
    emits: {
      /** React's onValueChange: the item chosen's value. */
      "update:modelValue": (_value: string) => true,
    },
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          reka.RadioGroup,
          {
            asChild: true,
            modelValue: props.modelValue,
            "onUpdate:modelValue": (value: string) =>
              emit("update:modelValue", value),
          },
          () => [
            h(
              Primitive,
              {
                as: "div",
                asChild: props.asChild,
                role: "group",
                // Reka names the group by a label's id; Radix's is named
                // only as an app names it.
                "aria-labelledby": attrs["aria-labelledby"],
                ...attrs,
              },
              () => slots.default?.(),
            ),
          ],
        );
    },
  });

  const RadioItem = defineComponent({
    name: kozmos("RadioItem"),
    inheritAttrs: false,
    props: {
      asChild: { type: Boolean, default: undefined },
      disabled: { type: Boolean, default: undefined },
      value: { type: String, required: true },
      textValue: { type: String, default: undefined },
    },
    emits: {
      /** The item was chosen; `preventDefault()` keeps the menu open. */
      select: (_event: Event) => true,
    },
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(props, { attrs, emit, slots }) {
      const row = useRow(props);
      return () => {
        const { class: className, ...rest } = attrs;
        return h(
          reka.RadioItem,
          {
            asChild: true,
            disabled: props.disabled,
            textValue: props.textValue,
            value: props.value,
            onSelect: (event: Event) => emit("select", event),
          },
          () => [
            h(
              Row,
              {
                asChild: props.asChild,
                register: row.register,
                ...rowAttrs(
                  row,
                  cn(menuIndicatorItemClass, normalizeClass(className)),
                  rest,
                ),
              },
              () => [
                h("span", { class: menuIndicatorClass }, [
                  h(reka.ItemIndicator, null, () => [
                    h(Circle, { class: MENU_RADIO_ICON_CLASS }),
                  ]),
                ]),
                ...(slots.default?.() ?? []),
              ],
            ),
          ],
        );
      };
    },
  });

  const Sub = defineComponent({
    name: kozmos("Sub"),
    props: {
      open: { type: Boolean, default: undefined },
      defaultOpen: { type: Boolean, default: undefined },
    },
    emits: {
      /** React's onOpenChange: the submenu asks to open or to close. */
      "update:open": (_open: boolean) => true,
    },
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(props, { emit, slots }) {
      // Reka closes a submenu as the menu around it closes, or as it is
      // taken away, and says so; Radix's is taken away with its menu and
      // says nothing. Its closing is said only while what holds it is open.
      const parentOpen = inject(SubOpenKey, null) ?? useRootOpen();
      const own = shallowRef(props.open ?? props.defaultOpen ?? false);
      let leaving = false;
      onBeforeUnmount(() => (leaving = true));
      provide(SubOpenKey, () => own.value);
      // A submenu that closes itself (a focus outside it) says so, as
      // Radix's does, even as the menu around it closes too.
      let closingItself = false;
      provide(SubClosingKey, () => {
        closingItself = true;
        queueMicrotask(() => (closingItself = false));
      });
      return () =>
        h(
          reka.Sub,
          {
            // Held here, so it can say a change as Radix's does.
            open: props.open ?? own.value,
            "onUpdate:open": (open: boolean) => {
              // Said only as it changes, as Radix's controllable state.
              if (open === own.value && props.open === undefined) return;
              own.value = open;
              const itself = closingItself;
              closingItself = false;
              if (!open && !itself && (leaving || !parentOpen())) return;
              // A submenu the app does not hold says it once the change is
              // drawn, as Radix's says it in an effect; one it holds, at
              // once.
              if (props.open === undefined)
                queueMicrotask(() => emit("update:open", open));
              else emit("update:open", open);
            },
          },
          () => slots.default?.(),
        );
    },
  });

  const SubTrigger = defineComponent({
    name: kozmos("SubTrigger"),
    inheritAttrs: false,
    props: {
      inset: { type: Boolean, default: undefined },
      asChild: { type: Boolean, default: undefined },
      disabled: { type: Boolean, default: undefined },
      textValue: { type: String, default: undefined },
    },
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(props, { attrs, slots }) {
      const row = useRow(props);
      return () => {
        const { class: className, ...rest } = attrs;
        return h(
          reka.SubTrigger,
          {
            asChild: true,
            disabled: props.disabled,
            textValue: props.textValue,
          },
          () => [
            h(
              Row,
              {
                asChild: props.asChild,
                register: row.register,
                ...rowAttrs(
                  row,
                  cn(
                    menuSubTriggerClass,
                    props.inset && MENU_INSET_CLASS,
                    normalizeClass(className),
                  ),
                  rest,
                ),
              },
              () => [
                ...(slots.default?.() ?? []),
                h(ChevronRight, { class: menuSubIconClass }),
              ],
            ),
          ],
        );
      };
    },
  });

  const SubContent = defineComponent({
    name: kozmos("SubContent"),
    inheritAttrs: false,
    props: {
      asChild: { type: Boolean, default: undefined },
      forceMount: {
        type: Boolean as unknown as PropType<true>,
        default: undefined,
      },
      ...SUB_POPPER_PROPS,
      loop: { type: Boolean, default: false },
    },
    emits: PANEL_EVENTS,
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(props, { attrs, emit, slots }) {
      const keys = useRadixKeys(() => props.loop);
      const once = onceEach();
      const closing = inject(SubClosingKey, () => {});

      return () => {
        const { class: className, ...rest } = attrs;
        return h(
          reka.SubContent,
          mergeProps(
            {
              ...keys.attrs,
              ...given(props, Object.keys(SUB_POPPER_PROPS)),
              asChild: props.asChild,
              forceMount: props.forceMount,
              loop: props.loop,
              class: cn(menuContentClass, normalizeClass(className)),
              onEscapeKeyDown: once(
                "onEscapeKeyDown",
                layerEscape((event: KeyboardEvent) =>
                  emit("escapeKeyDown", event),
                ),
              ),
              onPointerDownOutside: once(
                "onPointerDownOutside",
                (event: CustomEvent) => {
                  if (!dismissed(event))
                    emit("pointerDownOutside", event as never);
                },
              ),
              onFocusOutside: once("onFocusOutside", (event: CustomEvent) => {
                if (dismissed(event)) return;
                emit("focusOutside", event as never);
                // Reka's submenu closes on it next, unless prevented.
                if (!event.defaultPrevented) closing();
              }),
              onInteractOutside: once(
                "onInteractOutside",
                (event: CustomEvent) => {
                  if (dismissed(event)) return;
                  emit("interactOutside", event as never);
                  markDismissing(event);
                },
              ),
            },
            rest,
          ),
          () => slots.default?.(),
        );
      };
    },
  });

  const Portal = defineComponent({
    name: kozmos("Portal"),
    props: {
      container: {
        type: null as unknown as PropType<Element | DocumentFragment | null>,
        default: undefined,
      },
      forceMount: {
        type: Boolean as unknown as PropType<true>,
        default: undefined,
      },
    },
    slots: Object as SlotsType<{ default?: () => VNode[] }>,
    setup(props, { slots }) {
      const portal = useOverlayPortal(() => props.container);
      const density = useKozmosDensity();
      return () => {
        const to = portal.to.value;
        // Not in the body briefly, then in the provider's portal.
        if (to === null) return null;
        const mark = density?.value;
        return h(
          reka.Portal,
          { to: to as HTMLElement | string, forceMount: props.forceMount },
          () => {
            const children = slots.default?.() ?? [];
            // Each element carries the density where it opened, as React's
            // ThemePortal marks it.
            return mark === undefined
              ? children
              : children.map((child) =>
                  isVNode(child) &&
                  child.type !== Comment &&
                  child.type !== Text
                    ? cloneVNode(child, { "data-kozmos-density": mark })
                    : child,
                );
          },
        );
      };
    },
  });

  return {
    Group,
    Label,
    Separator,
    Shortcut,
    Item,
    CheckboxItem,
    RadioGroup,
    RadioItem,
    Sub,
    SubTrigger,
    SubContent,
    Portal,
  };
}

/** Listeners of one name, every one called, the app's first. */
function composedAll<E extends Event>(
  theirs: unknown,
  ours: (event: E) => void,
) {
  return (event: E) => {
    for (const handler of [theirs].flat())
      if (typeof handler === "function") handler(event);
    ours(event);
  };
}

export { elementOf, onceEach };
export type { PanelState };
