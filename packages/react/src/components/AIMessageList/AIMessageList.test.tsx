import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AIMessageList } from "./AIMessageList";

describe("AIMessageList", () => {
  it("announces the thread politely, as a log", () => {
    // Story 5 AC2 and Story 10: turns arrive over time and must be heard
    // without taking the visitor's place. Assertive would interrupt.
    render(<AIMessageList>a turn</AIMessageList>);
    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log).toHaveAccessibleName("Assistant conversation");
  });

  it("lets a product quiet the thread while the assistant speaks aloud", () => {
    // Decision 22: in a spoken conversation the thread's turns are what the
    // assistant is already saying, and a screen reader reading them too talks
    // over it. AICompanionPanel's docs tell a product to pass
    // aria-live="off" while the conversation is live; this keeps that
    // working. It passes on the code it was written against: a pin, not a
    // fix.
    const { rerender } = render(
      <AIMessageList aria-live="off">a turn</AIMessageList>,
    );
    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-live", "off");
    rerender(<AIMessageList aria-live="polite">a turn</AIMessageList>);
    expect(log).toHaveAttribute("aria-live", "polite");
  });
});
