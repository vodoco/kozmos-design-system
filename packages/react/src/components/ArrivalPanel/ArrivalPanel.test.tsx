import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArrivalPanel } from "./ArrivalPanel";

describe("ArrivalPanel", () => {
  it("is hosted, has no fabricated metrics or automatic announcement, and delegates Done", () => {
    const done = vi.fn();
    const { container } = render(
      <ArrivalPanel destination="Gate 3" onDone={done} />,
    );
    expect(
      screen.getByRole("heading", { name: "You've arrived" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Gate 3")).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("data-presentation", "hosted");
    expect(container.querySelector("dl")).toBeNull();
    expect(container.querySelector("[aria-live]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(done).toHaveBeenCalledTimes(1);
  });
  it("only shows supplied actual values, localizes labels and respects pending completion", () => {
    const done = vi.fn();
    render(
      <ArrivalPanel
        destination="Gate 3"
        actualDurationText="0 min"
        durationLabel="Dauer"
        doneLabel="Fertig"
        pending
        onDone={done}
      />,
    );
    expect(screen.getByText("Dauer")).toBeInTheDocument();
    expect(screen.getByText("0 min")).toBeInTheDocument();
    expect(screen.queryByText("Distance travelled")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Fertig" }));
    expect(done).not.toHaveBeenCalled();
  });
});
