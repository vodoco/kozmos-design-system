import figma from "@figma/code-connect";
import { MapStatusPill } from "./MapStatusPill";

const mapStatusPillUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17374";

/**
 * Figma Code Connect: MapStatusPill (decision 39, GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17374
 *
 * Tone is tone. Status Text is the words; Show Mark off is icon={null}, no
 * mark, one connect each way. live chooses how a change is announced and
 * draws nothing.
 */
figma.connect(MapStatusPill, mapStatusPillUrl, {
  variant: { "Show Mark": true },
  props: {
    tone: figma.enum("Tone", {
      Neutral: "neutral",
      Progress: "progress",
      Success: "success",
      Danger: "danger",
      Warning: "warning",
    }),
    children: figma.string("Status Text"),
  },
  example: ({ tone, children }) => (
    <MapStatusPill tone={tone}>{children}</MapStatusPill>
  ),
});

figma.connect(MapStatusPill, mapStatusPillUrl, {
  variant: { "Show Mark": false },
  props: {
    tone: figma.enum("Tone", {
      Neutral: "neutral",
      Progress: "progress",
      Success: "success",
      Danger: "danger",
      Warning: "warning",
    }),
    children: figma.string("Status Text"),
  },
  example: ({ tone, children }) => (
    <MapStatusPill tone={tone} icon={null}>
      {children}
    </MapStatusPill>
  ),
});
