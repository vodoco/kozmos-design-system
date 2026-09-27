import { useState } from "react";
import {
  AIInputBar,
  AIMessage,
  Box,
  Icon,
  IconButton,
  Surface,
  Text,
  UserMessage,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Asking() {
  const [value, setValue] = useState("");
  const [asked, setAsked] = useState<string>();
  return (
    <Box className="site-demo-column">
      <Surface>
        <Box className="site-demo-panel">
          {asked ? (
            <UserMessage>{asked}</UserMessage>
          ) : (
            <AIMessage>
              Hello — what are you looking for? Describe it in your own words.
            </AIMessage>
          )}
        </Box>
        <AIInputBar
          value={value}
          onValueChange={setValue}
          onSubmit={(question) => {
            setAsked(question);
            setValue("");
          }}
          inputLabel="Ask about Riverside Centre"
          placeholder="Ask about Riverside Centre"
        />
      </Surface>
      <Text size="sm" color="muted" aria-live="polite">
        {asked
          ? `It handed over “${asked}” — trimmed, and never empty.`
          : "Send stays disabled until there is something to ask, and Enter submits as it would in any other field. The bar draws its own top border, for the foot of a panel."}
      </Text>
    </Box>
  );
}

function WhileItReplies() {
  const [note, setNote] = useState(
    "disabled greys the field and Send, and the question stays in the field.",
  );
  return (
    <Box className="site-demo-column">
      <Surface>
        <Box className="site-demo-panel">
          <AIMessage status="streaming">
            Looking through this building…
          </AIMessage>
        </Box>
        <AIInputBar
          disabled
          value="Where can I get a coffee?"
          onValueChange={() => {}}
          onSubmit={() => {}}
          inputLabel="Ask about Riverside Centre, while it replies"
          trailing={
            <IconButton
              aria-label="Suggest a question"
              onClick={() =>
                setNote(
                  "The trailing control is still live: disabled reaches the field and Send, not the slot.",
                )
              }
            >
              <Icon name="stars-01" size="sm" />
            </IconButton>
          }
        />
      </Surface>
      <Text size="sm" color="muted" aria-live="polite">
        {note}
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Asking a question",
    description:
      "A single-line form: value and onValueChange are the caller’s, onSubmit is given the trimmed text and is never called with an empty one.",
    Component: Asking,
  },
  {
    title: "Disabled, with a control in the field",
    description:
      "trailing sits inside the field, before Send — the documentation names a voice control, and Kozmos has no microphone icon, so this one suggests a question instead. disabled reaches the field and Send but not the slot, which stays the product’s to disable.",
    Component: WhileItReplies,
  },
];
