import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouteSetupPanel } from "./RouteSetupPanel";

describe("RouteSetupPanel", () => {
  it.each([
    [false, false],
    [true, true],
  ])("cannot continue when ready=%s pending=%s", (ready, pending) => {
    const onContinue = vi.fn();
    const onClose = vi.fn();
    render(
      <RouteSetupPanel
        ready={ready}
        pending={pending}
        onContinue={onContinue}
        onClose={onClose}
      >
        <p>Origin field</p>
      </RouteSetupPanel>,
    );
    const next = screen.getByRole("button", { name: "Continue" });
    expect(next).toBeDisabled();
    fireEvent.click(next);
    expect(onContinue).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Close route setup" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it("hosts fields without duplicating the sheet and delegates valid continuation", () => {
    const onContinue = vi.fn();
    render(
      <RouteSetupPanel
        ready
        onContinue={onContinue}
        onClose={() => {}}
        title="Route planen"
        continueLabel="Weiter"
      >
        <p>Lobby → Gallery</p>
      </RouteSetupPanel>,
    );
    expect(
      screen.getByRole("region", { name: "Route planen" }),
    ).toHaveAttribute("data-presentation", "hosted");
    expect(screen.getByText("Lobby → Gallery")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
