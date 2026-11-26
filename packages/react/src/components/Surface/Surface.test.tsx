import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Surface, surfaceClass } from "./Surface";
import {
  designConfigTokens,
  normalizeDesignConfig,
} from "../../recipes/design-config";

describe("Surface", () => {
  it("is solid by default, in the caller's shape", () => {
    render(<Surface className="rounded-container p-4">Over the map</Surface>);
    const surface = screen.getByText("Over the map");
    expect(surface).toHaveClass(
      "kozmos-reset",
      "kozmos-surface-solid",
      "rounded-container",
      "p-4",
    );
    expect(surface).not.toHaveClass("kozmos-surface-glass");
  });

  it("is glass on request", () => {
    render(<Surface variant="glass">Glass</Surface>);
    expect(screen.getByText("Glass")).toHaveClass(
      "kozmos-reset",
      "kozmos-surface-glass",
    );
    expect(surfaceClass("glass")).toBe("kozmos-reset kozmos-surface-glass");
    expect(surfaceClass()).toBe("kozmos-reset kozmos-surface-solid");
  });

  it("passes the caller's attributes through", () => {
    render(
      <Surface role="region" aria-label="Summary">
        Summary
      </Surface>,
    );
    expect(screen.getByRole("region", { name: "Summary" })).toHaveClass(
      "kozmos-surface-solid",
    );
  });

  it("switches glass off through the design config only while transparency is reduced", () => {
    const on = designConfigTokens(normalizeDesignConfig({}), "t");
    expect(on["--kozmos-surface-glass-opacity"]).toBe("initial");
    expect(on["--kozmos-surface-glass-blur"]).toBe("initial");
    const off = designConfigTokens(
      normalizeDesignConfig({ accessibility: { reduceTransparency: true } }),
      "t",
    );
    expect(off["--kozmos-surface-glass-opacity"]).toBe(1);
    expect(off["--kozmos-surface-glass-blur"]).toBe("0px");
  });
});
