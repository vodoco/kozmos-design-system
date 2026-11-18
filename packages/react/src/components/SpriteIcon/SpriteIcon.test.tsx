import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpriteIcon, spriteCellLayout, spriteSuffix } from "./SpriteIcon";

// GAP-150, decisions 86 and 219: one cell of a published atlas, drawn as
// published, scaled with its aspect ratio kept, decorative unless named.
const INDEX = {
  atm: { x: 90, y: 0, width: 90, height: 90, pixelRatio: 2 },
  marker: { x: 0, y: 100, width: 90, height: 110, pixelRatio: 2 },
};

let base = 0;
function atlasUrl() {
  base += 1;
  return `https://cdn.test/sprite/${base}/light/sprite`;
}

class FakeImage {
  naturalWidth = 400;
  naturalHeight = 220;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

beforeEach(() => {
  vi.stubGlobal("Image", FakeImage);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => ({
      ok: !url.includes("missing"),
      json: async () => INDEX,
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SpriteIcon (GAP-150)", () => {
  it("picks MapLibre's @2x atlas on a 2x screen and the plain one below", () => {
    expect(spriteSuffix(1)).toBe("");
    expect(spriteSuffix(1.5)).toBe("");
    expect(spriteSuffix(2)).toBe("@2x");
    expect(spriteSuffix(3)).toBe("@2x");
  });

  it("scales a cell to the box with its aspect ratio kept", () => {
    const square = spriteCellLayout({ width: 400, height: 220 }, INDEX.atm, 24);
    expect(square).toEqual({
      width: 24,
      height: 24,
      backgroundSize: `${400 * (24 / 90)}px ${220 * (24 / 90)}px`,
      backgroundPosition: `${-90 * (24 / 90)}px 0px`,
    });
    const tall = spriteCellLayout(
      { width: 400, height: 220 },
      INDEX.marker,
      20,
    );
    expect(tall.height).toBe(20);
    expect(tall.width).toBeCloseTo(90 * (20 / 110));
  });

  it("draws the cell from the atlas once loaded, in a box of its size", async () => {
    const sprite = atlasUrl();
    vi.stubGlobal("devicePixelRatio", 2);
    render(
      <SpriteIcon data-testid="icon" sprite={sprite} name="atm" size={20} />,
    );
    const box = screen.getByTestId("icon");
    expect(box).toHaveStyle({ width: "20px", height: "20px" });
    expect(box).toHaveAttribute("data-state", "empty");
    await waitFor(() => expect(box).toHaveAttribute("data-state", "drawn"));
    expect(fetch).toHaveBeenCalledWith(`${sprite}@2x.json`);
    const cell = box.querySelector(
      "[data-slot=sprite-icon-cell]",
    ) as HTMLElement;
    expect(cell.style.backgroundImage).toBe(`url("${sprite}@2x.png")`);
    expect(cell.style.width).toBe("20px");
  });

  it("is decorative unless it is given a label, and named by it", () => {
    const sprite = atlasUrl();
    const { rerender } = render(
      <SpriteIcon data-testid="icon" sprite={sprite} name="atm" />,
    );
    expect(screen.getByTestId("icon")).toHaveAttribute("aria-hidden", "true");
    rerender(
      <SpriteIcon data-testid="icon" sprite={sprite} name="atm" label="ATM" />,
    );
    expect(screen.getByRole("img", { name: "ATM" })).toBe(
      screen.getByTestId("icon"),
    );
  });

  it("keeps an empty box of its size for a missing cell or atlas", async () => {
    const sprite = atlasUrl();
    render(
      <SpriteIcon
        data-testid="gone"
        sprite={sprite}
        name="nothing"
        size={16}
      />,
    );
    render(
      <SpriteIcon
        data-testid="no-atlas"
        sprite={`${sprite}/missing`}
        name="atm"
        size={16}
      />,
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 10));
    for (const id of ["gone", "no-atlas"]) {
      const box = screen.getByTestId(id);
      expect(box).toHaveAttribute("data-state", "empty");
      expect(box).toHaveStyle({ width: "16px", height: "16px" });
      expect(box.querySelector("[data-slot=sprite-icon-cell]")).toBeNull();
    }
  });
});
