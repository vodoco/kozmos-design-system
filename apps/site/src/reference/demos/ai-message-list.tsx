import { useState } from "react";
import {
  AIMessage,
  AIMessageList,
  Box,
  Button,
  Stack,
  Text,
  UserMessage,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const script = [
  {
    id: "greeting",
    from: "assistant",
    text: "Hello — what are you looking for? Describe it in your own words.",
  },
  { id: "quiet", from: "visitor", text: "Somewhere quiet to work for an hour" },
  {
    id: "corner",
    from: "assistant",
    text: "The reading corner in the bookshop is quiet until 17:00, and the co-working offices on the second floor take drop-ins.",
  },
  { id: "plug", from: "visitor", text: "Is there a plug?" },
  {
    id: "window",
    from: "assistant",
    text: "Two, by the window seats. The bookshop is 3 minutes from where you are.",
  },
] as const;

function Turn({ turn }: { turn: (typeof script)[number] }) {
  return turn.from === "visitor" ? (
    <UserMessage>{turn.text}</UserMessage>
  ) : (
    <AIMessage>{turn.text}</AIMessage>
  );
}

function Following() {
  const [shown, setShown] = useState(2);
  const whole = shown >= script.length;
  return (
    <Box className="site-demo-column">
      <Stack className="site-demo-scroll">
        <AIMessageList
          label="Assistant conversation, following the newest turn"
          tabIndex={0}
        >
          {script.slice(0, shown).map((turn) => (
            <Turn key={turn.id} turn={turn} />
          ))}
        </AIMessageList>
      </Stack>
      <Button
        variant="outline"
        onClick={() =>
          setShown((count) => (count < script.length ? count + 1 : 2))
        }
      >
        {whole ? "Start the thread again" : "Add the next turn"}
      </Button>
      <Text size="sm" color="muted" aria-live="polite">
        {`${shown} of ${script.length} turns. Each one scrolls the thread to itself.`}
      </Text>
    </Box>
  );
}

function LeftWhereItWas() {
  return (
    <Box className="site-demo-column">
      <Stack className="site-demo-scroll">
        <AIMessageList
          followLatest={false}
          label="Assistant conversation, left where it was"
          tabIndex={0}
        >
          {script.map((turn) => (
            <Turn key={turn.id} turn={turn} />
          ))}
        </AIMessageList>
      </Stack>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "A thread that follows the newest turn",
    description:
      'role="log" with aria-live="polite": turns arrive over time and are announced without taking the visitor’s place. It needs a bounded, flexible parent — the thread itself is flex-1 and scrolls inside it. Both threads here pass tabIndex={0}: the thread does not make its own scrolling region focusable, so without it a keyboard visitor cannot reach a turn that has scrolled out of sight.',
    Component: Following,
  },
  {
    title: "Left where the visitor left it",
    description:
      "followLatest={false} for a product that scrolls the thread itself: this one opens at the first turn and stays there.",
    Component: LeftWhereItWas,
  },
];
