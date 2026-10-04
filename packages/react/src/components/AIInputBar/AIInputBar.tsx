import React from "react";
import { IconButton } from "../IconButton/IconButton";
import {
  Microphone01,
  MicrophoneOff01,
  Send01,
  VolumeMax,
} from "@kozmos-ds/icons";
import { cn } from "../../utils";
import {
  EMOTION_FILLED_CLASSES,
  EMOTION_OUTLINE_CLASSES,
  emotionSurfaceProperties,
} from "../../utils/emotion";
import { SpinnerArc } from "../Spinner/SpinnerArc";

/**
 * Where a spoken conversation with the assistant is (decision 22).
 *
 * The product moves it along from its voice model: `connecting` while it
 * reaches the model, `listening` and `speaking` as the turns pass, `idle`
 * when it is over. `unavailable` is voice this product has but cannot start
 * now — the microphone refused, the model out of reach. `error` is a
 * conversation that failed to start or dropped; a press tries again.
 */
export type AIVoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "unavailable"
  | "error";

/** Connecting, listening or speaking: a press ends it. */
const isLive = (state: AIVoiceState) =>
  state === "connecting" || state === "listening" || state === "speaking";

export interface AIInputBarProps extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  "onSubmit"
> {
  value: string;
  onValueChange: (value: string) => void;
  /** Called with the trimmed text. Never called with an empty string. */
  onSubmit: (value: string) => void;
  placeholder?: string;
  sendLabel?: string;
  inputLabel?: string;
  /**
   * Offline (Story 3 AC1), for one. The field shows it as well as the send
   * button: until row 59 only the button did, and the field looked ready to
   * type into. `trailing` is the product's, so disable it with the same flag.
   * The microphone shows as unavailable, unless a conversation is live: that
   * one can always be ended.
   */
  disabled?: boolean;
  /** Inside the field, at its end: a control of the product's own. */
  trailing?: React.ReactNode;
  /**
   * The text field itself, for a product that has to put focus there — when
   * the assistant opens, after a send, after an error. The component's own
   * ref stays the form's: moving it would break every caller holding one.
   */
  inputRef?: React.Ref<HTMLInputElement>;
  /**
   * A spoken conversation, the assistant answering aloud (decision 22).
   * Passing this draws a microphone between the field and send; a product
   * with no voice model — an App Clip, PointrExpress — leaves it out, and
   * there is none. Called when the visitor presses it to start one: ask for
   * the microphone, connect the voice model, and move `voiceState` along.
   * Kozmos draws the control and announces it; it never records or plays.
   */
  onVoiceStart?: () => void;
  /**
   * Called when the visitor ends the conversation, pressing the microphone
   * while it connects, listens or speaks: close the connection and set
   * `voiceState` back to `idle`.
   */
  onVoiceEnd?: () => void;
  /** Where the conversation is: the product's to keep. `idle` by default. */
  voiceState?: AIVoiceState;
  /** The microphone's name while a press starts a conversation. */
  voiceStartLabel?: string;
  /** Its name while a press ends one. */
  voiceEndLabel?: string;
  /**
   * Announced as the conversation starts to connect, and shown in the empty
   * field while it does. Every voice label is English by default — the
   * product has the language — and an empty string leaves its announcement
   * out.
   */
  voiceConnectingLabel?: string;
  /** Announced, and shown in the empty field, when it is the visitor's turn. */
  voiceListeningLabel?: string;
  /** Announced, and shown in the empty field, while the assistant speaks. */
  voiceSpeakingLabel?: string;
  /** Announced when a live conversation goes back to `idle`. */
  voiceEndedLabel?: string;
  /**
   * Announced when voice becomes unavailable, and the microphone's name while
   * it is (the start label, if this is empty).
   */
  voiceUnavailableLabel?: string;
  /** Announced when the conversation fails to start, or drops. */
  voiceErrorLabel?: string;
}

/**
 * Text in, question out.
 *
 * A form rather than an input and a button, so Enter submits the way every
 * other field on the platform does. Typing by voice is the keyboard's own
 * microphone, which Kozmos leaves alone (decision 21). What it does draw,
 * when the product has a voice model, is the microphone that starts a spoken
 * conversation (decision 22) — its states, its names and what it announces.
 * The model, the audio and the permissions are the product's.
 */
const AIInputBar = React.forwardRef<HTMLFormElement, AIInputBarProps>(
  (
    {
      className,
      value,
      onValueChange,
      onSubmit,
      placeholder = "Ask anything",
      sendLabel = "Send",
      inputLabel = "Ask the assistant",
      disabled,
      trailing,
      inputRef,
      onVoiceStart,
      onVoiceEnd,
      voiceState = "idle",
      voiceStartLabel = "Start voice conversation",
      voiceEndLabel = "End voice conversation",
      voiceConnectingLabel = "Connecting…",
      voiceListeningLabel = "Listening…",
      voiceSpeakingLabel = "Assistant is speaking…",
      voiceEndedLabel = "Voice conversation ended",
      voiceUnavailableLabel = "Voice conversation unavailable",
      voiceErrorLabel = "Voice conversation failed. Try again.",
      ...props
    },
    ref,
  ) => {
    const trimmed = value.trim();
    const canSend = !disabled && trimmed.length > 0;

    const voiceOn = Boolean(onVoiceStart);
    const live = isLive(voiceState);
    // Offline, a microphone that is not in use cannot start anything. One
    // that is listening can always be turned off: a visitor is never left
    // with a microphone they cannot close.
    const unavailable =
      voiceState === "unavailable" || (Boolean(disabled) && !live);
    const voiceWords: Record<AIVoiceState, string> = {
      idle: "",
      connecting: voiceConnectingLabel,
      listening: voiceListeningLabel,
      speaking: voiceSpeakingLabel,
      unavailable: voiceUnavailableLabel,
      error: voiceErrorLabel,
    };
    // What the region says: the words for each state the conversation moves
    // to, set as it renders so they are there when the state is. Nothing for
    // the state it is first drawn in — nothing changed — and back to idle is
    // an ending only from a live state.
    const [said, setSaid] = React.useState({ state: voiceState, words: "" });
    if (said.state !== voiceState) {
      setSaid({
        state: voiceState,
        words:
          voiceState !== "idle"
            ? voiceWords[voiceState]
            : isLive(said.state)
              ? voiceEndedLabel
              : "",
      });
    }

    return (
      <form
        className={cn(
          "flex items-center gap-2 border-t border-border px-4 py-3",
          className,
        )}
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSend) return;
          onSubmit(trimmed);
        }}
        ref={ref}
        {...props}
      >
        {/* The pill draws the focus the input cannot. The input is
            outline-none, and until row 59 nothing showed in its place
            (WCAG 2.4.7); focus-within, as SearchBar draws it, rings the
            whole field, `trailing` included. At least 44 tall, level with
            send, as the prototype draws the two. */}
        <div
          className={cn(
            "flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-pill border border-border px-4 py-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            // The Input family's disabled look, a muted fill rather than a
            // fade, on the field as well as the button.
            disabled ? "cursor-not-allowed bg-muted" : "bg-card",
          )}
        >
          <input
            aria-label={inputLabel}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground"
            disabled={disabled}
            onChange={(event) => onValueChange(event.target.value)}
            // While the conversation is live the empty field says where it
            // is, as the prototype's does: in words, not only in the
            // microphone's colour and mark.
            placeholder={
              (voiceOn && live && voiceWords[voiceState]) || placeholder
            }
            ref={inputRef}
            type="text"
            value={value}
          />
          {trailing}
        </div>
        {voiceOn && (
          <>
            {/* Beside the field, not in it: a microphone in the field reads
                as typing by voice, the keyboard's own job. The name is what
                a press does, so there is no aria-pressed — a toggle's name
                must not change with its state. One element through every
                state, never `disabled`, so focus stays on it: unavailable is
                aria-disabled, found by the keyboard and inert. */}
            <button
              aria-disabled={unavailable || undefined}
              aria-label={
                unavailable
                  ? voiceUnavailableLabel || voiceStartLabel
                  : live
                    ? voiceEndLabel
                    : voiceStartLabel
              }
              className={cn(
                "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                unavailable
                  ? // The field's own disabled look.
                    "cursor-not-allowed border-border bg-muted text-muted-foreground"
                  : live
                    ? // The themed emotion's tint in a primary edge: the
                      // prototype's listening microphone, from tokens.
                      cn(EMOTION_FILLED_CLASSES, "border-primary")
                    : voiceState === "error"
                      ? cn(EMOTION_OUTLINE_CLASSES, "bg-card hover:bg-muted")
                      : "border-border bg-card text-foreground hover:bg-muted",
              )}
              onClick={() => {
                if (unavailable) return;
                if (live) onVoiceEnd?.();
                else onVoiceStart?.();
              }}
              style={
                unavailable
                  ? undefined
                  : live
                    ? emotionSurfaceProperties("themed")
                    : voiceState === "error"
                      ? emotionSurfaceProperties("danger")
                      : undefined
              }
              // Inside a form a button submits it unless it says otherwise,
              // and the draft in the field would go with it.
              type="button"
            >
              {voiceState === "connecting" ? (
                <SpinnerArc className="h-5 w-5" size={20} />
              ) : voiceState === "speaking" ? (
                <VolumeMax aria-hidden="true" className="h-5 w-5" />
              ) : unavailable || voiceState === "error" ? (
                <MicrophoneOff01 aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Microphone01 aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
            {/* In the page from the start, so a change is read: a region
                that arrives with its words often is not. Polite — a change
                of state never cuts off what is being read. */}
            <span aria-live="polite" className="sr-only" role="status">
              {said.words}
            </span>
          </>
        )}
        <IconButton
          aria-label={sendLabel}
          variant="default"
          className="shrink-0 rounded-pill"
          disabled={!canSend}
          type="submit"
        >
          <Send01 aria-hidden="true" className="h-5 w-5" />
        </IconButton>
      </form>
    );
  },
);
AIInputBar.displayName = "AIInputBar";

export { AIInputBar };
