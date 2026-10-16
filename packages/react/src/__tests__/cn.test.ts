import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("still resolves the standard scale", () => {
    expect(cn("rounded-sm", "rounded-lg")).toBe("rounded-lg");
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  /**
   * The defect this fixes: a caller could not override a component's radius.
   * `Avatar` carries `rounded-pill`, and `className="rounded-control"` used to
   * leave both on the element, so CSS order won and the avatar stayed a circle.
   */
  it("treats the design system's radius roles as one property", () => {
    expect(cn("rounded-pill", "rounded-control")).toBe("rounded-control");
    expect(cn("rounded-control", "rounded-pill")).toBe("rounded-pill");
    expect(cn("rounded-container", "rounded-panel")).toBe("rounded-panel");
  });

  it("resolves a role against the standard scale too", () => {
    expect(cn("rounded-full", "rounded-marker")).toBe("rounded-marker");
    expect(cn("rounded-pill", "rounded-none")).toBe("rounded-none");
  });

  it("resolves per-corner and per-side roles", () => {
    expect(cn("rounded-t-container", "rounded-t-panel")).toBe(
      "rounded-t-panel",
    );
    expect(cn("rounded-tl-marker", "rounded-tl-control")).toBe(
      "rounded-tl-control",
    );
  });

  it("keeps a side role beside the all-corners one", () => {
    // Different properties: the side should survive the general class.
    expect(cn("rounded-control", "rounded-t-panel")).toBe(
      "rounded-control rounded-t-panel",
    );
  });

  it("treats the elevation roles as one property", () => {
    expect(cn("shadow-raised", "shadow-overlay")).toBe("shadow-overlay");
    expect(cn("shadow-lg", "shadow-floating")).toBe("shadow-floating");
  });

  it("treats the border widths as one property", () => {
    expect(cn("border-sm", "border-lg")).toBe("border-lg");
  });

  /**
   * Decision 82: a control's size reads its density's token (`h-control`,
   * `w-icon-control-sm`). A caller's own size must still win, and a density
   * size must replace a standard one, or both stay and CSS order decides.
   */
  it("treats the density sizes as heights and widths", () => {
    expect(cn("h-control", "h-8")).toBe("h-8");
    expect(cn("h-11", "h-control-sm")).toBe("h-control-sm");
    expect(cn("h-control", "h-control-lg")).toBe("h-control-lg");
    expect(cn("h-icon-control", "h-icon-control-sm")).toBe("h-icon-control-sm");
    expect(cn("w-icon-control", "w-12")).toBe("w-12");
    expect(cn("h-field", "h-9")).toBe("h-9");
    expect(cn("min-h-field", "min-h-0")).toBe("min-h-0");
    // Height and width stay separate properties.
    expect(cn("h-icon-control", "w-icon-control")).toBe(
      "h-icon-control w-icon-control",
    );
  });
});
