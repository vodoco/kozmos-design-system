import {
  Box,
  Timeline,
  TimelineDescription,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const events = [
  {
    time: "09:00",
    title: "Doors open",
    description: "All floors, both entrances.",
  },
  {
    time: "12:30",
    title: "Author talk",
    description: "Community hall, second floor. Free.",
  },
  {
    time: "18:00",
    title: "Terrace closes",
    description: "Weather permitting until then.",
  },
  {
    time: "20:00",
    title: "Shops close",
    description: "The car park stays open until 23:00.",
  },
];

function Today() {
  return (
    <Box className="site-demo-column">
      <Timeline>
        {events.map((event) => (
          <TimelineItem key={event.time}>
            <TimelineTime>{event.time}</TimelineTime>
            <TimelineTitle>{event.title}</TimelineTitle>
            <TimelineDescription>{event.description}</TimelineDescription>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
}

function Compact() {
  return (
    <Box className="site-demo-column">
      <Timeline density="compact">
        {events.map((event) => (
          <TimelineItem key={event.time}>
            <TimelineTime>{event.time}</TimelineTime>
            <TimelineTitle>{event.title}</TimelineTitle>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Today’s events",
    description:
      "An ordered list with a time, a title and a description per item.",
    Component: Today,
  },
  { title: "Compact", Component: Compact },
];
