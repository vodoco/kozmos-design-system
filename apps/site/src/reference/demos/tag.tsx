import { useState } from "react";
import { Box, Tag } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const emotions = [
  "themed",
  "neutral",
  "success",
  "danger",
  "informative",
  "alert",
] as const;

function Variants() {
  return (
    <Box className="site-demo-row">
      <Tag>Default</Tag>
      <Tag variant="secondary">Secondary</Tag>
      <Tag variant="outline">Outline</Tag>
      <Tag variant="destructive">Destructive</Tag>
    </Box>
  );
}

function Emotions() {
  return (
    <Box className="site-demo-column">
      <Box className="site-demo-row">
        {emotions.map((emotion) => (
          <Tag key={emotion} emotion={emotion}>
            {emotion}
          </Tag>
        ))}
      </Box>
      <Box className="site-demo-row">
        {emotions.map((emotion) => (
          <Tag key={emotion} emotion={emotion} variant="outline">
            {emotion}
          </Tag>
        ))}
      </Box>
    </Box>
  );
}

function Removable() {
  const [tags, setTags] = useState(["Books", "Café", "Author events"]);
  return (
    <Box className="site-demo-row">
      {tags.map((tag) => (
        <Tag
          key={tag}
          variant="secondary"
          onRemove={() => setTags(tags.filter((t) => t !== tag))}
        >
          {tag}
        </Tag>
      ))}
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  { title: "Variants", Component: Variants },
  {
    title: "Emotions, filled and outlined",
    description:
      "The product drives this axis on 33,988 tag instances; emotion decides the colour, outline turns it into text with an edge.",
    Component: Emotions,
  },
  {
    title: "Removable",
    description: "onRemove adds a remove button, reported to analytics.",
    Component: Removable,
  },
];
