import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Slider } from "./Slider";
import "@testing-library/jest-dom/vitest";

describe("Slider", () => {
  it("forwards accessible names and merged descriptions to the interactive thumb", () => {
    render(
      <>
        <p id="hint">Adjust volume</p>
        <Slider
          defaultValue={[50]}
          aria-label="Volume"
          aria-describedby="hint"
          aria-invalid={false}
          error="Too loud"
        />
      </>,
    );
    const thumb = screen.getByRole("slider", { name: "Volume" });
    expect(thumb).toHaveAttribute("aria-invalid", "true");
    expect(thumb).toHaveAccessibleDescription("Adjust volume Too loud");
  });
  it("forwards external labelledby to the thumb", () => {
    render(
      <>
        <span id="volume">Sound level</span>
        <Slider defaultValue={[50]} aria-labelledby="volume" />
      </>,
    );
    expect(
      screen.getByRole("slider", { name: "Sound level" }),
    ).toBeInTheDocument();
  });
  it("renders correctly", () => {
    render(<Slider defaultValue={[50]} max={100} />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("renders a thumb for each range value", () => {
    render(<Slider defaultValue={[20, 80]} max={100} />);
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(
      screen.getByRole("slider", { name: "Minimum value" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "Maximum value" }),
    ).toBeInTheDocument();
  });

  it("names a range's thumbs in the product's own words", () => {
    render(
      <Slider
        defaultValue={[20, 50, 80]}
        thumbLabels={["Prix minimum", "Prix cible", "Prix maximum"]}
      />,
    );
    expect(
      screen
        .getAllByRole("slider")
        .map((thumb) => thumb.getAttribute("aria-label")),
    ).toEqual(["Prix minimum", "Prix cible", "Prix maximum"]);
    expect(screen.queryByRole("slider", { name: "Minimum value" })).toBeNull();
  });

  it("can reserve multiple thumbs before a value is supplied", () => {
    render(<Slider thumbCount={2} max={100} />);
    expect(screen.getAllByRole("slider")).toHaveLength(2);
  });

  it("renders label associated with the slider", () => {
    render(<Slider label="Volume" defaultValue={[50]} max={100} />);
    const label = screen.getByText("Volume");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("LABEL");
  });

  it("renders error message with aria-describedby linkage", () => {
    render(<Slider error="Value out of range" defaultValue={[50]} max={100} />);
    const slider = screen.getByRole("slider");
    expect(slider.closest('[aria-invalid="true"]')).toBeInTheDocument();

    const errorMessage = screen.getByText("Value out of range");
    expect(errorMessage).toBeInTheDocument();
  });

  it("renders boolean error without error text", () => {
    render(<Slider error={true} defaultValue={[50]} max={100} />);
    const slider = screen.getByRole("slider");
    expect(slider.closest('[aria-invalid="true"]')).toBeInTheDocument();
  });

  it("shows the value bubble on the thumb, not the track", () => {
    render(
      <Slider defaultValue={[40]} label="Transparency" showValueTooltip />,
    );

    const thumb = screen.getByRole("slider");
    expect(screen.queryByRole("tooltip")).toBeNull();

    fireEvent.pointerEnter(thumb);
    const bubble = screen.getByRole("tooltip");
    expect(bubble).toHaveTextContent("40");
    // Inside the thumb is what makes it track the knob. Anchored to the track
    // it would sit still while the knob moved under it.
    expect(thumb).toContainElement(bubble);
  });

  it("keeps the bubble up through a drag, after the pointer leaves the thumb", () => {
    render(
      <Slider defaultValue={[40]} label="Transparency" showValueTooltip />,
    );
    const thumb = screen.getByRole("slider");

    fireEvent.pointerEnter(thumb);
    fireEvent.pointerDown(thumb);
    // The pointer outruns the knob on any real drag.
    fireEvent.pointerLeave(thumb);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    // Released outside the slider — still has to put itself away.
    fireEvent.pointerUp(document);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("formats the value when asked, and stays silent unless opted in", () => {
    const { rerender } = render(
      <Slider
        defaultValue={[40]}
        formatValue={(v) => `${v}%`}
        label="Transparency"
        showValueTooltip
      />,
    );
    fireEvent.pointerEnter(screen.getByRole("slider"));
    expect(screen.getByRole("tooltip")).toHaveTextContent("40%");

    rerender(<Slider defaultValue={[40]} label="Transparency" />);
    fireEvent.pointerEnter(screen.getByRole("slider"));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
