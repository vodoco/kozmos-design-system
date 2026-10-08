import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserMessage } from "./UserMessage";

describe("UserMessage", () => {
  it("is filled and right-aligned, so it differs from the assistant by more than colour", () => {
    const { container } = render(<UserMessage>Visitor turn</UserMessage>);
    expect(container.querySelector(".justify-end")).not.toBeNull();
    expect(screen.getByText("Visitor turn")).toHaveClass(
      "bg-theme-fill",
      "text-theme-fill-foreground",
    );
  });

  it("tells a screen reader who is speaking, in the product's language", () => {
    // Row 61: side and fill tell a question from an answer, and a screen
    // reader hears neither. The label is read first, as the turn arrives in
    // the thread's live region and as a visitor moves back through it.
    const { rerender } = render(<UserMessage>Where is the lift?</UserMessage>);
    const bubble = screen.getByText("Where is the lift?");
    expect(bubble.firstChild).toBe(screen.getByText("You said"));
    expect(screen.getByText("You said")).toHaveClass("sr-only");

    rerender(
      <UserMessage speakerLabel="Sie sagten">Wo ist der Aufzug?</UserMessage>,
    );
    expect(screen.getByText("Sie sagten")).toHaveClass("sr-only");
    expect(screen.queryByText("You said")).toBeNull();

    // A product that names the speaker where everyone can see it opts out.
    const { container } = render(
      <UserMessage speakerLabel="">Wo ist der Aufzug?</UserMessage>,
    );
    expect(container.querySelector(".sr-only")).toBeNull();
  });

  it("keeps the speaker a word of its own, before the words", () => {
    // WebKit runs a hidden span into the text after it: measured in its
    // innerText, "You saidWo ist der Aufzug?", where Chromium and Firefox
    // break the line. A space between them is a word boundary in all three.
    render(<UserMessage>Wo ist der Aufzug?</UserMessage>);
    const bubble = screen.getByText("You said").parentElement!;
    expect(bubble.textContent).toBe("You said Wo ist der Aufzug?");
  });
});
