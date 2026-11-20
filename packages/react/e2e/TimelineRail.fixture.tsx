import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import {
  Timeline,
  TimelineDescription,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "../src/components/Timeline/Timeline";

/** GAP-247: the How to install steps, the last one with a long body. */
export function TimelineRailFixture({
  density,
  theme = "light",
}: {
  density?: "default" | "compact";
  theme?: "light" | "dark";
}) {
  return (
    <ThemeProvider theme={theme}>
      <div style={{ width: 360, padding: 16 }} data-host="">
        <Timeline density={density}>
          {["Unbox the beacon", "Pair it", "Mount it"].map((title, index) => (
            <TimelineItem key={title}>
              <TimelineTime>Step {index + 1}</TimelineTime>
              <TimelineTitle>{title}</TimelineTitle>
              <TimelineDescription>
                {index === 2
                  ? "Fix it to the wall at head height, away from metal, and check its signal from the far side of the room before you leave it."
                  : "A line about the step."}
              </TimelineDescription>
            </TimelineItem>
          ))}
        </Timeline>
      </div>
    </ThemeProvider>
  );
}
