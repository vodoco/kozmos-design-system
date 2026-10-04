import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoutingInputGroup } from "./RoutingInputGroup";
import { SwitchVertical01 } from "@kozmos-ds/icons";

const points = [
  { id: "origin", value: "Current location" },
  { id: "destination", value: "Gate A12" },
];

describe("RoutingInputGroup", () => {
  it("accepts localized field and action names including intermediate stops", () => {
    render(
      <RoutingInputGroup
        points={[
          { ...points[0], label: "Desde" },
          { id: "stop", value: "Café", label: "Parada" },
          { ...points[1], label: "Hasta" },
        ]}
        onPointChange={vi.fn()}
        onAddPoint={vi.fn()}
        onRemovePoint={vi.fn()}
        addPointLabel="Añadir parada"
        removePointLabel={(point) => `Quitar ${point.label}`}
      />,
    );
    expect(screen.getByRole("textbox", { name: "Desde" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Parada" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Hasta" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Añadir parada" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quitar Parada" }),
    ).toBeInTheDocument();
  });
  it("names populated route fields independently of their placeholders", () => {
    render(<RoutingInputGroup points={points} onPointChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Origin" })).toHaveValue(
      "Current location",
    );
    expect(screen.getByRole("textbox", { name: "Destination" })).toHaveValue(
      "Gate A12",
    );
  });

  it("uses the two-way swap asset, not a downward arrow", () => {
    const { container } = render(
      <>
        <RoutingInputGroup
          points={points}
          onPointChange={vi.fn()}
          onSwap={vi.fn()}
        />
        <span data-testid="expected-swap">
          <SwitchVertical01 />
        </span>
      </>,
    );
    expect(
      screen
        .getByRole("button", { name: "Swap route points" })
        .querySelector("svg")?.innerHTML,
    ).toBe(
      container.querySelector('[data-testid="expected-swap"] svg')?.innerHTML,
    );
  });

  it("renders route points and reports input changes", () => {
    const onPointChange = vi.fn();

    render(<RoutingInputGroup points={points} onPointChange={onPointChange} />);

    fireEvent.change(screen.getByDisplayValue("Current location"), {
      target: { value: "Lobby" },
    });

    expect(onPointChange).toHaveBeenCalledWith("origin", "Lobby");
  });

  it("supports swapping and adding route points", () => {
    const onSwap = vi.fn();
    const onAddPoint = vi.fn();

    render(
      <RoutingInputGroup
        points={points}
        onPointChange={vi.fn()}
        onSwap={onSwap}
        onAddPoint={onAddPoint}
      />,
    );

    fireEvent.click(screen.getByLabelText("Swap route points"));
    fireEvent.click(screen.getByLabelText("Add route point"));

    expect(onSwap).toHaveBeenCalledTimes(1);
    expect(onAddPoint).toHaveBeenCalledTimes(1);
  });

  it("supports removing intermediate stops", () => {
    const onRemovePoint = vi.fn();

    render(
      <RoutingInputGroup
        points={[
          points[0],
          { id: "stop", value: "Coffee bar", placeholder: "Coffee bar" },
          points[1],
        ]}
        onPointChange={vi.fn()}
        onRemovePoint={onRemovePoint}
      />,
    );

    fireEvent.click(screen.getByLabelText("Remove Coffee bar"));
    expect(onRemovePoint).toHaveBeenCalledWith("stop");
  });
});
