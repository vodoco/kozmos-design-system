import { render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { AlertTriangle, BluetoothOff, Check } from "@kozmos-ds/icons";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { MapStatusPill, type MapStatusPillProps } from "./MapStatusPill";

type Tone = NonNullable<MapStatusPillProps["tone"]>;
const TONES: Tone[] = ["neutral", "progress", "success", "danger", "warning"];

/** The drawn mark, if any: the part of the pill a screen reader never hears. */
function markOf(pill: HTMLElement) {
  return pill.querySelector<HTMLElement>(".kozmos-map-status-pill-mark");
}

describe("MapStatusPill", () => {
  it("is a polite status, and what it says is the product's words", () => {
    render(<MapStatusPill>Walking improves accuracy</MapStatusPill>);

    const pill = screen.getByRole("status");
    expect(pill.textContent).toBe("Walking improves accuracy");
    expect(pill).toHaveClass("kozmos-map-status-pill");
    expect(pill).toHaveAttribute("data-tone", "neutral");
  });

  it("draws the words alone when neutral, and the tone's own mark otherwise (decision 39)", () => {
    const own: Record<Exclude<Tone, "neutral" | "progress">, string> = {
      success: renderToStaticMarkup(<Check />),
      danger: renderToStaticMarkup(<AlertTriangle />),
      warning: renderToStaticMarkup(<AlertTriangle />),
    };
    for (const tone of TONES) {
      const { unmount } = render(
        <MapStatusPill tone={tone}>Established</MapStatusPill>,
      );
      const pill = screen.getByRole("status");
      expect(pill).toHaveAttribute("data-tone", tone);
      const mark = markOf(pill);
      if (tone === "neutral") {
        expect(mark, "a neutral pill drew a mark").toBeNull();
      } else if (tone === "progress") {
        // The system's arc, the one Spinner and a loading Button turn.
        expect(mark?.querySelector("svg")).toHaveClass("kozmos-spinner-arc");
      } else {
        expect(mark?.innerHTML, `the ${tone} mark`).toBe(own[tone]);
      }
      unmount();
    }
  });

  it("keeps its mark out of what is announced, the arc included", () => {
    render(
      <MapStatusPill tone="progress">
        Calculating step-free route
      </MapStatusPill>,
    );
    const pill = screen.getByRole("status");
    expect(markOf(pill)).toHaveAttribute("aria-hidden", "true");
    // The words say what is happening, so the arc is decorative: no second
    // status, and no "Loading" said over the product's words. Spinner would
    // bring both.
    expect(within(pill).queryByRole("status")).toBeNull();
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(pill.textContent).toBe("Calculating step-free route");
  });

  it("stops the arc wherever the system stops it: the one owned spin rule", () => {
    // Reduced motion (the media query, and the provider's `motion: reduced`)
    // stops `.kozmos-spinner-arc` in owned-components.css (GAP-50). The pill
    // turns that arc rather than an animation of its own, so it stops too.
    render(<MapStatusPill tone="progress">Updating Route</MapStatusPill>);
    const arc = markOf(screen.getByRole("status"))?.querySelector("svg");
    expect(arc).toHaveClass("kozmos-spinner-arc");
    expect(arc?.getAttribute("class")).not.toMatch(/animate-/);
  });

  it("takes the product's mark in place of the tone's, and draws none when told", () => {
    const { rerender } = render(
      <MapStatusPill icon={<BluetoothOff data-testid="mark" />} tone="danger">
        No Bluetooth
      </MapStatusPill>,
    );
    const pill = screen.getByRole("status");
    expect(within(pill).getByTestId("mark").parentElement).toBe(markOf(pill));
    expect(markOf(pill)?.innerHTML).not.toBe(
      renderToStaticMarkup(<AlertTriangle />),
    );

    rerender(
      <MapStatusPill icon={null} tone="success">
        Up-to-date
      </MapStatusPill>,
    );
    expect(markOf(screen.getByRole("status"))).toBeNull();
  });

  it("is as loud as the product asks: polite by default, an alert when assertive, silent when off", () => {
    const { rerender } = render(
      <MapStatusPill live="assertive" tone="danger">
        Wayfinding Unavailable
      </MapStatusPill>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Wayfinding Unavailable",
    );
    expect(screen.queryByRole("status")).toBeNull();

    rerender(
      <MapStatusPill live="off" tone="danger">
        Wayfinding Unavailable
      </MapStatusPill>,
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Wayfinding Unavailable")).toBeVisible();

    // A caller's own role still wins, as it does on Alert and Notice.
    rerender(<MapStatusPill role="log">Turn Back</MapStatusPill>);
    expect(screen.getByRole("log")).toHaveTextContent("Turn Back");
  });

  it("keeps its region while it has nothing to say, so its first words are read", () => {
    // A status that appears with its words already inside is not read by
    // every screen reader: NVDA reads a live region's changes, not its
    // arrival. Kept rendered with no words, the pill draws nothing, and the
    // same region then takes its first words.
    const { rerender } = render(<MapStatusPill tone="progress" />);
    const region = screen.getByRole("status");
    expect(region.textContent).toBe("");
    expect(region).not.toHaveClass("kozmos-map-status-pill");
    expect(markOf(region)).toBeNull();

    rerender(<MapStatusPill tone="progress">Preparing Content</MapStatusPill>);
    expect(screen.getByRole("status")).toBe(region);
    expect(region).toHaveClass("kozmos-map-status-pill");
    expect(region.textContent).toBe("Preparing Content");
  });

  it("has no axe violations in any tone", async () => {
    for (const tone of TONES) {
      const { container, unmount } = render(
        <MapStatusPill tone={tone}>
          Failed to Calculate Precise Position
        </MapStatusPill>,
      );
      expect(await axe(container), tone).toHaveNoViolations();
      unmount();
    }
  });
});
