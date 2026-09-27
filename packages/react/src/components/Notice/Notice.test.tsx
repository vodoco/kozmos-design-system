import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Notice } from "./Notice";

describe("Notice", () => {
  it("shows one line until asked for the rest", () => {
    // Story 14's full wording is four lines above results that are themselves
    // the answer. Collapsed, the summary must still say what the risk is.
    render(
      <Notice summary="AI results may be incomplete. Check allergens with the venue.">
        These results are AI-assisted and may be incomplete or out of date.
      </Notice>,
    );
    const toggle = screen.getByRole("button", { name: /More/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(/AI-assisted/)).not.toBeVisible();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/AI-assisted/)).toBeVisible();
  });

  it("is announced politely, never assertively", () => {
    // It must be heard when results arrive without cutting across whatever
    // the visitor is already being told.
    render(<Notice summary="Check allergens with the venue." />);
    expect(screen.getByRole("status")).toBeVisible();
  });

  it("offers no disclosure when there is nothing behind it", () => {
    render(<Notice summary="Results are AI-assisted." />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows everything at once when it must not be discovered", () => {
    // "Emergency: help first, not a result list" — nobody in an emergency
    // should have to find a More link before they can act.
    render(
      <Notice
        action={<button type="button">Call 112</button>}
        collapsible={false}
        summary="If someone's life is in danger, call 112 now"
        tone="critical"
      >
        Airport staff can help too. The nearest help points are below.
      </Notice>,
    );
    expect(screen.getByText(/Airport staff can help too/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Call 112" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /More/ }),
    ).not.toBeInTheDocument();
  });

  it("lets a product own the expanded state, to remember it for the session", () => {
    const onExpandedChange = vi.fn();
    render(
      <Notice expanded={false} onExpandedChange={onExpandedChange} summary="Short">
        Long
      </Notice>,
    );
    fireEvent.click(screen.getByRole("button", { name: /More/ }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    // Controlled: it does not move on its own.
    expect(screen.getByText("Long")).not.toBeVisible();
  });
});
