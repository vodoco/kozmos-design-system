import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AICompanionPanel } from "./AICompanionPanel";

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
    const { rerender } = render(<AICompanionPanel onClose={onClose}>thread</AICompanionPanel>);
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
});
