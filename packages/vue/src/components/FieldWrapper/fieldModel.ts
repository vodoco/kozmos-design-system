import { getCurrentInstance, nextTick, ref, watch, type Ref } from "vue";

/**
 * What the native fields share (Input, Textarea, PasswordInput and the
 * rest): how a field's `v-model` reads and shows its text, as React's
 * controlled and uncontrolled `value` and `defaultValue` do. Internal: the
 * package exports none of it.
 */

/** An attribute Vue writes as a boolean: there, unless false or left out. */
export const attributeFlag = (value: unknown) =>
  value !== undefined && value !== null && value !== false;

/** Listeners of one name, the field's own first: Vue calls each in turn. */
export const listeners = (
  own: (event: Event) => void,
  theirs: unknown,
): ((event: Event) => void) | ((event: Event) => void)[] =>
  theirs ? [own, ...([theirs].flat() as ((event: Event) => void)[])] : own;

/** What an app's attributes name a field's `readonly` (in any spelling). */
export const readOnlyOf = (attrs: Record<string, unknown>) =>
  attributeFlag(attrs.readonly ?? attrs.readOnly ?? attrs["read-only"]);

/**
 * Whether the parent listens for one of this component's events, by its
 * handler's name (`onResetMixed`): a declared event's listener is not in
 * `attrs`. A part draws what only a listener uses (a reset) only then, as
 * React's draws it only for a callback.
 */
export function useListens(handler: string) {
  const instance = getCurrentInstance();
  return () => !!instance?.vnode.props?.[handler];
}

/**
 * Whether the parent controls the model: it wrote `modelValue` (`v-model`,
 * or `:model-value`), whatever its value. React's `value` controls the field
 * when it is given; a model bound to nothing yet (`v-model` on an undefined
 * ref) is still the parent's, an empty field (the bridge's `empty`).
 */
export function useControlled() {
  const instance = getCurrentInstance();
  return () => {
    const props = instance?.vnode.props ?? {};
    return "modelValue" in props || "model-value" in props;
  };
}

/** Vue's `looseToNumber`, as `v-model.number` reads a field. */
const looseToNumber = (value: unknown) => {
  const n = parseFloat(value as string);
  return Number.isNaN(n) ? value : n;
};

/**
 * What `v-model`'s modifiers make of a field's text: `.trim` trims it,
 * `.number` reads it as a number where it can. Vue's `emit` applies them to
 * `update:modelValue`; the field compares its text to the model the same
 * way, so a typed space (`.trim`) or "4." (`.number`) stays as typed.
 */
export function useModifiers() {
  const instance = getCurrentInstance();
  return (text: string): unknown => {
    const props = (instance?.vnode.props ?? {}) as Record<string, unknown>;
    const modifiers = (props.modelModifiers ??
      props["model-modifiers"] ??
      {}) as { trim?: boolean; number?: boolean };
    let value: unknown = text;
    if (modifiers.trim) value = text.trim();
    if (modifiers.number) value = looseToNumber(value);
    return value;
  };
}

/** Two values a field shows the same way. */
export const sameValue = (a: unknown, b: unknown) =>
  (a == null ? "" : String(a)) === (b == null ? "" : String(b));

/** The attributes but the ones named, which the part draws itself. */
export function without(attrs: Record<string, unknown>, ...names: string[]) {
  const rest: Record<string, unknown> = { ...attrs };
  for (const name of names) delete rest[name];
  return rest;
}

/**
 * The attributes a field's `v-model` handles itself, so they never reach the
 * element: the modifiers, and `defaultValue` in either spelling, which it
 * draws as the field's first value.
 */
export function withoutModelAttributes(attrs: Record<string, unknown>) {
  const rest = without(
    attrs,
    "modelModifiers",
    "model-modifiers",
    "defaultValue",
    "default-value",
    "readOnly",
    "read-only",
  );
  // React's `readOnly`, in any spelling a template writes it, is the
  // element's `readonly`, as the bridge passed `read-only` to React.
  const readOnly = attrs.readOnly ?? attrs["read-only"];
  if (!("readonly" in rest) && readOnly !== undefined) rest.readonly = readOnly;
  return rest;
}

/** A field's `defaultValue`, as written in either spelling. */
export const defaultValueOf = (attrs: Record<string, unknown>) =>
  attrs.defaultValue ?? attrs["default-value"];

/**
 * A text field's `v-model`, as React's controlled and uncontrolled `value`:
 *
 * - controlled (`v-model`), the field shows the model. What the visitor
 *   types stays as typed while the model is what it makes (`.trim`'s
 *   trailing space, `.number`'s "4."), so the caret stays where it was; a
 *   change the parent refuses is taken back once the parent has answered,
 *   as React's controlled input takes it back, and a commit (`change`)
 *   shows the model as it is;
 * - uncontrolled, the field starts with `defaultValue` and keeps what is
 *   typed, mirrored here so a character count can follow it;
 * - mixed (GAP-153), a controlled field shows nothing, and an uncontrolled
 *   one is emptied as it turns mixed (and starts empty, mixed).
 *
 * `value()` is what the element's `value` is drawn with; undefined draws
 * none, as React's uncontrolled field without a `defaultValue` draws none.
 */
export function useTextModel(options: {
  model: () => unknown;
  attrs: Record<string, unknown>;
  mixed?: () => boolean;
  /** Says the change: the field's text, and the field it was typed in. */
  emit: (text: string, field: HTMLInputElement | HTMLTextAreaElement) => void;
  /**
   * Whether the text typed is the model, so it stays as typed: by default,
   * what `v-model`'s modifiers make of it is the model.
   */
  matches?: (text: string, model: unknown) => boolean;
}) {
  const { model, attrs, emit } = options;
  const mixed = options.mixed ?? (() => false);
  const controlled = useControlled();
  const modify = useModifiers();
  const matches =
    options.matches ??
    ((text: string, value: unknown) => sameValue(modify(text), value));
  const field: Ref<HTMLInputElement | HTMLTextAreaElement | null> = ref(null);
  const initial = defaultValueOf(attrs);
  const local = ref<string | undefined>(
    mixed() || initial === undefined || initial === null
      ? undefined
      : String(initial),
  );
  const typed = ref<string | null>(null);

  /** Empties an uncontrolled field: it turned mixed, or was reset. */
  const clear = () => {
    if (controlled()) return;
    local.value = "";
    if (field.value) field.value.value = "";
  };
  // Only as it turns mixed: the visitor's typing after that is theirs.
  watch(mixed, (now) => {
    if (now) clear();
  });

  const value = (): string | undefined => {
    if (!controlled()) return local.value;
    if (mixed()) return "";
    const text = typed.value;
    if (text !== null && matches(text, model())) return text;
    const shown = model();
    return shown === undefined || shown === null ? "" : String(shown);
  };

  const onInput = (event: Event) => {
    const element = event.target as HTMLInputElement | HTMLTextAreaElement;
    const text = element.value;
    if (!controlled()) {
      local.value = text;
      emit(text, element);
      return;
    }
    typed.value = text;
    emit(text, element);
    // Once the parent has answered: a change it refused is taken back.
    void nextTick(() => {
      if (typed.value !== null && !matches(typed.value, model()))
        typed.value = null;
    });
  };
  /**
   * The field's text changed outside an input event (a stepper): an
   * uncontrolled field keeps it.
   */
  const sync = (text: string) => {
    if (!controlled()) local.value = text;
  };
  /** A commit: the field shows the model as it is (`.trim`'s, trimmed). */
  const onChange = () => {
    typed.value = null;
  };

  return {
    field,
    controlled,
    value,
    /** What a character count reads: the model, or the mirrored text. */
    counted: () => (controlled() ? model() : (local.value ?? "")),
    onInput,
    onChange,
    clear,
    sync,
  };
}
