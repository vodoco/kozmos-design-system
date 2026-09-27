import { act, fireEvent, render, screen } from "@testing-library/react";
import { NavigationPointer01 as Focus } from "@kozmos-ds/icons";
import { describe, expect, it, vi } from "vitest";
import { MapControlButton } from "./MapControlButton";

describe("MapControlButton", () => {
  it("renders an icon-only action with an accessible name", () => {
    const onClick = vi.fn();
    render(
      <MapControlButton
        icon={<Focus />}
        label="Focus location"
        onClick={onClick}
      />,
    );

    const button = screen.getByRole("button", { name: "Focus location" });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("data-presentation", "icon-only");
  });

  it("exposes visible and semantic state for a labelled toggle", () => {
    render(
      <MapControlButton
        icon={<Focus />}
        label="Focus"
        presentation="labelled"
        pressed={false}
        stateLabel="Off"
        onClick={() => undefined}
      />,
    );

    expect(screen.getByText("Focus")).toBeVisible();
    expect(screen.getByText("Off")).toBeVisible();
    expect(screen.getByRole("button", { name: "Focus, Off" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
  it("tints an active control instead of filling it, by default", () => {
    render(
      <MapControlButton
        icon={<Focus data-testid="glyph" />}
        label="Focus"
        presentation="labelled"
        pressed
        stateLabel="On"
        onClick={() => undefined}
      />,
    );

    const button = screen.getByRole("button", { name: "Focus, On" });
    // The map surface survives: a filled control would take the primary tier
    // and hide the tiles it sits on. Asserted against the opaque role because
    // `bg-background/90` compiles to nothing — see the component comment.
    expect(button).toHaveClass("bg-background");
    expect(button.className).not.toContain("bg-background/");
    expect(button).toHaveClass("ring-primary");
    expect(button.className).not.toContain("bg-primary");
    // Only the icon carries the colour; the label stays ink so it keeps its
    // contrast against the surface.
    expect(screen.getByTestId("glyph").parentElement).toHaveClass(
      "text-primary",
    );
  });

  it("actually fills when a caller asks for the heavier emphasis", () => {
    render(
      <MapControlButton
        emphasis="filled"
        icon={<Focus data-testid="glyph" />}
        label="Focus"
        pressed
        onClick={() => undefined}
      />,
    );

    const button = screen.getByRole("button", { name: "Focus" });
    // The fill and its ink come from the Button's primary tier. Asserting that
    // a tint is absent is not enough — this passed for as long as the control
    // was white with black text, because the map surface and ink classes were
    // still on the root and tailwind-merge let them beat the tier's own.
    expect(button.className).toContain("kozmos-button-default");
    expect(button.className).toContain("kozmos-button");
    expect(button).not.toHaveClass("bg-background");
    expect(button).not.toHaveClass("text-foreground");
    expect(button).not.toHaveClass("hover:bg-muted");
    expect(button.className).not.toContain("ring-primary");
    expect(screen.getByTestId("glyph").parentElement).not.toHaveClass(
      "text-primary",
    );
  });

  it("stacks the state under the label when asked", () => {
    render(
      <MapControlButton
        icon={<Focus />}
        label="Focus"
        labelPlacement="stacked"
        presentation="labelled"
        pressed
        stateLabel="On"
        onClick={() => undefined}
      />,
    );

    const name = screen.getByText("Focus");
    const state = screen.getByText("On");
    const stack = name.parentElement;
    expect(stack).toBe(state.parentElement);
    expect(stack).toHaveClass("flex-col");
    expect(state).toHaveClass("font-semibold");
  });

  it("reaches for the control radius rather than a container's", () => {
    render(
      <MapControlButton
        icon={<Focus />}
        label="Zoom in"
        onClick={() => undefined}
      />,
    );

    const button = screen.getByRole("button", { name: "Zoom in" });
    expect(button).toHaveClass("rounded-control");
    expect(button.className).not.toContain("rounded-container");
  });

  it("keeps the label mounted and clipped when icon-only, so it can animate", () => {
    render(
      <MapControlButton
        icon={<Focus />}
        label="Focus"
        presentation="icon-only"
        stateLabel="On"
        onClick={() => undefined}
      />,
    );

    // Present for the width transition, hidden from the accessible name by the
    // button's own aria-label.
    const clipped = screen.getByText("Focus").parentElement;
    expect(clipped).toHaveClass("max-w-0");
    expect(screen.getByRole("button", { name: "Focus, On" })).toHaveAttribute(
      "data-presentation",
      "icon-only",
    );
  });
  it("hovers to the muted step, not the border grey", () => {
    render(
      <MapControlButton
        icon={<Focus />}
        label="Zoom in"
        onClick={() => undefined}
      />,
    );

    // `secondary` is background-200 (#C7CAD1) — the same value as Border/Subtle,
    // which is far too heavy a step for chrome sitting on a map.
    const button = screen.getByRole("button", { name: "Zoom in" });
    expect(button).toHaveClass("hover:bg-muted");
    expect(button.className).not.toContain("hover:bg-secondary");
  });

  it("resolves its own presentation when asked to reveal on change", () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <MapControlButton
          icon={<Focus />}
          label="Focus"
          revealOnChange
          stateLabel="Off"
          onClick={() => undefined}
        />,
      );

      // At rest it is icon-only, and mounting is not a change.
      expect(
        screen.getByRole("button", { name: "Focus, Off" }),
      ).toHaveAttribute("data-presentation", "icon-only");

      rerender(
        <MapControlButton
          icon={<Focus />}
          label="Focus"
          pressed
          revealOnChange
          stateLabel="On"
          onClick={() => undefined}
        />,
      );
      act(() => {
        vi.advanceTimersByTime(10);
      });
      expect(screen.getByRole("button", { name: "Focus, On" })).toHaveAttribute(
        "data-presentation",
        "labelled",
      );

      act(() => {
        vi.advanceTimersByTime(2600);
      });
      // Collapsed again, but the mode it announced is still on.
      const settled = screen.getByRole("button", { name: "Focus, On" });
      expect(settled).toHaveAttribute("data-presentation", "icon-only");
      expect(settled).toHaveAttribute("aria-pressed", "true");
    } finally {
      vi.useRealTimers();
    }
  });
  it("does not announce a change when `pressed` only goes from unset to false", () => {
    // A caller loading its state often renders `pressed={undefined}` first and
    // `false` once it knows. Nothing the user can see or do has changed, so
    // nothing should widen over the map.
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <MapControlButton
          icon={<Focus />}
          label="Focus"
          revealOnChange
          stateLabel="Off"
          onClick={() => undefined}
        />,
      );
      rerender(
        <MapControlButton
          icon={<Focus />}
          label="Focus"
          pressed={false}
          revealOnChange
          stateLabel="Off"
          onClick={() => undefined}
        />,
      );
      act(() => {
        vi.advanceTimersByTime(10);
      });
      expect(
        screen.getByRole("button", { name: "Focus, Off" }),
      ).toHaveAttribute("data-presentation", "icon-only");
    } finally {
      vi.useRealTimers();
    }
  });
  it("keeps a stacked caption legible on a filled surface", () => {
    render(
      <MapControlButton
        emphasis="filled"
        icon={<Focus />}
        label="Focus"
        labelPlacement="stacked"
        presentation="labelled"
        pressed
        stateLabel="On"
        onClick={() => undefined}
      />,
    );

    // Muted grey on the theme fill is about 1.9:1. On a filled surface the
    // caption inherits the on-fill colour, as the state line under it does.
    expect(screen.getByText("Focus")).not.toHaveClass("text-muted-foreground");
    expect(screen.getByText("On")).not.toHaveClass("text-muted-foreground");
  });

  it("keeps the caption muted on the map's own surface", () => {
    render(
      <MapControlButton
        icon={<Focus />}
        label="Focus"
        labelPlacement="stacked"
        presentation="labelled"
        pressed
        stateLabel="On"
        onClick={() => undefined}
      />,
    );

    expect(screen.getByText("Focus")).toHaveClass("text-muted-foreground");
  });
});
