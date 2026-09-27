import { useState } from "react";
import { Box, Icon, MapControlButton } from "@kozmos-ds/react";
import { GlassBackdrop } from "../GlassBackdrop";
import type { DemoModule } from "../types";

function Presentations() {
  const [pressed, setPressed] = useState(false);
  return (
    <Box className="site-demo-row">
      <MapControlButton icon={<Icon name="plus" size="sm" />} label="Zoom in" />
      <MapControlButton
        icon={<Icon name="minus" size="sm" />}
        label="Zoom out"
        emphasis="filled"
      />
      <MapControlButton
        icon={<Icon name="map-01" size="sm" />}
        label="Map style"
        presentation="labelled"
      />
      <MapControlButton
        icon={<Icon name="compass-01" size="sm" />}
        label="North"
        presentation="labelled"
        labelPlacement="stacked"
      />
      <MapControlButton
        icon={<Icon name="navigation-pointer-01" size="sm" />}
        label="Follow my location"
        emotion="themed"
        pressed={pressed}
        stateLabel={pressed ? "Following" : "Not following"}
        onClick={() => setPressed((value) => !value)}
      />
      <MapControlButton
        icon={<Icon name="navigation-pointer-01" size="sm" />}
        label="Locating"
        isLoading
        stateLabel="Locating…"
      />
    </Box>
  );
}

function OnGlass() {
  return (
    <GlassBackdrop colours={["blue", "orange"]} row>
      <MapControlButton
        variant="glass"
        icon={<Icon name="plus" size="sm" />}
        label="Zoom in"
      />
      <MapControlButton
        variant="glass"
        icon={<Icon name="minus" size="sm" />}
        label="Zoom out"
      />
      <MapControlButton
        variant="glass"
        icon={<Icon name="navigation-pointer-01" size="sm" />}
        label="My location"
        presentation="labelled"
      />
    </GlassBackdrop>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Icon-only, labelled, stacked, pressed, loading",
    description:
      "label is always the accessible name; presentation decides whether it prints. stateLabel announces a change.",
    Component: Presentations,
  },
  { title: "On glass", Component: OnGlass },
];
