import {
  computed,
  defineComponent,
  h,
  nextTick,
  normalizeClass,
  onUpdated,
  ref,
  shallowRef,
  useId,
  type PropType,
  type SlotsType,
} from "vue";
import {
  addEntries,
  CHIP_FIELD_GROUP_CLASS,
  CHIP_FIELD_INPUT_CLASS,
  chipInputDefaults,
  chipInputFieldClass,
  ENTRY_BREAK,
  mergeAriaIds,
  nextSaid,
  readEntries,
} from "#kozmos-recipes";
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import { chipRowAttributes, KozmosChip } from "../Chip/Chip";
import { KozmosFieldWrapper } from "../FieldWrapper/FieldWrapper";
import type { KozmosInputStatus } from "../Input/types";

const NO_ENTRIES: string[] = [];
type Words = (entry: string) => string;

/**
 * Vue's counterpart of React's ChipInput (GAP-222, decision 216): a field
 * that takes free text and holds each entry as a removable KozmosChip
 * inside it, drawn as React's draws it inside a KozmosFieldWrapper, from the
 * shared recipe (`recipes/multi-select.ts`). Enter or a comma adds the text
 * as an entry (an empty field leaves Enter to the form), text pasted with
 * commas or line breaks adds each part, Backspace in the empty field
 * removes the last entry, and each chip has a remove, after which the field
 * keeps focus. An entry already there is not added again: its text stays.
 * What was added, removed or refused is said through a polite status, in
 * the product's words (`added-label`, `removed-label`, `duplicate-label`).
 *
 * `v-model` is React's `value` and `onValueChange`, the entries;
 * `v-model:input-value` is the typed text, React's `inputValue`. Unbound,
 * each is the field's own, from `default-value` and `default-input-value`.
 * Entries are reported as `entry_added` and `entry_removed`. The app's
 * `class` and attributes reach the field; `input-id` names its input.
 */
export const KozmosChipInput = defineComponent({
  name: "KozmosChipInput",
  inheritAttrs: false,
  props: {
    /** The entries, controlled. */
    modelValue: { type: Array as PropType<string[]>, default: undefined },
    /** The entries at first, when the field holds its own. */
    defaultValue: {
      type: Array as PropType<string[]>,
      default: () => NO_ENTRIES,
    },
    /** The text being typed, controlled. */
    inputValue: { type: String, default: undefined },
    /** The text at first, when the field holds its own. */
    defaultInputValue: { type: String, default: "" },
    disabled: { type: Boolean, default: undefined },
    // String first: "" is an error with no words, as React's `error=""` is.
    error: {
      type: [String, Boolean] as PropType<boolean | string>,
      default: undefined,
    },
    helperText: { type: String, default: undefined },
    label: { type: String, default: undefined },
    placeholder: { type: String, default: undefined },
    readOnly: { type: Boolean, default: undefined },
    required: { type: Boolean, default: undefined },
    status: {
      type: String as PropType<KozmosInputStatus>,
      default: "default",
    },
    wrapperClassName: { type: String, default: undefined },
    /** The `id` of the text input, which the label names. */
    inputId: { type: String, default: undefined },
    /** Each chip's remove button's name. "Remove {entry}" by default. */
    removeLabel: {
      type: Function as PropType<Words>,
      default: chipInputDefaults.removeLabel,
    },
    /** Said politely when an entry is added. "{entry} added" by default. */
    addedLabel: {
      type: Function as PropType<Words>,
      default: chipInputDefaults.addedLabel,
    },
    /** Said politely when an entry is removed. "{entry} removed" by default. */
    removedLabel: {
      type: Function as PropType<Words>,
      default: chipInputDefaults.removedLabel,
    },
    /** Said politely when the typed entry is already in the field. */
    duplicateLabel: {
      type: Function as PropType<Words>,
      default: chipInputDefaults.duplicateLabel,
    },
  },
  emits: {
    /** React's onValueChange: every entry, after one is added or removed. */
    "update:modelValue": (_value: string[]) => true,
    /** React's onInputValueChange: the typed text. */
    "update:inputValue": (_value: string) => true,
  },
  slots: Object as SlotsType<Record<never, never>>,
  setup(props, { attrs, emit }) {
    const { trackEvent } = useKozmosAnalytics();
    const input = shallowRef<HTMLInputElement | null>(null);
    const defaultInputId = useId();
    const errorId = useId();
    const helperId = useId();
    const heldValue = ref<string[]>(props.defaultValue);
    const heldText = ref(props.defaultInputValue);
    const entries = computed(() => props.modelValue ?? heldValue.value);
    const text = computed(() => props.inputValue ?? heldText.value);
    const locked = () => Boolean(props.disabled || props.readOnly);
    const said = ref({ words: "", odd: false });
    const say = (words: string) => (said.value = nextSaid(said.value, words));

    const setText = (next: string) => {
      if (props.inputValue === undefined) heldText.value = next;
      emit("update:inputValue", next);
    };
    const commit = (next: string[]) => {
      if (props.modelValue === undefined) heldValue.value = next;
      emit("update:modelValue", next);
    };
    const add = (candidates: string[], rest: string) => {
      const { next, added, duplicate, text } = addEntries(
        entries.value,
        candidates,
        rest,
      );
      if (added.length > 0) {
        commit(next);
        for (const entry of added)
          trackEvent("ChipInput", "entry_added", { value: entry });
      }
      setText(text);
      if (duplicate !== null) say(props.duplicateLabel(duplicate));
      else if (added.length > 0) say(added.map(props.addedLabel).join(", "));
    };
    const remove = (entry: string) => {
      if (locked()) return;
      commit(entries.value.filter((current) => current !== entry));
      say(props.removedLabel(entry));
      trackEvent("ChipInput", "entry_removed", { value: entry });
    };
    // A text the app holds and did not take is taken back, as React's
    // controlled input takes it back.
    const showHeld = () => {
      const element = input.value;
      if (element && element.value !== text.value) element.value = text.value;
    };
    onUpdated(showHeld);

    return () => {
      const {
        class: className,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy,
        "aria-describedby": callerDescribedBy,
        "aria-invalid": callerInvalid,
        ...rest
      } = attrs as Record<string, unknown>;
      const id = props.inputId || defaultInputId;
      const list = entries.value;
      const isLocked = locked();
      const resolvedStatus: KozmosInputStatus = props.error
        ? "error"
        : props.status;
      const describedBy =
        props.error && typeof props.error === "string"
          ? errorId
          : props.helperText
            ? helperId
            : undefined;

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
        },
        () => [
          h(
            "div",
            {
              class: chipInputFieldClass(
                resolvedStatus,
                props.disabled,
                normalizeClass(className),
              ),
              "data-slot": "chip-input",
              onClick: () => input.value?.focus(),
              ...rest,
            },
            [
              h("div", chipRowAttributes(CHIP_FIELD_GROUP_CLASS), [
                ...list.map((entry) =>
                  h(
                    KozmosChip,
                    {
                      key: entry,
                      size: "sm",
                      selected: true,
                      disabled: isLocked,
                      removeLabel: props.removeLabel(entry),
                      onRemove: () => {
                        remove(entry);
                        // Its button goes with the chip: the field keeps focus.
                        input.value?.focus();
                      },
                    },
                    () => entry,
                  ),
                ),
                h("input", {
                  ref: input,
                  id,
                  "aria-label": ariaLabel,
                  "aria-labelledby": ariaLabelledBy,
                  "aria-describedby": mergeAriaIds(
                    callerDescribedBy as string | undefined,
                    describedBy,
                  ),
                  "aria-invalid":
                    resolvedStatus === "error" ? true : callerInvalid,
                  "aria-required": props.required || undefined,
                  autocomplete: "off",
                  // MultiSelect's input: the same height, padding and placeholder.
                  class: CHIP_FIELD_INPUT_CLASS,
                  disabled: props.disabled,
                  enterkeyhint: "enter",
                  placeholder: list.length > 0 ? "" : props.placeholder,
                  readonly: props.readOnly,
                  value: text.value,
                  onInput: (event: Event) => {
                    const next = (event.target as HTMLInputElement).value;
                    // A comma typed, or text pasted with commas or line
                    // breaks, adds what comes before the last one; what
                    // follows stays.
                    if (ENTRY_BREAK.test(next)) {
                      const read = readEntries(next);
                      add(read.entries, read.rest);
                    } else {
                      setText(next);
                    }
                    void nextTick(showHeld);
                  },
                  onPaste: (event: ClipboardEvent) => {
                    // A single-line input drops line breaks from what is
                    // pasted, so a pasted list is read here, before it is.
                    const pasted = event.clipboardData?.getData("text") ?? "";
                    if (isLocked || !ENTRY_BREAK.test(pasted)) return;
                    event.preventDefault();
                    const read = readEntries(`${text.value}${pasted}`);
                    add(read.entries, read.rest);
                  },
                  onKeydown: (event: KeyboardEvent) => {
                    if (isLocked || event.isComposing) return;
                    if (event.key === "Enter") {
                      const entry = text.value.trim();
                      // An empty field leaves Enter to the form.
                      if (!entry) return;
                      event.preventDefault();
                      add([entry], "");
                    } else if (event.key === "Backspace" && text.value === "") {
                      const last = list[list.length - 1];
                      if (last !== undefined) {
                        event.preventDefault();
                        remove(last);
                      }
                    }
                  },
                }),
              ]),
            ],
          ),
          h(
            "div",
            { role: "status", "aria-live": "polite", class: "sr-only" },
            said.value.words || undefined,
          ),
        ],
      );
    };
  },
});
