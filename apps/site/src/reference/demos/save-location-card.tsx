import { useState } from "react";
import { Box, SaveLocationCard, Text } from "@kozmos-ds/react";
import { GlassBackdrop } from "../GlassBackdrop";
import type { DemoModule } from "../types";

function MarkMyCar() {
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState("Nothing saved yet.");
  return (
    <Box className="site-demo-column">
      <SaveLocationCard
        isSaved={saved}
        onSaveToggle={() => {
          setSaved((value) => !value);
          setNote(saved ? "Forgotten." : "Saved: car park, bay 42.");
        }}
        onRouteToLocation={() => setNote("Routing to the car.")}
        onEditNote={() => setNote("Editing the note.")}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {note}
      </Text>
    </Box>
  );
}

function OnGlass() {
  return (
    <GlassBackdrop colours={["orange", "green"]}>
      <SaveLocationCard
        surface="glass"
        title="Remember this spot"
        description="Find your way back to the terrace."
        isSaved
        onSaveToggle={() => {}}
        onRouteToLocation={() => {}}
      />
    </GlassBackdrop>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Mark my car",
    description:
      "Save, then route back or edit the note; isSaved swaps the actions.",
    Component: MarkMyCar,
  },
  { title: "On glass, with its own words", Component: OnGlass },
];
