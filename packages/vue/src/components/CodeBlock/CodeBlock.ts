import {
  defineComponent,
  h,
  normalizeClass,
  onBeforeUnmount,
  ref,
  watch,
  type PropType,
  type SlotsType,
} from "vue";
import { Check, Copy01 } from "@kozmos-ds/icons/vue";
import {
  cn,
  CODE_BLOCK_CLASS,
  CODE_BLOCK_COPY_CLASS,
  CODE_BLOCK_COPY_ICON_CLASS,
  CODE_BLOCK_PRE_CLASS,
  CODE_BLOCK_SAID_MS,
  codeBlockCapped,
  codeBlockSaid,
  codeBlockTabIndex,
  iconButtonSizeClass,
} from "#kozmos-recipes";
import { KozmosButton } from "../Button/Button";

/** A CSS length as React writes a style's number: pixels, and 0 bare. */
const length = (value: number | string) =>
  typeof value === "number" && value !== 0 ? `${value}px` : String(value);

/**
 * Vue's counterpart of React's CodeBlock: a read-only block of code
 * (GAP-216, decision 225), the region React's draws from the same recipe,
 * named by `label`, holding a `<pre>` and its `<code>`: the code in the mono
 * family, on the muted surface, every space and line kept, no colouring.
 * Long lines wrap; `:wrap="false"` keeps each whole and scrolls the block
 * sideways, and `max-height` caps it, past which it scrolls down; either
 * way the scroller is a stop on the keyboard's way. `copyable` draws a copy
 * button at its top end (React's IconButton: a small ghost KozmosButton in
 * IconButton's box), which says "Copied" once it has copied, and emits
 * `copy` with the code.
 */
export const KozmosCodeBlock = defineComponent({
  name: "KozmosCodeBlock",
  inheritAttrs: false,
  props: {
    /** The code, shown as written: every space and line kept, no colouring. */
    code: { type: String, required: true },
    /**
     * The region's name, what a screen reader says it is: "mergedUnit JSON".
     * The product's words, in its own language.
     */
    label: { type: String, required: true },
    wrap: { type: Boolean, default: true },
    maxHeight: {
      type: [String, Number] as PropType<number | string>,
      default: undefined,
    },
    copyable: { type: Boolean, default: false },
    copyLabel: { type: String, default: "Copy" },
    copiedLabel: { type: String, default: "Copied" },
  },
  emits: {
    /** The code, once it is copied: React's `onCopy`. */
    copy: (_code: string) => true,
  },
  // It takes no content: React's takes no children. `{}` is how the
  // contract reads "no slots" (read-contract.ts); a record type reads untyped.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  slots: Object as SlotsType<{}>,
  setup(props, { attrs, emit }) {
    const said = ref("");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    // "Copied" is said, and the check drawn, for two seconds after a copy.
    watch(said, (now) => {
      stop();
      if (now)
        timer = setTimeout(() => {
          said.value = "";
        }, CODE_BLOCK_SAID_MS);
    });
    onBeforeUnmount(stop);

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(props.code);
      } catch {
        return;
      }
      said.value = codeBlockSaid(said.value, props.copiedLabel);
      emit("copy", props.code);
    };

    return () => {
      const { class: className, ...rest } = attrs;
      const capped = codeBlockCapped(props.maxHeight);
      const icon = {
        class: CODE_BLOCK_COPY_ICON_CLASS,
        "aria-hidden": "true" as const,
      };
      return h(
        "div",
        {
          role: "region",
          "aria-label": props.label,
          "data-wrap": props.wrap ? "true" : "false",
          "data-copyable": props.copyable ? "true" : undefined,
          class: cn(CODE_BLOCK_CLASS, normalizeClass(className)),
          ...rest,
        },
        [
          h(
            "pre",
            {
              class: CODE_BLOCK_PRE_CLASS,
              // No style at all uncapped: Vue writes an empty one.
              ...(capped
                ? { style: { maxHeight: length(props.maxHeight!) } }
                : {}),
              tabindex: codeBlockTabIndex(props.wrap, capped),
            },
            [h("code", props.code)],
          ),
          ...(props.copyable
            ? [
                h(
                  KozmosButton,
                  {
                    type: "button",
                    size: "sm",
                    variant: "ghost",
                    "aria-label": props.copyLabel,
                    class: cn(iconButtonSizeClass("sm"), CODE_BLOCK_COPY_CLASS),
                    onClick: copy,
                  },
                  () => [said.value ? h(Check, icon) : h(Copy01, icon)],
                ),
                // In the page from the start, so the change is read.
                h(
                  "span",
                  { class: "sr-only", role: "status", "aria-live": "polite" },
                  said.value,
                ),
              ]
            : []),
        ],
      );
    };
  },
});
