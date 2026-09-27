import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AICompanionPanel } from "./AICompanionPanel";

/** A control outside the panel, as AISearchButton is in the SDK's sheet. */
function outsideButton(name: string) {
  const button = document.createElement("button");
  button.textContent = name;
  document.body.append(button);
  return button;
}

afterEach(() => {
  document.body
    .querySelectorAll(":scope > button")
    .forEach((button) => button.remove());
});

describe("AICompanionPanel", () => {
  it("opens without a close button when the host has no way to close it", () => {
    // Story 18 lets a host turn the assistant off; Story 5 AC1 says the panel
    // must tolerate AISearchButton being absent.
    const { rerender } = render(<AICompanionPanel />);
    expect(
      screen.queryByRole("button", { name: "Close assistant" }),
    ).not.toBeInTheDocument();

    const onClose = vi.fn();
    rerender(<AICompanionPanel onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close assistant" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape, so a surface covering the frame is not a keyboard trap", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <AICompanionPanel onClose={onClose}>thread</AICompanionPanel>,
    );
    fireEvent.keyDown(screen.getByText("thread"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Nothing to close, nothing to do — Story 18 allows a host with no close.
    rerender(<AICompanionPanel>thread</AICompanionPanel>);
    fireEvent.keyDown(screen.getByText("thread"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("puts a banner above the thread, for the Story 14 notice", () => {
    render(
      <AICompanionPanel banner={<p>AI results may be incomplete.</p>}>
        <p>thread</p>
      </AICompanionPanel>,
    );
    expect(screen.getByText("AI results may be incomplete.")).toBeVisible();
  });

  it("draws its title as a heading, at the level the product gives", () => {
    // Row 60: the title was a <p>, so a screen reader moving by heading
    // passed the assistant by. The level follows whatever sits above it.
    const { rerender } = render(<AICompanionPanel />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Assistant" }),
    ).toBeVisible();

    rerender(<AICompanionPanel titleLevel={3} />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Assistant" }),
    ).toBeVisible();
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });

  it("is a region named by its title, in the product's language", () => {
    // Row 60: a surface covering the frame had no name at all, so there was
    // nothing to land on or to announce.
    const { rerender } = render(<AICompanionPanel title="Asistente" />);
    expect(
      screen.getByRole("region", { name: "Asistente" }),
    ).toBeInTheDocument();

    // A name the product gives the region itself still wins.
    rerender(<AICompanionPanel aria-label="Chat" title="Asistente" />);
    expect(screen.getByRole("region", { name: "Chat" })).toBeInTheDocument();
  });

  it("moves focus into itself when it opens, unless something inside already has it", () => {
    // Row 60: it covers the frame, and focus stayed on the button beneath it.
    outsideButton("Ask the assistant").focus();
    const { container, unmount } = render(
      <AICompanionPanel onClose={vi.fn()}>thread</AICompanionPanel>,
    );
    expect(container.firstElementChild).toHaveFocus();
    unmount();

    // A part inside that takes focus as it mounts keeps it.
    render(
      <AICompanionPanel>
        <input aria-label="Ask" autoFocus />
      </AICompanionPanel>,
    );
    expect(screen.getByRole("textbox", { name: "Ask" })).toHaveFocus();
  });

  it("hands focus back to where it was when it closes", () => {
    // Row 60: closing it removed whatever had focus, and focus fell to the
    // page — the visitor had to find their place in the search again.
    const opener = outsideButton("Ask the assistant");
    opener.focus();
    const { unmount } = render(
      <AICompanionPanel onClose={vi.fn()}>thread</AICompanionPanel>,
    );
    screen.getByRole("button", { name: "Close assistant" }).focus();
    unmount();
    expect(opener).toHaveFocus();
  });

  it("lets the product put focus somewhere else, on open and on close", () => {
    const elsewhere = outsideButton("Details");
    const onOpenAutoFocus = vi.fn((event: Event) => {
      event.preventDefault();
      screen.getByRole("textbox", { name: "Ask" }).focus();
    });
    const onCloseAutoFocus = vi.fn((event: Event) => {
      event.preventDefault();
      elsewhere.focus();
    });
    const { unmount } = render(
      <AICompanionPanel
        onCloseAutoFocus={onCloseAutoFocus}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <input aria-label="Ask" />
      </AICompanionPanel>,
    );
    expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "Ask" })).toHaveFocus();

    unmount();
    expect(onCloseAutoFocus).toHaveBeenCalledTimes(1);
    expect(elsewhere).toHaveFocus();
  });

  it("never takes back focus the product has already moved", () => {
    // A place picked from the thread: the product opens its details, puts
    // focus there, then closes the assistant. Returning focus to the button
    // beneath would undo that — Radix's close does exactly this, late.
    outsideButton("Ask the assistant").focus();
    const details = outsideButton("Details");
    const onCloseAutoFocus = vi.fn();
    const { container, unmount } = render(
      <AICompanionPanel onCloseAutoFocus={onCloseAutoFocus}>
        thread
      </AICompanionPanel>,
    );
    expect(container.firstElementChild).toHaveFocus();

    details.focus();
    unmount();
    expect(details).toHaveFocus();
    expect(onCloseAutoFocus).not.toHaveBeenCalled();
  });

  it("opens once under StrictMode's rehearsal, and does not close", () => {
    // StrictMode runs every effect, its cleanup, and the effect again. The
    // panel is still in the document through that, so it is no close.
    const onOpenAutoFocus = vi.fn();
    const onCloseAutoFocus = vi.fn();
    const { container } = render(
      <React.StrictMode>
        <AICompanionPanel
          onCloseAutoFocus={onCloseAutoFocus}
          onOpenAutoFocus={onOpenAutoFocus}
        >
          thread
        </AICompanionPanel>
      </React.StrictMode>,
    );
    expect(container.firstElementChild).toHaveFocus();
    expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
    expect(onCloseAutoFocus).not.toHaveBeenCalled();
  });

  it("gives close a 44px target round the 36px mark the header is drawn for", () => {
    // Row 60: close was 36px to hit. The mark stays 36 so the header keeps
    // the prototype's height; an owned rule carries the 44px target.
    render(<AICompanionPanel onClose={vi.fn()} />);
    const close = screen.getByRole("button", { name: "Close assistant" });
    expect(close).toHaveClass("kozmos-ai-companion-close");
    expect(close).toHaveClass("h-9", "w-9");
  });
});
