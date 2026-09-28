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
    // and hide the tiles it sits on. The surface and its tones are the owned
    // map-control rules, keyed to `aria-pressed`; see the component comment.
    expect(button).toHaveClass("kozmos-map-control", "kozmos-button-ghost");
    expect(button.className).not.toContain("bg-primary");
    expect(button.className).not.toContain("kozmos-button-default");
    expect(screen.getByTestId("glyph").parentElement).toHaveClass(
      "kozmos-map-control-mark",
    );
  });

  it("wears the map's own surface and draws no edge, pressed or not (decision 40)", () => {
    // The SDK's Tracking Indicator: white, a 16 corner, three shadows, and no
    // stroke in any state — "On" is said by the mark and the words, never by
    // a primary ring, and a pressed control keeps its lift.
    const { rerender } = render(
      <MapControlButton
        icon={<Focus />}
        label="Focus"
        pressed={false}
        onClick={() => undefined}
      />,
    );
    for (const pressed of [false, true]) {
      rerender(
        <MapControlButton
          icon={<Focus />}
          label="Focus"
          pressed={pressed}
          onClick={() => undefined}
        />,
      );
      const button = screen.getByRole("button", { name: "Focus" });
      expect(button).toHaveClass("kozmos-map-control");
      expect(button.className).not.toMatch(/\bring-(1|border|primary)\b/);
      expect(button.className).not.toMatch(/\bshadow-(raised|floating)\b/);
    }
  });

  it("sets a stacked name and state as two equal lines", () => {
    render(
      <MapControlButton
        icon={<Focus />}
        label="Focus"
        labelPlacement="stacked"
        presentation="labelled"
        pressed={false}
        stateLabel="Off"
        onClick={() => undefined}
      />,
    );

    // "Focus⏎Off" in the SDK: one bold 16 on a 16 line, twice — not a small
    // grey caption over a heavier state.
    const name = screen.getByText("Focus");
    const state = screen.getByText("Off");
    expect(name).toHaveClass("kozmos-map-control-line");
    expect(state.className).toBe(name.className);
  });

  it("can show its state alone, and keeps its name for a screen reader", () => {
    render(
      <MapControlButton
        icon={<Focus />}
        label="Focus"
        presentation="labelled"
        showLabel={false}
        stateLabel="No Location"
        onClick={() => undefined}
      />,
    );

    // The SDK's "No Location" is one line with no "Focus" over it. The name
    // still starts with what the control does.
    const button = screen.getByRole("button", { name: "Focus, No Location" });
    expect(screen.getByText("No Location")).toBeVisible();
    expect(screen.queryByText("Focus")).toBeNull();
    expect(button).not.toHaveAttribute("showlabel");
  });

  it("says what its words leave out after them, and does not reveal for it", () => {
    vi.useFakeTimers();
    try {
      const props = {
        icon: <Focus />,
        label: "Focus",
        pressed: true,
        revealOnChange: true,
        stateLabel: "On",
        onClick: () => undefined,
      };
      const { rerender } = render(<MapControlButton {...props} />);
      rerender(
        <MapControlButton {...props} stateDescription="map turns with you" />,
      );
      act(() => {
        vi.advanceTimersByTime(10);
      });

      // Read after the words the control shows, so a voice-control user can
      // still say what they see; never drawn, and not a change to announce:
      // the words did not change.
      const button = screen.getByRole("button", {
        name: "Focus, On, map turns with you",
      });
      expect(screen.queryByText("map turns with you")).toBeNull();
      expect(button).toHaveAttribute("data-presentation", "icon-only");
    } finally {
      vi.useRealTimers();
    }
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
    // still on the root and tailwind-merge let them beat the tier's own. The
    // map's surface and tones are keyed to the ghost tier, so they stand
    // aside here.
    expect(button.className).toContain("kozmos-button-default");
    expect(button.className).toContain("kozmos-button");
    expect(button).not.toHaveClass("kozmos-button-ghost");
    expect(button).not.toHaveClass("bg-background");
    expect(button).not.toHaveClass("text-foreground");
    expect(button.className).not.toContain("ring-primary");
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
    expect(stack).toHaveClass("kozmos-map-control-words-stacked");
  });

  it("reaches for the control radius rather than a container's", () => {
    render(
      <MapControlButton
        icon={<Focus />}
        label="Zoom in"
        onClick={() => undefined}
      />,
    );

    // The radius is the owned map-control rule's, the Control role (16).
    const button = screen.getByRole("button", { name: "Zoom in" });
    expect(button).toHaveClass("kozmos-map-control");
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
    // button's own aria-label. The owned map-control rules clip it while the
    // control is icon-only (the browser check measures the 48 square).
    const clipped = screen.getByText("Focus").parentElement;
    expect(clipped).toHaveClass("kozmos-map-control-words");
    expect(screen.getByRole("button", { name: "Focus, On" })).toHaveAttribute(
      "data-presentation",
      "icon-only",
    );
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

    // Muted grey on the theme fill is about 1.9:1. On a filled surface both
    // lines inherit the on-fill colour: the map's tones are the ghost tier's.
    expect(screen.getByText("Focus")).not.toHaveClass("text-muted-foreground");
    expect(screen.getByText("On")).not.toHaveClass("text-muted-foreground");
  });
});
