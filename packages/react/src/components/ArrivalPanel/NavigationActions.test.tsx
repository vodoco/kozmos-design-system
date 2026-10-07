import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArrivalPanel } from "./ArrivalPanel";
import { Button } from "../Button";
import { RouteSummary } from "../RouteSummary";
import { RoutingInputGroup } from "../RoutingInputGroup";
import { WayfindingCard, WayfindingInputRow } from "../WayfindingCard";

describe("navigation actions inside a host form", () => {
  it.each([
    "arrival",
    "summary",
    "summary-actions",
    "estimate",
    "start",
    "points",
    "stops",
    "wayfinding",
  ])("%s delegates actions without submitting the host form", (kind) => {
    const action = vi.fn();
    const submit = vi.fn();
    const points = [
      { id: "from", value: "Lobby" },
      { id: "to", value: "Gallery" },
    ];
    const content: Record<string, React.ReactNode> = {
      arrival: <ArrivalPanel destination="Gallery" onDone={action} />,
      summary: <RouteSummary destination="Gallery" onEndRoute={action} />,
      // The slot's recipe: the host's Buttons say type="button" (Button has
      // no default type), so Previous and Next never submit the host's form.
      "summary-actions": (
        <RouteSummary
          destination="Gallery"
          onEndRoute={action}
          actions={
            <>
              <Button type="button" variant="outline" onClick={action}>
                Previous
              </Button>
              <Button type="button" onClick={action}>
                Next
              </Button>
            </>
          }
        />
      ),
      estimate: (
        <RouteSummary etaText="1 min" distanceText="20 m" onEndRoute={action} />
      ),
      start: (
        <RouteSummary
          etaText="1 min"
          distanceText="20 m"
          state="preview"
          onStartNavigation={action}
          onEndRoute={action}
        />
      ),
      points: (
        <RoutingInputGroup
          points={points}
          onPointChange={() => {}}
          onSwap={action}
          onAddPoint={action}
        />
      ),
      stops: (
        <RoutingInputGroup
          points={[points[0], { id: "stop", value: "Cafe" }, points[1]]}
          onPointChange={() => {}}
          onRemovePoint={action}
        />
      ),
      wayfinding: (
        <WayfindingCard onClose={action}>
          <WayfindingInputRow onSwap={action} />
        </WayfindingCard>
      ),
    };
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {content[kind]}
      </form>,
    );
    const buttons = screen.getAllByRole("button");
    if (kind === "summary-actions")
      expect(buttons.map((button) => button.textContent)).toEqual([
        "End",
        "Previous",
        "Next",
      ]);
    buttons.forEach((button) => fireEvent.click(button));
    expect(action).toHaveBeenCalledTimes(buttons.length);
    expect(submit).not.toHaveBeenCalled();
  });
});
