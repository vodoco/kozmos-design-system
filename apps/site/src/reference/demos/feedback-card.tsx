import { useState } from "react";
import { Box, FeedbackCard, Text } from "@kozmos-ds/react";
import { GlassBackdrop } from "../GlassBackdrop";
import type { DemoModule } from "../types";

function RateTheRoute() {
  const [note, setNote] = useState("Rate, add a comment, submit.");
  return (
    <Box className="site-demo-column">
      <FeedbackCard
        onSubmitFeedback={(rating, comment) =>
          setNote(
            `Submitted ${rating} of 5${comment ? ` with a comment: “${comment}”` : ""}.`,
          )
        }
      />
      <Text size="sm" color="muted" aria-live="polite">
        {note}
      </Text>
    </Box>
  );
}

function Submitting() {
  return (
    <Box className="site-demo-column">
      <FeedbackCard
        title="How was the walk?"
        description="Two questions, thirty seconds."
        isSubmitting
      />
    </Box>
  );
}

function OnGlass() {
  return (
    <GlassBackdrop colours={["green", "turquoise"]}>
      <FeedbackCard surface="glass" />
    </GlassBackdrop>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Rate the route",
    description:
      "A Rating, a Textarea and a submit; the card shows successMessage afterwards.",
    Component: RateTheRoute,
  },
  { title: "Submitting", Component: Submitting },
  { title: "On glass", Component: OnGlass },
];
