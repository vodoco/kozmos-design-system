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

  it("leaves focus where it was when it mounts already open", () => {
    // Decision 16: a panel on screen from the start was not opened by the
    // visitor, so it takes focus from nothing on the page. It used to take it
    // as it mounted, unless the product prevented the open.
    const search = outsideButton("Search");
    search.focus();
    const onOpenAutoFocus = vi.fn();
    const { unmount } = render(
      <AICompanionPanel onClose={vi.fn()} onOpenAutoFocus={onOpenAutoFocus}>
        thread
      </AICompanionPanel>,
    );
    expect(screen.getByRole("region", { name: "Assistant" })).toBeVisible();
    expect(search).toHaveFocus();
    expect(onOpenAutoFocus).not.toHaveBeenCalled();
    unmount();

    // `open` from the first render is the same: nobody opened it.
    render(
      <AICompanionPanel onOpenAutoFocus={onOpenAutoFocus} open>
        thread
      </AICompanionPanel>,
    );
    expect(search).toHaveFocus();
    expect(onOpenAutoFocus).not.toHaveBeenCalled();
  });

  it("takes focus when a panel that mounted open is closed and opened again", () => {
    // On screen from the start, then closed by the visitor: opening it again
    // is the visitor's doing.
    const search = outsideButton("Search");
    search.focus();
    const onOpenAutoFocus = vi.fn();
    const panel = (open: boolean) => (
      <AICompanionPanel onOpenAutoFocus={onOpenAutoFocus} open={open}>
        thread
      </AICompanionPanel>
    );
    const { rerender } = render(panel(true));
    expect(search).toHaveFocus();

    rerender(panel(false));
    rerender(panel(true));
    expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();
    expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
  });

  it("moves focus into itself when it is opened", () => {
    // Row 60: it covers the frame, and focus stayed on the button beneath it.
    const opener = outsideButton("Ask the assistant");
    opener.focus();
    const panel = (open: boolean) => (
      <AICompanionPanel onClose={vi.fn()} open={open}>
        thread
      </AICompanionPanel>
    );
    const { rerender } = render(panel(false));
    // Closed, it leaves focus alone and draws nothing.
    expect(opener).toHaveFocus();
    expect(screen.queryByRole("region")).toBeNull();

    rerender(panel(true));
    expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();
  });

  it("leaves focus with a part inside that takes it as the panel opens", () => {
    const opener = outsideButton("Ask the assistant");
    opener.focus();
    const onOpenAutoFocus = vi.fn();
    const panel = (open: boolean) => (
      <AICompanionPanel onOpenAutoFocus={onOpenAutoFocus} open={open}>
        <input aria-label="Ask" autoFocus />
      </AICompanionPanel>
    );
    const { rerender } = render(panel(false));
    rerender(panel(true));
    expect(screen.getByRole("textbox", { name: "Ask" })).toHaveFocus();
    expect(onOpenAutoFocus).not.toHaveBeenCalled();

    // The opener was read before the field took focus, so the close still
    // finds its way back to the button.
    rerender(panel(false));
    expect(opener).toHaveFocus();
  });

  it("hands focus back to the opener when it closes", () => {
    // Row 60: closing it removed whatever had focus, and focus fell to the
    // page — the visitor had to find their place in the search again.
    const opener = outsideButton("Ask the assistant");
    opener.focus();
    const panel = (open: boolean) => (
      <AICompanionPanel onClose={vi.fn()} open={open}>
        thread
      </AICompanionPanel>
    );
    const { rerender } = render(panel(false));
    rerender(panel(true));
    screen.getByRole("button", { name: "Close assistant" }).focus();
    rerender(panel(false));
    expect(opener).toHaveFocus();
    expect(screen.queryByRole("region")).toBeNull();

    // Each open reads its own opener.
    const again = outsideButton("Ask again");
    again.focus();
    rerender(panel(true));
    expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();
    rerender(panel(false));
    expect(again).toHaveFocus();
  });

  it("hands focus back as it unmounts, to what had it when it mounted", () => {
    // A product that unmounts the panel to close it is closing it too.
    const opener = outsideButton("Ask the assistant");
    opener.focus();
    const { unmount } = render(
      <AICompanionPanel onClose={vi.fn()}>thread</AICompanionPanel>,
    );
    screen.getByRole("button", { name: "Close assistant" }).focus();
    unmount();
    expect(opener).toHaveFocus();
  });

  it("calls onOpenAutoFocus when it is opened, so the product can put focus elsewhere", () => {
    const elsewhere = outsideButton("Details");
    const onOpenAutoFocus = vi.fn((event: Event) => {
      event.preventDefault();
      screen.getByRole("textbox", { name: "Ask" }).focus();
    });
    const onCloseAutoFocus = vi.fn((event: Event) => {
      event.preventDefault();
      elsewhere.focus();
    });
    const panel = (open: boolean) => (
      <AICompanionPanel
        onCloseAutoFocus={onCloseAutoFocus}
        onOpenAutoFocus={onOpenAutoFocus}
        open={open}
      >
        <input aria-label="Ask" />
      </AICompanionPanel>
    );
    const { rerender } = render(panel(false));
    expect(onOpenAutoFocus).not.toHaveBeenCalled();

    rerender(panel(true));
    expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "Ask" })).toHaveFocus();

    rerender(panel(false));
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
    const panel = (open: boolean) => (
      <AICompanionPanel onCloseAutoFocus={onCloseAutoFocus} open={open}>
        thread
      </AICompanionPanel>
    );
    const { rerender } = render(panel(false));
    rerender(panel(true));
    expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();

    details.focus();
    rerender(panel(false));
    expect(details).toHaveFocus();
    expect(onCloseAutoFocus).not.toHaveBeenCalled();
  });

  it("is neither opened nor closed by StrictMode's rehearsal of its mount", () => {
    // StrictMode runs every effect, its cleanup, and the effect again. The
    // panel is still in the document through that, so it is no close, and a
    // panel that mounted open is still one nobody opened.
    const onOpenAutoFocus = vi.fn();
    const onCloseAutoFocus = vi.fn();
    const panel = (open: boolean) => (
      <React.StrictMode>
        <AICompanionPanel
          onCloseAutoFocus={onCloseAutoFocus}
          onOpenAutoFocus={onOpenAutoFocus}
          open={open}
        >
          thread
        </AICompanionPanel>
      </React.StrictMode>
    );
    // As a page starts: nothing has focus, which a close would read as lost.
    expect(document.body).toHaveFocus();
    const { unmount } = render(panel(true));
    expect(document.body).toHaveFocus();
    expect(onOpenAutoFocus).not.toHaveBeenCalled();
    expect(onCloseAutoFocus).not.toHaveBeenCalled();
    unmount();

    // Mounted closed and opened later, it opens once and closes once.
    const opener = outsideButton("Ask the assistant");
    opener.focus();
    onCloseAutoFocus.mockClear();
    const { rerender } = render(panel(false));
    rerender(panel(true));
    expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();
    expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
    rerender(panel(false));
    expect(onCloseAutoFocus).toHaveBeenCalledTimes(1);
    expect(opener).toHaveFocus();
  });

  it("hands its ref the panel while it is open", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { rerender } = render(<AICompanionPanel open={false} ref={ref} />);
    expect(ref.current).toBeNull();

    rerender(<AICompanionPanel open ref={ref} />);
    expect(ref.current).toBe(screen.getByRole("region", { name: "Assistant" }));

    rerender(<AICompanionPanel open={false} ref={ref} />);
    expect(ref.current).toBeNull();
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
