import {
  h,
  isVNode,
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref,
  type VNode,
  type VNodeChild,
} from "vue";
import {
  cn,
  hasOptionTrailing,
  OPTION_CHECK_CLASS,
  OPTION_CLASS,
  OPTION_CONTENT_CLASS,
  OPTION_DESCRIPTION_CLASS,
  OPTION_GROUP_CLASS,
  OPTION_GROUP_LABEL_CLASS,
  OPTION_LABEL_CLASS,
  OPTION_MEDIA_CLASS,
  OPTION_TRAILING_CLASS,
  optionGroupLabelId,
  optionInitials,
  optionRuns,
  optionTrailingId,
  readInputModality,
  subscribeInputModality,
} from "#kozmos-recipes";
import { Check } from "@kozmos-ds/icons/vue";
import {
  KozmosAvatar,
  KozmosAvatarFallback,
  KozmosAvatarImage,
} from "../Avatar/Avatar";
import type { KozmosComboboxOption } from "./types";

/**
 * What Vue's Listbox, Select and Combobox share, as React's OptionRow,
 * option-groups and input-modality do: the option row, its groups, and which
 * hand moved last. Internal: the package exports none of it.
 */

export type InputModality = "keyboard" | "pointer";

/**
 * Which hand moved last, the keyboard or a pointer (decision 26), as React's
 * useInputModality: "pointer" on the server and until the part is mounted,
 * then the store's, kept as it changes. The store is the shared recipe's
 * (`recipes/input-modality.ts`), listening on the document once.
 */
export function useInputModality(): Ref<InputModality> {
  const modality = ref<InputModality>("pointer");
  let unsubscribe: (() => void) | undefined;
  onMounted(() => {
    modality.value = readInputModality();
    unsubscribe = subscribeInputModality(() => {
      modality.value = readInputModality();
    });
  });
  onBeforeUnmount(() => unsubscribe?.());
  return modality;
}

/** What an option shows at its end: text or a number as text, a VNode as it is. */
function trailingChild(trailing: KozmosComboboxOption["trailing"]): VNodeChild {
  if (isVNode(trailing)) return trailing;
  if (typeof trailing === "string" || typeof trailing === "number")
    return String(trailing);
  return null;
}

/**
 * One option's row, the `<div role="option">` React's OptionRow draws, from
 * the shared recipe (`recipes/option.ts`). No focus or selection state is
 * owned here; the widget around it owns them. `extra` is the widget's own
 * attributes and listeners, drawn first, as React spreads them.
 */
export function drawOptionRow({
  option,
  selected,
  active,
  disabled,
  id,
  className,
  extra = {},
}: {
  option: KozmosComboboxOption;
  selected: boolean;
  active: boolean;
  disabled?: boolean;
  id: string;
  className?: string;
  extra?: Record<string, unknown>;
}): VNode {
  const hasTrailing = hasOptionTrailing(option.trailing);
  const trailingId = optionTrailingId(id);
  return h(
    "div",
    {
      ...extra,
      id,
      "aria-describedby": hasTrailing ? trailingId : undefined,
      role: "option",
      "aria-selected": selected,
      "aria-disabled": disabled || undefined,
      "data-active": active && !disabled ? "true" : undefined,
      class: cn(OPTION_CLASS, className),
    },
    [
      option.media
        ? // Decoration: the label names the option (decision 215).
          h(
            KozmosAvatar,
            { size: "sm", "aria-hidden": "true", class: OPTION_MEDIA_CLASS },
            () => [
              option.media!.src
                ? h(KozmosAvatarImage, { src: option.media!.src, alt: "" })
                : null,
              h(
                KozmosAvatarFallback,
                null,
                () => option.media!.initials ?? optionInitials(option.label),
              ),
            ],
          )
        : null,
      h("span", { class: OPTION_CONTENT_CLASS }, [
        h("span", { class: OPTION_LABEL_CLASS }, option.label),
        option.description
          ? h("span", { class: OPTION_DESCRIPTION_CLASS }, option.description)
          : null,
      ]),
      hasTrailing
        ? h(
            "span",
            {
              id: trailingId,
              "aria-hidden": "true",
              class: OPTION_TRAILING_CLASS,
            },
            [trailingChild(option.trailing)],
          )
        : null,
      selected
        ? h(Check, { class: OPTION_CHECK_CLASS, "aria-hidden": "true" })
        : null,
    ],
  );
}

/**
 * Draws `entries`, in the order orderByGroup gave them, as React's
 * renderOptionGroups: those with no group on their own, then each group's
 * inside a `role="group"` named by its label. `render` is given each entry
 * and its index in `entries`, the index the widget navigates by. A group is
 * keyed by its name, so filtering that moves a group keeps its element.
 */
export function drawOptionGroups<T>(
  entries: T[],
  nameOf: (entry: T) => string | undefined,
  idBase: string,
  render: (entry: T, index: number) => VNode,
): VNode[] {
  return optionRuns(entries, nameOf).map((run) => {
    if (run.group === undefined) return render(run.entry, run.index);
    const labelId = optionGroupLabelId(idBase, run.group);
    return h(
      "div",
      {
        key: `group:${run.group}`,
        role: "group",
        "aria-labelledby": labelId,
        class: OPTION_GROUP_CLASS,
      },
      [
        // Presentation, as the WAI-ARIA grouped listbox has it: the
        // group's name, nothing a screen reader lists as an item.
        h(
          "div",
          {
            id: labelId,
            role: "presentation",
            class: OPTION_GROUP_LABEL_CLASS,
          },
          run.group,
        ),
        ...run.entries.map(({ entry, index }) => render(entry, index)),
      ],
    );
  });
}

type Handler = (event: Event) => void;

/** An app's listener, one or many as Vue's attrs hold them, called in order. */
export function callAll(handler: unknown, event: Event) {
  for (const each of ([] as unknown[]).concat(handler ?? []))
    if (typeof each === "function") (each as Handler)(event);
}
