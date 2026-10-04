import type { Decorator, Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import { fn } from "@storybook/test";
import { Building01 } from "@kozmos-ds/icons";
import { LocationPin, type LocationPinProps } from "./LocationPin";
import { ThemeProvider } from "../ThemeProvider/ThemeProvider";

const meta: Meta<typeof LocationPin> = {
  id: "product-sdk-locationpin",
  title: "SDK/Map controls/LocationPin",
  component: LocationPin,
  parameters: { layout: "centered" },
  args: { onClick: fn() },
};

export default meta;
type Story = StoryObj<typeof LocationPin>;

const red = {
  accent: "var(--semantics-category-accent-red)",
  fill: "var(--semantics-category-fill-red)",
  onFill: "var(--semantics-category-on-fill-red)",
};

/**
 * A stretch of map for pins to stand on. A pin is placed by the point it
 * marks, the foot of its spot here, as a map renderer places it; standing
 * alone at the top left of the story, it would draw above and left of the
 * canvas, out of sight.
 */
function MapStandIn({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "56px 16px 32px",
        borderRadius: 16,
        background: "var(--primitives-colors-background-100)",
      }}
    >
      {children}
    </div>
  );
}

function Spot({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: "relative", width: 56, height: 8 }}>
      <div style={{ position: "absolute", left: "50%", top: 0 }}>
        {children}
      </div>
    </div>
  );
}

function OnTheMap({ pins }: { pins: LocationPinProps[] }) {
  return (
    <MapStandIn>
      {pins.map((pin, index) => (
        <Spot key={index}>
          <LocationPin {...pin} />
        </Spot>
      ))}
    </MapStandIn>
  );
}

/** One pin, from the story's args, stood on the map. */
const onTheMap: Decorator = (Story) => (
  <MapStandIn>
    <Spot>
      <Story />
    </Spot>
  </MapStandIn>
);

export const Default: Story = {
  args: {
    label: "Selected place",
    variant: "primary",
    size: "md",
  },
  decorators: [onTheMap],
};

export const NumberedSelected: Story = {
  args: {
    label: "Result 2, Burger King, selected",
    number: 2,
    selected: true,
    featured: true,
  },
  decorators: [onTheMap],
};

/**
 * Numbered pins at rest are quiet: the surface inside, a ring and the number
 * in the pin's colour, as the result card's number tab is at rest.
 */
export const NumberedAtRest: Story = {
  render: (args) => (
    <OnTheMap
      pins={[
        { ...args, label: "Result 1, Burger King", number: 1 },
        { ...args, label: "Result 2, Harbour Coffee Co.", number: 2 },
        { ...args, label: "Result 3, Baskin-Robbins", number: 3 },
      ]}
    />
  ),
};

/**
 * Only the selected pin is filled, with its ink on the number, and it grows,
 * so selection is never told by colour alone. Its card's number tab fills
 * with it (decision 55).
 */
export const NumberedOneSelected: Story = {
  render: (args) => (
    <OnTheMap
      pins={[
        { ...args, label: "Result 1, Burger King", number: 1 },
        {
          ...args,
          label: "Result 2, Harbour Coffee Co.",
          number: 2,
          selected: true,
        },
        { ...args, label: "Result 3, Baskin-Robbins", number: 3 },
      ]}
    />
  ),
};

/**
 * A featured pin, a pin with a logo in `markerContent` and a pin with no
 * number keep their fill at rest. A featured result's pin shows its logo on
 * the map, so a product numbers only the others.
 */
export const FeaturedLogoAndPlain: Story = {
  render: (args) => (
    <OnTheMap
      pins={[
        { ...args, label: "Burger King, featured", featured: true },
        {
          ...args,
          label: "Harbour Coffee Co.",
          markerContent: <Building01 aria-hidden="true" size={12} />,
        },
        { ...args, label: "Baskin-Robbins" },
      ]}
    />
  ),
};

/**
 * On another floor the marker is outlined with a dashed ring and the number
 * is in the foreground; selected, it grows and is never filled. The dashes
 * tell it from the quiet pin at rest on this floor, first here, which is
 * outlined too: in forced colours and to any colour vision.
 */
export const OtherFloor: Story = {
  render: (args) => (
    <OnTheMap
      pins={[
        { ...args, label: "Result 1, Burger King", number: 1 },
        {
          ...args,
          label: "Result 4, Gates, on another floor",
          number: 4,
          offFloor: true,
        },
        {
          ...args,
          label: "Result 5, Lounge, on another floor",
          number: 5,
          offFloor: true,
          selected: true,
        },
        { ...args, label: "Pharmacy, on another floor", offFloor: true },
      ]}
    />
  ),
};

/**
 * Other variants keep their colours in the ring and number at rest, as ink
 * that reads on the surface. Secondary's own colour is a surface grey, so
 * its ring and number take the muted foreground.
 */
export const VariantsAtRest: Story = {
  render: (args) => (
    <OnTheMap
      pins={[
        { ...args, label: "Result 1", number: 1, variant: "default" },
        { ...args, label: "Result 2", number: 2, variant: "secondary" },
        { ...args, label: "Result 3", number: 3, variant: "accent" },
        {
          ...args,
          label: "Result 4",
          number: 4,
          variant: "secondary",
          selected: true,
        },
      ]}
    />
  ),
};

/** The same pins in the dark theme: the ring and number in its primary. */
export const InTheDark: Story = {
  render: (args) => (
    <ThemeProvider theme="dark">
      <OnTheMap
        pins={[
          { ...args, label: "Result 1, Burger King", number: 1 },
          {
            ...args,
            label: "Result 2, Harbour Coffee Co.",
            number: 2,
            selected: true,
          },
          { ...args, label: "Result 3, Dining", number: 3, tint: red },
          {
            ...args,
            label: "Result 4, Gates, on another floor",
            number: 4,
            offFloor: true,
          },
        ]}
      />
    </ThemeProvider>
  ),
};

/**
 * Right to left, each pin still stands on the point it marks (GAP-076) and
 * keeps its states; the numbers are the products', as its cards show them.
 */
export const RightToLeft: Story = {
  render: function RightToLeftStory(args, { globals }) {
    return (
      <ThemeProvider
        dir="rtl"
        theme={globals.theme === "dark" ? "dark" : "light"}
      >
        <OnTheMap
          pins={[
            { ...args, label: "النتيجة 1، برجر كنج", number: 1 },
            {
              ...args,
              label: "النتيجة 2، مقهى هاربور",
              number: 2,
              selected: true,
            },
            {
              ...args,
              label: "النتيجة 4، البوابات، في طابق آخر",
              number: 4,
              offFloor: true,
            },
          ]}
        />
      </ThemeProvider>
    );
  },
};

export const ExternalLabel: Story = {
  args: {
    label: "Baskin-Robbins, second floor",
    externalLabel: "Baskin-Robbins",
    labelPlacement: "bottom",
  },
  decorators: [onTheMap],
};

/**
 * A pin in a category's colours. At rest it is outlined in the fill with the
 * number in the foreground (six of the eight fills fail 4.5:1 as text on the
 * surface).
 */
export const Tinted: Story = {
  args: {
    label: "Dining",
    number: 3,
    tint: red,
  },
  decorators: [onTheMap],
};

/** Selected, the category's fill is the marker and its ink the number. */
export const TintedSelected: Story = {
  args: {
    label: "Dining, selected",
    number: 3,
    selected: true,
    tint: red,
  },
  decorators: [onTheMap],
};

/** Off the floor: the outlined marker with a dashed ring in the fill, the number in the foreground. */
export const TintedOffFloor: Story = {
  args: {
    label: "Gates, on another floor",
    number: 4,
    offFloor: true,
    tint: {
      accent: "var(--semantics-category-accent-yellow)",
      fill: "var(--semantics-category-fill-yellow)",
      onFill: "var(--semantics-category-on-fill-yellow)",
    },
  },
  decorators: [onTheMap],
};
