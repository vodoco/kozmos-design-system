import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor } from "@storybook/test";
import { AdaptiveMapShell } from "../AdaptiveMapShell";
import { Button } from "../Button";
import { Itinerary, type ItineraryStep } from "../Itinerary";
import { ManoeuvreCard } from "./ManoeuvreCard";
import { RouteProgressRail } from "../RouteProgressRail";
import { RouteSummary } from "../RouteSummary";
import type { DirectionType } from "../DirectionStep/DirectionStep";

/** A route as the products present one: the engine's words, metres, seconds. */
const route = {
  origin: "Dunkin'",
  destination: "Airport Shuttles",
  steps: [
    {
      id: "1",
      instruction: "Follow the route to the elevator",
      type: "walking",
      metres: 58,
      seconds: 60,
      floor: "Second Floor",
    },
    {
      id: "2",
      instruction: "Take Corridor to Garage B",
      type: "transition",
      metres: 71,
      seconds: 70,
      floor: "First Floor",
    },
    {
      id: "3",
      instruction: "Take Walkway to Terminal B",
      type: "transition",
      metres: 40,
      seconds: 45,
      floor: "First Floor",
    },
    {
      id: "4",
      instruction: "Destination",
      type: "destination",
      metres: 32,
      seconds: 30,
      floor: "First Floor",
    },
  ] as const satisfies readonly {
    id: string;
    instruction: string;
    type: DirectionType;
    metres: number;
    seconds: number;
    floor: string;
  }[],
};

function minutes(seconds: number) {
  const value = Math.ceil(seconds / 60);
  return value <= 1 ? "1 min" : `${value} min`;
}

/**
 * The navigation screen: the manoeuvre card in the shell's top slot, opening
 * into the itinerary; the shell owns the summary's surface. The buttons below
 * the map simulate host updates and are explicitly not navigation UI.
 */
function NavigationExample() {
  const [index, setIndex] = React.useState(0);
  const [expanded, setExpanded] = React.useState(false);
  const [legFraction, setLegFraction] = React.useState(0);
  const [live, setLive] = React.useState(true);
  const [animate, setAnimate] = React.useState(true);
  const step = route.steps[index];
  const total = route.steps.reduce((sum, s) => sum + s.metres, 0);
  const rest = route.steps.slice(index);
  const remainingMetres = rest.reduce((sum, s) => sum + s.metres, 0);
  const remainingSeconds = rest.reduce((sum, s) => sum + s.seconds, 0);
  const legStart = (total - remainingMetres) / total;
  const legEnd = legStart + step.metres / total;
  const position = legStart + (legEnd - legStart) * legFraction;
  const transitions = route.steps.map((s, i) => ({
    id: s.id,
    position:
      route.steps.slice(0, i + 1).reduce((sum, part) => sum + part.metres, 0) /
      total,
    type: i === 0 ? ("lift-down" as const) : s.type,
    label: i === 0 ? "Elevator down to First Floor" : s.instruction,
  }));
  const steps: ItineraryStep[] = route.steps.map((s, i) => ({
    id: s.id,
    instruction: s.instruction,
    type: s.type,
    current: i === index,
  }));
  const last = index === route.steps.length - 1;
  return (
    <>
      <AdaptiveMapShell
        className="h-[720px]"
        mapLabel="Example map"
        map={<div className="h-full w-full bg-muted/40" />}
        panelLabel="Directions"
        panelPresentation="bottom"
        panelSizing="content"
        panelSurface="glass"
        topBar={
          <ManoeuvreCard
            type={step.type}
            instruction={step.instruction}
            detail={`${step.metres} m · ${step.floor}`}
            expanded={expanded}
            onToggle={() => setExpanded((open) => !open)}
          >
            <Itinerary
              origin={route.origin}
              steps={steps}
              destination={route.destination}
            />
          </ManoeuvreCard>
        }
        panel={
          <div className="flex flex-col gap-4 px-4 pb-4">
            <RouteSummary
              data-navigation-summary
              destination={route.destination}
              durationText={minutes(
                remainingSeconds - step.seconds * legFraction,
              )}
              distanceText={`${Math.round(remainingMetres - step.metres * legFraction)} m`}
              arrivalText="Arrive 12:58"
              onEndRoute={() => {
                setIndex(0);
                setLegFraction(0);
              }}
              progress={
                <RouteProgressRail
                  progress={position}
                  positionMode={live ? "live" : "static"}
                  motion={animate ? "directional" : "none"}
                  valueText={
                    live ? undefined : `Selected section: ${step.instruction}`
                  }
                  activeLeg={{ start: legStart, end: legEnd }}
                  activeWaypointId={step.id}
                  appearance="gradient"
                  waypoints={transitions}
                  type={step.type}
                  label={`Step ${index + 1} of ${route.steps.length}`}
                />
              }
            />
          </div>
        }
      />
      <div
        className="flex flex-col gap-3 p-4"
        role="group"
        aria-label="Fixture controls — not product navigation"
      >
        <p className="m-0 text-sm text-muted-foreground">
          Fixture controls — simulate distance along a leg and host-confirmed
          transitions, not live positioning.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            aria-pressed={live}
            onClick={() => setLive((value) => !value)}
          >
            Live position
          </Button>
          <Button
            variant="outline"
            aria-pressed={animate}
            onClick={() => setAnimate((value) => !value)}
          >
            Directional motion
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 max-w-full whitespace-normal"
            disabled={index === 0}
            onClick={() => {
              setIndex((i) => Math.max(i - 1, 0));
              setLegFraction(0);
            }}
          >
            Previous step
          </Button>
          <Button
            variant="outline"
            onClick={() => setLegFraction((value) => Math.min(1, value + 0.25))}
            disabled={legFraction === 1}
          >
            Advance within leg
          </Button>
          <Button
            type="button"
            className="h-auto min-h-11 max-w-full flex-1 whitespace-normal"
            onClick={() => {
              setIndex((i) => (last ? 0 : i + 1));
              setLegFraction(0);
            }}
          >
            {last ? "Finish" : "Next step"}
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * A route in the visitor's language, with the words each part is called by:
 * MAP-111's long instructions (GAP-094), each of which two lines cut short.
 */
interface PhoneRoute {
  lang: string;
  labels: {
    map: string;
    panel: string;
    manoeuvre: string;
    showItinerary: string;
    hideItinerary: string;
    itinerary: string;
    from: string;
    to: string;
    end: string;
  };
  origin: string;
  destination: string;
  /** The step under way, whose instruction the card shows. */
  current: number;
  /** Explicit distance snapshot for this fixture, never inferred from instruction count. */
  routeMetres: number;
  travelledMetres: number;
  legMetres: { start: number; end: number };
  detail: string;
  progress: string;
  duration: string;
  distance: string;
  arrival: string;
  steps: readonly { id: string; instruction: string; type: DirectionType }[];
}

/** US1-Escalator: two lines cut it at "…up to", before the level. */
const english: PhoneRoute = {
  lang: "en",
  labels: {
    map: "Map",
    panel: "Directions",
    manoeuvre: "Current manoeuvre",
    showItinerary: "Show itinerary",
    hideItinerary: "Hide itinerary",
    itinerary: "Itinerary",
    from: "From",
    to: "To",
    end: "End",
  },
  origin: "Main Entrance",
  destination: "Airport Shuttles",
  current: 1,
  routeMetres: 600,
  travelledMetres: 180,
  legMetres: { start: 120, end: 220 },
  detail: "40 m · Ground Floor",
  progress: "Step 2 of 5",
  duration: "6 min",
  distance: "420 m",
  arrival: "Arrive 12:58",
  steps: [
    { id: "1", instruction: "Go straight past the fountain", type: "straight" },
    {
      id: "2",
      instruction:
        "Take the escalator near Fountain Court up to Level 1, then keep to the right",
      type: "escalator-up",
    },
    {
      id: "3",
      instruction: "Turn right at Marlow Pharmacy",
      type: "right",
    },
    {
      id: "4",
      instruction: "Take the walkway to Terminal B",
      type: "transition",
    },
    { id: "5", instruction: "Destination", type: "destination" },
  ],
};

/**
 * US1-DE-Turn: two lines cut it at "…auf der linke", before the turn
 * itself, "rechts ab". Its list (US1-DE-List) is taller than the card's
 * cap, so the open card scrolls it (GAP-100).
 */
const german: PhoneRoute = {
  lang: "de",
  labels: {
    map: "Karte",
    panel: "Navigation",
    manoeuvre: "Aktuelles Manöver",
    showItinerary: "Wegbeschreibung zeigen",
    hideItinerary: "Wegbeschreibung ausblenden",
    itinerary: "Wegbeschreibung",
    from: "Von",
    to: "Nach",
    end: "Beenden",
  },
  origin: "Haupteingang",
  destination: "Flughafen-Shuttles",
  current: 2,
  routeMetres: 800,
  travelledMetres: 190,
  legMetres: { start: 150, end: 230 },
  detail: "40 m · Ebene 1",
  progress: "Schritt 3 von 9",
  duration: "9 Min.",
  distance: "610 m",
  arrival: "Ankunft 13:02",
  steps: [
    {
      id: "1",
      instruction: "Gehen Sie geradeaus am Brunnenhof vorbei",
      type: "straight",
    },
    {
      id: "2",
      instruction:
        "Nehmen Sie die Rolltreppe beim Brunnenhof nach oben zu Ebene 1",
      type: "escalator-up",
    },
    {
      id: "3",
      instruction:
        "Biegen Sie bei Marlow Apotheke auf der linken Seite rechts ab",
      type: "right",
    },
    {
      id: "4",
      instruction: "Gehen Sie durch den Verbindungsgang zum Terminal B",
      type: "transition",
    },
    {
      id: "5",
      instruction: "Biegen Sie hinter dem Informationsschalter links ab",
      type: "left",
    },
    {
      id: "6",
      instruction: "Nehmen Sie den Aufzug nach unten zur Ankunftsebene",
      type: "lift-down",
    },
    {
      id: "7",
      instruction: "Gehen Sie geradeaus bis zum Ausgang der Gepäckausgabe",
      type: "straight",
    },
    {
      id: "8",
      instruction: "Biegen Sie an der Wechselstube rechts ab",
      type: "right",
    },
    {
      id: "9",
      instruction: "Sie haben Ihr Ziel erreicht",
      type: "destination",
    },
  ],
};

/** US1-JA-Turn: the same escalator, three lines of Japanese at 390. */
const japanese: PhoneRoute = {
  lang: "ja",
  labels: {
    map: "地図",
    panel: "ナビゲーション",
    manoeuvre: "現在の案内",
    showItinerary: "経路を表示",
    hideItinerary: "経路を閉じる",
    itinerary: "経路",
    from: "出発",
    to: "到着",
    end: "終了",
  },
  origin: "正面入口",
  destination: "空港シャトル乗り場",
  current: 1,
  routeMetres: 600,
  travelledMetres: 180,
  legMetres: { start: 120, end: 220 },
  detail: "40 m · 1階",
  progress: "ステップ 2/4",
  duration: "6分",
  distance: "420 m",
  arrival: "12:58 到着",
  steps: [
    { id: "1", instruction: "噴水の前をまっすぐ進みます", type: "straight" },
    {
      id: "2",
      instruction:
        "ファウンテンコート近くのエスカレーターでレベル1へ上がり、右側を進んでください",
      type: "escalator-up",
    },
    {
      id: "3",
      instruction: "マーロウ薬局の角を右に曲がります",
      type: "right",
    },
    { id: "4", instruction: "目的地に到着しました", type: "destination" },
  ],
};

/**
 * The navigation screen on a 390 phone, in the visitor's language: the card
 * in the shell's top slot, grown to the whole instruction, over the
 * summary in the sheet.
 */
function PhoneNavigation({
  route: phone,
  initiallyExpanded = false,
}: {
  route: PhoneRoute;
  initiallyExpanded?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(initiallyExpanded);
  const step = phone.steps[phone.current];
  const { labels } = phone;
  return (
    <div lang={phone.lang}>
      <AdaptiveMapShell
        style={{ width: 390, height: 844, maxWidth: "100%" }}
        mapLabel={labels.map}
        map={<div className="h-full w-full bg-muted/40" />}
        panelLabel={labels.panel}
        panelPresentation="bottom"
        panelSizing="content"
        panelSurface="glass"
        topBar={
          <ManoeuvreCard
            type={step.type}
            instruction={step.instruction}
            detail={phone.detail}
            expanded={expanded}
            onToggle={() => setExpanded((open) => !open)}
            manoeuvreLabel={labels.manoeuvre}
            expandLabel={labels.showItinerary}
            collapseLabel={labels.hideItinerary}
            itineraryLabel={labels.itinerary}
          >
            <Itinerary
              origin={phone.origin}
              steps={phone.steps.map((s, i) => ({
                ...s,
                current: i === phone.current,
              }))}
              destination={phone.destination}
              originLabel={labels.from}
              destinationLabel={labels.to}
              label={labels.itinerary}
            />
          </ManoeuvreCard>
        }
        panel={
          <div className="px-4 pb-4">
            <RouteSummary
              data-navigation-summary
              destination={phone.destination}
              durationText={phone.duration}
              distanceText={phone.distance}
              arrivalText={phone.arrival}
              endLabel={labels.end}
              onEndRoute={() => setExpanded(false)}
              progress={
                <RouteProgressRail
                  progress={phone.travelledMetres / phone.routeMetres}
                  motion="directional"
                  activeLeg={{
                    start: phone.legMetres.start / phone.routeMetres,
                    end: phone.legMetres.end / phone.routeMetres,
                  }}
                  activeWaypointId={step.id}
                  appearance="gradient"
                  waypoints={[
                    {
                      id: step.id,
                      position: phone.legMetres.end / phone.routeMetres,
                      type: step.type,
                      label: step.instruction,
                    },
                    {
                      id: "destination",
                      position: 1,
                      type: "destination",
                      label: phone.destination,
                    },
                  ]}
                  type={step.type}
                  label={phone.progress}
                />
              }
            />
          </div>
        }
      />
    </div>
  );
}

const meta = {
  id: "examples-navigation",
  title: "Examples/Navigation/Guidance",
  component: NavigationExample,
  parameters: { layout: "fullscreen" },
  play: async ({ canvasElement }) => {
    // The shell now owns the first 16px. A consumer's former p-4 wrapper
    // must not double it; measure the real composition, not a class name.
    await waitFor(() => {
      const panel = canvasElement.querySelector("aside");
      const summary = canvasElement.querySelector("[data-navigation-summary]");
      expect(panel).not.toBeNull();
      expect(summary).not.toBeNull();
      const gap =
        summary!.getBoundingClientRect().top -
        panel!.getBoundingClientRect().top -
        panel!.clientTop;
      expect(Math.abs(gap - 16)).toBeLessThanOrEqual(1);
    });
  },
} satisfies Meta<typeof NavigationExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Directions: Story = {};

/** US1-Escalator on a 390 phone: the level, "Level 1", is on the card. */
export const PhoneEnglish: Story = {
  name: "Phone: the whole instruction, English",
  render: () => <PhoneNavigation route={english} />,
};

/** US1-DE-Turn on a 390 phone: the turn, "rechts ab", is on the card. */
export const PhoneGerman: Story = {
  name: "Phone: the whole instruction, German",
  render: () => <PhoneNavigation route={german} />,
};

/** US1-JA-Turn on a 390 phone: three lines of Japanese, all of them shown. */
export const PhoneJapanese: Story = {
  name: "Phone: the whole instruction, Japanese",
  render: () => <PhoneNavigation route={japanese} />,
};

/**
 * US1-DE-List on a 390 phone: the German itinerary is taller than the open
 * card's cap, so it scrolls in a group the keyboard reaches (GAP-100).
 */
export const PhoneGermanItinerary: Story = {
  name: "Phone: the German itinerary, scrolling",
  render: () => <PhoneNavigation route={german} initiallyExpanded />,
};
