import { describe, expect, it } from "vitest";
import * as pkg from "./index";
import { PopoverAnchor } from "./components/Popover/Popover";
import { TourStep } from "./components/TourStep/TourStep";

// The package entry is imported once, at module level. A test that imported
// it inside its own body transformed the whole library within that test's
// 5 s timeout, and timed out under load, on CI as well (28 Oct: TourStep's
// and PopoverAnchor's "is exported from the package").
describe("the package entry", () => {
  it.each([
    ["PopoverAnchor", PopoverAnchor],
    ["TourStep", TourStep],
  ] as const)("exports %s as the part itself", (name, part) => {
    expect((pkg as Record<string, unknown>)[name]).toBe(part);
  });
});
