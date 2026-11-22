import figma from "@figma/code-connect";
import {
  Timeline,
  TimelineDescription,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "./Timeline";

const timelineUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=660-4393";

const timelineProps = {
  density: figma.enum("Density", {
    Default: "default",
    Compact: "compact",
  }),
  item1Time: figma.string("Item 1 Time"),
  item1Title: figma.string("Item 1 Title"),
  item1Description: figma.string("Item 1 Description"),
  item2Time: figma.string("Item 2 Time"),
  item2Title: figma.string("Item 2 Title"),
  item2Description: figma.string("Item 2 Description"),
  item3Time: figma.string("Item 3 Time"),
  item3Title: figma.string("Item 3 Title"),
  item3Description: figma.string("Item 3 Description"),
};

// Content is what each item composes: Basic its title, Detailed its time,
// title and description. One connection each: Code Connect substitutes a
// property only where the example's JSX uses it, so a Content mapping read in
// a condition reached Dev Mode as a bare name.
figma.connect(Timeline, timelineUrl, {
  variant: { Content: "Basic" },
  props: timelineProps,
  example: ({ density, item1Title, item2Title, item3Title }) => (
    <Timeline density={density}>
      <TimelineItem>
        <TimelineTitle>{item1Title}</TimelineTitle>
      </TimelineItem>
      <TimelineItem>
        <TimelineTitle>{item2Title}</TimelineTitle>
      </TimelineItem>
      <TimelineItem>
        <TimelineTitle>{item3Title}</TimelineTitle>
      </TimelineItem>
    </Timeline>
  ),
});

figma.connect(Timeline, timelineUrl, {
  variant: { Content: "Detailed" },
  props: timelineProps,
  example: ({
    density,
    item1Time,
    item1Title,
    item1Description,
    item2Time,
    item2Title,
    item2Description,
    item3Time,
    item3Title,
    item3Description,
  }) => (
    <Timeline density={density}>
      <TimelineItem>
        <TimelineTime>{item1Time}</TimelineTime>
        <TimelineTitle>{item1Title}</TimelineTitle>
        <TimelineDescription>{item1Description}</TimelineDescription>
      </TimelineItem>
      <TimelineItem>
        <TimelineTime>{item2Time}</TimelineTime>
        <TimelineTitle>{item2Title}</TimelineTitle>
        <TimelineDescription>{item2Description}</TimelineDescription>
      </TimelineItem>
      <TimelineItem>
        <TimelineTime>{item3Time}</TimelineTime>
        <TimelineTitle>{item3Title}</TimelineTitle>
        <TimelineDescription>{item3Description}</TimelineDescription>
      </TimelineItem>
    </Timeline>
  ),
});
