import type { Decorator, Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import { fn } from "@storybook/test";
import { LocationPin, type LocationPinProps } from "./LocationPin";
import { ThemeProvider } from "../ThemeProvider/ThemeProvider";

const meta: Meta<typeof LocationPin> = {
  id: "product-sdk-locationpin",
  title: "SDK/Map controls/LocationPin",
  component: LocationPin,
  parameters: { layout: "centered" },
  args: { onClick: fn(), onOpen: fn() },
};

export default meta;
type Story = StoryObj<typeof LocationPin>;

/**
 * A fictional café's logo, drawn inline: a featured tile shows the product's
 * own image, and the visual review loads nothing from outside.
 */
const logo = (
  <img
    alt=""
    src={`data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#C8102E"/><text x="20" y="26" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">HC</text></svg>',
    )}`}
  />
);

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
        padding: "72px 16px 24px",
        borderRadius: 16,
        background: "var(--primitives-colors-background-100)",
      }}
    >
      {children}
    </div>
  );
}

function Spot({
  children,
  width = 64,
  at = "50%",
}: {
  children: ReactNode;
  width?: number;
  at?: number | string;
}) {
  return (
    <div style={{ position: "relative", width, height: 8 }}>
      <div style={{ position: "absolute", left: at, top: 0 }}>{children}</div>
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

/**
 * One pin with its words at its right, on a stretch of map wide enough to
 * hold them: the pin 32 in, and the words, 192 at most, 4 beyond it. On the
 * 64 spot the words ran off the map, and past a phone's 320 in a wide font.
 */
const onTheMapWithWordsAtTheRight: Decorator = (Story) => (
  <MapStandIn>
    <Spot width={248} at={32}>
      <Story />
    </Spot>
  </MapStandIn>
);

/**
 * A result: its number in a pill on a pointer, anchored at the pointer's
 * tip, as the SDK's map style draws it (decision 71). In a product the
 * markers come from the map style's sprite sheet; LocationPin draws the same
 * for prototypes and boards.
 */
export const Default: Story = {
  args: { label: "Result 1, Harbour Coffee Co.", number: 1 },
  decorators: [onTheMap],
};

/**
 * Results at rest: theme 600 on the background, the pill as wide as its
 * number needs, 32 at least. Without a number, a dot.
 */
export const Results: Story = {
  render: (args) => (
    <OnTheMap
      pins={[
        { ...args, label: "Result 1, Harbour Coffee Co.", number: 1 },
        { ...args, label: "Result 12, Tessel Shoes", number: 12 },
        { ...args, label: "Result 128, Gate B12", number: 128 },
        { ...args, label: "Baskin-Robbins" },
      ]}
    />
  ),
};

/**
 * Selected, a result fills in theme 600 with its number in foreground/1000;
 * it doesn't grow. Its card's number tab fills with it (decision 55).
 */
export const Selected: Story = {
  render: (args) => (
    <OnTheMap
      pins={[
        { ...args, label: "Result 1, Harbour Coffee Co.", number: 1 },
        {
          ...args,
          label: "Result 2, Tessel Shoes, selected",
          number: 2,
          selected: true,
        },
        { ...args, label: "Result 3, Baskin-Robbins", number: 3 },
        { ...args, label: "Gate B12, selected", selected: true },
      ]}
    />
  ),
};

/**
 * A featured place: its logo in a tile with a dark rim, 44 square and 52
 * when selected, standing on a dot. No number and no accent colour
 * (decision 81): in a product it is the featured sprite Pointr's back end
 * makes with the logo. Without a logo the tile is empty.
 */
export const Featured: Story = {
  render: (args) => (
    <OnTheMap
      pins={[
        {
          ...args,
          featured: true,
          label: "Harbour Coffee Co.",
          markerContent: logo,
        },
        {
          ...args,
          featured: true,
          label: "Harbour Coffee Co., selected",
          markerContent: logo,
          selected: true,
        },
        { ...args, featured: true, label: "Tessel Shoes" },
      ]}
    />
  ),
};

/**
 * A place on its own, its details open: the green pin, the only marker on
 * the map, standing on its dot. It shows no number and no logo.
 */
export const Place: Story = {
  args: { label: "Harbour Coffee Co.", place: true },
  decorators: [onTheMap],
};

/** A search's results on the map, a featured place among them. */
export const OnAMap: Story = {
  render: (args) => (
    <OnTheMap
      pins={[
        { ...args, label: "Result 1, Tessel Shoes", number: 1 },
        {
          ...args,
          featured: true,
          label: "Harbour Coffee Co.",
          markerContent: logo,
        },
        {
          ...args,
          label: "Result 3, Baskin-Robbins, selected",
          number: 3,
          selected: true,
        },
        { ...args, label: "Result 4, Gate B12", number: 4 },
      ]}
    />
  ),
};

/**
 * Right to left the markers stand where they did: a pin is anchored by a
 * physical point, as the renderer gives it.
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
              featured: true,
              label: "مقهى هاربور",
              markerContent: logo,
            },
          ]}
        />
      </ThemeProvider>
    );
  },
};

export const ExternalLabel: Story = {
  args: {
    label: "Result 2, Harbour Coffee Co.",
    number: 2,
    externalLabel: "Harbour Coffee Co.",
    labelPlacement: "right",
  },
  decorators: [onTheMapWithWordsAtTheRight],
};
