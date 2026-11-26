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
  ref,
  shallowRef,
  useId,
  watch,
  type PropType,
  type SlotsType,
} from "vue";
import { ChevronDown, X } from "@kozmos-ds/icons/vue";
import {
  CHIP_FIELD_GROUP_CLASS,
  CHIP_FIELD_INPUT_CLASS,
  cn,
  COMBOBOX_ACTION_GLYPH_CLASS,
  defaultFilterOption,
  defaultMaxSelectedLabel,
  FIELD_ACTION,
  FIELD_ACTIONS_ROW,
  FIELD_CHEVRON_CLASS,
  FIELD_CHEVRON_OPEN_CLASS,
  FIELD_POPUP_MAX_HEIGHT,
  firstEnabledIndex,
  groupOf,
  keepsFieldFocus,
  mergeAriaIds,
  MULTI_SELECT_EMPTY_CLASS,
  MULTI_SELECT_POPUP_CLASS,
  multiSelectFieldClass,
  nextEnabledIndex,
  orderByGroup,
  scrollbarFor,
  scrollOptionIntoView,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { KozmosChip, KozmosChipGroup } from "../Chip/Chip";
import { KozmosFieldPopper } from "../Combobox/fieldPopper";
import { MapShellPresentationKey } from "../Combobox/types";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import { useListens, without } from "../FieldWrapper/fieldModel";
import type { KozmosInputStatus } from "../Input/types";
import {
  drawOptionGroups,
  drawOptionRow,
  useInputModality,
} from "../Listbox/options";
import type { KozmosComboboxOption } from "../Listbox/types";

/** The shared recipe's filter, under the prop's own type. */
type KozmosMultiSelectFilter = (
  option: KozmosComboboxOption,
  inputValue: string,
) => boolean;
const filterDefault: KozmosMultiSelectFilter = (option, inputValue) =>
  !!defaultFilterOption(option, inputValue);
const NO_VALUES: string[] = [];

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

/** What a field's popup says aloud, as React's FieldPopupStatus. */
const status = (message?: string) =>
  h(
    "div",
    { role: "status", "aria-live": "polite", class: "sr-only" },
    message,
  );

/**
 * Vue's counterpart of React's MultiSelect: a field that holds several
 * choices as removable chips, with a text input after them that filters a
 * list of options under it, drawn as React's draws it inside a
 * KozmosFieldWrapper, from the shared recipes (`recipes/multi-select.ts`,
 * `recipes/combobox.ts`, `recipes/option.ts`). Focus stays in the input,
 * which points at its active option with `aria-activedescendant`: the
 * arrows move it, Enter toggles it, Backspace in the empty input removes
 * the last chip, Escape closes the list, and a press outside or focus
 * leaving closes it. Options are under their groups (GAP-192). At
 * `max-selected` the options not chosen cannot be chosen, and
 * `max-selected-label` is said once, politely, as the selection reaches it.
 *
 * `v-model` is React's `value` and `onValueChange`, emitted with the values
 * and their options; `v-model:search-value` is the typed text, React's
 * `searchValue`. Unbound, each is the field's own, from `default-value`
 * and `default-search-value`. Mixed (GAP-255), it holds no choice and
 * shows `mixed-label`; a `@reset-mixed` listener draws the reset. Choices
 * are reported as `option_selected` and `option_removed`, clears as
 * `selection_cleared`.
 *
 * The popup is drawn in the theme's portal, placed under the field as
 * React's popper places it (`../Combobox/fieldPopper.ts`). React's popup
 * is also a Radix DismissableLayer, which closes it on an Escape anywhere
 * but the input; this listens for that Escape on the document itself, and
 * joins no layer stack (the Vue overlays it would join are not ported).
 * The map shell's presentation, which picks the list's scrollbar, is read
 * from MapShellPresentationKey, which nothing provides yet, so the list
 * draws the thin scrollbar it draws outside a shell.
 */
export const KozmosMultiSelect = defineComponent({
  name: "KozmosMultiSelect",
  inheritAttrs: false,
  props: {
    clearable: { type: Boolean, default: true },
    defaultSearchValue: { type: String, default: "" },
    defaultValue: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    disabled: { type: Boolean, default: undefined },
    emptyText: { type: String, default: "No results found" },
    // String first: "" is an error with no words, as React's `error=""` is.
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    filterOption: {
      type: Function as PropType<KozmosMultiSelectFilter>,
      default: filterDefault,
    },
    helperText: { type: String, default: undefined },
    label: { type: String, default: undefined },
    maxSelected: { type: Number, default: undefined },
    /** What is said when the selection reaches `max-selected`, given the limit. */
    maxSelectedLabel: {
      type: Function as PropType<(max: number) => string>,
      default: defaultMaxSelectedLabel,
    },
    options: {
      type: Array as PropType<KozmosComboboxOption[]>,
      required: true,
    },
    placeholder: { type: String, default: "Select options" },
    readOnly: { type: Boolean, default: undefined },
    required: { type: Boolean, default: undefined },
    searchValue: { type: String, default: undefined },
    status: {
      type: String as PropType<KozmosInputStatus>,
      default: "default",
    },
    modelValue: { type: Array as PropType<string[]>, default: undefined },
    wrapperClassName: { type: String, default: undefined },
    mixed: { type: Boolean, default: false },
    mixedLabel: { type: String, default: "Multiple values" },
    resetMixedLabel: { type: String, default: undefined },
  },
  emits: {
    /** React's onSearchValueChange: the typed text. */
    "update:searchValue": (_value: string) => true,
    /** React's onValueChange: the values chosen and their options. */
    "update:modelValue": (_value: string[], _options: KozmosComboboxOption[]) =>
      true,
    /** The reset under a field that is not mixed was pressed: React's onResetMixed. */
    resetMixed: () => true,
  },
  slots: Object as SlotsType<Record<never, never>>,
  setup(props, { attrs, emit }) {
    const { trackEvent } = useKozmosAnalytics();
    // The active row's keyboard ring (owned-selection.css), as Combobox's.
    const modality = useInputModality();
    const presentation = inject(MapShellPresentationKey, null);
    const listensForReset = useListens("onResetMixed");
    const root = shallowRef<HTMLElement | null>(null);
    const field = shallowRef<HTMLElement | null>(null);
    const input = shallowRef<HTMLInputElement | null>(null);
    // The popup is in a portal, outside the root: a press or focus inside
    // it is still inside the field.
    const popup = shallowRef<HTMLElement | null>(null);
    const listboxDrawn = ref(false);
    const defaultInputId = useId();
    const errorId = useId();
    const helperId = useId();
    const listboxId = useId();
    const open = ref(false);
    const inputId = () => (attrs.id as string | undefined) || defaultInputId;

    // Made disabled or read-only, the field closes its list, and it stays
    // closed when it is free.
    watch(
      () => [props.disabled, props.readOnly],
      () => {
        if (props.disabled || props.readOnly) open.value = false;
      },
      { flush: "sync" },
    );

    const ownValue = ref<string[]>(
      props.mixed ? [] : [...(props.defaultValue ?? [])],
    );
    // Mixed (GAP-255), the field holds none: a choice it held is dropped
    // as it turns mixed, never shown again after.
    watch(
      () => props.mixed,
      (now) => {
        if (now) ownValue.value = [];
      },
      { flush: "sync" },
    );
    const selectedValues = computed(() =>
      props.mixed ? NO_VALUES : (props.modelValue ?? ownValue.value),
    );
    const selectedOptions = computed(
      () =>
        selectedValues.value
          .map((value) =>
            props.options.find((option) => option.value === value),
          )
          .filter(Boolean) as KozmosComboboxOption[],
    );
    const ownSearch = ref(props.defaultSearchValue);
    const visibleSearchValue = computed(
      () => props.searchValue ?? ownSearch.value,
    );
    // In the order they are drawn: under their groups (GAP-192).
    const filteredOptions = computed(() =>
      orderByGroup(
        props.options.filter((option) =>
          props.filterOption(option, visibleSearchValue.value),
        ),
        props.options,
      ),
    );
    const selectedSet = computed(() => new Set(selectedValues.value));
    const atSelectionLimit = computed(
      () =>
        typeof props.maxSelected === "number" &&
        selectedValues.value.length >= props.maxSelected,
    );
    const navigableOptions = computed(() =>
      filteredOptions.value.map((option) => ({
        ...option,
        disabled:
          option.disabled ||
          (atSelectionLimit.value && !selectedSet.value.has(option.value)),
      })),
    );
    const activeIndex = ref(firstEnabledIndex(filteredOptions.value));

    // The limit is said when the selection reaches it (GAP-225), as React's:
    // not as the field mounts, and again only after it drops below.
    const limited = () => typeof props.maxSelected === "number";
    const limitSeen = ref({
      limited: limited(),
      atLimit: atSelectionLimit.value,
      say: false,
    });
    watch(
      () => [limited(), atSelectionLimit.value] as const,
      ([isLimited, atLimit]) => {
        const seen = limitSeen.value;
        if (seen.limited !== isLimited || seen.atLimit !== atLimit)
          limitSeen.value = {
            limited: isLimited,
            atLimit,
            say: seen.limited && isLimited && atLimit,
          };
      },
      { flush: "sync" },
    );

    // New options, or new typed text, make the first enabled option active;
    // the option just chosen while text was typed stays active in the full
    // list that comes back. The list is known by what it draws, not by
    // identity. An active option that can no longer be chosen gives way to
    // the next enabled one on from it (GAP-231).
    const drawnList = computed(() =>
      JSON.stringify([
        visibleSearchValue.value,
        filteredOptions.value.map((option) => option.value),
      ]),
    );
    let activeFor: string | null = null;
    let keptValue: string | null = null;
    const reconcile = () => {
      const navigable = navigableOptions.value;
      if (activeFor !== drawnList.value) {
        activeFor = drawnList.value;
        const kept =
          keptValue === null
            ? -1
            : navigable.findIndex((option) => option.value === keptValue);
        keptValue = null;
        activeIndex.value =
          kept < 0
            ? firstEnabledIndex(navigable)
            : navigable[kept].disabled
              ? nextEnabledIndex(navigable, kept, 1)
              : kept;
      } else if (navigable[activeIndex.value]?.disabled !== false) {
        const next =
          activeIndex.value >= 0
            ? nextEnabledIndex(navigable, activeIndex.value, 1)
            : firstEnabledIndex(navigable);
        if (next !== activeIndex.value) activeIndex.value = next;
      }
    };
    watch([drawnList, navigableOptions, activeIndex], reconcile, {
      flush: "sync",
      immediate: true,
    });

    const listboxOpen = () => open.value && filteredOptions.value.length > 0;
    const activeOptionId = computed(() => {
      const option =
        activeIndex.value >= 0
          ? filteredOptions.value[activeIndex.value]
          : null;
      return open.value && listboxDrawn.value && option
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

    // While the list is open: a press outside the field and its popup
    // closes it, and so does an Escape anywhere but the input, as React's
    // DismissableLayer around the popup closes it (the input's Escape is
    // the input's own).
    const onDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!root.value?.contains(target) && !popup.value?.contains(target))
        open.value = false;
    };
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && event.target !== input.value)
        open.value = false;
    };
    const listen = (now: boolean) => {
      if (now) {
        document.addEventListener("mousedown", onDocumentMouseDown);
        document.addEventListener("keydown", onDocumentKeyDown);
      } else {
        document.removeEventListener("mousedown", onDocumentMouseDown);
        document.removeEventListener("keydown", onDocumentKeyDown);
      }
    };
    watch(open, listen);
    onBeforeUnmount(() => listen(false));

    const setSearch = (next: string) => {
      if (props.searchValue === undefined) ownSearch.value = next;
      emit("update:searchValue", next);
    };
    // A text the app holds and did not take is taken back, as React's
    // controlled input takes it back.
    const showHeld = () => {
      const element = input.value;
      if (element && element.value !== visibleSearchValue.value)
        element.value = visibleSearchValue.value;
    };
    onUpdated(showHeld);

    const commitValue = (next: string[]) => {
      if (props.modelValue === undefined) ownValue.value = next;
      emit(
        "update:modelValue",
        next,
        next
          .map((value) =>
            props.options.find((option) => option.value === value),
          )
          .filter(Boolean) as KozmosComboboxOption[],
      );
    };

    const toggleOption = (option: KozmosComboboxOption | null | undefined) => {
      if (!option || option.disabled || props.disabled || props.readOnly)
        return;
      const exists = selectedSet.value.has(option.value);
      if (!exists && atSelectionLimit.value) return;
      const hadText = !!visibleSearchValue.value;
      commitValue(
        exists
          ? selectedValues.value.filter((value) => value !== option.value)
          : [...selectedValues.value, option.value],
      );
      if (hadText) keptValue = option.value;
      setSearch("");
      open.value = true;
      trackEvent("MultiSelect", exists ? "option_removed" : "option_selected", {
        value: option.value,
      });
    };

    const removeValue = (value: string) => {
      if (props.disabled || props.readOnly) return;
      const option = props.options.find(
        (candidate) => candidate.value === value,
      );
      commitValue(selectedValues.value.filter((current) => current !== value));
      trackEvent("MultiSelect", "option_removed", { value });
      if (option) input.value?.focus();
    };

    // Focusing the field opens its list, except when the list is to stay shut.
    let keepListClosed = false;
    const clearSelection = () => {
      if (props.disabled || props.readOnly) return;
      commitValue([]);
      setSearch("");
      // The clear goes with the choices it clears: the field takes focus,
      // with its list closed (R3).
      keepListClosed = true;
      input.value?.focus();
      keepListClosed = false;
      open.value = false;
      trackEvent("MultiSelect", "selection_cleared", {});
    };

    return () => {
      const {
        class: className,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy,
        "aria-describedby": callerDescribedBy,
        "aria-invalid": callerInvalid,
        ...others
      } = attrs as Record<string, unknown>;
      const rest = without(others, "id");
      const isDisabled = props.disabled;
      const isReadOnly = props.readOnly;
      const id = inputId();
      const filtered = filteredOptions.value;
      const selected = selectedValues.value;
      const set = selectedSet.value;
      const atLimit = atSelectionLimit.value;
      const active = activeIndex.value;
      const isOpen = open.value;
      const listbox = listboxOpen();
      const resolvedStatus: KozmosInputStatus = props.error
        ? "error"
        : props.status;
      const describedBy =
        props.error && typeof props.error === "string"
          ? errorId
          : props.helperText
            ? helperId
            : undefined;
      const canClear =
        props.clearable && !isDisabled && !isReadOnly && selected.length > 0;
      const activeOption = active >= 0 ? filtered[active] : null;
      const label = (ariaLabel as string | undefined) ?? props.label;

      const chips = selectedOptions.value.map((option) =>
        h(
          KozmosChip,
          {
            key: option.value,
            size: "sm",
            selected: true,
            disabled: isDisabled || isReadOnly,
            onRemove: () => removeValue(option.value),
          },
          () => option.label,
        ),
      );
      const text = h("input", {
        ref: input,
        id,
        role: "combobox",
        "aria-autocomplete": "list",
        "aria-controls": listbox ? listboxId : undefined,
        "aria-expanded": listbox,
        "aria-haspopup": "listbox",
        "aria-activedescendant": activeOptionId.value,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy,
        "aria-describedby": mergeAriaIds(
          callerDescribedBy as string | undefined,
          describedBy,
        ),
        "aria-invalid": resolvedStatus === "error" ? true : callerInvalid,
        "aria-required": props.required || undefined,
        autocomplete: "off",
        class: CHIP_FIELD_INPUT_CLASS,
        // Mixed, said once: by the empty field's placeholder.
        "data-mixed": props.mixed ? "" : undefined,
        disabled: isDisabled,
        readonly: isReadOnly,
        placeholder: props.mixed
          ? props.mixedLabel
          : selected.length > 0
            ? ""
            : props.placeholder,
        value: visibleSearchValue.value,
        onFocus: () => {
          if (!isDisabled && !isReadOnly && !keepListClosed) open.value = true;
        },
        onInput: (event: Event) => {
          setSearch((event.target as HTMLInputElement).value);
          open.value = true;
          void nextTick(showHeld);
        },
        onKeydown: (event: KeyboardEvent) => {
          if (
            isDisabled ||
            isReadOnly ||
            event.isComposing ||
            // Safari's Enter that commits a composition: isComposing is
            // already false, keyCode is still 229.
            event.keyCode === 229
          )
            return;
          if (event.key === "Backspace" && !visibleSearchValue.value) {
            const last = selectedValues.value[selectedValues.value.length - 1];
            if (last) removeValue(last);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            open.value = true;
            activeIndex.value = nextEnabledIndex(
              navigableOptions.value,
              activeIndex.value,
              1,
            );
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            open.value = true;
            activeIndex.value = nextEnabledIndex(
              navigableOptions.value,
              activeIndex.value,
              -1,
            );
          } else if (event.key === "Enter" && open.value) {
            event.preventDefault();
            toggleOption(
              activeIndex.value >= 0
                ? filteredOptions.value[activeIndex.value]
                : activeOption,
            );
          } else if (event.key === "Escape") {
            open.value = false;
          }
        },
      });

      const list = isOpen
        ? h(KozmosFieldPopper, { anchor: () => field.value }, () => [
            h(
              "div",
              {
                ref: popup,
                onMousedown: (event: MouseEvent) => {
                  if (
                    keepsFieldFocus(event.target, event.offsetX, event.offsetY)
                  )
                    event.preventDefault();
                },
                "data-kozmos-scrollbar": scrollbarFor(presentation),
                id: listbox ? listboxId : undefined,
                "data-modality": modality.value,
                // With no option it holds plain text: the status says it.
                role: listbox ? "listbox" : undefined,
                "aria-label": listbox ? label : undefined,
                "aria-labelledby": listbox ? ariaLabelledBy : undefined,
                "aria-multiselectable": listbox ? true : undefined,
                class: MULTI_SELECT_POPUP_CLASS,
                style: { maxHeight: FIELD_POPUP_MAX_HEIGHT },
              },
              [
                h(Drawn, {
                  onDrawn: (drawn: boolean) => (listboxDrawn.value = drawn),
                }),
                ...(filtered.length === 0
                  ? [
                      h(
                        "div",
                        { class: MULTI_SELECT_EMPTY_CLASS },
                        props.emptyText,
                      ),
                    ]
                  : drawOptionGroups(filtered, groupOf, id, (option, index) => {
                      const isSelected = set.has(option.value);
                      const disabledOption =
                        option.disabled || (!isSelected && atLimit);
                      return drawOptionRow({
                        option,
                        selected: isSelected,
                        active: index === active,
                        disabled: disabledOption,
                        id: `${id}-option-${index}`,
                        extra: {
                          key: option.value,
                          onMouseenter: () => {
                            if (!disabledOption) activeIndex.value = index;
                          },
                          onMousedown: (event: MouseEvent) =>
                            event.preventDefault(),
                          onClick: () =>
                            !disabledOption ? toggleOption(option) : undefined,
                        },
                      });
                    })),
              ],
            ),
          ])
        : null;

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
          required: props.required,
          status: resolvedStatus,
          mixed: props.mixed,
          ...(listensForReset() && !isDisabled && !isReadOnly
            ? {
                onResetMixed: () => {
                  // The query goes with the edit, and the list closes.
                  setSearch("");
                  open.value = false;
                  if (props.modelValue === undefined) ownValue.value = [];
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
              h(
                "div",
                {
                  ref: field,
                  class: multiSelectFieldClass(
                    resolvedStatus,
                    isDisabled,
                    canClear,
                    normalizeClass(className),
                  ),
                  onClick: () => input.value?.focus(),
                  ...rest,
                },
                [
                  h(KozmosChipGroup, { class: CHIP_FIELD_GROUP_CLASS }, () => [
                    ...chips,
                    text,
                  ]),
                  // Combobox's clear and open (field-actions.ts), each as
                  // tall as the field, out of the line.
                  h("div", { class: FIELD_ACTIONS_ROW }, [
                    canClear
                      ? h(
                          "button",
                          {
                            type: "button",
                            class: FIELD_ACTION,
                            "aria-label": "Clear selected options",
                            onClick: (event: MouseEvent) => {
                              event.stopPropagation();
                              clearSelection();
                            },
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
                        "aria-label": isOpen ? "Close options" : "Open options",
                        disabled: isDisabled || isReadOnly,
                        onClick: (event: MouseEvent) => {
                          event.stopPropagation();
                          const next = !open.value;
                          input.value?.focus();
                          open.value = next;
                        },
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
                ],
              ),
              list,
            ],
          ),
          status(isOpen && filtered.length === 0 ? props.emptyText : undefined),
          // A region of its own, mounted with the limit, empty.
          typeof props.maxSelected === "number"
            ? status(
                limitSeen.value.say && atLimit
                  ? props.maxSelectedLabel(props.maxSelected)
                  : undefined,
              )
            : null,
        ],
      );
    };
  },
});
