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
      <Notice
        expanded={false}
        onExpandedChange={onExpandedChange}
        summary="Short"
      >
        Long
      </Notice>,
    );
    fireEvent.click(screen.getByRole("button", { name: /More/ }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    // Controlled: it does not move on its own.
    expect(screen.getByText("Long")).not.toBeVisible();
  });

  it("can be urgent, and is polite unless told otherwise", () => {
    // Fixed at role="status" before row 54: the dietary notice needs to be
    // read when results arrive, and the emergency notice needs to interrupt.
    // One component, two jobs, and no way to say which.
    const { rerender, container } = render(
      <Notice summary="Check allergens." />,
    );
    expect(container.firstChild).toHaveAttribute("role", "status");

    rerender(<Notice live="assertive" summary="Evacuate by the north exit." />);
    expect(container.firstChild).toHaveAttribute("role", "alert");

    rerender(<Notice live="off" summary="Shown in English." />);
    expect(container.firstChild).not.toHaveAttribute("role");

    // A caller's own role still wins, as Alert's does.
    rerender(<Notice live="assertive" role="note" summary="Anything." />);
    expect(container.firstChild).toHaveAttribute("role", "note");
  });

  it("gives More a target the stylesheet owns", () => {
    // The drawn control is ~60x20 and should stay that size: the whole point
    // of Notice is that collapsed it is one line. The target is carried by an
    // owned rule instead, so it cannot vanish with the utility layer.
    render(<Notice summary="Short">Long</Notice>);
    expect(screen.getByRole("button", { name: /More/ })).toHaveClass(
      "kozmos-notice-more",
    );
  });
});
