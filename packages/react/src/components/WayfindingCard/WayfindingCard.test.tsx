import { render, screen, fireEvent } from "@testing-library/react";
import { WayfindingCard, WayfindingInputRow } from "./WayfindingCard";
import { describe, it, expect, vi } from "vitest";
import { AnalyticsProvider } from "../../utils/analytics";
import { SwitchVertical01 } from "@kozmos-ds/icons";

describe("WayfindingCard", () => {
  it("uses a swap glyph and omits raw locations from swap telemetry", () => {
    const onDispatch = vi.fn();
    const { unmount } = render(
      <AnalyticsProvider onDispatch={onDispatch}>
        <WayfindingInputRow
          originValue="Private origin"
          destinationValue="Private destination"
        />
        <span data-testid="expected-swap">
          <SwitchVertical01 />
        </span>
      </AnalyticsProvider>,
    );
    const swap = screen.getByRole("button", {
      name: "Swap origin and destination",
    });
    expect(swap.querySelector("svg")?.innerHTML).toBe(
      screen.getByTestId("expected-swap").querySelector("svg")?.innerHTML,
    );
    fireEvent.click(swap);
    unmount();
    expect(onDispatch).toHaveBeenCalledTimes(1);
    const event = onDispatch.mock.calls[0][0].find(
      (item: { eventName: string }) =>
        item.eventName === "wayfinding_route_swapped",
    );
    expect(event).toBeDefined();
    expect(event.eventName).toBe("wayfinding_route_swapped");
    expect(event.properties ?? {}).toEqual({});
  });

  it("does not submit a surrounding form when closing navigation", () => {
    const submit = vi.fn();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <WayfindingCard onClose={() => {}}>Route</WayfindingCard>
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));
    expect(submit).not.toHaveBeenCalled();
  });
  it("names its controls and supports localized names", () => {
    render(
      <WayfindingCard onClose={() => {}} closeLabel="Close route">
        <WayfindingInputRow
          originLabel="From"
          destinationLabel="To"
          swapLabel="Reverse route"
        />
      </WayfindingCard>,
    );
    expect(
      screen.getByRole("button", { name: "Close route" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reverse route" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "From" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "To" })).toBeInTheDocument();
  });
  it("renders title and children", () => {
    render(
      <WayfindingCard title="Test Route">
        <div>Step 1</div>
      </WayfindingCard>,
    );
    expect(screen.getByText("Test Route")).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });

  it("handles close", () => {
    const onClose = vi.fn();
    render(<WayfindingCard onClose={onClose}>Content</WayfindingCard>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalled();
  });
});
