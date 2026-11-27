import {
  computed,
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
  ref,
  shallowRef,
  useId,
  watch,
  type Component,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { ChevronDown, X } from "@kozmos-ds/icons/vue";
import {
  cn,
  COMBOBOX_ACTION_GLYPH_CLASS,
  COMBOBOX_ACTION_ICON_CLASS,
  COMBOBOX_ACTION_LABEL_CLASS,
  COMBOBOX_ACTIONS_START_CLASS,
  COMBOBOX_EMPTY_CLASS,
  COMBOBOX_INPUT_CLASS,
  COMBOBOX_LIST_CLASS,
  COMBOBOX_POPUP_CLASS,
  COMBOBOX_POPUP_INLINE_CLASS,
  defaultFilterOption,
  FIELD_ACTION,
  FIELD_ACTIONS_ROW,
  FIELD_CHEVRON_CLASS,
  FIELD_CHEVRON_OPEN_CLASS,
  FIELD_POPUP_MAX_HEIGHT,
  fieldActionsRoom,
  firstAutomaticKey,
  firstEnabledIndex,
  groupOf,
  inputVariants,
  keepsFieldFocus,
  mergeAriaIds,
  nextEnabledIndex,
  OPTION_CLASS,
  orderByGroup,
  popupEntryKey,
  scrollbarFor,
  scrollOptionIntoView,
  validPopupActions,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import {
  attributeFlag,
  readOnlyOf,
  useListens,
  without,
} from "../FieldWrapper/fieldModel";
import type { KozmosInputStatus } from "../Input/types";
import {
  callAll,
  drawOptionGroups,
  drawOptionRow,
  useInputModality,
} from "../Listbox/options";
import type { KozmosComboboxOption } from "../Listbox/types";
import { KozmosFieldPopper } from "./fieldPopper";
import { joinLayers } from "../shared/layers";
import {
  MapShellPresentationKey,
  type KozmosComboboxPopupAction,
} from "./types";

type Entry =
  | { kind: "value"; option: KozmosComboboxOption; disabled?: boolean }
  | { kind: "action"; action: KozmosComboboxPopupAction; disabled?: boolean };
const entryKey = (entry: Entry) => popupEntryKey(entry);
const NO_ACTIONS: KozmosComboboxPopupAction[] = [];
/** The shared recipe's filter, under the prop's own type. */
type KozmosComboboxFilter = (
  option: KozmosComboboxOption,
  inputValue: string,
) => boolean;
const filterDefault: KozmosComboboxFilter = (option, inputValue) =>
  !!defaultFilterOption(option, inputValue);

/** Whether the parent wrote a prop, in either spelling: a model it owns. */
function useWritten(camel: string, kebab: string) {
  const instance = getCurrentInstance();
  return () => {
    const props = instance?.vnode.props ?? {};
    return camel in props || kebab in props;
  };
}

/**
 * Says when the popup's list is in the page, as React's FieldPopupDrawn:
 * true as it mounts, false as it goes. The field names an active option
 * only while its list is drawn (GAP-231).
 */
const Drawn = defineComponent({
  props: {
    onDrawn: {
      type: Function as PropType<(drawn: boolean) => void>,
      required: true,
    },
  },
  setup(props) {
    onMounted(() => props.onDrawn(true));
    onBeforeUnmount(() => props.onDrawn(false));
    return () => null;
  },
});

/** A command's icon: a Vue component, or a VNode as it is. */
const iconOf = (icon: Component | VNode) => (isVNode(icon) ? icon : h(icon));

/**
 * Vue's counterpart of React's Combobox: a text field that filters a list of
 * options under it, drawn as React's draws it, inside a KozmosFieldWrapper,
 * from the shared recipes (`recipes/combobox.ts`, `recipes/option.ts`).
 * Focus stays in the field, which points at its active option with
 * `aria-activedescendant`; the arrows move it (Home and End to the ends),
 * Enter chooses it, Escape closes the list, and a press outside or focus
 * leaving closes it. Its options are under their groups (GAP-192), and its
 * `popup-actions` follow them, never filtered, never the value.
 *
 * `v-model` is React's `value` and `onValueChange`, emitted with the option
 * chosen (or `""` and no option for a clear); `v-model:input-value` is the
 * field's text, React's `inputValue`. Unbound, each is the field's own, from
 * `default-value` and `default-input-value`. A new choice shows its label;
 * text the visitor typed is kept otherwise (GAP-232). Mixed (GAP-153), no
 * option is the choice and the field shows `mixed-label`; a `@reset-mixed`
 * listener draws the reset. Choices are reported as `option_selected`
 * (without the value when `include-value-in-analytics` is false) and
 * clears as `selection_cleared`.
 *
 * The overlay popup is drawn in the theme's portal, placed under the field
 * as React's popper places it (`fieldPopper.ts`); `popup-layout="inline"`
 * draws it in the flow under the field. React's popup is also a Radix
 * DismissableLayer, so Radix's own overlays around it see it as the layer
 * above them; Reka UI keeps its layer to itself, so this popup joins the
 * Vue overlays' stack by its DOM contract (`../shared/layers.ts`).
 */
export const KozmosCombobox = defineComponent({
  name: "KozmosCombobox",
  inheritAttrs: false,
  props: {
    clearable: { type: Boolean, default: true },
    clearLabel: { type: String, default: "Clear selection" },
    openLabel: { type: String, default: "Open options" },
    closeLabel: { type: String, default: "Close options" },
    /** Legacy generic analytics by default; sensitive place pickers must omit values. */
    includeValueInAnalytics: { type: Boolean, default: true },
    defaultInputValue: { type: String, default: undefined },
    defaultValue: { type: String, default: undefined },
    emptyText: { type: String, default: "No results found" },
    // String first: "" is an error with no words, as React's `error=""` is.
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    filterOption: {
      type: Function as PropType<KozmosComboboxFilter>,
      default: filterDefault,
    },
    helperText: { type: String, default: undefined },
    inputValue: { type: String, default: undefined },
    label: { type: String, default: undefined },
    options: {
      type: Array as PropType<KozmosComboboxOption[]>,
      required: true,
    },
    /** Commands after the options: they share the keys, never the value. */
    popupActions: {
      type: Array as PropType<KozmosComboboxPopupAction[]>,
      default: () => NO_ACTIONS,
    },
    /** Inline takes its place in a sheet's flow instead of overlaying what follows. */
    popupLayout: {
      type: String as PropType<"overlay" | "inline">,
      default: "overlay",
    },
    status: {
      type: String as PropType<KozmosInputStatus>,
      default: "default",
    },
    modelValue: { type: String, default: undefined },
    wrapperClassName: { type: String, default: undefined },
    mixed: { type: Boolean, default: false },
    mixedLabel: { type: String, default: "Multiple values" },
    resetMixedLabel: { type: String, default: undefined },
  },
  emits: {
    /** React's onInputValueChange: the field's new text. */
    "update:inputValue": (_value: string) => true,
    /** React's onValueChange: the value chosen and its option, or "" and none. */
    "update:modelValue": (_value: string, _option?: KozmosComboboxOption) =>
      true,
    /** The reset under a field that is not mixed was pressed: React's onResetMixed. */
    resetMixed: () => true,
  },
  slots: Object as SlotsType<Record<never, never>>,
  setup(props, { attrs, emit }) {
    const { trackEvent } = useKozmosAnalytics();
    // The active row's keyboard ring (owned-selection.css): its rows never
    // take focus (aria-activedescendant), so the list reads which hand moved.
    const modality = useInputModality();
    const presentation = inject(MapShellPresentationKey, null);
    const listensForReset = useListens("onResetMixed");
    const valueBound = useWritten("modelValue", "model-value");
    const inputBound = useWritten("inputValue", "input-value");
    const root = shallowRef<HTMLElement | null>(null);
    const anchor = shallowRef<HTMLElement | null>(null);
    const field = shallowRef<HTMLInputElement | null>(null);
    // The overlay popup is in a portal, outside the root: a press or focus
    // inside it is still inside the field.
    const popup = shallowRef<HTMLElement | null>(null);
    const listboxDrawn = ref(false);
    const defaultInputId = useId();
    const errorId = useId();
    const helperId = useId();
    const listboxId = useId();
    const open = ref(false);

    const disabled = () => attributeFlag(attrs.disabled);
    const readOnly = () => readOnlyOf(attrs);
    // Made disabled or read-only, the field shows its popup closed at once,
    // and it stays closed when it is free again.
    const locked = () => disabled() || readOnly();
    onUpdated(() => {
      if (locked() && open.value) open.value = false;
    });

    const ownValue = ref(props.defaultValue || "");
    // Mixed (GAP-153), no option is the choice.
    const selectedValue = computed(() =>
      props.mixed
        ? ""
        : valueBound()
          ? (props.modelValue ?? "")
          : (props.modelValue ?? ownValue.value),
    );
    const selectedOption = computed(() =>
      props.options.find((option) => option.value === selectedValue.value),
    );
    const inputHeld = () => inputBound() || props.inputValue !== undefined;
    const ownInput = ref(
      props.defaultInputValue ?? selectedOption.value?.label ?? "",
    );
    // Who last wrote the field's own text: the field, with the chosen
    // option's label, or the visitor, by typing. A nonblank draft from
    // default-input-value counts as the visitor's.
    const textByVisitor = ref(
      props.defaultInputValue !== undefined && props.defaultInputValue !== "",
    );
    // A new choice puts its label in the field's own text; anything else
    // leaves text the visitor typed as it is (GAP-232): while the text is
    // the field's own, a new label for the same choice replaces it, and a
    // choice cleared to no option empties it; a choice whose option has
    // left `options` keeps it. Text the app holds is the app's.
    watch(
      [selectedValue, () => selectedOption.value?.label],
      ([value, label], [previousValue]) => {
        const choiceChanged = previousValue !== value;
        if (
          !inputHeld() &&
          (label === undefined
            ? choiceChanged && !textByVisitor.value
            : choiceChanged || !textByVisitor.value)
        ) {
          ownInput.value = label ?? "";
          textByVisitor.value = false;
        }
      },
      { flush: "sync" },
    );
    const visibleInputValue = computed(() =>
      inputBound()
        ? (props.inputValue ?? "")
        : (props.inputValue ?? ownInput.value),
    );

    // In the order they are drawn: under their groups (GAP-192).
    const filteredOptions = computed(() =>
      orderByGroup(
        props.options.filter((option) =>
          props.filterOption(option, visibleInputValue.value),
        ),
        props.options,
      ),
    );
    const validActions = computed(() =>
      validPopupActions(props.popupActions ?? NO_ACTIONS),
    );
    const entries = computed<Entry[]>(() => [
      ...filteredOptions.value.map((option) => ({
        kind: "value" as const,
        option,
        disabled: option.disabled,
      })),
      ...validActions.value.map((action) => ({
        kind: "action" as const,
        action,
        disabled: action.disabled,
      })),
    ]);
    const activeKey = ref<string | null>(firstAutomaticKey(entries.value));
    // New typed text makes the first option active, and new entries keep
    // the active one only while it is still drawn and enabled (GAP-231).
    watch(
      [entries, visibleInputValue],
      ([now, query], [, previousQuery]) => {
        if (
          previousQuery !== query ||
          !now.some(
            (entry) => !entry.disabled && entryKey(entry) === activeKey.value,
          )
        )
          activeKey.value = firstAutomaticKey(now);
      },
      { flush: "sync" },
    );
    const activeIndex = computed(() =>
      entries.value.findIndex(
        (entry) => !entry.disabled && entryKey(entry) === activeKey.value,
      ),
    );
    const setActiveIndex = (index: number) => {
      const entry = entries.value[index];
      activeKey.value = entry ? entryKey(entry) : null;
    };
    const popupOpen = () => open.value && !locked();
    const inputId = () => (attrs.id as string | undefined) || defaultInputId;
    const activeOptionId = computed(() => {
      const entry =
        activeIndex.value >= 0 ? entries.value[activeIndex.value] : null;
      return popupOpen() && listboxDrawn.value && entry
        ? `${inputId()}-option-${activeIndex.value}`
        : undefined;
    });
    watch(
      activeOptionId,
      (id) => {
        if (id)
          scrollOptionIntoView(root.value?.ownerDocument.getElementById(id));
      },
      { flush: "post" },
    );

    // A press outside the field and its popup closes it; a host toolbar may
    // keep the field's focus for its own clear or cancel.
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as Node;
      if (!root.value?.contains(target) && !popup.value?.contains(target))
        open.value = false;
    };
    watch(open, (now) => {
      if (now) document.addEventListener("mousedown", onDocumentMouseDown);
      else document.removeEventListener("mousedown", onDocumentMouseDown);
    });
    onBeforeUnmount(() =>
      document.removeEventListener("mousedown", onDocumentMouseDown),
    );

    const setInputValue = (next: string) => {
      if (!inputHeld()) ownInput.value = next;
      emit("update:inputValue", next);
    };
    // A text the app holds and did not take is taken back, as React's
    // controlled input takes it back.
    const showHeld = () => {
      const element = field.value;
      if (element && element.value !== visibleInputValue.value)
        element.value = visibleInputValue.value;
    };
    onUpdated(showHeld);

    const selectOption = (option: KozmosComboboxOption | undefined) => {
      if (!option || option.disabled || disabled() || readOnly()) return;
      if (!valueBound() && props.modelValue === undefined)
        ownValue.value = option.value;
      setInputValue(option.label);
      textByVisitor.value = false;
      open.value = false;
      trackEvent(
        "Combobox",
        "option_selected",
        props.includeValueInAnalytics ? { value: option.value } : undefined,
      );
      emit("update:modelValue", option.value, option);
    };
    const selectEntry = (entry: Entry | null | undefined) => {
      if (!entry || entry.disabled || disabled() || readOnly()) return;
      if (entry.kind === "value") return selectOption(entry.option);
      root.value?.querySelector("input")?.focus();
      open.value = false;
      entry.action.onAction();
    };
    const clearSelection = () => {
      // Mixed, there is no choice to clear, only the visitor's query: an
      // empty choice reported here would read as an edit that empties the
      // property across the whole selection (GAP-153).
      if (props.mixed) {
        setInputValue("");
        textByVisitor.value = false;
        open.value = false;
        return;
      }
      if (!valueBound() && props.modelValue === undefined) ownValue.value = "";
      setInputValue("");
      textByVisitor.value = false;
      open.value = false;
      trackEvent("Combobox", "selection_cleared", {});
      emit("update:modelValue", "", undefined);
    };

    // React's autoFocus focuses the field as it mounts, and writes no
    // attribute of its own.
    onMounted(() => {
      if (attributeFlag(attrs.autofocus ?? attrs.autoFocus))
        field.value?.focus();
    });

    return () => {
      const {
        class: className,
        placeholder = "Select option",
        required,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy,
        "aria-describedby": callerDescribedBy,
        "aria-invalid": callerInvalid,
        onBlur,
        onFocus,
        onKeydown,
        onInput,
        ...others
      } = attrs as Record<string, unknown>;
      const rest = without(
        others,
        "id",
        "disabled",
        "readonly",
        "readOnly",
        "read-only",
        "autofocus",
        "autoFocus",
      );
      const isDisabled = disabled();
      const isReadOnly = readOnly();
      const isRequired = attributeFlag(required);
      const id = inputId();
      const list = entries.value;
      const filtered = filteredOptions.value;
      const actions = validActions.value;
      const active = activeIndex.value;
      const isOpen = popupOpen();
      const resolvedStatus: KozmosInputStatus = props.error
        ? "error"
        : props.status;
      const supportingText =
        typeof props.error === "string" && props.error
          ? props.error
          : props.helperText;
      const showEmptyText = props.emptyText !== supportingText;
      const hasPopupContent = list.length > 0 || showEmptyText;
      // Open with nothing to show is not shown: no layer to swallow a
      // parent's Escape, and no Escape of its own to claim.
      const popupVisible = isOpen && hasPopupContent;
      const describedBy =
        props.error && typeof props.error === "string"
          ? errorId
          : props.helperText
            ? helperId
            : undefined;
      const activeOption = active >= 0 ? list[active] : null;
      const listboxOpen = isOpen && list.length > 0;
      const showsEmptyText =
        popupVisible && filtered.length === 0 && showEmptyText;
      const text = visibleInputValue.value;
      const canClear =
        props.clearable && !isDisabled && !isReadOnly && Boolean(text);

      const renderEntry = (entry: Entry, index: number): VNode => {
        if (entry.kind === "action")
          return h(
            "div",
            {
              key: `action:${entry.action.id}`,
              role: "option",
              id: `${id}-option-${index}`,
              "aria-selected": false,
              "aria-disabled": entry.disabled || undefined,
              "data-active":
                index === active && !entry.disabled ? "true" : undefined,
              class: cn(
                OPTION_CLASS,
                index === filtered.length && COMBOBOX_ACTIONS_START_CLASS,
              ),
              onMouseenter: () => {
                if (!entry.disabled) setActiveIndex(index);
              },
              onMousedown: (event: MouseEvent) => event.preventDefault(),
              onClick: () => selectEntry(entry),
            },
            [
              entry.action.icon
                ? h(
                    "span",
                    {
                      "aria-hidden": "true",
                      class: COMBOBOX_ACTION_ICON_CLASS,
                    },
                    [iconOf(entry.action.icon)],
                  )
                : null,
              h(
                "span",
                { class: COMBOBOX_ACTION_LABEL_CLASS },
                entry.action.label,
              ),
            ],
          );
        const option = entry.option;
        return drawOptionRow({
          option,
          selected: option.value === selectedValue.value,
          active: index === active,
          disabled: option.disabled,
          id: `${id}-option-${index}`,
          extra: {
            key: `value:${option.value}`,
            onMouseenter: () => {
              if (!option.disabled) setActiveIndex(index);
            },
            onMousedown: (event: MouseEvent) => event.preventDefault(),
            onClick: () => selectEntry(entry),
          },
        });
      };

      const empty = () =>
        h("div", { class: COMBOBOX_EMPTY_CLASS }, props.emptyText);
      const frame = h(
        "div",
        {
          ref: popup,
          // A layer of the overlays' stack, as React's popup is a Radix
          // DismissableLayer with no dismiss of its own: a Dialog, Drawer or
          // Popover it opens in hears a press in it as inside, and it takes
          // the pointer a modal under it turned off (shared/layers.ts).
          ...joinLayers(popup.value),
          "data-combobox-popup": "",
          onMousedown: (event: MouseEvent) => {
            if (keepsFieldFocus(event.target, event.offsetX, event.offsetY))
              event.preventDefault();
          },
          class: cn(
            COMBOBOX_POPUP_CLASS,
            props.popupLayout === "inline" && COMBOBOX_POPUP_INLINE_CLASS,
          ),
          style: {
            maxHeight: FIELD_POPUP_MAX_HEIGHT,
            ...joinLayers(popup.value).style,
          },
        },
        [
          // Plain text: the field's status says it aloud.
          filtered.length === 0 && actions.length > 0 && showEmptyText
            ? empty()
            : null,
          h(
            "div",
            {
              id: listboxOpen ? listboxId : undefined,
              class: COMBOBOX_LIST_CLASS,
              "data-modality": modality.value,
              "data-kozmos-scrollbar": scrollbarFor(presentation),
              role: listboxOpen ? "listbox" : undefined,
              "aria-label": listboxOpen
                ? ((ariaLabel as string | undefined) ?? props.label)
                : undefined,
              "aria-labelledby": listboxOpen ? ariaLabelledBy : undefined,
            },
            [
              h(Drawn, {
                onDrawn: (drawn: boolean) => (listboxDrawn.value = drawn),
              }),
              ...(list.length === 0
                ? showEmptyText
                  ? [empty()]
                  : []
                : [
                    ...drawOptionGroups(
                      list.slice(0, filtered.length),
                      (entry) =>
                        entry.kind === "value"
                          ? groupOf(entry.option)
                          : undefined,
                      id,
                      renderEntry,
                    ),
                    ...list
                      .slice(filtered.length)
                      .map((entry, offset) =>
                        renderEntry(entry, filtered.length + offset),
                      ),
                  ]),
            ],
          ),
        ],
      );

      const input = h("input", {
        ref: field,
        id,
        role: "combobox",
        "aria-autocomplete": "list",
        "aria-controls": listboxOpen ? listboxId : undefined,
        "aria-expanded": listboxOpen,
        "aria-haspopup": "listbox",
        "aria-activedescendant": isOpen ? activeOptionId.value : undefined,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy,
        "aria-describedby": mergeAriaIds(
          callerDescribedBy as string | undefined,
          describedBy,
        ),
        "aria-invalid": resolvedStatus === "error" ? true : callerInvalid,
        autocomplete: "off",
        class: cn(
          inputVariants({ status: resolvedStatus }),
          // Room for the buttons, each as tall as the field (decision 82).
          COMBOBOX_INPUT_CLASS,
          fieldActionsRoom(canClear),
          normalizeClass(className),
        ),
        "data-clearable": canClear ? "" : undefined,
        "data-mixed": props.mixed ? "" : undefined,
        disabled: isDisabled,
        readonly: isReadOnly,
        placeholder: props.mixed ? props.mixedLabel : placeholder,
        required: isRequired,
        value: text,
        onBlur: (event: FocusEvent) => callAll(onBlur, event),
        onFocus: (event: FocusEvent) => {
          if (!isReadOnly && !isDisabled) open.value = true;
          callAll(onFocus, event);
        },
        onInput: (event: Event) => {
          setInputValue((event.target as HTMLInputElement).value);
          if (!inputHeld()) textByVisitor.value = true;
          if (!open.value) open.value = true;
          callAll(onInput, event);
          void nextTick(showHeld);
        },
        onKeydown: (event: KeyboardEvent) => {
          callAll(onKeydown, event);
          if (
            event.defaultPrevented ||
            isDisabled ||
            isReadOnly ||
            event.isComposing ||
            // Safari's Enter that commits a composition: isComposing is
            // already false, keyCode is still 229.
            event.keyCode === 229
          )
            return;
          const current = activeIndex.value;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            open.value = true;
            setActiveIndex(nextEnabledIndex(entries.value, current, 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            open.value = true;
            setActiveIndex(nextEnabledIndex(entries.value, current, -1));
          } else if (event.key === "Home") {
            setActiveIndex(firstEnabledIndex(entries.value));
          } else if (event.key === "End") {
            setActiveIndex(nextEnabledIndex(entries.value, 0, -1));
          } else if (event.key === "Enter" && open.value) {
            event.preventDefault();
            selectEntry(
              current >= 0 ? entries.value[current] : (activeOption ?? null),
            );
          }
        },
        ...rest,
      });

      return h(
        KozmosFieldWrapper,
        {
          class: props.wrapperClassName,
          error: props.error,
          errorId,
          helperId,
          helperText: props.helperText,
          inputId: id,
          label: props.label,
          required: isRequired || undefined,
          status: resolvedStatus,
          mixed: props.mixed,
          ...(listensForReset() && !isDisabled && !isReadOnly
            ? {
                onResetMixed: () => {
                  // The text goes with the choice, typed or not.
                  setInputValue("");
                  textByVisitor.value = false;
                  open.value = false;
                  emit("resetMixed");
                },
              }
            : {}),
          resetMixedLabel: props.resetMixedLabel,
        },
        () => [
          h(
            "div",
            {
              ref: root,
              class: "relative",
              onKeydown: (event: KeyboardEvent) => {
                if (event.key !== "Escape" || !popupVisible) return;
                // This field owns the open popup's Escape, including a host
                // veto or IME cancellation: no bubble-based parent
                // dismisses too.
                event.stopPropagation();
                if (event.defaultPrevented || event.isComposing) return;
                event.preventDefault();
                root.value?.querySelector("input")?.focus();
                open.value = false;
              },
              onFocusout: (event: FocusEvent) => {
                const next = event.relatedTarget as Node | null;
                if (
                  !(event.currentTarget as HTMLElement).contains(next) &&
                  !popup.value?.contains(next)
                )
                  open.value = false;
              },
            },
            [
              h("div", { ref: anchor, class: "relative" }, [
                input,
                h("div", { class: FIELD_ACTIONS_ROW }, [
                  canClear
                    ? h(
                        "button",
                        {
                          type: "button",
                          class: FIELD_ACTION,
                          "aria-label": props.clearLabel,
                          onClick: clearSelection,
                        },
                        [
                          h(X, {
                            class: COMBOBOX_ACTION_GLYPH_CLASS,
                            "aria-hidden": "true",
                          }),
                        ],
                      )
                    : null,
                  h(
                    "button",
                    {
                      type: "button",
                      class: FIELD_ACTION,
                      "aria-label": isOpen ? props.closeLabel : props.openLabel,
                      disabled: isDisabled || isReadOnly,
                      onClick: () => (open.value = !open.value),
                    },
                    [
                      h(ChevronDown, {
                        class: cn(
                          FIELD_CHEVRON_CLASS,
                          isOpen && FIELD_CHEVRON_OPEN_CLASS,
                        ),
                        "aria-hidden": "true",
                      }),
                    ],
                  ),
                ]),
              ]),
              popupVisible
                ? props.popupLayout === "overlay"
                  ? h(KozmosFieldPopper, { anchor: () => anchor.value }, () => [
                      frame,
                    ])
                  : frame
                : null,
            ],
          ),
          // What the popup says aloud: in the field from the first render,
          // outside the popup, only its words changing (GAP-193).
          h(
            "div",
            { role: "status", "aria-live": "polite", class: "sr-only" },
            showsEmptyText ? props.emptyText : undefined,
          ),
        ],
      );
    };
  },
});
