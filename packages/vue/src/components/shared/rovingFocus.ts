import {
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  useId,
  watch,
  type InjectionKey,
  type Ref,
} from "vue";

/**
 * Radix's RovingFocusGroup (1.1), which React's RadioGroup and
 * SegmentedControl (Radix's ToggleGroup) move focus with: one Tab stop for
 * the group, the arrows, Home and End moving focus along its options in the
 * writing direction, looping when asked. Drawn here as Radix draws it, not
 * on Reka UI's RovingFocusGroup, which differs where an app can see: Reka's
 * items carry `data-active` and `data-disabled` of their own, and they find
 * one another by Reka's collection where Radix's mark each option
 * `data-radix-collection-item`, which React's parts draw and this draws
 * too. Internal: the package exports none of it.
 *
 * The group's box is `tabindex="0"` once it holds a usable option (so a
 * server render draws -1, as React's does), and Tab onto it sends focus to
 * the active option, else the one last focused, else the first usable one;
 * Shift+Tab from an option leaves the group. Each option is `tabindex="0"`
 * while it is the group's stop, `-1` otherwise.
 */
export type RovingOrientation = "horizontal" | "vertical";
export type RovingDirection = "ltr" | "rtl";

const ITEM = "data-radix-collection-item";

interface RovingContext {
  orientation: () => RovingOrientation | undefined;
  dir: () => RovingDirection;
  loop: () => boolean;
  currentTabStopId: Ref<string | null>;
  group: Ref<HTMLElement | null>;
  onItemFocus: (id: string) => void;
  onItemShiftTab: () => void;
  onFocusableItemAdd: () => void;
  onFocusableItemRemove: () => void;
  items: Map<
    HTMLElement,
    { id: string; focusable: () => boolean; active: () => boolean }
  >;
}
const KEY: InjectionKey<RovingContext> = Symbol("KozmosRovingFocus");

const FOCUS_INTENT: Record<string, "prev" | "next" | "first" | "last"> = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last",
};

function focusIntent(
  event: KeyboardEvent,
  orientation: RovingOrientation | undefined,
  dir: RovingDirection,
) {
  const key =
    dir !== "rtl"
      ? event.key
      : event.key === "ArrowLeft"
        ? "ArrowRight"
        : event.key === "ArrowRight"
          ? "ArrowLeft"
          : event.key;
  if (orientation === "vertical" && ["ArrowLeft", "ArrowRight"].includes(key))
    return undefined;
  if (orientation === "horizontal" && ["ArrowUp", "ArrowDown"].includes(key))
    return undefined;
  return FOCUS_INTENT[key];
}

function focusFirst(candidates: HTMLElement[]) {
  const previous = document.activeElement;
  for (const candidate of candidates) {
    if (candidate === previous) return;
    candidate.focus();
    if (document.activeElement !== previous) return;
  }
}

const wrap = <T>(array: T[], start: number) =>
  array.map((_, index) => array[(start + index) % array.length]);

/**
 * The group: provides the context its options join, and returns the
 * attributes and listeners for its box, written before the part's own so
 * an app's `tabindex` and `style` win, as Radix's Slot merges them.
 */
export function useRovingFocusGroup(options: {
  orientation: () => RovingOrientation | undefined;
  dir: () => RovingDirection;
  loop: () => boolean;
}) {
  const currentTabStopId = ref<string | null>(null);
  const isTabbingBackOut = ref(false);
  const focusableCount = ref(0);
  const group = shallowRef<HTMLElement | null>(null);
  const items: RovingContext["items"] = new Map();
  let isClickFocus = false;

  /** The options, in the order the page draws them, as Radix's collection. */
  const ordered = () =>
    group.value
      ? [...group.value.querySelectorAll<HTMLElement>(`[${ITEM}]`)].filter(
          (element) => items.has(element),
        )
      : [];

  provide(KEY, {
    ...options,
    currentTabStopId,
    group,
    onItemFocus: (id) => (currentTabStopId.value = id),
    onItemShiftTab: () => (isTabbingBackOut.value = true),
    onFocusableItemAdd: () => focusableCount.value++,
    onFocusableItemRemove: () => focusableCount.value--,
    items,
  });

  const attributes = () => ({
    tabindex: isTabbingBackOut.value || focusableCount.value === 0 ? -1 : 0,
    "data-orientation": options.orientation(),
    style: { outline: "none" },
  });

  const listeners = {
    onMousedown: () => {
      isClickFocus = true;
    },
    onFocus: (event: FocusEvent) => {
      const isKeyboardFocus = !isClickFocus;
      if (
        event.target === event.currentTarget &&
        isKeyboardFocus &&
        !isTabbingBackOut.value
      ) {
        const usable = ordered().filter((element) =>
          items.get(element)!.focusable(),
        );
        const active = usable.find((element) => items.get(element)!.active());
        const current = usable.find(
          (element) => items.get(element)!.id === currentTabStopId.value,
        );
        focusFirst(
          [active, current, ...usable].filter(Boolean) as HTMLElement[],
        );
      }
      isClickFocus = false;
    },
    onBlur: () => {
      isTabbingBackOut.value = false;
    },
  };

  return {
    group,
    setGroup: (element: unknown) => {
      group.value =
        (element as { $el?: HTMLElement } | null)?.$el ??
        (element as HTMLElement | null);
    },
    attributes,
    listeners,
    ordered,
  };
}

/**
 * One option of the group: its attributes and listeners, written under the
 * option's own so the option's win, and its element's ref. `focusable` is
 * false for a disabled option, which the arrows pass.
 */
export function useRovingFocusItem(options: {
  focusable: () => boolean;
  active: () => boolean;
}) {
  const context = inject(KEY)!;
  const id = useId();
  const element = shallowRef<HTMLElement | null>(null);
  const entry = { id, focusable: options.focusable, active: options.active };

  onMounted(() => {
    if (element.value) context.items.set(element.value, entry);
    if (options.focusable()) context.onFocusableItemAdd();
  });
  watch(options.focusable, (now, before) => {
    if (now === before) return;
    if (now) context.onFocusableItemAdd();
    else context.onFocusableItemRemove();
  });
  onBeforeUnmount(() => {
    if (element.value) context.items.delete(element.value);
    if (options.focusable()) context.onFocusableItemRemove();
  });

  const attributes = () => ({
    tabindex: context.currentTabStopId.value === id ? 0 : -1,
    "data-orientation": context.orientation(),
    [ITEM]: "",
  });

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === "Tab" && event.shiftKey) {
      context.onItemShiftTab();
      return;
    }
    if (event.target !== event.currentTarget) return;
    const intent = focusIntent(event, context.orientation(), context.dir());
    if (intent === undefined) return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
      return;
    event.preventDefault();
    const group = context.group.value;
    let candidates = group
      ? [...group.querySelectorAll<HTMLElement>(`[${ITEM}]`)].filter(
          (node) => context.items.get(node)?.focusable() ?? false,
        )
      : [];
    if (intent === "last") candidates.reverse();
    else if (intent === "prev" || intent === "next") {
      if (intent === "prev") candidates.reverse();
      const index = candidates.indexOf(event.currentTarget as HTMLElement);
      candidates = context.loop()
        ? wrap(candidates, index + 1)
        : candidates.slice(index + 1);
    }
    setTimeout(() => focusFirst(candidates));
  };

  const listeners = {
    onMousedown: (event: MouseEvent) => {
      if (!options.focusable()) event.preventDefault();
      else context.onItemFocus(id);
    },
    onFocus: () => context.onItemFocus(id),
    onKeydown,
  };

  return {
    id,
    element,
    setElement: (node: unknown) => {
      element.value =
        (node as { $el?: HTMLElement } | null)?.$el ??
        (node as HTMLElement | null);
    },
    attributes,
    listeners,
  };
}
