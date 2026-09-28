import { useState } from "react";
import {
  ActionCard,
  AIMessage,
  Box,
  Icon,
  IconButton,
  POIResultCard,
  Text,
} from "@kozmos-ds/react";
import { results } from "../sample-data";
import type { DemoModule } from "../types";

const bookshop = results[0];

function AnAnswer() {
  const [again, setAgain] = useState(0);
  return (
    <Box className="site-demo-column">
      <AIMessage>
        The bookshop is on the first floor, past the lifts. It is open until
        20:00.
      </AIMessage>
      <AIMessage
        trailing={
          <IconButton
            aria-label="Ask again"
            variant="outline"
            onClick={() => setAgain((count) => count + 1)}
          >
            <Icon name="flip-backward" />
          </IconButton>
        }
        actionCard={
          <ActionCard title="1 place">
            <POIResultCard
              poi={bookshop.poi}
              result={{ ...bookshop.result, selected: false, featured: false }}
              currentFloorId="1"
              onSelect={() => {}}
            />
          </ActionCard>
        }
      >
        Here it is — 3 minutes from where you are.
      </AIMessage>
      <Text size="sm" color="muted" aria-live="polite">
        {again
          ? `Asked again ${again} time${again === 1 ? "" : "s"}.`
          : "trailing sits beside the bubble; actionCard sits under it, at the turn’s full width."}
      </Text>
    </Box>
  );
}

function StillThinkingAndOutOfTime() {
  return (
    <Box className="site-demo-column">
      <AIMessage status="streaming">Looking through this building…</AIMessage>
      <AIMessage status="streaming" streamingLabel="Still searching" />
      <AIMessage status="timedOut" />
      <AIMessage
        status="timedOut"
        timedOutLabel="No answer yet. Search and the map still work."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "An answer, with results and a control",
    description:
      "The turn is its children, in a bubble that stops at 85% of the row. trailing puts a control beside the bubble; actionCard carries rich content underneath.",
    Component: AnAnswer,
  },
  {
    title: "Streaming, and out of time",
    description:
      "streaming runs three dots beside the words rather than instead of them, so an acknowledgement can arrive before the answer; streamingLabel is what a screen reader hears in the dots’ place. timedOut greys the bubble and falls back to timedOutLabel when there is nothing to show; it offers no retry of its own — that is what trailing is for.",
    Component: StillThinkingAndOutOfTime,
  },
];
