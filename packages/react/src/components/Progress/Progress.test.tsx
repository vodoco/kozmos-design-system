import { render, screen } from "@testing-library/react";
import { Progress } from "./Progress";
import { describe, it, expect } from "vitest";

describe("Progress", () => {
  it("exposes the same normalized value visually and to assistive technology", () => {
    const { rerender } = render(
      <Progress value={25} max={50} aria-label="Download" />,
    );
    const progress = screen.getByRole("progressbar", { name: "Download" });
    expect(progress).toHaveAttribute("aria-valuenow", "25");
    expect(progress).toHaveAttribute("aria-valuemax", "50");
    // A width from the inline start, not a translation that always runs
    // from the left: right to left the bar fills from the right.
    expect(progress.firstElementChild).toHaveStyle({ width: "50%" });
    expect(progress.firstElementChild).not.toHaveStyle({
      transform: "translateX(-50%)",
    });
    rerender(<Progress value={null} aria-label="Download" />);
    expect(progress).not.toHaveAttribute("aria-valuenow");
    expect(progress).toHaveAttribute("data-state", "indeterminate");
  });
  it("renders correctly", () => {
    render(<Progress value={50} aria-label="progress" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  // Decision 131 (GAP-038): a count out of a total, as a ring.
  describe("circular", () => {
    const ring = (progress: HTMLElement) => {
      const svg = progress.querySelector("svg")!;
      const [track, arc] = Array.from(svg.querySelectorAll("circle"));
      return { svg, track, arc };
    };

    it("is a progress bar drawn as one ring, from 12 o'clock clockwise", () => {
      render(
        <Progress
          shape="circular"
          value={11}
          max={15}
          aria-label="Levels"
          getValueLabel={(value, max) => `${value} of ${max}`}
        />,
      );
      const progress = screen.getByRole("progressbar", { name: "Levels" });
      expect(progress).toHaveAttribute("aria-valuenow", "11");
      expect(progress).toHaveAttribute("aria-valuemax", "15");
      expect(progress).toHaveAttribute("aria-valuetext", "11 of 15");
      expect(progress).toHaveAttribute("data-shape", "circular");
      expect(progress).toHaveAttribute("data-size", "md");
      const { svg, track, arc } = ring(progress);
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("viewBox", "0 0 96 96");
      expect(svg).toHaveAttribute("stroke-width", "8");
      expect(track).toHaveClass("kozmos-progress-ring-track");
      expect(track).toHaveAttribute("r", "44");
      expect(arc).toHaveClass("kozmos-progress-ring-arc");
      // Rotated a quarter turn back, so the stroke starts at the top; a
      // circle's stroke runs clockwise from there.
      expect(arc).toHaveAttribute("transform", "rotate(-90 48 48)");
      const circumference = 2 * Math.PI * 44;
      const [dash, gap] = arc
        .getAttribute("stroke-dasharray")!
        .split(" ")
        .map(Number);
      expect(dash).toBeCloseTo((circumference * 11) / 15, 6);
      expect(gap).toBeCloseTo(circumference, 6);
    });

    it("takes its diameter and stroke from the size", () => {
      const { rerender } = render(
        <Progress shape="circular" size="sm" value={1} aria-label="Step" />,
      );
      const progress = screen.getByRole("progressbar");
      for (const [size, diameter, stroke] of [
        ["sm", 48, 4],
        ["md", 96, 8],
        ["lg", 128, 12],
      ] as const) {
        rerender(
          <Progress shape="circular" size={size} value={1} aria-label="Step" />,
        );
        const { svg, track } = ring(progress);
        expect(progress).toHaveAttribute("data-size", size);
        expect(svg).toHaveAttribute("viewBox", `0 0 ${diameter} ${diameter}`);
        expect(svg).toHaveAttribute("width", String(diameter));
        expect(svg).toHaveAttribute("stroke-width", String(stroke));
        expect(track).toHaveAttribute("r", String((diameter - stroke) / 2));
      }
    });

    it("is named by its centre label, which is said once", () => {
      render(
        <Progress
          shape="circular"
          value={11}
          max={15}
          label="11 Levels Added in total"
        />,
      );
      const progress = screen.getByRole("progressbar", {
        name: "11 Levels Added in total",
      });
      const label = screen.getByText("11 Levels Added in total");
      expect(progress).toContainElement(label);
      expect(progress).toHaveAttribute("aria-labelledby", label.id);
      expect(progress).not.toHaveAttribute("aria-describedby");
      // The drawn copy is hidden: heard through the reference alone.
      expect(label).toHaveAttribute("aria-hidden", "true");
    });

    it("is described by its centre label when it is already named", () => {
      render(
        <>
          <p id="hint">Ground floor first</p>
          <Progress
            shape="circular"
            value={11}
            max={15}
            aria-label="Levels"
            aria-describedby="hint"
            label="11 Levels Added in total"
          />
        </>,
      );
      const progress = screen.getByRole("progressbar", { name: "Levels" });
      const label = screen.getByText("11 Levels Added in total");
      expect(progress).not.toHaveAttribute("aria-labelledby");
      expect(progress).toHaveAttribute("aria-describedby", `hint ${label.id}`);
      expect(progress).toHaveAccessibleDescription(
        "Ground floor first 11 Levels Added in total",
      );
    });

    it("draws the track alone while the value is unknown", () => {
      render(<Progress shape="circular" value={null} aria-label="Levels" />);
      const progress = screen.getByRole("progressbar");
      expect(progress).toHaveAttribute("data-state", "indeterminate");
      expect(progress).not.toHaveAttribute("aria-valuenow");
      expect(progress.querySelectorAll("circle")).toHaveLength(1);
    });

    it("leaves the bar as it was: no ring, no label", () => {
      render(
        <Progress
          value={50}
          aria-label="Download"
          size="lg"
          label="Never drawn"
        />,
      );
      const progress = screen.getByRole("progressbar", { name: "Download" });
      expect(progress.querySelector("svg")).toBeNull();
      expect(screen.queryByText("Never drawn")).toBeNull();
      expect(progress).not.toHaveAttribute("data-shape");
      expect(progress).not.toHaveAttribute("size");
      expect(progress).not.toHaveAttribute("label");
      expect(progress.firstElementChild).toHaveStyle({ width: "50%" });
    });
  });
});
