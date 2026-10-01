import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Itinerary } from "../Itinerary";
import { ManoeuvreCard, manoeuvreDescription } from "./ManoeuvreCard";

describe("ManoeuvreCard", () => {
  it("reads the instruction then the detail, and nothing for an absent detail", () => {
    expect(manoeuvreDescription("Turn left", "58 m · 1 min")).toBe(
      "Turn left, 58 m · 1 min",
    );
    expect(manoeuvreDescription("Turn left")).toBe("Turn left");
    expect(manoeuvreDescription("Turn left", "")).toBe("Turn left");
  });

  it("closed, is the manoeuvre as one button that opens the itinerary, with the grab bar silent", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <ManoeuvreCard
        type="left"
        instruction="Turn left"
        detail="58 m · 1 min"
        expanded={false}
        onToggle={onToggle}
      >
        <p>FROM Dunkin</p>
      </ManoeuvreCard>,
    );

    expect(
      screen.getByRole("region", { name: "Current manoeuvre" }),
    ).toBeInTheDocument();
    const manoeuvre = screen.getByRole("button", {
      name: "Turn left, 58 m · 1 min",
    });
    expect(manoeuvre).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("FROM Dunkin")).not.toBeInTheDocument();
    // The instruction row already offers the way in; the bar says nothing.
    const bar = container.querySelector('[aria-label="Show itinerary"]');
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(bar).toHaveAttribute("tabindex", "-1");

    fireEvent.click(manoeuvre);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("open, shows the itinerary instead of the manoeuvre and the grab bar closes it", () => {
    const onToggle = vi.fn();
    render(
      <ManoeuvreCard
        type="left"
        instruction="Turn left"
        detail="58 m"
        expanded
        onToggle={onToggle}
        maxItineraryHeight={240}
      >
        <p>FROM Dunkin</p>
      </ManoeuvreCard>,
    );

    // No name of its own: the itinerary inside is the named thing.
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.getByText("FROM Dunkin")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Turn left/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("FROM Dunkin").parentElement).toHaveStyle({
      maxHeight: "240px",
    });

    const bar = screen.getByRole("button", { name: "Hide itinerary" });
    expect(bar).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(bar);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("is solid by default and glass on request", () => {
    const { rerender } = render(
      <ManoeuvreCard
        type="left"
        instruction="Turn left"
        expanded={false}
        onToggle={() => {}}
      />,
    );
    const card = screen.getByRole("region", { name: "Current manoeuvre" });
    expect(card).toHaveClass("kozmos-reset", "kozmos-surface-solid");
    rerender(
      <ManoeuvreCard
        type="left"
        instruction="Turn left"
        expanded={false}
        onToggle={() => {}}
        surface="glass"
      />,
    );
    expect(card).toHaveClass("kozmos-surface-glass");
    expect(card).not.toHaveClass("kozmos-surface-solid");
  });

  it("takes its own labels", () => {
    render(
      <ManoeuvreCard
        type="right"
        instruction="Rechts"
        expanded={false}
        onToggle={() => {}}
        manoeuvreLabel="Aktuelles Manöver"
        expandLabel="Route zeigen"
      >
        <p />
      </ManoeuvreCard>,
    );
    expect(
      screen.getByRole("region", { name: "Aktuelles Manöver" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechts" })).toBeInTheDocument();
  });

  it("draws its detail muted through the class a glass surface turns to ink", () => {
    // Decision 48, on every glass surface: text that is muted elsewhere
    // takes the foreground colour on glass (owned CSS reads the glass
    // surface's --kozmos-surface-muted-foreground; measured over a
    // saturated map in check-adaptive-edge-cases.mjs). A
    // `text-muted-foreground` beside the class would outrank it.
    render(
      <ManoeuvreCard
        type="left"
        instruction="Turn left"
        detail="58 m · 1 min"
        expanded={false}
        onToggle={() => undefined}
        surface="glass"
      />,
    );
    const detail = screen.getByText("58 m · 1 min");
    expect(detail.classList.contains("kozmos-muted-text")).toBe(true);
    expect(detail.className).not.toMatch(/\btext-muted-foreground\b/);
  });
});

// MAP-111's instructions, from the register's rows: two lines cut each of
// them short of what it asks (GAP-094).
const escalator = "Take the escalator near Fountain Court up to Level 1";
const escalatorName = `${escalator}, 40 m`;
const route = [
  {
    id: "1",
    instruction: escalator,
    type: "escalator-up" as const,
    current: true,
  },
  {
    id: "2",
    instruction: "Turn right at Marlow Pharmacy",
    type: "right" as const,
  },
  { id: "3", instruction: "Destination", type: "destination" as const },
];

describe("ManoeuvreCard: the whole instruction (GAP-094)", () => {
  it("shows the whole instruction by default, cut at no line", () => {
    render(
      <ManoeuvreCard
        type="escalator-up"
        instruction={escalator}
        detail="40 m"
        expanded={false}
        onToggle={() => {}}
      />,
    );
    const text = screen.getByText(escalator);
    expect(text.className).not.toMatch(/line-clamp/);
    expect(text).not.toHaveAttribute("data-lines");
    expect(
      text.style.getPropertyValue("--kozmos-manoeuvre-instruction-lines"),
    ).toBe("");
  });

  it("cuts the instruction at `instructionLines` when a product asks, and still reads it whole", () => {
    render(
      <ManoeuvreCard
        type="escalator-up"
        instruction={escalator}
        detail="40 m"
        instructionLines={2}
        expanded={false}
        onToggle={() => {}}
      />,
    );
    const text = screen.getByText(escalator);
    expect(text).toHaveAttribute("data-lines", "2");
    expect(
      text.style.getPropertyValue("--kozmos-manoeuvre-instruction-lines"),
    ).toBe("2");
    // What is cut is only what is drawn: the name is the whole instruction.
    expect(
      screen.getByRole("button", { name: escalatorName }),
    ).toBeInTheDocument();
  });

  it("shows the whole instruction for a limit that is not a whole line or more", () => {
    for (const instructionLines of [0, -1, Number.NaN, Infinity]) {
      const { unmount } = render(
        <ManoeuvreCard
          type="escalator-up"
          instruction={escalator}
          instructionLines={instructionLines}
          expanded={false}
          onToggle={() => {}}
        />,
      );
      expect(screen.getByText(escalator)).not.toHaveAttribute("data-lines");
      expect(screen.getByText(escalator).className).not.toMatch(/line-clamp/);
      unmount();
    }
    // A fraction of a line is the whole lines below it.
    render(
      <ManoeuvreCard
        type="escalator-up"
        instruction={escalator}
        instructionLines={2.5}
        expanded={false}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText(escalator)).toHaveAttribute("data-lines", "2");
  });
});

describe("ManoeuvreCard: the itinerary the keyboard can scroll (GAP-100)", () => {
  it("open, scrolls the itinerary in a group named after it, which takes focus", () => {
    render(
      <ManoeuvreCard
        type="escalator-up"
        instruction={escalator}
        expanded
        onToggle={() => {}}
        maxItineraryHeight={240}
      >
        <Itinerary
          origin="Dunkin'"
          steps={route}
          destination="Airport Shuttles"
        />
      </ManoeuvreCard>,
    );
    // axe's scrollable-region-focusable: the box that scrolls is one the
    // keyboard can reach, and a focused box says what it is.
    const scroller = screen.queryByRole("group", { name: "Itinerary" });
    expect(scroller).not.toBeNull();
    expect(scroller).toHaveAttribute("tabindex", "0");
    expect(scroller).toHaveStyle({ maxHeight: "240px" });
    expect(scroller).toContainElement(
      screen.getByRole("region", { name: "Itinerary" }),
    );
    // A group, not a second landmark: the itinerary inside is the landmark.
    expect(screen.getAllByRole("region")).toHaveLength(1);
  });

  it("takes the product's name for the itinerary it scrolls", () => {
    render(
      <ManoeuvreCard
        type="right"
        instruction="Biegen Sie bei Marlow Apotheke auf der linken Seite rechts ab"
        expanded
        onToggle={() => {}}
        itineraryLabel="Wegbeschreibung"
      >
        <Itinerary
          origin="Dunkin'"
          steps={route}
          destination="Airport Shuttles"
          label="Wegbeschreibung"
        />
      </ManoeuvreCard>,
    );
    expect(
      screen.queryByRole("group", { name: "Wegbeschreibung" }),
    ).not.toBeNull();
  });
});

/** A product's navigation screen: it owns `expanded`, and has a control of its own. */
function Navigation({ initiallyExpanded = false }) {
  const [expanded, setExpanded] = React.useState(initiallyExpanded);
  return (
    <>
      <button type="button">Next step</button>
      <ManoeuvreCard
        type="escalator-up"
        instruction={escalator}
        detail="40 m"
        expanded={expanded}
        onToggle={() => setExpanded((open) => !open)}
      >
        <Itinerary
          origin="Dunkin'"
          steps={route}
          destination="Airport Shuttles"
        />
      </ManoeuvreCard>
    </>
  );
}

const focused = () => document.activeElement as HTMLElement;
const instructionButton = () =>
  screen.getByRole("button", { name: escalatorName });
const itineraryGroup = () => screen.getByRole("group", { name: "Itinerary" });
const hideBar = () => screen.getByRole("button", { name: "Hide itinerary" });
const nextStep = () => screen.getByRole("button", { name: "Next step" });

/**
 * Focus is on something a keyboard and a screen reader can both use: not
 * dropped to the page, not inside anything hidden from assistive
 * technology, and not on something Tab would never reach.
 */
function expectSoundFocus() {
  const active = focused();
  expect(active).not.toBe(document.body);
  expect(active.closest('[aria-hidden="true"]')).toBeNull();
  expect(active.tabIndex).toBeGreaterThanOrEqual(0);
}

describe("ManoeuvreCard: focus through the disclosure (review T4)", () => {
  it("opening from the keyboard takes focus from the instruction to the itinerary it shows", async () => {
    const user = userEvent.setup();
    render(<Navigation />);
    instructionButton().focus();

    await user.keyboard("{Enter}");

    // The button that had focus is gone; focus went down with it to the page.
    expect(focused()).not.toBe(document.body);
    expect(focused()).toBe(itineraryGroup());
    expectSoundFocus();
  });

  it("closing from the grab bar puts focus back on the instruction, never on the bar it hides", async () => {
    const user = userEvent.setup();
    render(<Navigation initiallyExpanded />);
    hideBar().focus();

    await user.keyboard("{Enter}");

    // Closed, the bar is hidden from assistive technology and out of the
    // tab order: focus must not stay on it.
    expect(focused().getAttribute("aria-hidden")).not.toBe("true");
    expect(focused()).toBe(instructionButton());
    expectSoundFocus();
  });

  it("keeps focus sound through repeated keyboard cycles, by Enter and by Space", async () => {
    const user = userEvent.setup();
    render(<Navigation />);
    await user.tab();
    expect(focused()).toBe(nextStep());
    await user.tab();
    expect(focused()).toBe(instructionButton());

    for (const key of ["{Enter}", " ", "{Enter}"]) {
      await user.keyboard(key);
      expectSoundFocus();
      expect(focused()).toBe(itineraryGroup());
      await user.tab();
      expect(focused()).toBe(hideBar());
      await user.keyboard(key);
      expectSoundFocus();
      expect(focused()).toBe(instructionButton());
    }
    // Closed, the bar is never a stop: Tab leaves the card from the
    // instruction, and Shift+Tab comes back to it.
    await user.tab();
    expect(focused()).toBe(document.body);
    await user.tab({ shift: true });
    expect(focused()).toBe(instructionButton());
  });

  it("an outside change to `expanded` moves focus only when it was in the part that changed", () => {
    const card = (expanded: boolean) => (
      <>
        <button type="button">Next step</button>
        <ManoeuvreCard
          type="escalator-up"
          instruction={escalator}
          detail="40 m"
          expanded={expanded}
          onToggle={() => {}}
        >
          <Itinerary
            origin="Dunkin'"
            steps={route}
            destination="Airport Shuttles"
          />
        </ManoeuvreCard>
      </>
    );
    const { rerender } = render(card(false));

    // Focus on the product's own control: the card opens and closes under
    // it and leaves it there.
    nextStep().focus();
    rerender(card(true));
    expect(focused()).toBe(nextStep());
    rerender(card(false));
    expect(focused()).toBe(nextStep());

    // Focus on the instruction as the product opens the card: the
    // itinerary takes it, rather than the page.
    instructionButton().focus();
    rerender(card(true));
    expect(focused()).not.toBe(document.body);
    expect(focused()).toBe(itineraryGroup());

    // Focus in the itinerary as the product closes the card: the
    // instruction takes it back.
    rerender(card(false));
    expect(focused()).toBe(instructionButton());
    expectSoundFocus();
  });

  it("follows a pointer that takes focus, and leaves alone focus a pointer did not take", async () => {
    const user = userEvent.setup();
    render(<Navigation />);

    // A press that focuses what it presses, as Chromium's does: focus
    // follows into the itinerary, and back to the instruction.
    await user.click(instructionButton());
    expect(focused()).not.toBe(document.body);
    expect(focused()).toBe(itineraryGroup());
    await user.click(hideBar());
    expect(focused()).toBe(instructionButton());
    expectSoundFocus();

    // A press that leaves focus where it was, as WebKit's and Firefox's on
    // macOS do: the card opens and closes, and focus stays put.
    nextStep().focus();
    fireEvent.click(instructionButton());
    expect(focused()).toBe(nextStep());
    fireEvent.click(hideBar());
    expect(focused()).toBe(nextStep());
  });

  it("never lets the closed, silent grab bar take focus from a pointer", async () => {
    const user = userEvent.setup();
    const { container } = render(<Navigation />);
    nextStep().focus();
    const closedBar = container.querySelector<HTMLElement>(
      '[aria-label="Show itinerary"]',
    )!;

    await user.click(closedBar);

    // It still opens the card, but focus was never on it: pressed while
    // hidden from assistive technology, it would have held focus nobody
    // can hear.
    expect(hideBar()).toBe(closedBar);
    expect(focused()).toBe(nextStep());
  });
});
