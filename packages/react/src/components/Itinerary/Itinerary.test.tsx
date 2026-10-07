import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Itinerary, type ItineraryStep } from "./Itinerary";

const steps: ItineraryStep[] = [
  {
    id: "1",
    instruction: "Take Elevator down to First Floor",
    type: "straight",
  },
  {
    id: "2",
    instruction: "Take Corridor to Garage B",
    type: "straight",
    current: true,
  },
  { id: "3", instruction: "Destination", type: "destination" },
];

describe("Itinerary", () => {
  it("does not arbitrarily emphasize a step when more than one is current", () => {
    render(
      <Itinerary
        origin="A"
        destination="B"
        steps={steps.map((step) => ({ ...step, current: true }))}
      />,
    );
    expect(
      screen
        .getAllByRole("listitem")
        .some((item) => item.hasAttribute("aria-current")),
    ).toBe(false);
  });
  it("renders optional step metrics without inventing missing values or dropping language", () => {
    const metricSteps = [
      {
        id: "a",
        type: "left" as const,
        instruction: [{ text: "Gauche", lang: "fr" }],
        duration: "0 min",
      },
      {
        id: "b",
        type: "right" as const,
        instruction: "Right",
        distance: "12 m",
      },
      {
        id: "c",
        type: "straight" as const,
        instruction: "Ahead",
        distance: "20 m",
        duration: "1 min",
      },
      {
        id: "d",
        type: "destination" as const,
        instruction: "There",
        distance: "",
        duration: "",
      },
    ];
    render(<Itinerary origin="A" steps={metricSteps} destination="B" />);
    expect(screen.getByText("0 min")).toBeInTheDocument();
    expect(screen.getByText("12 m")).toBeInTheDocument();
    expect(screen.getByText("20 m • 1 min")).toBeInTheDocument();
    expect(screen.getByText("Gauche")).toHaveAttribute("lang", "fr");
    expect(screen.getByText("There").closest("li")).toHaveTextContent(
      /^There$/,
    );
  });
  it("lists the origin, every step and the destination, in order", () => {
    render(
      <Itinerary
        origin="Dunkin'"
        steps={steps}
        destination="Airport Shuttles"
      />,
    );

    expect(
      screen.getByRole("region", { name: "Itinerary" }),
    ).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "FromDunkin'",
      "Take Elevator down to First Floor",
      "Take Corridor to Garage B",
      "Destination",
      "ToAirport Shuttles",
    ]);
  });

  it("marks the current step alone, and none when there is none", () => {
    const { rerender } = render(
      <Itinerary origin="A" steps={steps} destination="B" />,
    );
    const current = screen
      .getAllByRole("listitem")
      .filter((item) => item.getAttribute("aria-current") === "step");
    expect(current.map((item) => item.textContent)).toEqual([
      "Take Corridor to Garage B",
    ]);

    rerender(
      <Itinerary
        origin="A"
        steps={steps.map((step) => ({ ...step, current: false }))}
        destination="B"
      />,
    );
    expect(
      screen
        .getAllByRole("listitem")
        .some((item) => item.hasAttribute("aria-current")),
    ).toBe(false);
  });

  it("takes its own endpoint labels", () => {
    render(
      <Itinerary
        origin="A"
        steps={[]}
        destination="B"
        originLabel="Von"
        destinationLabel="Nach"
        label="Wegbeschreibung"
      />,
    );
    expect(
      screen.getByRole("region", { name: "Wegbeschreibung" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Von")).toBeInTheDocument();
    expect(screen.getByText("Nach")).toBeInTheDocument();
  });

  it("draws its captions and its origin muted through the class a glass surface turns to ink", () => {
    // Decision 48, on every glass surface: inside a glass manoeuvre card,
    // text that is muted elsewhere takes the foreground colour (measured
    // over a saturated map in check-adaptive-edge-cases.mjs). A
    // `text-muted-foreground` beside the class would outrank it. The
    // destination is emphasised, in the foreground colour already.
    render(
      <Itinerary
        origin="Harbour Coffee Co."
        steps={steps}
        destination="Gate 12"
      />,
    );
    for (const text of ["From", "Harbour Coffee Co.", "To"]) {
      const node = screen.getByText(text);
      expect(node.classList.contains("kozmos-muted-text")).toBe(true);
      expect(node.className).not.toMatch(/\btext-muted-foreground\b/);
    }
    expect(screen.getByText("Gate 12").className).toMatch(
      /\bkozmos-guidance-text\b/,
    );
  });

  // GAP-104. The Web SDK's route card has an action beside From and To; the
  // host passes a callback per endpoint, and only a passed one draws, so
  // ManoeuvreCard's list, which passes none, is unchanged.
  describe("endpoint actions", () => {
    it("draws an endpoint's action only when its callback is passed", () => {
      const { rerender } = render(
        <Itinerary origin="Dunkin'" steps={steps} destination="Gate 12" />,
      );
      expect(screen.queryAllByRole("button")).toEqual([]);

      rerender(
        <Itinerary
          origin="Dunkin'"
          steps={steps}
          destination="Gate 12"
          onEditDestination={() => {}}
        />,
      );
      const items = screen.getAllByRole("listitem");
      expect(screen.getAllByRole("button")).toHaveLength(1);
      expect(items[0].querySelector("button")).toBeNull();
      expect(items[items.length - 1].querySelector("button")).not.toBeNull();
    });

    it("names each action for its endpoint, its visible verb first, and calls that endpoint's callback", () => {
      const onEditOrigin = vi.fn();
      const onEditDestination = vi.fn();
      render(
        <Itinerary
          origin="Dunkin'"
          steps={steps}
          destination="Gate 12"
          onEditOrigin={onEditOrigin}
          onEditDestination={onEditDestination}
        />,
      );
      const origin = screen.getByRole("button", { name: "Change From" });
      const destination = screen.getByRole("button", {
        name: "Change To",
      });
      for (const button of [origin, destination]) {
        // Not a form's submit button where a host puts the list in a form.
        expect(button).toHaveAttribute("type", "button");
        expect(button).toHaveTextContent(/^Change$/);
        // WCAG 2.5.3: the name a speech user says is the one they see.
        expect(button.getAttribute("aria-label")).toMatch(/^Change\b/);
      }

      fireEvent.click(origin);
      expect(onEditOrigin).toHaveBeenCalledTimes(1);
      expect(onEditDestination).not.toHaveBeenCalled();
      fireEvent.click(destination);
      expect(onEditDestination).toHaveBeenCalledTimes(1);
      expect(onEditOrigin).toHaveBeenCalledTimes(1);
    });

    it("puts each action in its endpoint's row, after the place's name", () => {
      render(
        <Itinerary
          origin="Dunkin'"
          steps={steps}
          destination="Gate 12"
          onEditOrigin={() => {}}
          onEditDestination={() => {}}
        />,
      );
      const items = screen.getAllByRole("listitem");
      for (const [item, name, action] of [
        [items[0], "Dunkin'", "Change From"],
        [items[items.length - 1], "Gate 12", "Change To"],
      ] as const) {
        const button = screen.getByRole("button", { name: action });
        expect(item).toContainElement(button);
        expect(
          screen.getByText(name).compareDocumentPosition(button) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
        expect(item.lastElementChild).toBe(button);
      }
      // The steps between carry no action.
      for (const item of items.slice(1, -1))
        expect(item.querySelector("button")).toBeNull();
    });

    it("builds its default names from the words the product translates, in one language", () => {
      // A translated verb and captions, and no names: the names are the
      // visible verb and the row's own caption, never a built-in English word.
      render(
        <Itinerary
          origin="Dunkin'"
          steps={steps}
          destination="Gate 12"
          originLabel="Von"
          destinationLabel="Nach"
          onEditOrigin={() => {}}
          onEditDestination={() => {}}
          changeLabel="Bearbeiten"
        />,
      );
      expect(
        screen
          .getAllByRole("button")
          .map((button) => button.getAttribute("aria-label")),
      ).toEqual(["Bearbeiten Von", "Bearbeiten Nach"]);
    });

    it("takes the host's words, and builds the names from a changed verb", () => {
      const { rerender } = render(
        <Itinerary
          origin="A"
          steps={[]}
          destination="B"
          onEditOrigin={() => {}}
          onEditDestination={() => {}}
          changeLabel="Bearbeiten"
          editOriginLabel="Bearbeiten: Startpunkt"
          editDestinationLabel="Bearbeiten: Ziel"
        />,
      );
      expect(
        screen.getByRole("button", { name: "Bearbeiten: Startpunkt" }),
      ).toHaveTextContent(/^Bearbeiten$/);
      expect(
        screen.getByRole("button", { name: "Bearbeiten: Ziel" }),
      ).toHaveTextContent(/^Bearbeiten$/);

      // The SDK's own verb, with no names given: they follow the verb.
      rerender(
        <Itinerary
          origin="A"
          steps={[]}
          destination="B"
          onEditOrigin={() => {}}
          onEditDestination={() => {}}
          changeLabel="Edit"
        />,
      );
      expect(
        screen.getByRole("button", { name: "Edit From" }),
      ).toHaveTextContent(/^Edit$/);
      expect(screen.getByRole("button", { name: "Edit To" })).toHaveTextContent(
        /^Edit$/,
      );
    });
  });
});
