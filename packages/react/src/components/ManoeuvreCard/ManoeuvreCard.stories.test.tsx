import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import itineraryMeta from "../Itinerary/Itinerary.stories";
import meta, {
  InstructionLines,
  LongInstruction,
} from "./ManoeuvreCard.stories";

describe("ManoeuvreCard reference directions", () => {
  it("uses the same semantic directions in standalone itinerary references", () => {
    expect(itineraryMeta.args.steps.map((step) => step.type)).toEqual([
      "lift-down",
      "transition",
      "right",
      "destination",
    ]);
  });

  it("documents the elevator-down kind in all three platform recipes", () => {
    const mdx = readFileSync(
      resolve("src/components/Itinerary/Itinerary.mdx"),
      "utf8",
    );
    expect(mdx).toContain(
      'instruction: "Take Elevator down to First Floor", type: "lift-down"',
    );
    expect(mdx).toContain(
      'instruction: "Take Elevator down to First Floor", type: .liftDown',
    );
    expect(mdx).toContain(
      '"Take Elevator down to First Floor", DirectionType.LiftDown',
    );
  });

  it("uses transport and transition kinds matching the displayed instructions", () => {
    expect(meta.args.type).toBe("lift-down");
    expect(
      meta.args.children.props.steps.map((step: { type: string }) => step.type),
    ).toEqual(["lift-down", "transition", "transition", "destination"]);
    expect(LongInstruction.args?.type).toBe("escalator-up");
    expect(InstructionLines.args?.type).toBe("escalator-up");
  });
});
