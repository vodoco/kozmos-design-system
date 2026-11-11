import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
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
  it("draws a value over the total as a full bar, as the natives do", () => {
    render(<Progress value={120} aria-label="Download" />);
    const progress = screen.getByRole("progressbar", { name: "Download" });
    expect(progress).toHaveAttribute("data-state", "complete");
    expect(progress).toHaveAttribute("aria-valuenow", "100");
    expect(progress.firstElementChild).toHaveStyle({ width: "100%" });
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

    // Owner, 28 Oct: the Level Manager's ring is a status ring.
    it("takes its arc's colour from its tone, themed by default", () => {
      const { rerender } = render(
        <Progress shape="circular" value={3} max={4} aria-label="Levels" />,
      );
      const progress = screen.getByRole("progressbar");
      // Themed is the emotion's text colour, theme 600: the bar's own fill.
      expect(progress).toHaveAttribute("data-tone", "themed");
      expect(
        progress.style.getPropertyValue("--kozmos-progress-ring-tone"),
      ).toBe("var(--semantics-emotion-themed-text)");
      for (const tone of [
        "neutral",
        "success",
        "danger",
        "informative",
        "alert",
      ] as const) {
        rerender(
          <Progress
            shape="circular"
            value={3}
            max={4}
            aria-label="Levels"
            tone={tone}
            style={{ marginInline: 8 }}
          />,
        );
        expect(progress).toHaveAttribute("data-tone", tone);
        expect(
          progress.style.getPropertyValue("--kozmos-progress-ring-tone"),
        ).toBe(`var(--semantics-emotion-${tone}-text)`);
        // The caller's own style is kept beside it.
        expect(progress.style.marginInline).toBe("8px");
      }
      rerender(
        <Progress
          shape="circular"
          value={3}
          aria-label="Levels"
          // A tone it does not know is the default one.
          tone={"warning" as never}
        />,
      );
      expect(progress).toHaveAttribute("data-tone", "themed");
    });

    it("draws its label beside the ring, still said once by reference", () => {
      render(
        <Progress
          shape="circular"
          value={2}
          max={6}
          labelPlacement="end"
          label="2 Levels Added in total"
        />,
      );
      const progress = screen.getByRole("progressbar", {
        name: "2 Levels Added in total",
      });
      const label = screen.getByText("2 Levels Added in total");
      expect(progress).toHaveAttribute("data-label-placement", "end");
      // After the dial, inside the progress bar: beside it, not in its hole.
      const dial = progress.querySelector(".kozmos-progress-ring-dial")!;
      expect(dial).not.toContainElement(label);
      expect(progress.lastElementChild).toBe(label);
      expect(dial.nextElementSibling).toBe(label);
      expect(progress).toHaveAttribute("aria-labelledby", label.id);
      expect(label).toHaveAttribute("aria-hidden", "true");
    });

    it("draws its label in the hole by default", () => {
      render(<Progress shape="circular" value={2} max={6} label="2 of 6" />);
      const progress = screen.getByRole("progressbar", { name: "2 of 6" });
      expect(progress).toHaveAttribute("data-label-placement", "center");
      expect(
        progress.querySelector(".kozmos-progress-ring-dial"),
      ).toContainElement(screen.getByText("2 of 6"));
    });

    it("draws the track alone while the value is unknown", () => {
      render(<Progress shape="circular" value={null} aria-label="Levels" />);
      const progress = screen.getByRole("progressbar");
      expect(progress).toHaveAttribute("data-state", "indeterminate");
      expect(progress).not.toHaveAttribute("aria-valuenow");
      expect(progress.querySelectorAll("circle")).toHaveLength(1);
    });

    // "16 of 15 levels": all of them, as SwiftUI's and Compose's rings have
    // it, and as `<progress>` does. Radix would call it unknown and draw the
    // track alone, as if none were done.
    it("draws a value over the total as a full ring", () => {
      render(
        <Progress
          shape="circular"
          value={16}
          max={15}
          aria-label="Levels"
          getValueLabel={(value, max) => `${value} of ${max}`}
        />,
      );
      const progress = screen.getByRole("progressbar", { name: "Levels" });
      expect(progress).toHaveAttribute("data-state", "complete");
      expect(progress).toHaveAttribute("aria-valuenow", "15");
      expect(progress).toHaveAttribute("aria-valuetext", "15 of 15");
      const { arc } = ring(progress);
      const [drawn, gap] = arc.getAttribute("stroke-dasharray")!.split(" ");
      expect(Number(drawn)).toBeCloseTo(Number(gap));
    });

    it("leaves a value that is not a number unknown, the track alone", () => {
      render(
        <Progress shape="circular" value={Infinity} aria-label="Levels" />,
      );
      const progress = screen.getByRole("progressbar", { name: "Levels" });
      expect(progress).toHaveAttribute("data-state", "indeterminate");
      expect(ring(progress).arc).toBeUndefined();
    });

    // Owner, 2 Nov: "100%" is 31.8 wide at 12, in a 28.28 square; "99%" fits.
    // So at `sm` a whole ring with no label of the product's draws a check.
    describe("a small ring at complete", () => {
      const mark = (progress: HTMLElement) =>
        progress.querySelector(".kozmos-progress-ring-done");

      it("draws a check in the hole, and still says 100%", () => {
        render(<Progress shape="circular" size="sm" value={100} />);
        const progress = screen.getByRole("progressbar", { name: "100%" });
        expect(progress).toHaveAttribute("aria-valuenow", "100");
        expect(progress).toHaveAttribute("aria-valuetext", "100%");
        expect(progress).toHaveAttribute("data-state", "complete");
        const check = mark(progress);
        expect(check).toBeInTheDocument();
        expect(check?.parentElement).toHaveClass("kozmos-progress-ring-dial");
        expect(check).toHaveAttribute("aria-hidden", "true");
        expect(check).toHaveAttribute("focusable", "false");
        expect(check).toHaveAttribute("width", "24");
        expect(check).toHaveAttribute("height", "24");
        expect(check).toHaveAttribute("stroke", "currentColor");
        expect(
          progress.querySelector(".kozmos-progress-ring-label"),
        ).toBeNull();
      });

      it("counts a value over the total as complete", () => {
        render(<Progress shape="circular" size="sm" value={16} max={15} />);
        const progress = screen.getByRole("progressbar", { name: "100%" });
        expect(progress).toHaveAttribute("aria-valuenow", "15");
        expect(progress).toHaveAttribute("aria-valuetext", "100%");
        expect(mark(progress)).toBeInTheDocument();
      });

      it("keeps the name and the value the product gave it", () => {
        render(
          <Progress
            shape="circular"
            size="sm"
            value={15}
            max={15}
            aria-label="Levels"
            getValueLabel={(value, max) => `${value} of ${max}`}
          />,
        );
        const progress = screen.getByRole("progressbar", { name: "Levels" });
        expect(progress).toHaveAttribute("aria-valuetext", "15 of 15");
        expect(mark(progress)).toBeInTheDocument();
      });

      it("keeps a name given by reference", () => {
        render(
          <>
            <span id="own">Levels</span>
            <Progress
              shape="circular"
              size="sm"
              value={100}
              aria-labelledby="own"
            />
          </>,
        );
        expect(
          mark(screen.getByRole("progressbar", { name: "Levels" })),
        ).toBeInTheDocument();
      });

      it("gives way to the product's own label, in the hole or beside it", () => {
        const { rerender } = render(
          <Progress shape="circular" size="sm" value={100} label="Done" />,
        );
        const progress = screen.getByRole("progressbar", { name: "Done" });
        expect(mark(progress)).toBeNull();
        rerender(
          <Progress
            shape="circular"
            size="sm"
            value={100}
            label="Done"
            labelPlacement="end"
          />,
        );
        expect(mark(progress)).toBeNull();
        rerender(
          <Progress shape="circular" size="sm" value={100} label="100%" />,
        );
        expect(mark(progress)).toBeNull();
        expect(progress).toHaveTextContent("100%");
      });

      it("draws no check short of complete, at another size, or while unknown", () => {
        const { rerender } = render(
          <Progress shape="circular" size="sm" value={99} aria-label="Ring" />,
        );
        const progress = screen.getByRole("progressbar", { name: "Ring" });
        expect(mark(progress)).toBeNull();
        rerender(
          <Progress shape="circular" size="md" value={100} aria-label="Ring" />,
        );
        expect(mark(progress)).toBeNull();
        rerender(
          <Progress shape="circular" size="lg" value={100} aria-label="Ring" />,
        );
        expect(mark(progress)).toBeNull();
        rerender(
          <Progress
            shape="circular"
            size="sm"
            value={null}
            aria-label="Ring"
          />,
        );
        expect(mark(progress)).toBeNull();
        rerender(
          <Progress
            shape="circular"
            size="sm"
            value={Number.NaN}
            aria-label="Ring"
          />,
        );
        expect(mark(progress)).toBeNull();
      });

      it("names no unnamed ring short of the check", () => {
        render(<Progress shape="circular" size="md" value={100} />);
        expect(screen.getByRole("progressbar")).not.toHaveAttribute(
          "aria-label",
        );
      });

      it("leaves a bar as it was", () => {
        render(<Progress size="sm" value={100} aria-label="Bar" />);
        const progress = screen.getByRole("progressbar", { name: "Bar" });
        expect(mark(progress)).toBeNull();
        expect(progress.querySelector("svg")).toBeNull();
      });
    });

    it("leaves the bar as it was: no ring, no label", () => {
      render(
        <Progress
          value={50}
          aria-label="Download"
          size="lg"
          label="Never drawn"
          labelPlacement="end"
          tone="danger"
        />,
      );
      const progress = screen.getByRole("progressbar", { name: "Download" });
      expect(progress.querySelector("svg")).toBeNull();
      expect(screen.queryByText("Never drawn")).toBeNull();
      expect(progress).not.toHaveAttribute("data-shape");
      expect(progress).not.toHaveAttribute("size");
      expect(progress).not.toHaveAttribute("label");
      expect(progress).not.toHaveAttribute("tone");
      expect(progress).not.toHaveAttribute("labelplacement");
      expect(progress.firstElementChild).toHaveStyle({ width: "50%" });
    });
  });

  // GAP-159: the bar with no value moves, stops under reduced motion (the
  // stylesheet's), is said once, and can be the page's top loading bar.
  describe("indeterminate", () => {
    it("draws a sweeping segment, not an empty track", () => {
      render(<Progress />);
      const progress = screen.getByRole("progressbar", { name: "Loading" });
      expect(progress).toHaveAttribute("data-state", "indeterminate");
      expect(progress).not.toHaveAttribute("aria-valuenow");
      const segment = progress.firstElementChild!;
      expect(segment).toHaveClass("kozmos-progress-sweep");
      // No width of a value: the stylesheet draws a quarter of the track.
      expect(segment.getAttribute("style") ?? "").not.toMatch(/width/);
    });

    it("says its words once, in a status mounted before them", () => {
      // The first markup holds the status empty, so the words arriving in
      // it are a change a screen reader announces (GAP-226).
      const html = renderToStaticMarkup(<Progress />);
      expect(html).toMatch(
        /<span[^>]*role="status"[^>]*aria-live="polite"[^>]*><\/span>/,
      );
      const { rerender } = render(<Progress />);
      const status = screen.getByRole("status");
      expect(status).toHaveTextContent(/^Loading$/);
      const words = status.firstChild;
      // Re-rendering while the wait lasts does not say it again.
      rerender(<Progress />);
      expect(screen.getByRole("status").firstChild).toBe(words);
      // A value ends the wait, and the status goes.
      rerender(<Progress value={40} aria-label="Upload" />);
      expect(screen.queryByRole("status")).toBeNull();
      expect(
        screen.getByRole("progressbar", { name: "Upload" }).firstElementChild,
      ).toHaveStyle({ width: "40%" });
    });

    it("takes its words from label, and keeps a name it is given", () => {
      const { rerender } = render(<Progress label="Loading the map" />);
      expect(
        screen.getByRole("progressbar", { name: "Loading the map" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Loading the map");
      rerender(<Progress aria-label="Map" label="Loading the map" />);
      expect(
        screen.getByRole("progressbar", { name: "Map" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Loading the map");
    });

    it("sits at the top of the page with placement top", () => {
      const { rerender } = render(<Progress placement="top" />);
      const progress = screen.getByRole("progressbar");
      expect(progress).toHaveAttribute("data-placement", "top");
      expect(progress).toHaveClass("kozmos-progress-top");
      expect(progress).not.toHaveClass("h-2");
      expect(progress).not.toHaveClass("rounded-pill");
      rerender(<Progress />);
      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "data-placement",
        "inline",
      );
      expect(screen.getByRole("progressbar")).toHaveClass(
        "h-2",
        "rounded-pill",
      );
    });

    it("places a ring nowhere but in the flow", () => {
      render(
        <Progress
          shape="circular"
          placement="top"
          value={5}
          aria-label="Ring"
        />,
      );
      const progress = screen.getByRole("progressbar", { name: "Ring" });
      expect(progress).not.toHaveClass("kozmos-progress-top");
      expect(progress).not.toHaveAttribute("placement");
    });
  });
});
