import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Microphone01, MicrophoneOff01, VolumeMax } from "@kozmos-ds/icons";
import { AIInputBar, type AIVoiceState } from "./AIInputBar";

const submit = () =>
  fireEvent.submit(
    screen.getByRole("button", { name: "Send" }).closest("form")!,
  );

/** The pill around the input and `trailing`: what a visitor sees as the field. */
const field = () =>
  screen.getByRole("textbox", { name: "Ask the assistant" }).parentElement!;

describe("AIInputBar", () => {
  it("never sends an empty or whitespace-only question, and trims what it does send", () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <AIInputBar onSubmit={onSubmit} onValueChange={vi.fn()} value="   " />,
    );
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    submit();
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <AIInputBar
        onSubmit={onSubmit}
        onValueChange={vi.fn()}
        value="  where is a quiet desk  "
      />,
    );
    submit();
    // No product should have to trim what it is handed.
    expect(onSubmit).toHaveBeenCalledWith("where is a quiet desk");
  });

  it("shows where focus is, with the ring SearchBar draws", () => {
    // Row 59: the input is outline-none and nothing drew in its place, so a
    // keyboard visitor tabbing into the field saw no sign of it (WCAG 2.4.7).
    render(<AIInputBar onSubmit={vi.fn()} onValueChange={vi.fn()} value="" />);
    expect(field()).toHaveClass(
      "focus-within:ring-2",
      "focus-within:ring-ring",
      "focus-within:ring-offset-2",
      // The gap takes the page's colour, not white, in the dark theme too.
      "ring-offset-background",
    );
  });

  it("looks disabled when it is, not only its send button", () => {
    // Row 59: offline (Story 3 AC1) the input is disabled, and until now only
    // the send button said so — the field looked ready to type into.
    const { rerender } = render(
      <AIInputBar
        disabled
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        value=""
      />,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
    // The Input family's disabled look: a muted fill, not a fade.
    expect(field()).toHaveClass("bg-muted", "cursor-not-allowed");
    expect(field()).not.toHaveClass("bg-card");

    rerender(
      <AIInputBar onSubmit={vi.fn()} onValueChange={vi.fn()} value="" />,
    );
    expect(field()).toHaveClass("bg-card");
    expect(field()).not.toHaveClass("bg-muted");
  });

  it("lets the product put focus in the field, and keeps the form's ref the form's", () => {
    // Row 59: the ref is the form's and the input had none of its own, so a
    // product could not focus the field — on opening the panel, after a
    // send, after an error.
    const inputRef = React.createRef<HTMLInputElement>();
    const formRef = React.createRef<HTMLFormElement>();
    render(
      <AIInputBar
        inputRef={inputRef}
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        ref={formRef}
        value=""
      />,
    );
    inputRef.current?.focus();
    expect(
      screen.getByRole("textbox", { name: "Ask the assistant" }),
    ).toHaveFocus();
    // Moving the component's own ref would break every caller holding one.
    expect(formRef.current).toBeInstanceOf(HTMLFormElement);
  });

  it("gives send the SDK's 44px, and grows the field to match", () => {
    // Row 59: send was 40px. The prototype draws it at 44 beside a field of
    // at least 44, so the field grows with it and the row stays level.
    render(
      <AIInputBar onSubmit={vi.fn()} onValueChange={vi.fn()} value="ask" />,
    );
    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toHaveClass("h-11", "w-11");
    expect(send).not.toHaveClass("h-10");
    expect(send).not.toHaveClass("w-10");
    expect(field()).toHaveClass("min-h-11");
  });
});

/** The microphone, by the name it has now; an assertion, not a throw, when it is missing. */
const microphone = (name: string) => {
  const button = screen.queryByRole("button", { name });
  expect(button, `no button named "${name}"`).toBeInTheDocument();
  return button!;
};

/** The polite region the microphone speaks through. */
const voiceStatus = () => {
  const region = screen.queryByRole("status");
  expect(region, "no live region for the conversation").toBeInTheDocument();
  return region!;
};

/** An icon's outline, to tell one mark from another. */
const outlineOf = (root: ParentNode) =>
  Array.from(root.querySelectorAll("path"), (path) => path.getAttribute("d"));
const drawingOf = (icon: React.ReactElement) => {
  const { container, unmount } = render(icon);
  const outline = outlineOf(container);
  unmount();
  return outline;
};

describe("AIInputBar: a spoken conversation", () => {
  it("draws a microphone only when the product can start a conversation", () => {
    // Decision 22: off unless the product turns it on, per platform and per
    // app. An App Clip has no voice model, so PointrExpress passes nothing
    // and draws nothing.
    const { rerender } = render(
      <AIInputBar onSubmit={vi.fn()} onValueChange={vi.fn()} value="" />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    // A state alone turns nothing on: there would be nothing for a press to do.
    rerender(
      <AIInputBar
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        value=""
        voiceState="listening"
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByRole("status")).toBeNull();

    rerender(
      <AIInputBar
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        onVoiceStart={vi.fn()}
        value=""
      />,
    );
    const mic = microphone("Start voice conversation");
    // Beside the field, not in it: the field's microphone is the keyboard's,
    // for typing by voice (decision 21). Between the field and send.
    expect(field()).not.toContainElement(mic);
    expect(screen.getAllByRole("button")).toEqual([
      mic,
      screen.getByRole("button", { name: "Send" }),
    ]);
  });

  it("starts and ends the conversation, and never sends the question in the field", () => {
    const onVoiceStart = vi.fn();
    const onVoiceEnd = vi.fn();
    const onSubmit = vi.fn();
    const bar = (voiceState?: AIVoiceState) => (
      <AIInputBar
        onSubmit={onSubmit}
        onValueChange={vi.fn()}
        onVoiceEnd={onVoiceEnd}
        onVoiceStart={onVoiceStart}
        value="where is gate b4"
        voiceState={voiceState}
      />
    );
    const { rerender } = render(bar());
    fireEvent.click(microphone("Start voice conversation"));
    expect(onVoiceStart).toHaveBeenCalledTimes(1);
    // A button in a form submits it unless it says otherwise: the draft in
    // the field stays a draft.
    expect(onSubmit).not.toHaveBeenCalled();

    // Connecting too: a visitor can call it off before it answers.
    for (const state of ["connecting", "listening", "speaking"] as const) {
      rerender(bar(state));
      fireEvent.click(microphone("End voice conversation"));
    }
    expect(onVoiceEnd).toHaveBeenCalledTimes(3);
    expect(onVoiceStart).toHaveBeenCalledTimes(1);

    // After a failure the same press tries again.
    rerender(bar("error"));
    fireEvent.click(microphone("Start voice conversation"));
    expect(onVoiceStart).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("names the control for what a press does, never as a pressed toggle", () => {
    // The ARIA authoring guide: a toggle's name must not change with its
    // state. This one's name is its action, so it carries no aria-pressed,
    // which would read "End voice conversation, pressed".
    const names: [AIVoiceState, string][] = [
      ["idle", "Start voice conversation"],
      ["connecting", "End voice conversation"],
      ["listening", "End voice conversation"],
      ["speaking", "End voice conversation"],
      ["unavailable", "Voice conversation unavailable"],
      ["error", "Start voice conversation"],
    ];
    const bar = (voiceState: AIVoiceState, labels = {}) => (
      <AIInputBar
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        onVoiceEnd={vi.fn()}
        onVoiceStart={vi.fn()}
        value=""
        voiceState={voiceState}
        {...labels}
      />
    );
    const { rerender } = render(bar("idle"));
    for (const [state, name] of names) {
      rerender(bar(state));
      expect(microphone(name)).not.toHaveAttribute("aria-pressed");
    }

    // In the product's language.
    const german = {
      voiceStartLabel: "Sprachgespräch starten",
      voiceEndLabel: "Sprachgespräch beenden",
      voiceUnavailableLabel: "Sprachgespräch nicht verfügbar",
    };
    rerender(bar("idle", german));
    microphone("Sprachgespräch starten");
    rerender(bar("speaking", german));
    microphone("Sprachgespräch beenden");
    rerender(bar("unavailable", german));
    microphone("Sprachgespräch nicht verfügbar");
  });

  it("announces each change of state, politely, through one region", () => {
    const bar = (voiceState: AIVoiceState) => (
      <AIInputBar
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        onVoiceEnd={vi.fn()}
        onVoiceStart={vi.fn()}
        value=""
        voiceState={voiceState}
      />
    );
    const { rerender } = render(bar("idle"));
    const region = voiceStatus();
    // Polite: a change of state never cuts off what is being read.
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region.textContent).toBe("");

    const said: [AIVoiceState, string][] = [
      ["connecting", "Connecting…"],
      ["listening", "Listening…"],
      ["speaking", "Assistant is speaking…"],
      ["listening", "Listening…"],
      // Back to idle from a live state is the conversation ending.
      ["idle", "Voice conversation ended"],
      ["error", "Voice conversation failed. Try again."],
      ["unavailable", "Voice conversation unavailable"],
      // From a state that was not live, idle ends nothing.
      ["idle", ""],
    ];
    for (const [state, words] of said) {
      rerender(bar(state));
      // The same region throughout: a region put in with its words is often
      // not read at all.
      expect(screen.getByRole("status")).toBe(region);
      expect(region.textContent, `after "${state}"`).toBe(words);
    }
  });

  it("announces nothing for the state it is first drawn in", () => {
    // A panel opened on a conversation already under way, or a microphone
    // unavailable from the start: nothing changed, so nothing is said.
    for (const state of ["listening", "unavailable", "error"] as const) {
      const { unmount } = render(
        <AIInputBar
          onSubmit={vi.fn()}
          onValueChange={vi.fn()}
          onVoiceStart={vi.fn()}
          value=""
          voiceState={state}
        />,
      );
      expect(voiceStatus().textContent, state).toBe("");
      unmount();
    }
  });

  it("leaves out what the product blanks, and says the rest in its language", () => {
    const bar = (voiceState: AIVoiceState) => (
      <AIInputBar
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        onVoiceEnd={vi.fn()}
        onVoiceStart={vi.fn()}
        value=""
        voiceConnectingLabel=""
        voiceEndedLabel="Sprachgespräch beendet"
        voiceErrorLabel=""
        voiceListeningLabel="Ich höre zu…"
        voiceSpeakingLabel=""
        voiceState={voiceState}
        voiceUnavailableLabel=""
      />
    );
    const { rerender } = render(bar("idle"));
    const region = voiceStatus();
    const said: [AIVoiceState, string][] = [
      ["connecting", ""],
      ["listening", "Ich höre zu…"],
      ["speaking", ""],
      ["idle", "Sprachgespräch beendet"],
      ["error", ""],
      ["unavailable", ""],
    ];
    for (const [state, words] of said) {
      rerender(bar(state));
      expect(region.textContent, `after "${state}"`).toBe(words);
    }
    // Blanking the unavailable words leaves the control a name all the same.
    expect(microphone("Start voice conversation")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("keeps an unavailable microphone in reach, and does nothing when it is pressed", () => {
    const onVoiceStart = vi.fn();
    const onVoiceEnd = vi.fn();
    render(
      <AIInputBar
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        onVoiceEnd={onVoiceEnd}
        onVoiceStart={onVoiceStart}
        value=""
        voiceState="unavailable"
      />,
    );
    const mic = microphone("Voice conversation unavailable");
    // aria-disabled, not disabled: a disabled button leaves the tab order,
    // and a visitor on the keyboard or a screen reader could never find out
    // that voice is there but cannot be used.
    expect(mic).toHaveAttribute("aria-disabled", "true");
    expect(mic).toBeEnabled();
    mic.focus();
    expect(mic).toHaveFocus();
    fireEvent.click(mic);
    expect(onVoiceStart).not.toHaveBeenCalled();
    expect(onVoiceEnd).not.toHaveBeenCalled();
  });

  it("keeps focus on the microphone through every change of state", () => {
    // One control throughout. A permission refused while the visitor is on
    // the button turns it unavailable; a control swapped or disabled there
    // would drop focus to the page.
    const bar = (voiceState: AIVoiceState) => (
      <AIInputBar
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        onVoiceEnd={vi.fn()}
        onVoiceStart={vi.fn()}
        value=""
        voiceState={voiceState}
      />
    );
    const { rerender } = render(bar("idle"));
    const mic = microphone("Start voice conversation");
    mic.focus();
    for (const state of [
      "connecting",
      "listening",
      "speaking",
      "listening",
      "unavailable",
      "error",
      "idle",
    ] as const) {
      rerender(bar(state));
      expect(mic, state).toHaveFocus();
    }
  });

  it("says the live state in the empty field, and gives the product's placeholder back after", () => {
    const bar = (voiceState: AIVoiceState, labels = {}) => (
      <AIInputBar
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        onVoiceStart={vi.fn()}
        placeholder="Ask about this building"
        value=""
        voiceState={voiceState}
        {...labels}
      />
    );
    const { rerender } = render(bar("idle"));
    const input = screen.getByRole("textbox", { name: "Ask the assistant" });
    expect(input).toHaveAttribute("placeholder", "Ask about this building");
    const shown: [AIVoiceState, string][] = [
      ["connecting", "Connecting…"],
      ["listening", "Listening…"],
      ["speaking", "Assistant is speaking…"],
      ["unavailable", "Ask about this building"],
      ["error", "Ask about this building"],
      ["idle", "Ask about this building"],
    ];
    for (const [state, placeholder] of shown) {
      rerender(bar(state));
      expect(input, state).toHaveAttribute("placeholder", placeholder);
    }
    // Words the product blanks fall back to its own placeholder.
    rerender(bar("listening", { voiceListeningLabel: "" }));
    expect(input).toHaveAttribute("placeholder", "Ask about this building");
    // With no microphone, the state is not the field's to say.
    rerender(
      <AIInputBar
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        placeholder="Ask about this building"
        value=""
        voiceState="listening"
      />,
    );
    expect(input).toHaveAttribute("placeholder", "Ask about this building");
  });

  it("offline, shows a microphone not in use as unavailable, and lets one in use be ended", () => {
    const onVoiceStart = vi.fn();
    const onVoiceEnd = vi.fn();
    const bar = (voiceState: AIVoiceState) => (
      <AIInputBar
        disabled
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        onVoiceEnd={onVoiceEnd}
        onVoiceStart={onVoiceStart}
        value=""
        voiceState={voiceState}
      />
    );
    const { rerender } = render(bar("idle"));
    const mic = microphone("Voice conversation unavailable");
    expect(mic).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(mic);
    expect(onVoiceStart).not.toHaveBeenCalled();

    // A microphone that is listening can always be turned off: going
    // offline is no reason to leave it open.
    rerender(bar("listening"));
    const end = microphone("End voice conversation");
    expect(end).not.toHaveAttribute("aria-disabled");
    fireEvent.click(end);
    expect(onVoiceEnd).toHaveBeenCalledTimes(1);
  });

  it("is send's 44px, and draws each state apart", () => {
    const bar = (voiceState: AIVoiceState) => (
      <AIInputBar
        onSubmit={vi.fn()}
        onValueChange={vi.fn()}
        onVoiceEnd={vi.fn()}
        onVoiceStart={vi.fn()}
        value=""
        voiceState={voiceState}
      />
    );
    const { rerender } = render(bar("idle"));
    const mic = microphone("Start voice conversation");
    expect(mic).toHaveClass("h-11", "w-11", "rounded-pill");
    const mark = () => mic.querySelector("svg");
    // Idle: the field's own surface, and the microphone.
    expect(mic).toHaveClass("bg-card", "border-border");
    expect(outlineOf(mic)).toEqual(drawingOf(<Microphone01 />));
    // Live: the themed emotion's tint inside a primary edge, the look the
    // prototype gives its listening microphone.
    for (const state of ["connecting", "listening", "speaking"] as const) {
      rerender(bar(state));
      expect(mic, state).toHaveClass("border-primary");
      expect(mic.style.getPropertyValue("--kz-emotion-surface"), state).toBe(
        "var(--semantics-emotion-themed-surface)",
      );
    }
    rerender(bar("connecting"));
    expect(mark()).toHaveClass("kozmos-spinner-arc");
    rerender(bar("listening"));
    expect(outlineOf(mic)).toEqual(drawingOf(<Microphone01 />));
    rerender(bar("speaking"));
    expect(outlineOf(mic)).toEqual(drawingOf(<VolumeMax />));
    // Unavailable: the Input family's muted fill, the microphone struck out.
    rerender(bar("unavailable"));
    expect(mic).toHaveClass("bg-muted", "text-muted-foreground");
    expect(outlineOf(mic)).toEqual(drawingOf(<MicrophoneOff01 />));
    // Failed: the same mark, drawn in danger's outline.
    rerender(bar("error"));
    expect(mic.style.getPropertyValue("--kz-emotion-text")).toBe(
      "var(--semantics-emotion-danger-text)",
    );
    expect(outlineOf(mic)).toEqual(drawingOf(<MicrophoneOff01 />));
    // Every mark is silent: the name says it all.
    expect(mark()).toHaveAttribute("aria-hidden", "true");
  });
});
