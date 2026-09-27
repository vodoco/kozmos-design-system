import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import {
  Heart,
  InfoCircle as Info,
  SearchMd as Search,
  ShoppingBag01 as ShoppingBag,
} from "@kozmos-ds/icons";
import { Accessibility, Utensils } from "@kozmos-ds/icons";
import { BrowseCategoriesPanel } from "./BrowseCategoriesPanel";
import { SearchBar } from "../SearchBar";

const iconByName = {
  accessibility: <Accessibility className="h-8 w-8" />,
  favourite: <Heart className="h-8 w-8" />,
  information: <Info className="h-8 w-8" />,
  search: <Search className="h-8 w-8" />,
  shopping: <ShoppingBag className="h-8 w-8" />,
  dining: <Utensils className="h-8 w-8" />,
};

const meta = {
  title: "Product SDK/BrowseCategoriesPanel",
  component: BrowseCategoriesPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    categories: [
      {
        id: "favourites",
        label: "Favourites",
        iconName: "favourite",
        selected: false,
      },
      {
        id: "shopping",
        label: "Shopping",
        iconName: "shopping",
        selected: true,
      },
      { id: "dining", label: "Dining", iconName: "dining", selected: false },
      {
        id: "accessible",
        label: "Accessible places",
        iconName: "accessibility",
        selected: false,
      },
      {
        id: "information",
        label: "Information and help",
        iconName: "information",
        selected: false,
      },
    ],
    className: "h-[34rem] w-full max-w-[25rem]",
    onSelect: fn(),
    renderIcon: (category) =>
      iconByName[category.iconName as keyof typeof iconByName] ??
      iconByName.search,
    search: <SearchBar aria-label="Search places" />,
  },
} satisfies Meta<typeof BrowseCategoriesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const categoryPalette = [
  "yellow",
  "orange",
  "turquoise",
  "red",
  "blue",
  "navy",
  "green",
  "pink",
];

/**
 * The aviation quick access as the taxonomy publishes it, read from
 * quick-access/aviation_customer.json at 10.12.0 - the current release, not the
 * mutable `latest` alias, so this story cannot change under us.
 *
 * The artwork is the taxonomy's own, fetched from its CDN. It is deliberately
 * NOT in @kozmos-ds/icons: a category symbol belongs to the venue's taxonomy
 * and changes with it, while an icon in the design system is drawn once and
 * versioned with the components. Bundling these meant shipping eight PNGs that
 * went stale the moment Pointr published a release.
 *
 * The colour in each filename is the taxonomy's, and the tint tokens below are
 * the design system's reading of it. Both are named so a drift is visible.
 */
const TAXONOMY_RELEASE = "10.12.0";
const quickAccessIcon = (file: string) =>
  `https://pointrmapstorage.blob.core.windows.net/taxonomy/${TAXONOMY_RELEASE}/quick-access/icons/png/2x/${file}.png`;

const aviationQuickAccess = [
  { id: "entrances-exits", label: "Entrances & Exits", colour: "green", icon: "entrance-exit-green", count: 6 },
  { id: "check-in-baggage", label: "Check-in & Baggage", colour: "turquoise", icon: "service-space_office-turquoise", count: 14 },
  { id: "security-immigration", label: "Security & Immigration", colour: "red", icon: "security-space-red", count: 5 },
  { id: "gates", label: "Gates", colour: "yellow", icon: "transportation-space_boarding-gate-yellow", count: 88 },
  { id: "customer-service", label: "Customer Service", colour: "blue", icon: "amenity-space_desk-blue", count: 9 },
  { id: "parking-ground-transport", label: "Parking & Ground Transport", colour: "navy", icon: "parking-space-navy", count: 22 },
  { id: "dining", label: "Dining", colour: "orange", icon: "food-beverage-space-orange", count: 37 },
  { id: "shopping", label: "Shopping", colour: "pink", icon: "retail-space-pink", count: 41 },
];

export const AviationQuickAccess: Story = {
  args: {
    categories: aviationQuickAccess.map(({ id, label, count }) => ({
      id,
      label,
      resultCount: count,
      selected: false,
    })),
    renderIcon: (category) => {
      const entry = aviationQuickAccess.find(({ id }) => id === category.id);
      if (!entry) return null;
      return (
        <img
          src={quickAccessIcon(entry.icon)}
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
        />
      );
    },
    tint: (category) => {
      const entry = aviationQuickAccess.find(({ id }) => id === category.id);
      if (!entry) return undefined;
      return {
        accent: `var(--semantics-category-accent-${entry.colour})`,
        fill: `var(--semantics-category-fill-${entry.colour})`,
        onFill: `var(--semantics-category-on-fill-${entry.colour})`,
      };
    },
  },
};

/** Each tile in a category colour of its own, from the taxonomy's palette. */
export const Tinted: Story = {
  args: {
    tint: (category) => {
      const name =
        categoryPalette[
          [...category.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) %
            categoryPalette.length
        ];
      return {
        accent: `var(--semantics-category-accent-${name})`,
        fill: `var(--semantics-category-fill-${name})`,
        onFill: `var(--semantics-category-on-fill-${name})`,
      };
    },
  },
};
