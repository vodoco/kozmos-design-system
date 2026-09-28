import { AIMessage, Box, UserMessage } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function TakingTurns() {
  return (
    <Box className="site-demo-column">
      <AIMessage>
        Hello — what are you looking for? Describe it in your own words, like
        “somewhere quiet to work”.
      </AIMessage>
      <UserMessage>Somewhere quiet to work for an hour</UserMessage>
      <AIMessage>
        The reading corner in the bookshop is quiet until 17:00, and the
        co-working offices on the second floor take drop-ins.
      </AIMessage>
      <UserMessage>Is there a plug?</UserMessage>
    </Box>
  );
}

function ALongerQuestion() {
  return (
    <Box className="site-demo-column">
      <UserMessage>
        I am meeting someone off the 14:40 coach and we need somewhere on the
        ground floor to sit down with a coffee, before the shops shut.
      </UserMessage>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "The visitor’s turn, against the assistant’s",
    description:
      "Filled and at the end of the row, where AIMessage is outlined and starts it: the two turns differ by side and by fill, not by colour alone.",
    Component: TakingTurns,
  },
  {
    title: "A longer question",
    description:
      "It takes no props of its own — the turn is its children, and the bubble stops at 85% of the row, so a long question wraps rather than filling it.",
    Component: ALongerQuestion,
  },
];
