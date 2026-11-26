import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  nextTick,
  normalizeClass,
  onMounted,
  ref,
  shallowRef,
  useId,
  watch,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  asValueArray,
  cn,
  firstEnabledIndex,
  groupOf,
  LISTBOX_CLASS,
  LISTBOX_EMBEDDED_CLASS,
  listboxNextValue,
  listboxRowId,
  nextEnabledIndex,
  orderByGroup,
  scrollOptionIntoView,
} from "#kozmos-recipes";
import {
  callAll,
  drawOptionGroups,
  drawOptionRow,
  useInputModality,
} from "./options";
import type { KozmosComboboxOption } from "./types";

/** Whether the parent wrote a prop, in either spelling: a model it owns. */
function useWritten(camel: string, kebab: string) {
  const instance = getCurrentInstance();
  return () => {
    const props = instance?.vnode.props ?? {};
    return camel in props || kebab in props;
  };
}

/**
 * Vue's counterpart of React's Listbox: the `<div role="listbox">` React's
 * draws, from the same recipes (`recipes/listbox.ts`, `recipes/option.ts`),
 * its options under their groups (GAP-192), each a row React's OptionRow
 * draws. Focus stays on the list, which points at its active row with
 * `aria-activedescendant`; the arrows, Home and End move it, skipping the
 * options that cannot be chosen, and Enter or Space chooses it, as a press
 * does.
 *
 * `v-model` is React's `value` and `onValueChange`: one value, or with
 * `multiple` the values chosen, emitted with the option chosen. Unbound, the
 * list holds its own from `default-value`. `v-model:active-value` is
 * React's `activeValue` (GAP-260), for a field that drives the list as a
 * combobox: bound, the list only asks for a move; `null` is no active
 * option. `embedded` draws no panel of its own (GAP-271).
 */
export const KozmosListbox = defineComponent({
  name: "KozmosListbox",
  inheritAttrs: false,
  props: {
    /**
     * The active option's value, for a product that moves it (GAP-260),
     * with `update:activeValue`; `null` is none. Unbound, the list keeps its
     * own.
     */
    activeValue: {
      type: String as PropType<string | null>,
      default: undefined,
    },
    defaultValue: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    disabled: { type: Boolean, default: undefined },
    /**
     * Draws no panel of its own (GAP-271): no border, surface, shadow or
     * padding, for a list inside a container that is the box.
     */
    embedded: { type: Boolean, default: false },
    multiple: { type: Boolean, default: undefined },
    options: {
      type: Array as PropType<KozmosComboboxOption[]>,
      required: true,
    },
    modelValue: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
  },
  emits: {
    /**
     * React's onActiveValueChange: the option the list would make active,
     * by the arrows, Home and End, by the pointer, and by a choice.
     */
    "update:activeValue": (_value: string | null) => true,
    /** React's onValueChange: the new value, and the option chosen. */
    "update:modelValue": (
      _value: string | string[],
      _option: KozmosComboboxOption,
    ) => true,
  },
  slots: Object as SlotsType<{
    /** Taken and not drawn: React's Listbox draws its options. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, emit }) {
    const defaultListboxId = useId();
    const modality = useInputModality();
    const focused = ref(false);
    const root = shallowRef<HTMLElement | null>(null);
    const valueBound = useWritten("modelValue", "model-value");
    const activeBound = useWritten("activeValue", "active-value");

    // In the order they are drawn: under their groups (GAP-192).
    const options = computed(() => orderByGroup(props.options ?? []));
    const listboxId = () =>
      (attrs.id as string | undefined) || defaultListboxId;
    const own = ref<string | string[]>(
      props.defaultValue ?? (props.multiple ? [] : ""),
    );
    const selectedValues = computed(() =>
      asValueArray(
        valueBound()
          ? (props.modelValue ?? (props.multiple ? [] : ""))
          : (props.modelValue ?? own.value),
      ),
    );

    // The active option the list keeps, with the options it was set for:
    // new options move it to where the list starts (GAP-231), one that can
    // no longer be chosen gives way to the next enabled one, and a host
    // passing equal options anew moves nothing (the list is known by the
    // values it draws).
    const drawnList = computed(() =>
      JSON.stringify(options.value.map((option) => option.value)),
    );
    const ownActive = ref({
      index: firstEnabledIndex(options.value, selectedValues.value),
      for: drawnList.value,
    });
    const ownIndex = computed(() => {
      const list = options.value;
      if (ownActive.value.for !== drawnList.value)
        return firstEnabledIndex(list, selectedValues.value);
      const index = ownActive.value.index;
      if (!list[index] || list[index].disabled)
        return index >= 0
          ? nextEnabledIndex(list, index, 1)
          : firstEnabledIndex(list, selectedValues.value);
      return index;
    });
    watch(
      ownIndex,
      (index) => {
        ownActive.value = { index, for: drawnList.value };
      },
      { flush: "sync" },
    );
    const activeControlled = () => activeBound();
    const activeIndex = computed(() =>
      activeControlled()
        ? options.value.findIndex(
            (option) => option.value === (props.activeValue ?? null),
          )
        : ownIndex.value,
    );
    const setActiveIndex = (index: number) => {
      const current = activeIndex.value;
      if (!activeControlled())
        ownActive.value = { index, for: drawnList.value };
      if (index !== current)
        emit("update:activeValue", options.value[index]?.value ?? null);
    };
    const activeOptionId = computed(() =>
      activeIndex.value >= 0 && options.value[activeIndex.value]
        ? listboxRowId(listboxId(), activeIndex.value)
        : undefined,
    );

    // The active option is kept in view while the list has focus, and,
    // when a product moves it, wherever focus is: in the field driving it.
    const keepInView = () => {
      const element = root.value;
      const id = activeOptionId.value;
      if (
        element &&
        (activeControlled() ||
          element.ownerDocument.activeElement === element) &&
        id
      )
        scrollOptionIntoView(element.ownerDocument.getElementById(id));
    };
    onMounted(keepInView);
    watch([activeOptionId, activeControlled], () => nextTick(keepInView), {
      flush: "post",
    });

    const commitOption = (option: KozmosComboboxOption) => {
      if (props.disabled || option.disabled) return;
      const next = listboxNextValue(
        selectedValues.value,
        option.value,
        props.multiple,
      );
      if (!valueBound() && props.modelValue === undefined) own.value = next;
      emit("update:modelValue", next, option);
    };

    return () => {
      const {
        class: className,
        onFocus,
        onBlur,
        onKeydown,
        ...rest
      } = attrs as Record<string, unknown>;
      // The list's id is its own or the app's, drawn once.
      delete rest.id;
      const id = listboxId();
      const list = options.value;
      const selected = new Set(selectedValues.value);
      const active = activeIndex.value;
      return h(
        "div",
        {
          ref: root,
          id,
          role: "listbox",
          "aria-activedescendant": activeOptionId.value,
          "aria-disabled": props.disabled || undefined,
          "aria-multiselectable": props.multiple || undefined,
          tabindex: props.disabled ? -1 : 0,
          "data-modality": focused.value ? modality.value : undefined,
          "data-embedded": props.embedded || undefined,
          class: cn(
            LISTBOX_CLASS,
            props.embedded && LISTBOX_EMBEDDED_CLASS,
            normalizeClass(className),
          ),
          onFocus: (event: FocusEvent) => {
            callAll(onFocus, event);
            focused.value = true;
          },
          onBlur: (event: FocusEvent) => {
            callAll(onBlur, event);
            focused.value = false;
          },
          onKeydown: (event: KeyboardEvent) => {
            callAll(onKeydown, event);
            if (event.defaultPrevented || props.disabled) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex(nextEnabledIndex(list, active, 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex(nextEnabledIndex(list, active, -1));
            } else if (event.key === "Home") {
              event.preventDefault();
              setActiveIndex(firstEnabledIndex(list));
            } else if (event.key === "End") {
              event.preventDefault();
              setActiveIndex(nextEnabledIndex(list, 0, -1));
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              const option = list[active];
              if (option) commitOption(option);
            }
          },
          ...rest,
        },
        drawOptionGroups(list, groupOf, id, (option, index) =>
          drawOptionRow({
            option,
            selected: selected.has(option.value),
            active: index === active,
            disabled: props.disabled || option.disabled,
            id: listboxRowId(id, index),
            extra: {
              key: option.value,
              onMouseenter: () => {
                if (!props.disabled && !option.disabled) setActiveIndex(index);
              },
              onClick: () => {
                if (props.disabled || option.disabled) return;
                // The list, not the row's parent: in a group that is the
                // group.
                root.value?.focus();
                setActiveIndex(index);
                commitOption(option);
              },
            },
          }),
        ),
      );
    };
  },
});
