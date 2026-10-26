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
});
