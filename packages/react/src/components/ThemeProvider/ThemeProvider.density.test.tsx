import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "./ThemeProvider";
import { DesignConfigProvider } from "../../context/DesignConfigContext";
import { KozmosTheme } from "../../theme/KozmosTheme";

// Decision 82: a compact density for pointer-first desktop tools (Pointr
// Cloud). The provider marks its root and its portal root, so every part
// inside, portalled popups included, reads the compact sizes; a nested
// provider inherits the density unless it names its own.
const density = (selector: string) =>
  document.querySelector(selector)?.getAttribute("data-kozmos-density");

describe("ThemeProvider density", () => {
  it("is touch unless asked, on the root and the portal root alike", () => {
    render(
      <ThemeProvider>
        <span />
      </ThemeProvider>,
    );
    expect(density("[data-kozmos-root]:not([data-kozmos-portal])")).toBe(
      "touch",
    );
    expect(density("[data-kozmos-portal]")).toBe("touch");
  });

  it("marks the root and the portal root compact", () => {
    render(
      <ThemeProvider density="compact">
        <span />
      </ThemeProvider>,
    );
    expect(density("[data-kozmos-root]:not([data-kozmos-portal])")).toBe(
      "compact",
    );
    expect(density("[data-kozmos-portal]")).toBe("compact");
  });

  it("is inherited by a nested provider, which may name its own", () => {
    render(
      <ThemeProvider density="compact">
        <ThemeProvider>
          <span data-testid="inherits" />
        </ThemeProvider>
        <ThemeProvider density="touch">
          <span data-testid="overrides" />
        </ThemeProvider>
      </ThemeProvider>,
    );
    const rootOf = (id: string) =>
      document
        .querySelector(`[data-testid="${id}"]`)
        ?.closest("[data-kozmos-root]")
        ?.getAttribute("data-kozmos-density");
    expect(rootOf("inherits")).toBe("compact");
    expect(rootOf("overrides")).toBe("touch");
  });
});

// DesignConfigProvider (and KozmosTheme, which forwards to it) take every
// ThemeProvider prop; density must reach the provider they render, or a
// typed, documented prop does nothing.
describe("DesignConfigProvider and KozmosTheme density", () => {
  it("passes density to the provider they render", () => {
    render(
      <>
        <DesignConfigProvider density="compact">
          <span data-testid="config" />
        </DesignConfigProvider>
        <KozmosTheme density="compact">
          <span data-testid="kozmos" />
        </KozmosTheme>
      </>,
    );
    for (const id of ["config", "kozmos"])
      expect(
        document
          .querySelector(`[data-testid="${id}"]`)
          ?.closest("[data-kozmos-root]")
          ?.getAttribute("data-kozmos-density"),
      ).toBe("compact");
  });
});
