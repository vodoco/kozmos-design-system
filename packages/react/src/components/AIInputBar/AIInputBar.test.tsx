import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { AIInputBar } from "./AIInputBar";

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
