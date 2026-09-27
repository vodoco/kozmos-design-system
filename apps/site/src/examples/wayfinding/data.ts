/**
 * Routes through the venue explorer's shopping centre, made up from the map's
 * geometry: from the entrance to the atrium, up by escalator or lift when the
 * place is on another floor, a turn, and the arrival. A product gets these
 * from a routing service; the shapes are the SDK's.
 */
import type { DirectionType } from "@kozmos-ds/react";
import type { RouteOptionPresentation } from "@kozmos-ds/product-contracts";
import { floorLabel, floors, places, type Place } from "../venue-explorer/data";

export { floorLabel, floors, places, type Place };

export type Preference = "quickest" | "step-free";

export interface RouteStep {
  id: string;
  type: DirectionType;
  instruction: string;
  distanceMetres: number;
  floorId: string;
  /** Where the step ends, in percent of the illustrative map. */
  point: { x: number; y: number };
}

export interface PlannedRoute {
  option: RouteOptionPresentation;
  steps: readonly RouteStep[];
}

/** Fixed points of the building, in percent of the map: the same on every floor. */
export const entrance = { x: 50, y: 92 };
const atrium = { x: 50, y: 60 };
const escalators = { x: 62, y: 44 };
const lifts = { x: 36, y: 44 };

/** One percent of the map is about two metres of floor. */
const METRES_PER_PERCENT = 2;
const WALKING_METRES_PER_SECOND = 1.2;
const FLOOR_CHANGE_SECONDS = { quickest: 40, "step-free": 75 } as const;

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * METRES_PER_PERCENT);
}

function floorIndex(id: string) {
  return floors.length - 1 - floors.findIndex((floor) => floor.id === id);
}

/** The steps from the entrance to a place, by the quickest way or step-free. */
export function stepsTo(place: Place, preference: Preference): RouteStep[] {
  const ground = floors[floors.length - 1].id;
  // A place without a floor is on the level the route starts from: this
  // venue has levels, so the contracts' optional floor means "no change".
  const target = place.poi.floorId ?? ground;
  const levels = floorIndex(target) - floorIndex(ground);
  const steps: RouteStep[] = [
    {
      id: "atrium",
      type: "straight",
      instruction: "Head towards the atrium",
      distanceMetres: distance(entrance, atrium),
      floorId: ground,
      point: atrium,
    },
  ];
  let from = atrium;
  let floor = ground;
  if (levels > 0) {
    const via = preference === "quickest" ? escalators : lifts;
    const label = floorLabel(target).toLowerCase();
    steps.push({
      id: "approach",
      type: via === escalators ? "right" : "left",
      instruction:
        via === escalators
          ? "Turn right for the escalators"
          : "Turn left for the lifts",
      distanceMetres: distance(from, via),
      floorId: ground,
      point: via,
    });
    steps.push({
      id: "up",
      type: via === escalators ? "escalator-up" : "lift-up",
      instruction:
        via === escalators
          ? `Take the escalator${levels > 1 ? "s" : ""} to the ${label}`
          : `Take the lift to the ${label}`,
      distanceMetres: 0,
      floorId: target,
      point: via,
    });
    from = via;
    floor = target;
  }
  const turn: DirectionType = place.position.x < from.x ? "left" : "right";
  const midway = {
    x: (from.x + place.position.x) / 2,
    y: (from.y + place.position.y) / 2,
  };
  steps.push({
    id: "turn",
    type: turn,
    instruction: `Turn ${turn} towards ${place.poi.name}`,
    distanceMetres: distance(from, midway),
    floorId: floor,
    point: midway,
  });
  steps.push({
    id: "arrive",
    type: "destination",
    instruction: `${place.poi.name} is on your ${turn}`,
    distanceMetres: distance(midway, place.position),
    floorId: floor,
    point: place.position,
  });
  return steps;
}

/** How long some steps take on foot, with the floor changes they include. */
export function secondsFor(
  steps: readonly RouteStep[],
  preference: Preference,
) {
  const metres = steps.reduce((sum, step) => sum + step.distanceMetres, 0);
  const changes = steps.filter((step) => step.distanceMetres === 0).length;
  return Math.round(
    metres / WALKING_METRES_PER_SECOND +
      changes * FLOOR_CHANGE_SECONDS[preference],
  );
}

function minutes(total: number) {
  return `${Math.max(1, Math.round(total / 60))} min`;
}

/** The routes a place can be reached by, as the SDK presents them. */
export function routesTo(place: Place): PlannedRoute[] {
  const planned = (["quickest", "step-free"] as const).map((preference) => {
    const steps = stepsTo(place, preference);
    const total = secondsFor(steps, preference);
    const metres = steps.reduce((sum, step) => sum + step.distanceMetres, 0);
    return {
      option: {
        id: preference,
        label: preference === "quickest" ? "Quickest" : "Step-free",
        durationSeconds: total,
        durationLabel: minutes(total),
        distanceMetres: metres,
        distanceLabel: `${metres} m`,
        preference,
        selected: preference === "quickest",
        available: true,
      } satisfies RouteOptionPresentation,
      steps,
    };
  });
  const terrace = planned[0];
  return [
    ...planned,
    {
      option: {
        id: "terrace",
        label: "Via the terrace",
        durationSeconds: terrace.option.durationSeconds + 240,
        durationLabel: minutes(terrace.option.durationSeconds + 240),
        distanceMetres: terrace.option.distanceMetres + 180,
        distanceLabel: `${terrace.option.distanceMetres + 180} m`,
        preference: "custom",
        selected: false,
        available: false,
        warning: "The terrace is closed for the season.",
      },
      steps: terrace.steps,
    },
  ];
}

/** The time of day the route would end, from now. */
export function arrivalTime(durationSeconds: number, now = new Date()) {
  const arrival = new Date(now.getTime() + durationSeconds * 1000);
  return arrival.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Points along a route on one floor, for the dots that stand in for its line. */
export function dotsOn(steps: readonly RouteStep[], floorId: string) {
  const dots: { x: number; y: number }[] = [];
  let from = entrance;
  for (const step of steps) {
    if (step.floorId === floorId && step.distanceMetres > 0) {
      const count = Math.max(2, Math.round(step.distanceMetres / 8));
      for (let i = 1; i <= count; i++) {
        dots.push({
          x: from.x + ((step.point.x - from.x) * i) / count,
          y: from.y + ((step.point.y - from.y) * i) / count,
        });
      }
    }
    from = step.point;
  }
  return dots;
}

/** The compass heading from one point to the next, degrees clockwise from north. */
export function headingBetween(
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  return (
    (Math.round((Math.atan2(to.x - from.x, from.y - to.y) * 180) / Math.PI) +
      360) %
    360
  );
}
