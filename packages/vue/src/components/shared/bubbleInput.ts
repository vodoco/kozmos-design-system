import {
  computed,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  ssrContextKey,
  watch,
  type ShallowRef,
} from "vue";

/** A CSS length as React writes a number in a style: `0`, else `20px`. */
const px = (value: number) => (value === 0 ? "0" : `${value}px`);

/**
 * The hidden input Radix's Switch and Radio (1.2) draw beside their button,
 * so a form hears the control as it hears a native checkbox or radio:
 * drawn while the control is taken to be in a form (always, until it
 * mounts, so a server render draws what a form without script needs), at
 * the button's size, and clicked as the state changes. Radix's Checkbox
 * (1.3) draws its own differently (KozmosCheckbox). Internal: the package
 * exports none of it.
 *
 * `control` is the button; `onControlClick` is called from its click, after
 * the part's own change, and stops the click as Radix's does so the form
 * hears the hidden input's alone.
 */
export function useBubbleInput(options: {
  type: "checkbox" | "radio";
  checked: () => boolean;
  form: () => unknown;
}) {
  const serverRender = inject(ssrContextKey, null) !== null;
  const control: ShallowRef<HTMLButtonElement | null> = shallowRef(null);
  const input: ShallowRef<HTMLInputElement | null> = shallowRef(null);
  const size = shallowRef<{ width: number; height: number } | undefined>();
  let bubbles = true;
  let observer: ResizeObserver | undefined;

  const isFormControl = computed(() =>
    control.value ? !!options.form() || !!control.value.closest("form") : true,
  );

  onMounted(() => {
    const element = control.value;
    if (!element) return;
    size.value = { width: element.offsetWidth, height: element.offsetHeight };
    if (typeof ResizeObserver === "undefined") return;
    observer = new ResizeObserver((entries) => {
      const box = entries[0]?.borderBoxSize;
      const first = Array.isArray(box) ? box[0] : box;
      size.value = first
        ? { width: first.inlineSize, height: first.blockSize }
        : { width: element.offsetWidth, height: element.offsetHeight };
    });
    observer.observe(element, { box: "border-box" });
  });
  onBeforeUnmount(() => observer?.disconnect());

  // A change of state clicks the hidden input, so a form hears it.
  watch(options.checked, (next, previous) => {
    const element = input.value;
    if (!element || next === previous) return;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "checked",
    )?.set;
    if (!setter) return;
    setter.call(element, next);
    element.dispatchEvent(new Event("click", { bubbles }));
  });

  /** Called from the button's click: stops it inside a form, as Radix's. */
  const onControlClick = (event: MouseEvent) => {
    if (!isFormControl.value) return;
    bubbles = !event.cancelBubble;
    if (bubbles) event.stopPropagation();
  };

  /** The button's ref. */
  const setControl = (element: unknown) => {
    control.value =
      (element as { $el?: HTMLButtonElement } | null)?.$el ??
      (element as HTMLButtonElement | null);
  };

  /** The hidden input, or null outside a form once mounted. */
  const render = (attributes: {
    name?: unknown;
    value?: unknown;
    required?: unknown;
    disabled?: unknown;
    form?: unknown;
  }) => {
    if (!isFormControl.value) return null;
    const checked = options.checked();
    return h("input", {
      type: options.type,
      "aria-hidden": "true",
      // React writes defaultChecked as the attribute; on the client Vue
      // would set the property, which writes the same attribute.
      ...(serverRender ? { checked } : { defaultChecked: checked }),
      name: attributes.name,
      value: attributes.value,
      required: attributes.required,
      disabled: attributes.disabled,
      form: attributes.form,
      tabindex: "-1",
      ref: (element: unknown) => {
        input.value = element as HTMLInputElement | null;
      },
      style: {
        transform: "translateX(-100%)",
        ...(size.value
          ? { width: px(size.value.width), height: px(size.value.height) }
          : {}),
        position: "absolute",
        pointerEvents: "none",
        opacity: 0,
        margin: 0,
      },
    });
  };

  return { control, setControl, isFormControl, onControlClick, render };
}
