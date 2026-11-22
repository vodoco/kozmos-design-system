import figma from "@figma/code-connect";
import { AIInputBar, type AIInputBarProps } from "./AIInputBar";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const draft: AIInputBarProps["value"];
declare const setValue: AIInputBarProps["onValueChange"];
declare const ask: AIInputBarProps["onSubmit"];
declare const startVoice: NonNullable<AIInputBarProps["onVoiceStart"]>;
declare const endVoice: NonNullable<AIInputBarProps["onVoiceEnd"]>;

/**
 * Figma Code Connect: AIInputBar (decision 22, GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18346
 *
 * State is value and disabled: Empty has no words, Filled the Value Text,
 * Disabled is disabled. VoiceState is voiceState, Off being no onVoiceStart
 * (no microphone) and Idle the default; every other VoiceState has the
 * microphone, onVoiceStart and onVoiceEnd. Placeholder Text is placeholder.
 */
figma.connect(
  AIInputBar,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18346",
  {
    props: {
      // Empty and Disabled show the product's own draft: Code Connect leaves
      // an empty string out of a snippet, and value is required.
      value: figma.enum("State", {
        Empty: draft,
        Filled: figma.string("Value Text"),
        Disabled: draft,
      }),
      disabled: figma.enum("State", { Disabled: true }),
      placeholder: figma.string("Placeholder Text"),
      voiceState: figma.enum("VoiceState", {
        Off: undefined,
        Idle: undefined,
        Connecting: "connecting",
        Listening: "listening",
        Speaking: "speaking",
        Unavailable: "unavailable",
        Error: "error",
      }),
      onVoiceStart: figma.enum("VoiceState", {
        Off: undefined,
        Idle: () => startVoice(),
        Connecting: () => startVoice(),
        Listening: () => startVoice(),
        Speaking: () => startVoice(),
        Unavailable: () => startVoice(),
        Error: () => startVoice(),
      }),
      onVoiceEnd: figma.enum("VoiceState", {
        Off: undefined,
        Idle: () => endVoice(),
        Connecting: () => endVoice(),
        Listening: () => endVoice(),
        Speaking: () => endVoice(),
        Unavailable: () => endVoice(),
        Error: () => endVoice(),
      }),
    },
    example: ({
      value,
      disabled,
      placeholder,
      voiceState,
      onVoiceStart,
      onVoiceEnd,
    }) => (
      <AIInputBar
        value={value}
        onValueChange={(next) => setValue(next)}
        onSubmit={(question) => ask(question)}
        placeholder={placeholder}
        disabled={disabled}
        voiceState={voiceState}
        onVoiceStart={onVoiceStart}
        onVoiceEnd={onVoiceEnd}
      />
    ),
  },
);
