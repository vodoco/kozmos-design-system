import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "./ThemeProvider";
import { DesignConfigProvider } from "../../context/DesignConfigContext";
import { DensityScope } from "../../theme/DensityScope";
import { KozmosTheme } from "../../theme/KozmosTheme";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover/Popover";
import { RouteSetupPanel } from "../RouteSetupPanel";

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

// One region at another density (decision 82): DensityScope marks its element
// and sets the density for the providers inside it and the popovers it opens,
// and keeps the provider's theme around it.
describe("DensityScope", () => {
  const densityOf = (id: string) =>
    screen
      .getByTestId(id)
      .closest("[data-kozmos-density]")
      ?.getAttribute("data-kozmos-density");

  it("marks the one child it is given, adding no element", () => {
    render(
      <ThemeProvider density="compact">
        <DensityScope density="touch" asChild>
          <section data-testid="part" />
        </DensityScope>
      </ThemeProvider>,
    );
    const part = screen.getByTestId("part");
    expect(part.getAttribute("data-kozmos-density")).toBe("touch");
    expect(part.parentElement?.hasAttribute("data-kozmos-root")).toBe(true);
  });

  it("gives a fragment an element of its own: a fragment takes no attribute", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(
        <ThemeProvider density="compact">
          <DensityScope density="touch" asChild>
            <>
              <span data-testid="first" />
              <span data-testid="second" />
            </>
          </DensityScope>
        </ThemeProvider>,
      );
      const scope = screen.getByTestId("first").parentElement!;
      expect(scope.getAttribute("data-kozmos-density")).toBe("touch");
      expect(scope.style.display).toBe("contents");
      expect(densityOf("second")).toBe("touch");
      // React warns when a fragment is given a prop it can't take.
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("marks an element of its own, which draws no box, without asChild", () => {
    render(
      <ThemeProvider>
        <DensityScope density="compact">
          <span data-testid="inside" />
        </DensityScope>
      </ThemeProvider>,
    );
    const scope = screen.getByTestId("inside").parentElement!;
    expect(scope.getAttribute("data-kozmos-density")).toBe("compact");
    expect(scope.style.display).toBe("contents");
    expect(scope.hasAttribute("data-kozmos-root")).toBe(false);
  });

  it("sets the density of a provider nested in it", () => {
    render(
      <ThemeProvider density="compact">
        <DensityScope density="touch">
          <ThemeProvider>
            <span data-testid="nested" />
          </ThemeProvider>
        </DensityScope>
      </ThemeProvider>,
    );
    expect(
      screen
        .getByTestId("nested")
        .closest("[data-kozmos-root]")
        ?.getAttribute("data-kozmos-density"),
    ).toBe("touch");
  });

  it("keeps the theme and the tokens around it: it is no provider", () => {
    render(
      <ThemeProvider
        density="compact"
        theme="dark"
        tokens={{ "--probe": "1px" }}
      >
        <DensityScope density="touch">
          <span data-testid="inside" />
        </DensityScope>
      </ThemeProvider>,
    );
    const root = screen.getByTestId("inside").closest("[data-kozmos-root]");
    expect(root?.getAttribute("data-theme")).toBe("dark");
    expect((root as HTMLElement).style.getPropertyValue("--probe")).toBe("1px");
    expect(root?.getAttribute("data-kozmos-density")).toBe("compact");
    expect(densityOf("inside")).toBe("touch");
  });

  it("opens its popovers at its density, in the provider's portal", () => {
    render(
      <ThemeProvider density="compact">
        <DensityScope density="touch">
          <Popover open>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent data-testid="popover">Inside</PopoverContent>
          </Popover>
        </DensityScope>
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent data-testid="page-popover">Page</PopoverContent>
        </Popover>
      </ThemeProvider>,
    );
    const popover = screen.getByTestId("popover");
    expect(popover.closest("[data-kozmos-portal]")).not.toBeNull();
    expect(popover.getAttribute("data-kozmos-density")).toBe("touch");
    expect(densityOf("page-popover")).toBe("compact");
  });

  it("is every SDK part's root: a provider and a popover inside stay touch", () => {
    render(
      <ThemeProvider density="compact">
        <RouteSetupPanel
          ready
          onContinue={() => undefined}
          onClose={() => undefined}
        >
          <ThemeProvider>
            <span data-testid="provider-in-part" />
          </ThemeProvider>
          <Popover open>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent data-testid="part-popover">Inside</PopoverContent>
          </Popover>
        </RouteSetupPanel>
      </ThemeProvider>,
    );
    expect(densityOf("provider-in-part")).toBe("touch");
    expect(densityOf("part-popover")).toBe("touch");
  });
});
