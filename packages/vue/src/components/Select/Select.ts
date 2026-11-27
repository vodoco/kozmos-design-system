import {
  computed,
  createTextVNode,
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  isVNode,
  nextTick,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  provide,
  reactive,
  ref,
  shallowRef,
  ssrContextKey,
  Teleport,
  Text,
  useId,
  watch,
  type ComputedRef,
  type InjectionKey,
  type PropType,
  type Ref,
  type SlotsType,
  type VNode,
} from "vue";
import {
  Primitive,
  SelectContent as RekaSelectContent,
  SelectGroup as RekaSelectGroup,
  SelectItem as RekaSelectItem,
  SelectItemText as RekaSelectItemText,
  SelectLabel as RekaSelectLabel,
  SelectRoot as RekaSelectRoot,
  SelectScrollDownButton as RekaSelectScrollDownButton,
  SelectScrollUpButton as RekaSelectScrollUpButton,
  SelectSeparator as RekaSelectSeparator,
  SelectTrigger as RekaSelectTrigger,
  SelectViewport as RekaSelectViewport,
  injectSelectRootContext,
} from "reka-ui";
import { Check, ChevronDown, ChevronUp } from "@kozmos-ds/icons/vue";
import {
  cn,
  hasSelectCount,
  inertOutside,
  isPlainText,
  mergeAriaIds,
  OPTION_CHECK_CLASS,
  OPTION_CONTENT_CLASS,
  resolveLocale,
  SELECT_CONTENT_CLASS,
  SELECT_CONTENT_POPPER_CLASS,
  SELECT_ICON_CLASS,
  SELECT_ITEM_CHECK_SLOT_CLASS,
  SELECT_ITEM_CLASS,
  SELECT_ITEM_COUNT_CLASS,
  SELECT_LABEL_CLASS,
  SELECT_SCROLL_BUTTON_CLASS,
  SELECT_SCROLL_ICON_CLASS,
  SELECT_SEPARATOR_CLASS,
  SELECT_TRIGGER_CLASS,
  SELECT_TRIGGER_ERROR_CLASS,
  SELECT_TRIGGER_GHOST_CLASS,
  SELECT_VIEWPORT_CLASS,
  SELECT_VIEWPORT_POPPER_CLASS,
  selectCountText,
  selectItemNaming,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { KozmosCounter } from "../Counter/Counter";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import { useListens } from "../FieldWrapper/fieldModel";
import { drawn } from "../drawn";
import { callAll, useInputModality } from "../Listbox/options";
import { ThemeKey, useKozmosDensity } from "../../theme/injection";
import type {
  KozmosSelectAlign,
  KozmosSelectDirection,
  KozmosSelectSide,
} from "./types";

type Props = Record<string, unknown>;

/** Whether the parent wrote a prop, in either spelling: a model it owns. */
function useWritten(camel: string, kebab: string) {
  const instance = getCurrentInstance();
  return () => {
    const props = instance?.vnode.props ?? {};
    return camel in props || kebab in props;
  };
}

/** Radix's shouldShowPlaceholder: no value, or the empty one. */
const showsPlaceholder = (value: string | undefined) =>
  value === "" || value === undefined;

/** An item as the root knows it: its text, once drawn, and its words to show in the trigger. */
interface SelectEntry {
  value: string;
  disabled: boolean;
  text: string;
  words: () => VNode[] | undefined;
}

/** What a Select gives its parts, as React's root and Radix's context do. */
interface SelectState {
  value: ComputedRef<string | undefined>;
  open: ComputedRef<boolean>;
  mixed: ComputedRef<boolean>;
  mixedLabel: ComputedRef<string>;
  resetMixedLabel: ComputedRef<string | undefined>;
  /** The reset's handler, while the app listens and the root is enabled. */
  resetMixed: ComputedRef<(() => void) | undefined>;
  disabled: ComputedRef<boolean>;
  entries: Map<string, SelectEntry>;
  trigger: Ref<HTMLElement | null>;
  contentId: string;
}

const SelectKey: InjectionKey<SelectState> = Symbol("KozmosSelect");

function useSelect(part: string) {
  const state = inject(SelectKey, undefined);
  if (!state)
    throw new Error(`\`${part}\` must be used within \`KozmosSelect\``);
  return state;
}

/** @radix-ui/react-visually-hidden's styles, as React writes them on the form's select. */
const VISUALLY_HIDDEN = {
  position: "absolute",
  border: "0",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  wordWrap: "normal",
};

/**
 * Vue's counterpart of React's Select, the root: it holds the value and the
 * open state and draws no element of its own, on Reka UI's SelectRoot as
 * React's is on Radix's. `v-model` is React's `value` and `onValueChange`
 * (`""` shows the placeholder), `v-model:open` its `open` and
 * `onOpenChange`; unbound, each is the root's own, from `default-value` and
 * `default-open`. Each choice is reported as `select_value_changed`.
 *
 * Mixed (GAP-153), the trigger shows `mixed-label` and no option is
 * checked; a choice edits it, and a `@reset-mixed` listener draws the
 * field's reset. As Radix's does, the root draws the hidden native
 * `<select>` a form reads while it is in one (or before it is mounted),
 * with an option for each item; Reka draws one only with a `name`, so the
 * root draws it itself and gives Reka no name.
 */
export const KozmosSelect = defineComponent({
  name: "KozmosSelect",
  inheritAttrs: false,
  props: {
    mixed: { type: Boolean, default: undefined },
    mixedLabel: { type: String, default: "Multiple values" },
    resetMixedLabel: { type: String, default: undefined },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    dir: {
      type: String as PropType<KozmosSelectDirection>,
      default: undefined,
    },
    name: { type: String, default: undefined },
    autoComplete: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    required: { type: Boolean, default: undefined },
    form: { type: String, default: undefined },
    modelValue: { type: String, default: undefined },
    defaultValue: { type: String, default: undefined },
  },
  emits: {
    /** React's onOpenChange. */
    "update:open": (_open: boolean) => true,
    /** React's onValueChange: the value chosen. */
    "update:modelValue": (_value: string) => true,
    /** The reset under a field that is not mixed was pressed: React's onResetMixed. */
    resetMixed: () => true,
  },
  slots: Object as SlotsType<{
    /** The trigger and the content, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { emit, slots }) {
    const { trackEvent } = useKozmosAnalytics();
    const valueBound = useWritten("modelValue", "model-value");
    const openBound = useWritten("open", "open");
    const listensForReset = useListens("onResetMixed");
    const contentId = useId();

    // A Select given `mixed` at all is the field of a multi-selection: it is
    // given a value from the first render to the last. Without the app's
    // value it holds the choice itself: `default-value` while not mixed,
    // none while it is, and the visitor's choice after; a value it held
    // before turning mixed is dropped.
    const takesMixed = () => props.mixed !== undefined;
    const held = ref<string>(
      props.mixed === true ? "" : (props.defaultValue ?? ""),
    );
    watch(
      () => props.mixed,
      (mixed) => {
        if (mixed === true) held.value = "";
      },
      { flush: "sync" },
    );
    // Not mixed and unbound: the root's own, as Radix's uncontrolled value.
    const own = ref<string | undefined>(props.defaultValue);
    const value = computed<string | undefined>(() => {
      if (takesMixed())
        return props.mixed === true ? "" : (props.modelValue ?? held.value);
      if (valueBound()) return props.modelValue ?? "";
      return props.modelValue ?? own.value;
    });
    const ownOpen = ref(props.defaultOpen ?? false);
    const open = computed(() =>
      openBound() ? !!props.open : (props.open ?? ownOpen.value),
    );

    const entries = reactive(new Map<string, SelectEntry>()) as Map<
      string,
      SelectEntry
    >;
    const trigger = shallowRef<HTMLElement | null>(null);
    const state: SelectState = {
      value,
      open,
      mixed: computed(() => props.mixed === true),
      mixedLabel: computed(() => props.mixedLabel),
      resetMixedLabel: computed(() => props.resetMixedLabel),
      resetMixed: computed(() =>
        listensForReset() && !props.disabled
          ? () => emit("resetMixed")
          : undefined,
      ),
      disabled: computed(() => !!props.disabled),
      entries,
      trigger,
      contentId,
    };
    provide(SelectKey, state);

    const setValue = (next: string) => {
      if (takesMixed()) held.value = next;
      else if (!valueBound() && props.modelValue === undefined)
        own.value = next;
      trackEvent("Select", "select_value_changed", { value: next });
      emit("update:modelValue", next);
    };
    const setOpen = (next: boolean) => {
      if (!openBound() && props.open === undefined) ownOpen.value = next;
      emit("update:open", next);
    };

    // The form's select: told of each new value as a native one is, with a
    // change that bubbles.
    const bubble = shallowRef<HTMLSelectElement | null>(null);
    watch(
      value,
      (next, previous) => {
        const select = bubble.value;
        if (!select || next === previous) return;
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype,
          "value",
        )?.set;
        if (!setter) return;
        setter.call(select, next);
        select.dispatchEvent(new Event("change", { bubbles: true }));
      },
      { flush: "post" },
    );
    // The value the form's select was drawn with, for the items it lists.
    let drawnFor: string | undefined;
    let drawnWith: string | undefined;

    return () => {
      const isFormControl = trigger.value
        ? !!props.form || !!trigger.value.closest("form")
        : true;
      const options = [...entries.values()];
      const nativeKey = options.map((option) => option.value).join(";");
      const current = value.value;
      if (nativeKey !== drawnFor) {
        drawnFor = nativeKey;
        drawnWith = current;
      }
      return h(
        RekaSelectRoot,
        {
          modelValue: current,
          "onUpdate:modelValue": (next: unknown) => setValue(next as string),
          open: open.value,
          "onUpdate:open": setOpen,
          dir: props.dir,
          disabled: props.disabled,
          required: props.required,
        },
        () => [
          ...(slots.default?.() ?? []),
          isFormControl
            ? h(
                "select",
                {
                  key: nativeKey,
                  ref: bubble,
                  "aria-hidden": "true",
                  required: props.required,
                  tabindex: "-1",
                  name: props.name,
                  autocomplete: props.autoComplete,
                  disabled: props.disabled,
                  form: props.form,
                  style: VISUALLY_HIDDEN,
                  onChange: (event: Event) =>
                    setValue((event.target as HTMLSelectElement).value),
                },
                [
                  current === undefined ? h("option", { value: "" }) : null,
                  ...options.map((option) =>
                    h(
                      "option",
                      {
                        key: option.value,
                        value: option.value,
                        disabled: option.disabled,
                        // React writes the value the select was drawn with
                        // as its default: that option's `selected`
                        // attribute, until new items draw it anew.
                        "^selected":
                          option.value === drawnWith ? "" : undefined,
                      },
                      option.text,
                    ),
                  ),
                ],
              )
            : null,
        ],
      );
    };
  },
});

/** Radix's Group: a `role="group"` named by its label. */
export const KozmosSelectGroup = defineComponent({
  name: "KozmosSelectGroup",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () =>
      h(RekaSelectGroup, { asChild: props.asChild, ...attrs }, () =>
        slots.default?.(),
      );
  },
});

/**
 * The words in the closed select: the chosen item's own words, or, with no
 * value, the `#placeholder` slot (React's `placeholder`). Mixed, it shows
 * the root's `mixed-label`, hidden from screen readers, since the trigger
 * is described by it. Drawn as Radix's `<span>`, not Reka's SelectValue,
 * which writes the item's text alone (Radix draws its nodes) and adds a
 * `data-placeholder`; as Radix's, it takes no class or style of the app's.
 */
export const KozmosSelectValue = defineComponent({
  name: "KozmosSelectValue",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    /** Shown while there is no value, as React's `placeholder`. */
    placeholder?: () => VNode[];
    /** Shown in place of the chosen item's words, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    const state = useSelect("KozmosSelectValue");
    const mounted = ref(false);
    onMounted(() => (mounted.value = true));
    return () => {
      // Radix's SelectValue takes no class or style of the app's.
      const rest: Record<string, unknown> = { ...attrs };
      delete rest.class;
      delete rest.style;
      const mixed = state.mixed.value;
      const value = state.value.value;
      const words = (): (VNode | string)[] | undefined => {
        if (showsPlaceholder(value))
          return mixed ? [state.mixedLabel.value] : slots.placeholder?.();
        const own = slots.default?.();
        if (own) return own;
        // The chosen item's words, once it is drawn (Radix's item text
        // portals them here from its list).
        return mounted.value && value !== undefined
          ? state.entries.get(value)?.words()
          : undefined;
      };
      return h(
        Primitive,
        {
          as: "span",
          asChild: props.asChild,
          "aria-hidden": mixed ? true : undefined,
          ...rest,
          style: { pointerEvents: "none" },
        },
        () => words(),
      );
    };
  },
});

/** What Radix's trigger writes first, in its order. */
const TRIGGER_FIRST = [
  "type",
  "role",
  "aria-controls",
  "aria-expanded",
  "aria-required",
  "aria-autocomplete",
  "dir",
  "data-state",
  "disabled",
  "data-disabled",
  "data-placeholder",
];

/**
 * The trigger's `<button>`, which Reka's trigger is drawn onto: its
 * attributes written in the order Radix's are, Radix's own first, then the
 * app's, so the list it controls is named before its own id, as React's
 * page has them.
 */
const TriggerButton = (
  _props: unknown,
  { attrs, slots }: { attrs: Props; slots: { default?: () => VNode[] } },
) => {
  const ordered: Props = {};
  for (const name of TRIGGER_FIRST)
    if (name in attrs) ordered[name] = attrs[name];
  for (const [name, value] of Object.entries(attrs))
    if (!(name in ordered)) ordered[name] = value;
  return h("button", ordered, slots.default?.());
};
TriggerButton.inheritAttrs = false;

/**
 * The closed field: the `<button role="combobox">` Radix's trigger draws,
 * from the shared recipe (`recipes/select.ts`), inside the FieldWrapper
 * React's draws it in (its error, and mixed, its description and reset),
 * with the chevron at its end. `variant="ghost"` draws no edge or fill at
 * rest (decision 151). Reka's trigger names its list in `aria-controls`
 * only while it is open; Radix's always does, and so does this one.
 */
export const KozmosSelectTrigger = defineComponent({
  name: "KozmosSelectTrigger",
  inheritAttrs: false,
  props: {
    // String first: "" is an error with no words, as React's `error=""` is.
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    wrapperClassName: { type: String, default: undefined },
    /**
     * `default` is the bordered field; `ghost` draws no edge and no fill at
     * rest, only the value and the chevron (decision 151, CLOUD-UI-009).
     */
    variant: {
      type: String as PropType<"default" | "ghost">,
      default: "default",
    },
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    /** The value, as React's `children`: a KozmosSelectValue. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    const state = useSelect("KozmosSelectTrigger");
    const errorId = useId();
    const mixedId = useId();
    const defaultTriggerId = useId();
    // Reka writes its own id for the list unless one is set first.
    const reka = injectSelectRootContext();
    reka.contentId = state.contentId;
    // Where the trigger was pressed, which the open list reads to swallow
    // the press's own release: Radix starts it unset, Reka at the page's
    // corner, so a list opened by the keyboard swallowed a press on a row
    // near (0, 0). Unset until a press sets it, as Radix's.
    reka.triggerPointerDownPosRef.value = null;
    // Listening before the list opens: the key that opens it comes first.
    useInputModality();
    // The button, as Reka knows it once mounted (its Slot keeps no ref of
    // ours), for the root's form test.
    onMounted(() => {
      state.trigger.value = reka.triggerElement.value ?? null;
    });
    onBeforeUnmount(() => {
      if (state.trigger.value === reka.triggerElement.value)
        state.trigger.value = null;
    });
    return () => {
      const {
        class: className,
        id,
        "aria-describedby": ariaDescribedBy,
        "aria-invalid": ariaInvalid,
        ...rest
      } = attrs as Record<string, unknown>;
      const triggerId = (id as string | undefined) ?? defaultTriggerId;
      const mixed = state.mixed.value;
      const hasError = !!props.error;
      const isStringError = typeof props.error === "string";
      const disabled = rest.disabled === true || rest.disabled === "";
      const reset = state.resetMixed.value;
      return h(
        KozmosFieldWrapper,
        {
          error: props.error,
          errorId,
          class: props.wrapperClassName,
          inputId: triggerId,
          mixed,
          mixedLabel: state.mixedLabel.value,
          mixedId,
          resetMixedLabel: state.resetMixedLabel.value,
          // Disabled on the trigger or on the root, as Radix disables it.
          ...(reset && !disabled ? { onResetMixed: reset } : {}),
        },
        () => [
          // The app's `disabled` is Reka's too, as Radix's trigger reads it.
          h(RekaSelectTrigger, { asChild: true, disabled }, () => {
            const own = {
              id: triggerId,
              // Reka names the list only while it is open; Radix always.
              "aria-controls": state.contentId,
              "data-mixed": mixed ? "" : undefined,
              "data-variant": props.variant === "ghost" ? "ghost" : undefined,
              "aria-invalid": hasError || ariaInvalid,
              "aria-describedby": mergeAriaIds(
                ariaDescribedBy as string | undefined,
                hasError && isStringError ? errorId : undefined,
                mixed ? mixedId : undefined,
              ),
              class: cn(
                SELECT_TRIGGER_CLASS,
                props.variant === "ghost" && SELECT_TRIGGER_GHOST_CLASS,
                hasError && SELECT_TRIGGER_ERROR_CLASS,
                normalizeClass(className),
              ),
              ...rest,
            };
            const children = [
              ...(slots.default?.() ?? []),
              h(ChevronDown, {
                "aria-hidden": "true",
                class: SELECT_ICON_CLASS,
              }),
            ];
            // Reka's trigger is drawn as its child: what is written here
            // wins over what Reka writes, as an app's props win over
            // Radix's. With `as-child`, the app's own child is the trigger.
            return props.asChild
              ? h(Primitive, { asChild: true, ...own }, () => children)
              : [h(TriggerButton, own, () => children)];
          }),
        ],
      );
    };
  },
});

/** The arrow at the list's top, drawn while it can scroll up. */
export const KozmosSelectScrollUpButton = defineComponent({
  name: "KozmosSelectScrollUpButton",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    /** Taken and not drawn: React's draws its own chevron. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        RekaSelectScrollUpButton,
        {
          asChild: props.asChild,
          class: cn(SELECT_SCROLL_BUTTON_CLASS, normalizeClass(className)),
          ...rest,
        },
        () => [h(ChevronUp, { class: SELECT_SCROLL_ICON_CLASS })],
      );
    };
  },
});

/** The arrow at the list's foot, drawn while it can scroll down. */
export const KozmosSelectScrollDownButton = defineComponent({
  name: "KozmosSelectScrollDownButton",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    /** Taken and not drawn: React's draws its own chevron. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        RekaSelectScrollDownButton,
        {
          asChild: props.asChild,
          class: cn(SELECT_SCROLL_BUTTON_CLASS, normalizeClass(className)),
          ...rest,
        },
        () => [h(ChevronDown, { class: SELECT_SCROLL_ICON_CLASS })],
      );
    };
  },
});

/** What Reka's popper writes of the content's own props (bodyLock and the rest). */
const LEAKED_ATTRIBUTES = [
  "bodylock",
  "disableoutsidepointerevents",
  "position",
];

/** Radix's names for the sizes React's classes read, from Reka's. */
const RADIX_VARIABLES = {
  "--radix-select-content-transform-origin":
    "var(--reka-select-content-transform-origin)",
  "--radix-select-content-available-width":
    "var(--reka-select-content-available-width)",
  "--radix-select-content-available-height":
    "var(--reka-select-content-available-height)",
  "--radix-select-trigger-width": "var(--reka-select-trigger-width)",
  "--radix-select-trigger-height": "var(--reka-select-trigger-height)",
};

/**
 * The open list: React's panel, from the shared recipe, placed beside the
 * trigger (`position="popper"`, the default), in the theme's portal (or
 * `portal-container`), carrying the density where it opened, as React's
 * ThemePortal marks it, and the hand that moved last. As Radix's Select is
 * modal, the page outside is kept out of reach exactly where aria-hidden's
 * hideOthers keeps it visible (GAP-193).
 *
 * Closed, Reka draws an empty `<div>` in the list's place to hold its items;
 * Radix draws nothing there. The list is drawn in a fragment of its own
 * while closed, then, open, in the portal, until its exit is over.
 */
export const KozmosSelectContent = defineComponent({
  name: "KozmosSelectContent",
  inheritAttrs: false,
  props: {
    portalContainer: {
      type: null as unknown as PropType<Element | DocumentFragment | null>,
      default: undefined,
    },
    asChild: { type: Boolean, default: undefined },
    side: { type: String as PropType<KozmosSelectSide>, default: undefined },
    sideOffset: { type: Number, default: undefined },
    align: { type: String as PropType<KozmosSelectAlign>, default: undefined },
    alignOffset: { type: Number, default: undefined },
    arrowPadding: { type: Number, default: undefined },
    avoidCollisions: { type: Boolean, default: undefined },
    collisionBoundary: {
      type: null as unknown as PropType<Element | null | (Element | null)[]>,
      default: undefined,
    },
    collisionPadding: {
      type: [Number, Object] as PropType<
        number | Partial<Record<KozmosSelectSide, number>>
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
    position: {
      type: String as PropType<"item-aligned" | "popper">,
      default: "popper",
    },
  },
  emits: {
    /** Focus is about to return to the trigger as the list closes. */
    closeAutoFocus: (_event: Event) => true,
    /** Escape was pressed while the list was open. */
    escapeKeyDown: (_event: KeyboardEvent) => true,
    /** A press outside the list. */
    pointerDownOutside: (
      _event: CustomEvent<{ originalEvent: PointerEvent }>,
    ) => true,
  },
  slots: Object as SlotsType<{
    /** The items, groups, labels and separators. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, emit, slots }) {
    const state = useSelect("KozmosSelectContent");
    const theme = inject(ThemeKey, undefined);
    const density = useKozmosDensity();
    // Radix focuses its items under the pointer too, so the row's keyboard
    // ring reads which hand moved last (owned-selection.css).
    const modality = useInputModality();
    const fragment = shallowRef<DocumentFragment | null>(null);
    onMounted(() => {
      fragment.value = document.createDocumentFragment();
    });
    // In the portal from opening until the exit is over.
    const shown = ref(state.open.value);
    let release: (() => void) | undefined;
    let observer: MutationObserver | undefined;
    // Radix's Select is always modal: as it opens it hides the page with
    // hideOthers, so the page is kept in reach where that keeps it visible
    // (GAP-193), and given back as it closes, before focus goes back to the
    // trigger (Reka's list leaves only once its exit is over).
    const giveBack = () => {
      release?.();
      release = undefined;
    };
    watch(state.open, (open) => {
      if (open) shown.value = true;
      else giveBack();
    });
    const instance = shallowRef<{ $el?: unknown } | null>(null);
    /** Reka's list, as it is drawn now: open, the popper wrapper's child. */
    const contentElement = (): HTMLElement | null => {
      const node = instance.value?.$el;
      const element =
        node instanceof HTMLElement &&
        node.hasAttribute("data-reka-popper-content-wrapper")
          ? node.firstElementChild
          : node;
      return element instanceof HTMLElement &&
        element.getAttribute("role") === "listbox"
        ? element
        : null;
    };
    const follow = () => {
      const element = contentElement();
      if (!element) {
        // Closed and gone: back to the fragment.
        if (!state.open.value && shown.value) {
          shown.value = false;
          observer?.disconnect();
          observer = undefined;
        }
        return;
      }
      // Reka 2.11 hands its content's own props on to the popper, which
      // writes them as attributes Radix's list has not: taken off. Vue
      // writes an attribute again only when its value changes, and these
      // do not.
      for (const name of LEAKED_ATTRIBUTES) element.removeAttribute(name);
      if (state.open.value && !release)
        release = inertOutside(element, { mirrorAriaHidden: true });
      // The list leaves when its exit is over, in Reka's own render: seen
      // in the portal it is drawn in.
      if (!observer && typeof MutationObserver !== "undefined") {
        observer = new MutationObserver(follow);
        observer.observe(
          element.closest("[data-kozmos-portal]") ?? element.ownerDocument.body,
          { childList: true, subtree: true },
        );
      }
    };
    onMounted(() => nextTick(follow));
    onUpdated(() => nextTick(follow));
    onBeforeUnmount(() => {
      giveBack();
      observer?.disconnect();
    });

    return () => {
      if (!fragment.value) return null;
      const container =
        props.portalContainer !== undefined
          ? props.portalContainer
          : theme
            ? theme.portalContainer.value
            : document.body;
      // Do not draw in the body briefly and again once the provider's own
      // portal exists.
      if (shown.value && !container) return null;
      const {
        class: className,
        style,
        ...rest
      } = attrs as Record<string, unknown>;
      const popper = props.position === "popper";
      return h(Teleport, { to: shown.value ? container : fragment.value }, [
        h(
          RekaSelectContent,
          {
            ref: (element: unknown) => {
              instance.value = element as { $el?: unknown } | null;
            },
            asChild: props.asChild,
            side: props.side,
            sideOffset: props.sideOffset,
            align: props.align,
            alignOffset: props.alignOffset,
            arrowPadding: props.arrowPadding,
            avoidCollisions: props.avoidCollisions,
            collisionBoundary: props.collisionBoundary,
            collisionPadding: props.collisionPadding,
            sticky: props.sticky,
            hideWhenDetached: props.hideWhenDetached,
            updatePositionStrategy: props.updatePositionStrategy,
            position: props.position,
            onCloseAutoFocus: (event: Event) => emit("closeAutoFocus", event),
            onEscapeKeyDown: (event: KeyboardEvent) =>
              emit("escapeKeyDown", event),
            onPointerDownOutside: (
              event: CustomEvent<{ originalEvent: PointerEvent }>,
            ) => emit("pointerDownOutside", event),
            class: cn(
              SELECT_CONTENT_CLASS,
              popper && SELECT_CONTENT_POPPER_CLASS,
              normalizeClass(className),
            ),
            "data-modality": modality.value,
            "data-kozmos-density": density?.value,
            ...rest,
            style: [RADIX_VARIABLES, style],
          },
          () => [
            h(KozmosSelectScrollUpButton),
            h(
              RekaSelectViewport,
              {
                class: cn(
                  SELECT_VIEWPORT_CLASS,
                  popper && SELECT_VIEWPORT_POPPER_CLASS,
                ),
              },
              () => slots.default?.(),
            ),
            h(KozmosSelectScrollDownButton),
          ],
        ),
      ]);
    };
  },
});

/** A group's name, drawn as React's label. */
export const KozmosSelectLabel = defineComponent({
  name: "KozmosSelectLabel",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        RekaSelectLabel,
        {
          asChild: props.asChild,
          class: cn(SELECT_LABEL_CLASS, normalizeClass(className)),
          ...rest,
        },
        () => slots.default?.(),
      );
    };
  },
});

/** The item's row, which Reka's item is drawn onto. */
const ItemRow = (
  _props: unknown,
  { attrs, slots }: { attrs: Props; slots: { default?: () => VNode[] } },
) => h("div", attrs, slots.default?.());
ItemRow.inheritAttrs = false;
/** With `as-child`, the app's own child is the row. */
const ItemChild = (
  _props: unknown,
  { attrs, slots }: { attrs: Props; slots: { default?: () => VNode[] } },
) => h(Primitive, { asChild: true, ...attrs }, () => slots.default?.());
ItemChild.inheritAttrs = false;

/** A slot's text, when it draws text alone: "POI", or "96". */
function textOf(nodes: VNode[] | undefined): string | undefined {
  if (!nodes || nodes.length !== 1) return undefined;
  const node = nodes[0];
  return isVNode(node) &&
    node.type === Text &&
    typeof node.children === "string"
    ? node.children
    : undefined;
}

/**
 * One option: Combobox's row (owned-selection.css), the words, then a
 * count's Counter (`#count`, GAP-164) and the check's place, kept on every
 * row so counts form one column (decision 1). A count that is a number
 * alone is written in the app's grouping, "1,284" ("1.284" in German), and
 * the row is named by its words, then its count: "POI, 96"; an app's
 * `aria-label` wins. The check is drawn while the item is the value.
 *
 * Reka marks a row `aria-selected` whenever it is the value; Radix only
 * while it is the value and has focus, and so does this one.
 */
export const KozmosSelectItem = defineComponent({
  name: "KozmosSelectItem",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    value: { type: String, required: true },
    textValue: { type: String, default: undefined },
  },
  slots: Object as SlotsType<{
    /** A count beside the option's words, as React's `count`. */
    count?: () => VNode[];
    /** The option's words, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    const state = useSelect("KozmosSelectItem");
    const textId = useId();
    const countId = useId();
    const serverRender = inject(ssrContextKey, null) !== null;
    const locale = serverRender ? "en-US" : resolveLocale();
    const focused = ref(false);
    const textElement = shallowRef<HTMLElement | null>(null);
    const countElement = shallowRef<HTMLElement | null>(null);
    const drawnName = ref<string | null>(null);
    // What the last render drew, for the name read from the page after it.
    let plainName: string | null = null;
    let hasCount = false;
    const readDrawn = () => {
      const words = textElement.value?.textContent?.trim();
      const number = countElement.value?.textContent?.trim();
      const next =
        hasCount && !plainName && words && number
          ? `${words}, ${number}`
          : null;
      if (drawnName.value !== next) drawnName.value = next;
    };
    // The root's own list of items, for the form's select and the trigger's
    // words, once the item's words are drawn.
    let registered: string | undefined;
    const register = () => {
      if (!textElement.value) return;
      if (registered !== undefined && registered !== props.value)
        state.entries.delete(registered);
      registered = props.value;
      state.entries.set(props.value, {
        value: props.value,
        disabled: !!props.disabled,
        text: textElement.value.textContent ?? "",
        words: () => slots.default?.(),
      });
    };
    onMounted(() => {
      readDrawn();
      register();
    });
    onUpdated(readDrawn);
    watch(
      () => [props.value, props.disabled],
      () => register(),
    );
    // Gone a task later, unless drawn again by then: Reka draws an item
    // twice over, in its open list and in the closed one's fragment, and
    // between the two its exit leaves a render with neither. Radix's
    // switches in one commit, so its form's select is never drawn anew.
    onBeforeUnmount(() => {
      const value = registered;
      const entry = value === undefined ? undefined : state.entries.get(value);
      if (value === undefined || !entry) return;
      setTimeout(() => {
        if (state.entries.get(value) === entry) state.entries.delete(value);
      }, 0);
    });

    return () => {
      const {
        class: className,
        onFocus,
        onBlur,
        ...rest
      } = attrs as Record<string, unknown>;
      const words = slots.default?.();
      const countNodes = drawn(slots.count?.());
      const countText = textOf(countNodes);
      hasCount = hasSelectCount(countNodes);
      // A count that is a number alone is React's number count.
      const countShown =
        countText !== undefined && /^-?\d+(\.\d+)?$/.test(countText.trim())
          ? [
              createTextVNode(
                String(selectCountText(Number(countText.trim()), locale)),
              ),
            ]
          : countNodes;
      const shownText = textOf(countShown);
      const wordsText = textOf(words);
      plainName =
        hasCount && isPlainText(wordsText) && isPlainText(shownText)
          ? `${wordsText}, ${shownText}`
          : null;
      const naming = selectItemNaming({
        callerLabel: rest["aria-label"] as string | undefined,
        callerLabelledBy: rest["aria-labelledby"] as string | undefined,
        hasCount,
        name: plainName ?? drawnName.value,
        textId,
        countId,
      });
      const selected = state.value.value === props.value;
      const own = {
        class: cn(SELECT_ITEM_CLASS, normalizeClass(className)),
        ...rest,
        ...naming,
        // Reka marks the value's row selected; Radix only while focused.
        "aria-selected": selected && focused.value,
        onFocus: (event: FocusEvent) => {
          callAll(onFocus, event);
          focused.value = true;
        },
        onBlur: (event: FocusEvent) => {
          callAll(onBlur, event);
          focused.value = false;
        },
      };
      // Reka's item is drawn onto a row of ours, so what is written here
      // wins over what Reka writes (its aria-selected, its aria-labelledby
      // where React takes it away), as React's props win over Radix's.
      return h(
        RekaSelectItem,
        {
          asChild: true,
          disabled: props.disabled,
          value: props.value,
          textValue: props.textValue,
        },
        () => [
          h(props.asChild ? ItemChild : ItemRow, own, () => rowChildren()),
        ],
      );
      function rowChildren() {
        return [
          h("span", { class: OPTION_CONTENT_CLASS }, [
            h(
              RekaSelectItemText,
              {
                ref: (element: unknown) => {
                  const node =
                    (element as { $el?: HTMLElement } | null)?.$el ??
                    (element as HTMLElement | null);
                  textElement.value = node ?? null;
                },
                ...(hasCount ? { id: textId } : {}),
              },
              () => words,
            ),
          ]),
          hasCount
            ? h(
                KozmosCounter,
                {
                  ref: (element: unknown) => {
                    countElement.value =
                      (element as { $el?: HTMLElement } | null)?.$el ??
                      (element as HTMLElement | null);
                  },
                  id: countId,
                  class: SELECT_ITEM_COUNT_CLASS,
                },
                () => countShown,
              )
            : null,
          h(
            "span",
            {
              "data-slot": "select-item-check",
              class: SELECT_ITEM_CHECK_SLOT_CLASS,
            },
            // Radix's ItemIndicator: drawn while the item is the value,
            // hidden; Reka's adds a data-state Radix's has not.
            selected
              ? [h(Check, { "aria-hidden": "true", class: OPTION_CHECK_CLASS })]
              : [],
          ),
        ];
      }
    };
  },
});

/** A line between groups. */
export const KozmosSelectSeparator = defineComponent({
  name: "KozmosSelectSeparator",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    return () => {
      const { class: className, ...rest } = attrs;
      return h(
        RekaSelectSeparator,
        {
          asChild: props.asChild,
          class: cn(SELECT_SEPARATOR_CLASS, normalizeClass(className)),
          ...rest,
        },
        () => slots.default?.(),
      );
    };
  },
});
