import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AIMessage } from "./AIMessage";

describe("AIMessage", () => {
  it("streams an acknowledgement beside its dots, not instead of it", () => {
    // Story 10 counts a streamed acknowledgement as the first visible
    // response, so the words must show while the dots are still going.
    render(
      <AIMessage status="streaming">Looking through this building…</AIMessage>,
    );
    expect(screen.getByText("Looking through this building…")).toBeVisible();
    expect(screen.getByText("Assistant is replying")).toHaveClass("sr-only");
  });

  it("says plainly when a turn timed out", () => {
    // Story 10's ten-second stop: a thread that simply stops reads the same
    // as one still thinking.
    render(<AIMessage status="timedOut" />);
    expect(
      screen.getByText("The assistant did not reply in time."),
    ).toBeVisible();
  });

  it("carries rich content under the bubble", () => {
    render(<AIMessage actionCard={<span>rows</span>}>Found it</AIMessage>);
    expect(screen.getByText("rows")).toBeVisible();
  });

  it("tells a screen reader who is speaking, in the product's language", () => {
    // Row 61: side and fill tell an answer from a question, and a screen
    // reader hears neither. The label is read first, as the turn arrives in
    // the thread's live region and as a visitor moves back through it.
    const { rerender } = render(<AIMessage>The lift is behind you.</AIMessage>);
    const bubble = screen.getByText("The lift is behind you.");
    expect(bubble.firstChild).toBe(screen.getByText("Assistant said"));
    expect(screen.getByText("Assistant said")).toHaveClass("sr-only");

    rerender(
      <AIMessage speakerLabel="Der Assistent sagte">
        Der Aufzug ist hinter Ihnen.
      </AIMessage>,
    );
    expect(screen.getByText("Der Assistent sagte")).toHaveClass("sr-only");
    expect(screen.queryByText("Assistant said")).toBeNull();

    // A product that names the speaker where everyone can see it opts out.
    const { container } = render(
      <AIMessage speakerLabel="">Der Aufzug ist hinter Ihnen.</AIMessage>,
    );
    expect(container.querySelector(".sr-only")).toBeNull();
  });

  it("names the speaker on every turn, before a streaming turn says it is replying", () => {
    // Always there rather than added when a reply completes: the log would
    // announce a late label on its own.
    const { rerender } = render(
      <AIMessage status="streaming">Looking through this building…</AIMessage>,
    );
    expect(
      screen.getByText("Looking through this building…"),
    ).toHaveTextContent(
      /^Assistant saidAssistant is replyingLooking through this building…$/,
    );

    rerender(<AIMessage status="timedOut" />);
    expect(
      screen.getByText("The assistant did not reply in time."),
    ).toHaveTextContent(
      /^Assistant saidThe assistant did not reply in time\.$/,
    );
  });
});
