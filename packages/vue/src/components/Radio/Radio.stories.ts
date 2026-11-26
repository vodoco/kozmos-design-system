import type { Meta, StoryObj } from "@storybook/vue3";
import { h, type Component } from "vue";
import {
  ArrowNarrowRight,
  Contrast01,
  Edit05,
  Expand01,
  Globe01,
  Map01,
  MagicWand02,
  Minimize01,
  Move,
  Route,
  Stars02,
  ZoomIn,
  ZoomOut,
} from "@kozmos-ds/icons/vue";
import {
  KozmosBox,
  KozmosGrid,
  KozmosIcon,
  KozmosRadioGroup,
  KozmosRadioGroupItem,
} from "../../index";

/**
 * Vue's RadioGroup: the stories React's has, with the same names, each
 * drawn as React's story draws it, inside the KozmosThemeProvider the
 * Storybook's decorator gives every story. React's `media` is Vue's
 * `#media` slot. test/parity/radio.parity.spec.ts draws each in both and
 * holds Vue's render to React's.
 */
const meta: Meta<typeof KozmosRadioGroup> = {
  title: "Vue/Core/Inputs/RadioGroup",
  component: KozmosRadioGroup,
};

export default meta;
type Story = StoryObj<typeof KozmosRadioGroup>;

/** A group of items, drawn from props as React's story draws it. */
const drawn =
  (props: Record<string, unknown>, items: () => ReturnType<typeof h>[]) =>
  () => ({
    setup: () => () => h(KozmosRadioGroup, props, items),
  });
const item = (props: Record<string, unknown>) =>
  h(KozmosRadioGroupItem, props as never);

export const Default: Story = {
  render: drawn({ defaultValue: "option-one" }, () => [
    item({ value: "option-one", id: "option-one", label: "Option One" }),
    item({ value: "option-two", id: "option-two", label: "Option Two" }),
  ]),
};

export const Disabled: Story = {
  render: drawn({ defaultValue: "option-one", disabled: true }, () => [
    item({
      value: "option-one",
      id: "option-disabled-one",
      label: "Option One",
    }),
    item({
      value: "option-two",
      id: "option-disabled-two",
      label: "Option Two",
    }),
  ]),
};

export const Error: Story = {
  render: drawn(
    { defaultValue: "option-one", error: "Selection required" },
    () => [
      item({
        value: "option-one",
        id: "option-error-one",
        label: "Option One",
        error: true,
      }),
      item({
        value: "option-two",
        id: "option-error-two",
        label: "Option Two",
        error: true,
      }),
    ],
  ),
};

// GAP-162 on a radio: a description under the label, read as the option's
// description.
export const WithDescription: Story = {
  render: drawn({ "aria-label": "Levels shown", defaultValue: "all" }, () => [
    item({
      value: "all",
      label: "All levels",
      description: "Every level of the building, stacked",
    }),
    item({
      value: "current",
      label: "Current level",
      description: "Only the level you are on",
    }),
  ]),
};

/** A boxed item, its image or icon in the `#media` slot. */
const boxed = (
  props: Record<string, unknown>,
  media: () => ReturnType<typeof h>,
) => h(KozmosRadioGroupItem, props as never, { media: () => [media()] });
const tinted = (icon: Component) => () =>
  h(
    KozmosBox,
    { class: "flex h-20 w-full items-center justify-center bg-muted" },
    () => [h(KozmosIcon, { icon, size: "xl", color: "muted" })],
  );
const primary = (icon: Component) => () =>
  h(KozmosIcon, { icon, size: "lg", color: "primary" });

// GAP-158: radio cards. Each card is one radio named by its title; the image
// is decoration. The chosen card's edge is heavier and its ring shows its dot,
// so the choice is never told by colour alone. The arrows move between them.
export const Cards: Story = {
  render: () => ({
    setup: () => () =>
      h("div", { class: "flex flex-col gap-6" }, [
        h(
          KozmosRadioGroup,
          { "aria-label": "Map style", defaultValue: "vector" },
          () => [
            h(KozmosGrid, { cols: 2, gap: 2 }, () => [
              boxed(
                {
                  value: "vector",
                  variant: "card",
                  label: "Vector",
                  description: "Drawn from the building's plans",
                },
                tinted(Map01),
              ),
              boxed(
                {
                  value: "satellite",
                  variant: "card",
                  label: "Satellite",
                  description: "Aerial imagery under the plans",
                },
                tinted(Globe01),
              ),
            ]),
          ],
        ),
        h(
          KozmosRadioGroup,
          { "aria-label": "Geometry", defaultValue: "auto" },
          () => [
            h(KozmosGrid, { cols: 2, gap: 2 }, () => [
              boxed(
                {
                  value: "auto",
                  variant: "card",
                  label: "Auto-generate",
                  description: "Kozmos traces the outline from the floor plan",
                },
                primary(MagicWand02),
              ),
              boxed(
                {
                  value: "manual",
                  variant: "card",
                  label: "Draw manually",
                  description: "Draw the outline point by point",
                },
                primary(Edit05),
              ),
            ]),
          ],
        ),
      ]),
  }),
};

const transitions = [
  { value: "fade", label: "Fade", icon: Contrast01 },
  { value: "slide", label: "Slide", icon: ArrowNarrowRight },
  { value: "move", label: "Move", icon: Move },
  { value: "zoom-in", label: "Zoom in", icon: ZoomIn },
  { value: "zoom-out", label: "Zoom out", icon: ZoomOut },
  { value: "grow", label: "Grow", icon: Expand01 },
  { value: "shrink", label: "Shrink", icon: Minimize01 },
  { value: "follow", label: "Follow route", icon: Route },
  { value: "sparkle", label: "Sparkle", icon: Stars02 },
];

// GAP-158: radio tiles, the transition editor's nine-tile grid. One Tab stop
// for the grid; the arrows move and choose. The chosen tile's edge is heavier
// and it shows a check.
export const Tiles: Story = {
  render: drawn({ "aria-label": "Transition", defaultValue: "slide" }, () => [
    h(KozmosGrid, { cols: 3, gap: 2 }, () =>
      transitions.map((transition) =>
        boxed(
          {
            key: transition.value,
            value: transition.value,
            variant: "tile",
            label: transition.label,
          },
          () => h(KozmosIcon, { icon: transition.icon, size: "lg" }),
        ),
      ),
    ),
  ]),
};
