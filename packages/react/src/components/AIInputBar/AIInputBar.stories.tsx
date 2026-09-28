import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useEffect, useRef, useState } from "react";
import { AIInputBar, type AIVoiceState } from "./AIInputBar";

const meta = {
  title: "Product SDK/AIInputBar",
  component: AIInputBar,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AIInputBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  // The render holds its own state; the args only satisfy the required props,
  // which `StoryObj<typeof meta>` asks every story to state.
  args: { onSubmit: fn(), onValueChange: fn(), value: "" },
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <div className="w-80 rounded-container border border-border">
          <AIInputBar onSubmit={fn()} onValueChange={setValue} value={value} />
        </div>
      );
    };
    return <Demo />;
  },
};

/** Send stays disabled until there is something to ask. */
export const Empty: Story = {
  args: { onSubmit: fn(), onValueChange: fn(), value: "" },
};

/** Offline (Story 3 AC1): the field says so, not only the send button. */
export const Disabled: Story = {
  args: { disabled: true, onSubmit: fn(), onValueChange: fn(), value: "" },
  render: (args) => (
    <div className="w-80 rounded-container border border-border">
      <AIInputBar {...args} />
    </div>
  ),
};

/**
 * A spoken conversation in one state, drawn from its args: flip `voiceState`
 * in the controls to see the others.
 */
const voiceStory = (voiceState: AIVoiceState): Story => ({
  args: {
    onSubmit: fn(),
    onValueChange: fn(),
    onVoiceEnd: fn(),
    onVoiceStart: fn(),
    value: "",
    voiceState,
  },
  render: (args) => (
    <div className="w-80 rounded-container border border-border">
      <AIInputBar {...args} />
    </div>
  ),
});

/**
 * Decision 22: the product has a voice model, so it passes `onVoiceStart` and
 * a microphone sits between the field and send. Pressed, it starts a spoken
 * conversation.
 */
export const VoiceIdle = voiceStory("idle");

/** The product is reaching its voice model. A press calls it off. */
export const VoiceConnecting = voiceStory("connecting");

/** The visitor's turn to speak. The empty field says so too. */
export const VoiceListening = voiceStory("listening");

/** The assistant answering aloud. */
export const VoiceSpeaking = voiceStory("speaking");

/**
 * Voice is on for this product but cannot start now: the microphone is
 * refused, or the voice model cannot be reached. It stays focusable, so a
 * keyboard or screen-reader visitor can find it and hear why, and a press
 * does nothing.
 */
export const VoiceUnavailable = voiceStory("unavailable");

/** The conversation could not start, or dropped. A press tries again. */
export const VoiceError = voiceStory("error");

/**
 * The product's side, played by a timer: a press asks to start, the voice
 * model answers a moment later, and the conversation stays live until the
 * visitor ends it. Nothing here listens or speaks.
 */
export const VoiceConversation: Story = {
  args: {
    onSubmit: fn(),
    onValueChange: fn(),
    onVoiceEnd: fn(),
    onVoiceStart: fn(),
    value: "",
  },
  render: (args) => {
    const Demo = () => {
      const [value, setValue] = useState("");
      const [voiceState, setVoiceState] = useState<AIVoiceState>("idle");
      const connecting = useRef<number>();
      useEffect(() => () => window.clearTimeout(connecting.current), []);
      return (
        <div className="w-80 rounded-container border border-border">
          <AIInputBar
            onSubmit={args.onSubmit}
            onValueChange={setValue}
            onVoiceEnd={() => {
              args.onVoiceEnd?.();
              window.clearTimeout(connecting.current);
              setVoiceState("idle");
            }}
            onVoiceStart={() => {
              args.onVoiceStart?.();
              setVoiceState("connecting");
              connecting.current = window.setTimeout(
                () => setVoiceState("listening"),
                1500,
              );
            }}
            value={value}
            voiceState={voiceState}
          />
        </div>
      );
    };
    return <Demo />;
  },
};
