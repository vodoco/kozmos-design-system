import type { Meta, StoryObj } from "@storybook/vue3";
import { h, onMounted, ref, type Ref } from "vue";
import {
  KozmosContextMenu,
  KozmosContextMenuContent,
  KozmosContextMenuItem,
  KozmosContextMenuLabel,
  KozmosContextMenuSeparator,
  KozmosContextMenuShortcut,
  KozmosContextMenuSub,
  KozmosContextMenuSubContent,
  KozmosContextMenuSubTrigger,
  KozmosContextMenuTrigger,
  KozmosText,
} from "../../index";

/**
 * Vue's ContextMenu: the stories React's has, with the same names, each
 * drawn as React's story draws it, from Kozmos parts only, inside the
 * KozmosThemeProvider the Storybook's decorator gives every story.
 * test/parity/context-menu.parity.spec.ts draws them in both, closed and
 * open.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Layout/ContextMenu",
  component: KozmosContextMenu,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<Args>;

const AREA_CLASS =
  "flex h-40 w-72 items-center justify-center rounded-control border border-dashed border-border focus:outline-none focus:ring-2 focus:ring-ring";

/** The area a right click opens the menu in. */
const area = (element?: Ref<HTMLElement | null>) =>
  h(
    "div",
    {
      ref: element,
      tabindex: 0,
      "aria-label": "Gate A12, map feature",
      class: AREA_CLASS,
    },
    [
      h(
        KozmosText,
        { size: "sm", color: "muted" },
        () => "Right click, or long press, here",
      ),
    ],
  );

const documentation = () =>
  h(KozmosContextMenuItem, { external: true, asChild: true }, () =>
    h("a", { href: "https://docs.pointr.tech" }, "Documentation"),
  );

/**
 * Right click the area, long press it on touch, or focus it and press the
 * context-menu key or Shift+F10.
 */
export const Default: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosContextMenu, null, () => [
        h(KozmosContextMenuTrigger, { asChild: true }, () => area()),
        h(KozmosContextMenuContent, null, () => [
          h(KozmosContextMenuLabel, null, () => "Feature actions"),
          h(KozmosContextMenuItem, null, () => [
            "Copy",
            h(KozmosContextMenuShortcut, null, () => "⌘C"),
          ]),
          h(KozmosContextMenuItem, null, () => [
            "Paste",
            h(KozmosContextMenuShortcut, null, () => "⌘V"),
          ]),
          h(KozmosContextMenuSeparator),
          h(KozmosContextMenuSub, null, () => [
            h(KozmosContextMenuSubTrigger, null, () => "Move to level"),
            h(KozmosContextMenuSubContent, null, () => [
              h(KozmosContextMenuItem, null, () => "Level 1"),
              h(KozmosContextMenuItem, null, () => "Level 2"),
            ]),
          ]),
          documentation(),
        ]),
      ]),
  }),
};

/**
 * The menu open, as a right click 24 into the area opens it, so the visual
 * review draws the panel, a submenu row and an external item. A context
 * menu has no `defaultOpen`: the story asks for it as a right click does.
 */
export const Open: Story = {
  render: () => ({
    setup: () => {
      const element = ref<HTMLElement | null>(null);
      onMounted(() => {
        const box = element.value!.getBoundingClientRect();
        element.value!.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: box.left + 24,
            clientY: box.top + 24,
          }),
        );
      });
      return () =>
        h("div", { style: { height: "280px" } }, [
          h(KozmosContextMenu, { modal: false }, () => [
            h(KozmosContextMenuTrigger, { asChild: true }, () => area(element)),
            h(KozmosContextMenuContent, null, () => [
              h(KozmosContextMenuLabel, null, () => "Feature actions"),
              h(KozmosContextMenuItem, null, () => [
                "Copy",
                h(KozmosContextMenuShortcut, null, () => "⌘C"),
              ]),
              h(KozmosContextMenuSeparator),
              h(KozmosContextMenuSub, null, () => [
                h(KozmosContextMenuSubTrigger, null, () => "Move to level"),
                h(KozmosContextMenuSubContent, null, () => [
                  h(KozmosContextMenuItem, null, () => "Level 1"),
                ]),
              ]),
              documentation(),
            ]),
          ]),
        ]);
    },
  }),
};
