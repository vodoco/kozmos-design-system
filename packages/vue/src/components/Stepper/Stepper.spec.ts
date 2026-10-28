import { describe, expect, it } from "vitest";
import { KozmosStepper } from "../../index";

describe("KozmosStepper", () => {
  it("is the Vue wrapper of the React Stepper, under its name", () => {
    expect(KozmosStepper).toMatchObject({
      name: "Stepper",
      setup: expect.any(Function),
    });
  });

  // GAP-191: variant and steps pass to React as attributes do; a
  // positionLabel function is a prop, so Vue never writes its source onto
  // the wrapper's element as an attribute.
  it("declares positionLabel as a prop", () => {
    expect(Object.keys(KozmosStepper.props ?? {})).toContain("positionLabel");
  });

  // GAP-173: steps may be objects, statusLabels is one and onStepSelect a
  // function; none is written onto the wrapper's element.
  it("declares steps, statusLabels and onStepSelect as props", () => {
    expect(Object.keys(KozmosStepper.props ?? {})).toEqual(
      expect.arrayContaining(["steps", "statusLabels", "onStepSelect"]),
    );
  });
});
