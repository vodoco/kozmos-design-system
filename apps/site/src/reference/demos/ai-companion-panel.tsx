import { useState } from "react";
import {
  ActionCard,
  AICompanionPanel,
  AIInputBar,
  AIMessage,
  AIMessageList,
  AISearchButton,
  Box,
  Notice,
  POIResultCard,
  Text,
  UserMessage,
} from "@kozmos-ds/react";
import { results } from "../sample-data";
import type { DemoModule } from "../types";

const bookshop = results[0];

/** The input, and the turns a question adds: nothing answers it here. */
function useAsking(inputLabel: string) {
  const [value, setValue] = useState("");
  const [asked, setAsked] = useState<string>();
  return {
    input: (
      <AIInputBar
        value={value}
        onValueChange={setValue}
        onSubmit={(question) => {
          setAsked(question);
          setValue("");
        }}
        inputLabel={inputLabel}
        placeholder="Ask about Riverside Centre"
      />
    ),
    asked: asked ? (
      <>
        <UserMessage>{asked}</UserMessage>
        <AIMessage status="streaming">Looking through this building…</AIMessage>
      </>
    ) : null,
  };
}

function WholeSurface() {
  const [open, setOpen] = useState(true);
  const { input, asked } = useAsking("Ask the Riverside Centre assistant");

  if (!open) {
    return (
      <Box className="site-demo-row">
        <AISearchButton
          label="Open the assistant"
          onClick={() => setOpen(true)}
        />
        <Text size="sm" color="muted">
          Closed — by the × or by Escape. On a phone the panel covers the frame
          and leaves the search underneath untouched.
        </Text>
      </Box>
    );
  }

  return (
    <Box className="site-demo-shell">
      <AICompanionPanel
        title="Riverside Centre assistant"
        onClose={() => setOpen(false)}
      >
        <AIMessageList label="Assistant conversation, the whole surface">
          <AIMessage>
            Hello — what are you looking for? Describe it in your own words,
            like “somewhere to buy a paperback”.
          </AIMessage>
          <UserMessage>Where can I buy a paperback?</UserMessage>
          <AIMessage
            actionCard={
              <ActionCard title="1 place">
                <POIResultCard
                  poi={bookshop.poi}
                  result={{
                    ...bookshop.result,
                    selected: false,
                    featured: false,
                  }}
                  currentFloorId="1"
                  onSelect={() => {}}
                />
              </ActionCard>
            }
          >
            The bookshop on the first floor sells new and second-hand books, 3
            minutes from where you are.
          </AIMessage>
          {asked}
        </AIMessageList>
        {input}
      </AICompanionPanel>
    </Box>
  );
}

function WithABanner() {
  const { input, asked } = useAsking("Ask the assistant, under a notice");
  return (
    <Box className="site-demo-shell">
      <AICompanionPanel
        title="Assistant"
        banner={
          <Notice summary="AI results may be incomplete. Check allergens with the venue.">
            These results are AI-assisted and may be incomplete or out of date.
            If you have an allergy or intolerance, confirm with the venue or its
            staff before you order.
          </Notice>
        }
      >
        <AIMessageList label="Assistant conversation, under a notice">
          <UserMessage>Anything gluten-free on the first floor?</UserMessage>
          <AIMessage status="timedOut" />
          {asked}
        </AIMessageList>
        {input}
      </AICompanionPanel>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "The whole surface",
    description:
      "A header, the thread and its input, in that order. onClose draws the × and lets Escape close it; asking adds the turn and the acknowledgement a real assistant streams back.",
    Component: WholeSurface,
    tall: true,
  },
  {
    title: "A banner, and nothing to close it",
    description:
      "banner sits above the thread — here Notice’s standing caveat. Without onClose there is no × and Escape does nothing, which is what a host that opened the panel some other way needs.",
    Component: WithABanner,
    tall: true,
  },
];
