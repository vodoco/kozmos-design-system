import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import { AICompanionPanel } from "./AICompanionPanel";
import { ActionCard } from "../ActionCard";
import { AIInputBar } from "../AIInputBar";
import { AIMessage } from "../AIMessage";
import { AIMessageList } from "../AIMessageList";
import { AISearchButton } from "../AISearchButton";
import { UserMessage } from "../UserMessage";
import { POIResultCard } from "../POIResultCard";

const meta = {
  title: "Product SDK/AICompanionPanel",
  component: AICompanionPanel,
  parameters: { layout: "centered" },
} satisfies Meta<typeof AICompanionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const poi = {
  id: "restroom-east",
  name: "Restroom East Wing",
  floorId: "2",
  floorLabel: "Second floor",
  media: [],
  availability: "open" as const,
  availabilityLabel: "Open",
  actions: ["navigate" as const],
};

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="h-[560px] w-[360px] overflow-hidden rounded-container border border-border">
    {children}
  </div>
);

/** The whole surface: header, thread and input. */
export const Conversation: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState("");
      return (
        <Frame>
          <AICompanionPanel onClose={fn()}>
            <AIMessageList>
              <AIMessage>
                Hello! What are you looking for? Describe it in your own words,
                like &ldquo;somewhere quiet to work.&rdquo;
              </AIMessage>
              <UserMessage>
                Where is the nearest accessible restroom?
              </UserMessage>
              <AIMessage
                actionCard={
                  <ActionCard title="2 results">
                    <POIResultCard
                      onSelect={fn()}
                      poi={poi}
                      result={{
                        poiId: poi.id,
                        resultIndex: 0,
                        selected: false,
                        featured: false,
                        floorId: poi.floorId,
                      }}
                    />
                  </ActionCard>
                }
              >
                The closest accessible restroom is on the second floor, 2
                minutes away.
              </AIMessage>
            </AIMessageList>
            <AIInputBar
              onSubmit={fn()}
              onValueChange={setValue}
              value={value}
            />
          </AICompanionPanel>
        </Frame>
      );
    };
    return <Demo />;
  },
};

/** Story 10: an acknowledgement counts as the first visible response. */
export const Streaming: Story = {
  render: () => (
    <Frame>
      <AICompanionPanel onClose={fn()}>
        <AIMessageList>
          <UserMessage>Where is the nearest accessible restroom?</UserMessage>
          <AIMessage status="streaming">
            Looking through this building…
          </AIMessage>
        </AIMessageList>
        <AIInputBar onSubmit={fn()} onValueChange={fn()} value="" />
      </AICompanionPanel>
    </Frame>
  ),
};

/**
 * Row 60 and decision 16: the panel stays mounted and `open` opens it. Open
 * it from the button and focus goes into the panel; close it and focus comes
 * back to the button, which stayed beneath it all along. The other stories
 * are on screen from the start, so none of them takes focus.
 */
export const OpenAndClose: Story = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <Frame>
          <div className="relative h-full">
            <div className="flex h-full items-center justify-center">
              <AISearchButton onClick={() => setOpen(true)} />
            </div>
            <AICompanionPanel
              className="absolute inset-0"
              onClose={() => setOpen(false)}
              open={open}
            >
              <AIMessageList>
                <AIMessage>
                  Hello! What are you looking for? Describe it in your own
                  words, like &ldquo;somewhere quiet to work.&rdquo;
                </AIMessage>
              </AIMessageList>
              <AIInputBar onSubmit={fn()} onValueChange={fn()} value="" />
            </AICompanionPanel>
          </div>
        </Frame>
      );
    };
    return <Demo />;
  },
};

/**
 * Decision 22: a spoken conversation, the assistant answering aloud. The
 * product has a voice model, so it turns the microphone on and drives its
 * state; the thread shows what was said. While the conversation is live the
 * thread stops announcing itself (`aria-live="off"`), or a screen reader
 * would read out the words the assistant is already speaking.
 */
export const VoiceConversation: Story = {
  render: () => (
    <Frame>
      <AICompanionPanel onClose={fn()}>
        <AIMessageList aria-live="off">
          <AIMessage>
            Hello! What are you looking for? Describe it in your own words, like
            &ldquo;somewhere quiet to work.&rdquo;
          </AIMessage>
          <UserMessage>Where is the nearest accessible restroom?</UserMessage>
          <AIMessage status="streaming">
            The closest accessible restroom is on the second floor
          </AIMessage>
        </AIMessageList>
        <AIInputBar
          onSubmit={fn()}
          onValueChange={fn()}
          onVoiceEnd={fn()}
          onVoiceStart={fn()}
          value=""
          voiceState="speaking"
        />
      </AICompanionPanel>
    </Frame>
  ),
};

/** Story 10: the ten-second hard stop, drawn rather than left silent. */
export const TimedOut: Story = {
  render: () => (
    <Frame>
      <AICompanionPanel onClose={fn()}>
        <AIMessageList>
          <UserMessage>Where is the nearest accessible restroom?</UserMessage>
          <AIMessage status="timedOut" />
        </AIMessageList>
        <AIInputBar onSubmit={fn()} onValueChange={fn()} value="" />
      </AICompanionPanel>
    </Frame>
  ),
};
