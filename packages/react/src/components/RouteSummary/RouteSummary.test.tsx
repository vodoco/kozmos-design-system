import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteSummary } from "./RouteSummary";
import { AdaptiveMapShell } from "../AdaptiveMapShell";
import { Button } from "../Button";

describe("RouteSummary", () => {
  it("hosts navigation without another surface and omits unavailable metrics", () => {
    const { container } = render(
      <RouteSummary
        destination="Gate 3"
        presentation="hosted"
        onEndRoute={() => {}}
      />,
    );
    expect(container.firstChild).toHaveAttribute("data-presentation", "hosted");
    expect(container.firstChild).not.toHaveClass(
      "kozmos-surface-solid",
      "p-4",
      "shadow-overlay",
    );
    expect(container.querySelector("p")).toBeNull();
    expect(screen.getByRole("heading")).not.toHaveClass("line-clamp-2");
  });
  it("keeps supplied zero metrics and replaces failed destination media decoratively", () => {
    const { container } = render(
      <RouteSummary
        destination="Gate 3"
        durationText="0 min"
        destinationImage="/missing.png"
        onEndRoute={() => {}}
      />,
    );
    expect(screen.getByText("0 min")).toBeInTheDocument();
    const image = container.querySelector("img")!;
    expect(image).toHaveAttribute("alt", "");
    fireEvent.error(image);
    expect(container.querySelector("img")).toBeNull();
    expect(
      container.querySelector('[data-destination-media="fallback"]'),
    ).not.toBeNull();
  });
  describe("destination media", () => {
    afterEach(() => vi.restoreAllMocks());
    const media = (container: HTMLElement) =>
      container
        .querySelector("[data-destination-media]")
        ?.getAttribute("data-destination-media");

    it("falls back for an image that failed before the page hydrated", () => {
      // A server-rendered image can fail before React listens for its error.
      vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(
        true,
      );
      vi.spyOn(
        HTMLImageElement.prototype,
        "naturalWidth",
        "get",
      ).mockReturnValue(0);
      const { container } = render(
        <RouteSummary
          destination="Gate 3"
          destinationImage="/missing.png"
          onEndRoute={() => {}}
        />,
      );
      expect(media(container)).toBe("fallback");
    });

    it("tries a new image after an earlier one failed (it is keyed by its source)", () => {
      const { container, rerender } = render(
        <RouteSummary
          destination="Gate 3"
          destinationImage="/missing.png"
          onEndRoute={() => {}}
        />,
      );
      fireEvent.error(container.querySelector("img")!);
      expect(media(container)).toBe("fallback");
      rerender(
        <RouteSummary
          destination="Gate 4"
          destinationImage="/gate-4.png"
          onEndRoute={() => {}}
        />,
      );
      expect(media(container)).toBe("image");
      expect(container.querySelector("img")).toHaveAttribute(
        "src",
        "/gate-4.png",
      );
    });
  });
  it("renders active route details and ends the route", () => {
    const onEndRoute = vi.fn();

    render(
      <RouteSummary
        etaText="12 min"
        distanceText="1.8 km remaining"
        onEndRoute={onEndRoute}
      />,
    );

    expect(screen.getByText("12 min")).toBeInTheDocument();
    expect(screen.getByText("1.8 km remaining")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("End route"));
    expect(onEndRoute).toHaveBeenCalledTimes(1);
  });

  it("renders preview action when navigation can start", () => {
    const onStartNavigation = vi.fn();

    render(
      <RouteSummary
        etaText="18 min"
        distanceText="2 stops"
        state="preview"
        onEndRoute={vi.fn()}
        onStartNavigation={onStartNavigation}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /start navigation/i }));
    expect(onStartNavigation).toHaveBeenCalledTimes(1);
  });

  it("lays out navigation: the destination as the heading with End beside it, the stats, the progress", () => {
    const onEndRoute = vi.fn();
    render(
      <RouteSummary
        destination="Airport Shuttles"
        durationText="4 min"
        distanceText="201 m"
        arrivalText="Arrive 12:58"
        onEndRoute={onEndRoute}
        progress={<div data-testid="rail" />}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Airport Shuttles" }),
    ).toBeInTheDocument();
    expect(screen.getByText("4 min")).toBeInTheDocument();
    expect(screen.getByText("201 m")).toBeInTheDocument();
    expect(screen.getByText("Arrive 12:58")).toBeInTheDocument();
    expect(screen.getByTestId("rail")).toBeInTheDocument();
    // The estimate layout's icon button is not there; End is a labelled button.
    expect(screen.queryByLabelText("End route")).not.toBeInTheDocument();
    const end = screen.getByRole("button", { name: "End" });
    expect(end).toHaveClass("kozmos-button-outline");
    fireEvent.click(end);
    expect(onEndRoute).toHaveBeenCalledTimes(1);
  });

  it("is solid by default and glass on request, in both layouts", () => {
    const { container, rerender } = render(
      <RouteSummary
        destination="B"
        durationText="1 min"
        distanceText="32 m"
        onEndRoute={vi.fn()}
      />,
    );
    expect(container.firstChild).toHaveClass(
      "kozmos-reset",
      "kozmos-surface-solid",
    );
    rerender(
      <RouteSummary
        destination="B"
        durationText="1 min"
        distanceText="32 m"
        onEndRoute={vi.fn()}
        surface="glass"
      />,
    );
    expect(container.firstChild).toHaveClass("kozmos-surface-glass");
    rerender(
      <RouteSummary
        etaText="12 min"
        distanceText="1.8 km"
        onEndRoute={vi.fn()}
        surface="glass"
      />,
    );
    expect(container.firstChild).toHaveClass("kozmos-surface-glass");
  });

  it("takes its own End label", () => {
    render(
      <RouteSummary
        destination="B"
        durationText="1 min"
        distanceText="32 m"
        endLabel="Beenden"
        onEndRoute={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Beenden" })).toBeInTheDocument();
  });

  it("draws its distance muted through the class a glass surface turns to ink", () => {
    // Decision 48, on every glass surface: text that is muted elsewhere
    // takes the foreground colour on glass (measured over a saturated map
    // in check-adaptive-edge-cases.mjs). A `text-muted-foreground` beside
    // the class would outrank it.
    render(
      <RouteSummary
        etaText="4 min"
        distanceText="201 m"
        onEndRoute={vi.fn()}
        surface="glass"
      />,
    );
    const distance = screen.getByText("201 m");
    expect(distance.classList.contains("kozmos-muted-text")).toBe(true);
    expect(distance.className).not.toMatch(/\btext-muted-foreground\b/);
  });
  describe("presentation inside the map shell (decision 43)", () => {
    const summary = (presentation?: "standalone" | "hosted") => (
      <RouteSummary
        destination="Gate 3"
        presentation={presentation}
        onEndRoute={() => {}}
      />
    );
    const presentationOf = (container: HTMLElement) =>
      container
        .querySelector("[data-presentation]")
        ?.getAttribute("data-presentation");

    it("stands alone outside the shell", () => {
      const { container } = render(summary());
      expect(presentationOf(container)).toBe("standalone");
    });

    it("is hosted in the shell's panel without the product asking", () => {
      const { container } = render(
        <AdaptiveMapShell map={<div />} panel={summary()} />,
      );
      expect(presentationOf(container)).toBe("hosted");
      expect(container.querySelector("[data-presentation]")).not.toHaveClass(
        "shadow-overlay",
      );
    });

    it("keeps an explicit presentation in the shell", () => {
      const { container } = render(
        <AdaptiveMapShell map={<div />} panel={summary("standalone")} />,
      );
      expect(presentationOf(container)).toBe("standalone");
    });

    // The panel header sits on the panel's surface as its content does: a
    // summary there is hosted too, in a bottom sheet and in a side panel,
    // as SwiftUI and Compose host what either slot holds.
    it.each(["bottom", "side"] as const)(
      "is hosted in the %s panel's header without the product asking",
      (panelPresentation) => {
        const { container } = render(
          <AdaptiveMapShell
            map={<div />}
            panel={<div />}
            panelHeader={summary()}
            panelPresentation={panelPresentation}
          />,
        );
        expect(
          container.querySelector("[data-panel-presentation]"),
        ).toHaveAttribute("data-panel-presentation", panelPresentation);
        expect(
          container.querySelector(
            "[data-kozmos-panel-header] [data-presentation]",
          ),
        ).not.toBeNull();
        expect(presentationOf(container)).toBe("hosted");
        expect(container.querySelector("[data-presentation]")).not.toHaveClass(
          "shadow-overlay",
        );
      },
    );

    it("keeps an explicit presentation in the panel header", () => {
      const { container } = render(
        <AdaptiveMapShell
          map={<div />}
          panel={<div />}
          panelHeader={summary("standalone")}
        />,
      );
      expect(presentationOf(container)).toBe("standalone");
    });
  });
  describe("actions (GAP-110)", () => {
    // Previous and Next in static wayfinding, as the host draws them: Kozmos
    // Buttons that never submit a form, unavailable through aria-disabled.
    const steps = (
      <>
        <Button
          type="button"
          variant="outline"
          aria-disabled="true"
          onClick={() => {}}
        >
          Previous
        </Button>
        <Button type="button" onClick={() => {}}>
          Next
        </Button>
      </>
    );

    it("draws nothing after the progress without actions", () => {
      for (const actions of [undefined, null, false]) {
        const { container, unmount } = render(
          <RouteSummary
            destination="Gate 3"
            onEndRoute={() => {}}
            progress={<div data-testid="rail" />}
            actions={actions}
          />,
        );
        const root = container.firstElementChild!;
        expect(root.lastElementChild).toBe(screen.getByTestId("rail"));
        expect(
          container.querySelector(".kozmos-route-summary-actions"),
        ).toBeNull();
        expect(root).not.toHaveAttribute("actions");
        unmount();
      }
    });

    it("puts the actions after the progress, in reading order", () => {
      const { container } = render(
        <RouteSummary
          destination="Gate 3"
          onEndRoute={() => {}}
          progress={<div data-testid="rail" />}
          actions={steps}
        />,
      );
      const rail = screen.getByTestId("rail");
      const previous = screen.getByRole("button", { name: "Previous" });
      const next = screen.getByRole("button", { name: "Next" });
      const follows = (a: Node, b: Node) =>
        Boolean(
          a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING,
        );
      expect(follows(rail, previous)).toBe(true);
      expect(follows(previous, next)).toBe(true);
      // The row is the summary's last part, holding the host's two buttons.
      const row = container.firstElementChild!.lastElementChild!;
      expect(Array.from(row.children)).toEqual([previous, next]);
      expect(container.firstElementChild).not.toHaveAttribute("actions");
    });

    it("wraps the actions in the owned recipe, hosted and standalone", () => {
      const summary = (presentation?: "hosted" | "standalone") => (
        <RouteSummary
          destination="Gate 3"
          presentation={presentation}
          onEndRoute={() => {}}
          actions={steps}
        />
      );
      for (const [where, ui] of [
        ["hosted", summary("hosted")],
        ["standalone", summary("standalone")],
        [
          "in the shell's panel",
          <AdaptiveMapShell key="shell" map={<div />} panel={summary()} />,
        ],
      ] as const) {
        const { unmount } = render(ui);
        // The shell keeps its panel from assistive technology until it has
        // measured it, which jsdom never does.
        const button = (name: string) =>
          screen.getByRole("button", { name, hidden: true });
        const row = button("Next").parentElement!;
        // Owned, and only owned: a utility here would vanish in a host
        // without @scope, and the layout is the slot's promise.
        expect(row.className, where).toBe("kozmos-route-summary-actions");
        expect(
          row.closest("[data-presentation]")!.getAttribute("data-presentation"),
          where,
        ).toBe(where === "standalone" ? "standalone" : "hosted");
        // The host's buttons, as the host wrote them.
        expect(button("Previous"), where).toHaveAttribute(
          "aria-disabled",
          "true",
        );
        unmount();
      }
    });
  });

  describe("route preview (GAP-111)", () => {
    it("omits End when the navigation layout has no onEndRoute", () => {
      render(
        <RouteSummary
          destination="Tessel Shoes"
          durationText="3 min"
          distanceText="205 m"
          actions={
            <>
              <Button type="button">Go</Button>
              <Button type="button" variant="outline">
                Details
              </Button>
            </>
          }
        />,
      );
      expect(screen.queryByRole("button", { name: "End" })).toBeNull();
      expect(
        screen.getAllByRole("button").map((button) => button.textContent),
      ).toEqual(["Go", "Details"]);
    });

    it("keeps End for every existing navigation caller", () => {
      for (const presentation of [undefined, "hosted", "standalone"] as const)
        for (const progress of [undefined, <div key="rail" />]) {
          const onEndRoute = vi.fn();
          const { unmount } = render(
            <RouteSummary
              destination="Gate 3"
              presentation={presentation}
              onEndRoute={onEndRoute}
              progress={progress}
            />,
          );
          const end = screen.getByRole("button", { name: "End" });
          // Beside the destination, as before: the heading's row ends with it.
          expect(end.parentElement!.lastElementChild).toBe(end);
          expect(end.parentElement).toContainElement(
            screen.getByRole("heading"),
          );
          fireEvent.click(end);
          expect(onEndRoute).toHaveBeenCalledTimes(1);
          unmount();
        }
    });

    it("draws the location line under the destination", () => {
      const { container, rerender } = render(
        <RouteSummary
          destination="Tessel Shoes"
          locationText="Store · Level 1 · Harbour Point Mall"
          surface="glass"
        />,
      );
      const heading = screen.getByRole("heading", { name: "Tessel Shoes" });
      const location = screen.getByText("Store · Level 1 · Harbour Point Mall");
      // Its own line after the heading, not part of the heading's name.
      expect(location.tagName).toBe("P");
      expect(heading.nextElementSibling).toBe(location);
      // Muted, and on glass the foreground colour (decision 48).
      expect(location).toHaveClass("kozmos-muted-text");
      expect(location.className).not.toMatch(/\btext-muted-foreground\b/);
      expect(container.firstElementChild).not.toHaveAttribute("locationtext");
      // Without it the heading's row is as it was.
      rerender(
        <RouteSummary destination="Tessel Shoes" onEndRoute={vi.fn()} />,
      );
      expect(
        screen.getByRole("heading", { name: "Tessel Shoes" })
          .nextElementSibling,
      ).toBe(screen.getByRole("button", { name: "End" }));
    });
  });
});
