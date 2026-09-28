import { useEffect, useRef, useState } from "react";
import {
  ActionCard,
  AICompanionPanel,
  AIInputBar,
  AIMessage,
  AIMessageList,
  POIResultCard,
  UserMessage,
  type AIVoiceState,
} from "@kozmos-ds/react";
import { answerFor, greeting, spokenQuestion, type Answer } from "./answers";
import type { Place } from "./data";

interface Turn {
  id: number;
  from: "visitor" | "assistant";
  text: string;
  places?: readonly Place[];
  /** An answer still arriving. */
  streaming?: boolean;
}

/** How long each scripted beat of the spoken conversation lasts, in ms. */
const CONNECTING = 800;
const LISTENING = 1800;
const SPEAKING = 2600;
/** How long an answer streams before it is whole, in ms. */
const STREAMING = 600;

/**
 * The assistant over the phone's frame: AICompanionPanel, opened from the
 * AI search button beside the search field, with its thread and its input.
 * It answers from the example's own places (./answers.ts), and its voice
 * conversation is a script — there is no voice model here, and nothing
 * listens to the microphone. A place picked from the thread closes the
 * assistant and opens that place in the sheet it covered.
 */
export function Assistant({
  open,
  places,
  onClose,
  onChoosePlace,
  currentFloorId,
}: {
  open: boolean;
  places: readonly Place[];
  onClose: () => void;
  onChoosePlace: (poiId: string) => void;
  currentFloorId: string;
}) {
  const [turns, setTurns] = useState<readonly Turn[]>(() => [
    { id: 0, from: "assistant", text: greeting },
  ]);
  const [question, setQuestion] = useState("");
  const [voiceState, setVoiceState] = useState<AIVoiceState>("idle");
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  // A place picked from the thread takes focus in the sheet; the panel must
  // not hand it back to the AI search button as it closes.
  const handedOff = useRef(false);

  const later = (ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms));
  };
  const clearTimers = () => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  function ask(text: string) {
    const answer: Answer = answerFor(text, places);
    const visitor = nextId.current++;
    const reply = nextId.current++;
    setTurns((current) => [
      ...current,
      { id: visitor, from: "visitor", text },
      { id: reply, from: "assistant", text: answer.text, streaming: true },
    ]);
    // The answer arrives in a moment, as a model's does, with its places.
    later(STREAMING, () =>
      setTurns((current) =>
        current.map((turn) =>
          turn.id === reply
            ? { ...turn, streaming: false, places: answer.places }
            : turn,
        ),
      ),
    );
  }

  // The script a voice model would drive: connect, listen, hear one
  // question, say the answer, listen again until the visitor ends it.
  function startVoice() {
    clearTimers();
    setVoiceState("connecting");
    later(CONNECTING, () => setVoiceState("listening"));
    later(CONNECTING + LISTENING, () => {
      ask(spokenQuestion);
      setVoiceState("speaking");
    });
    later(CONNECTING + LISTENING + SPEAKING, () => setVoiceState("listening"));
  }

  function endVoice() {
    clearTimers();
    setVoiceState("idle");
  }

  // Closing ends a live conversation too: a microphone never stays open
  // behind a panel the visitor has closed.
  function close() {
    endVoice();
    onClose();
  }

  // One voice at a time: while the conversation is live the thread does not
  // read its turns out over the assistant saying them.
  const live = ["connecting", "listening", "speaking"].includes(voiceState);

  return (
    <AICompanionPanel
      className="ex-phone-assistant"
      open={open}
      onClose={close}
      onCloseAutoFocus={(event) => {
        if (!handedOff.current) return;
        handedOff.current = false;
        event.preventDefault();
      }}
    >
      {/* GAP-83: the thread scrolls and takes no focus of its own, so a
          keyboard could not scroll it; it is given a tab stop here. */}
      <AIMessageList tabIndex={0} aria-live={live ? "off" : "polite"}>
        {turns.map((turn) =>
          turn.from === "visitor" ? (
            <UserMessage key={turn.id}>{turn.text}</UserMessage>
          ) : (
            <AIMessage
              key={turn.id}
              status={turn.streaming ? "streaming" : undefined}
              actionCard={
                turn.places && turn.places.length > 0 ? (
                  <ActionCard
                    title={
                      turn.places.length === 1
                        ? "1 place"
                        : `${turn.places.length} places`
                    }
                  >
                    {turn.places.map((place, index) => (
                      <POIResultCard
                        key={place.poi.id}
                        poi={place.poi}
                        result={{
                          poiId: place.poi.id,
                          resultIndex: index + 1,
                          selected: false,
                          featured: false,
                          floorId: place.poi.floorId,
                          travelEstimate: place.details.travelEstimate,
                        }}
                        currentFloorId={currentFloorId}
                        onSelect={(poiId) => {
                          handedOff.current = true;
                          endVoice();
                          onChoosePlace(poiId);
                        }}
                      />
                    ))}
                  </ActionCard>
                ) : undefined
              }
            >
              {turn.text}
            </AIMessage>
          ),
        )}
      </AIMessageList>
      <AIInputBar
        placeholder="Ask about the centre"
        value={question}
        onValueChange={setQuestion}
        onSubmit={(text) => {
          ask(text);
          setQuestion("");
        }}
        // A product passes these only where it has a voice model; this
        // example plays a script in its place.
        onVoiceStart={startVoice}
        onVoiceEnd={endVoice}
        voiceState={voiceState}
      />
    </AICompanionPanel>
  );
}
