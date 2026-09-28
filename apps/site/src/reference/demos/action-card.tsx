import { useState } from "react";
import {
  ActionCard,
  AIMessage,
  Box,
  Button,
  POIResultList,
  Text,
} from "@kozmos-ds/react";
import { results } from "../sample-data";
import type { DemoModule } from "../types";

function ResultsUnderAReply() {
  const [opened, setOpened] = useState<string>();
  return (
    <Box className="site-demo-column">
      <AIMessage
        actionCard={
          <ActionCard title="3 places">
            <POIResultList
              label="Places the assistant found"
              resultCountLabel="3 places"
              items={results}
              currentFloorId="1"
              selectedPoiId={opened}
              onSelect={setOpened}
            />
          </ActionCard>
        }
      >
        Three places match. The bookshop is the closest, 3 minutes from where
        you are.
      </AIMessage>
      <Text size="sm" color="muted" aria-live="polite">
        {opened
          ? `Opened ${opened}: the same card, and the same handlers, as the search list.`
          : "The rows are ordinary POIResultCards, so a result here opens what a result in search opens."}
      </Text>
    </Box>
  );
}

function AHandOff() {
  const [note, setNote] = useState(
    "Without a title the card is only the gap between the bubble and what it holds.",
  );
  return (
    <Box className="site-demo-column">
      <AIMessage
        actionCard={
          <ActionCard>
            <Button
              onClick={() =>
                setNote(
                  "A product decides what the hand-off does; the card only holds the control.",
                )
              }
            >
              Walk me to the bookshop
            </Button>
          </ActionCard>
        }
      >
        I can take you there from here.
      </AIMessage>
      <Text size="sm" color="muted" aria-live="polite">
        {note}
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A result list under a reply",
    description:
      "title is a small label above whatever the card holds — here a POIResultList inside an AIMessage’s actionCard, which draws at the turn’s full width rather than the bubble’s.",
    Component: ResultsUnderAReply,
  },
  {
    title: "A hand-off, with no title",
    description:
      "The card draws no surface of its own: no border, no fill, no padding. It stacks a label and its content, stretching what it holds to the turn’s full width, and that is all it does.",
    Component: AHandOff,
  },
];
