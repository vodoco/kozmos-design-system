import { useState } from "react";
import { Box, Icon, LocationPin, Text } from "@kozmos-ds/react";
import { tint } from "../sample-data";
import type { DemoModule } from "../types";

/**
 * A pin positions itself: absolute, its tip at the anchor point. In a product
 * the map engine gives it that point; here each pin gets one on a stage.
 */
function Pinned({
  x,
  y = 78,
  children,
}: {
  x: number;
  y?: number;
  children: React.ReactNode;
}) {
  return (
    <Box
      className="site-demo-pin"
      style={{ "--pin-x": `${x}%`, "--pin-y": `${y}%` }}
    >
      {children}
    </Box>
  );
}

function Variants() {
  return (
    <Box className="site-demo-pins">
      <Pinned x={10}>
        <LocationPin label="Primary" />
      </Pinned>
      <Pinned x={26}>
        <LocationPin label="Default" variant="default" />
      </Pinned>
      <Pinned x={42}>
        <LocationPin label="Secondary" variant="secondary" />
      </Pinned>
      <Pinned x={58}>
        <LocationPin label="Accent" variant="accent" />
      </Pinned>
      <Pinned x={74}>
        <LocationPin label="Small" size="sm" />
      </Pinned>
      <Pinned x={90}>
        <LocationPin label="Large" size="lg" />
      </Pinned>
    </Box>
  );
}

function States() {
  const [selected, setSelected] = useState("2");
  return (
    <Box className="site-demo-column">
      <Box className="site-demo-pins">
        {["1", "2", "3"].map((number, index) => (
          <Pinned key={number} x={12 + index * 16}>
            <LocationPin
              label={`Result ${number}`}
              number={Number(number)}
              selected={selected === number}
              onClick={() => setSelected(number)}
            />
          </Pinned>
        ))}
        <Pinned x={62}>
          <LocationPin label="Featured" featured />
        </Pinned>
        <Pinned x={76}>
          <LocationPin label="On another floor" offFloor />
        </Pinned>
        <Pinned x={90}>
          <LocationPin label="Unavailable" disabled />
        </Pinned>
      </Box>
      <Text size="sm" color="muted" aria-live="polite">
        Result {selected} is selected; the label is the pin’s accessible name.
      </Text>
    </Box>
  );
}

function Tinted() {
  return (
    <Box className="site-demo-pins site-demo-pins-tall">
      <Pinned x={18} y={55}>
        <LocationPin
          label="Bookshop, first floor"
          externalLabel="Bookshop"
          tint={tint("blue")}
          markerContent={<Icon name="shopping-bag-02" size="sm" />}
        />
      </Pinned>
      <Pinned x={50} y={55}>
        <LocationPin
          label="Bus interchange"
          externalLabel="Buses"
          labelPlacement="right"
          tint={tint("green")}
          markerContent={<Icon name="bus" size="sm" />}
        />
      </Pinned>
      <Pinned x={82} y={78}>
        <LocationPin
          label="Information desk"
          externalLabel="Information"
          labelPlacement="top"
          tint={tint("turquoise")}
          markerContent={<Icon name="info-circle" size="sm" />}
        />
      </Pinned>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Variants and sizes",
    description:
      "A pin is a button that positions itself, tip on the anchor point; in a product the map engine gives it that point.",
    Component: Variants,
  },
  {
    title: "Numbered, selected, featured, off-floor, disabled",
    Component: States,
  },
  {
    title: "Category tint, a glyph, and an external label",
    description:
      "tint colours the pin from a category; externalLabel prints beside it where labelPlacement says.",
    Component: Tinted,
  },
];
