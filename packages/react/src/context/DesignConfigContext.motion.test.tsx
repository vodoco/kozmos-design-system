import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DesignConfigProvider, useDesignConfig } from "./DesignConfigContext";
import { ThemeProvider } from "../components/ThemeProvider/ThemeProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/Popover/Popover";

// GAP-50: the config's reduced motion stops every loop through the
// `data-kozmos-motion="reduced"` mark, on the provider's scope and on the
// portal of every ThemeProvider inside it, which is outside that scope. A
// Popover, a Dialog or a Select's list draws in the portal, and a Spinner in
// one kept spinning before the portal carried the mark
// (scripts/check-portal-motion.mjs measures it in three engines).
const motionOf = (element: Element | null) =>
  element?.getAttribute("data-kozmos-motion") ?? null;
const portals = () =>
  Array.from(document.querySelectorAll("[data-kozmos-portal]"));

function Toggle() {
  const { updateConfig } = useDesignConfig();
  return (
    <>
      <button onClick={() => updateConfig({ motion: "reduced" })}>
        Reduce
      </button>
      <button onClick={() => updateConfig({ motion: "fluid" })}>Fluid</button>
    </>
  );
}

describe("the config's reduced motion in the theme portal", () => {
  it("marks the provider's scope and its portal when the config reduces motion", () => {
    render(
      <DesignConfigProvider persistKey={null} config={{ motion: "reduced" }}>
        <span data-testid="inside" />
      </DesignConfigProvider>,
    );
    expect(
      screen.getByTestId("inside").closest('[data-kozmos-motion="reduced"]'),
    ).not.toBeNull();
    expect(portals().map(motionOf)).toEqual(["reduced"]);
  });

  it("marks them for accessibility.reduceMotion too", () => {
    render(
      <DesignConfigProvider
        persistKey={null}
        config={{ accessibility: { reduceMotion: true } }}
      >
        <span />
      </DesignConfigProvider>,
    );
    expect(portals().map(motionOf)).toEqual(["reduced"]);
  });

  it("marks neither while motion is fluid, and no ThemeProvider of its own", () => {
    render(
      <>
        <DesignConfigProvider persistKey={null}>
          <span />
        </DesignConfigProvider>
        <ThemeProvider>
          <span />
        </ThemeProvider>
      </>,
    );
    expect(document.querySelector("[data-kozmos-motion]")).toBeNull();
    expect(portals()).toHaveLength(2);
  });

  it("follows the config as it changes", () => {
    render(
      <DesignConfigProvider persistKey={null}>
        <Toggle />
      </DesignConfigProvider>,
    );
    expect(portals().map(motionOf)).toEqual([null]);
    fireEvent.click(screen.getByText("Reduce"));
    expect(portals().map(motionOf)).toEqual(["reduced"]);
    fireEvent.click(screen.getByText("Fluid"));
    expect(portals().map(motionOf)).toEqual([null]);
  });

  it("marks the portal of a ThemeProvider inside it, and of a provider inside, whose fluid config cannot turn motion back on", () => {
    render(
      <DesignConfigProvider persistKey={null} config={{ motion: "reduced" }}>
        <ThemeProvider theme="light">
          <span />
        </ThemeProvider>
        <DesignConfigProvider persistKey={null} config={{ motion: "fluid" }}>
          <span data-testid="inner" />
          <Popover open>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent data-testid="inner-popover">Inside</PopoverContent>
          </Popover>
        </DesignConfigProvider>
      </DesignConfigProvider>,
    );
    // Reduced motion carries downward, as the ancestor rules read it: what
    // the inner provider draws in place is under the outer scope's mark, and
    // what it draws in its portal is marked as well.
    expect(portals().map(motionOf)).toEqual(["reduced", "reduced", "reduced"]);
    for (const id of ["inner", "inner-popover"])
      expect(
        screen.getByTestId(id).closest('[data-kozmos-motion="reduced"]'),
      ).not.toBeNull();
    // Its tokens follow: the reduced motion scale, in place and in its portal.
    const scale = (id: string) =>
      (
        screen.getByTestId(id).closest("[data-kozmos-root]") as HTMLElement
      ).style.getPropertyValue("--semantics-motion-duration-scale");
    expect(scale("inner")).toBe("0.001");
    expect(scale("inner-popover")).toBe("0.001");
  });

  it("lets a fluid provider stay fluid beside a reduced one", () => {
    render(
      <>
        <DesignConfigProvider persistKey={null} config={{ motion: "reduced" }}>
          <span />
        </DesignConfigProvider>
        <DesignConfigProvider persistKey={null} config={{ motion: "fluid" }}>
          <span />
        </DesignConfigProvider>
      </>,
    );
    expect(
      portals()
        .map((portal) => String(motionOf(portal)))
        .sort(),
    ).toEqual(["null", "reduced"]);
  });

  it("puts what a Popover draws in the portal under the mark", () => {
    render(
      <DesignConfigProvider persistKey={null} config={{ motion: "reduced" }}>
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent data-testid="popover">Inside</PopoverContent>
        </Popover>
      </DesignConfigProvider>,
    );
    const popover = screen.getByTestId("popover");
    expect(popover.closest("[data-kozmos-portal]")).not.toBeNull();
    expect(popover.closest('[data-kozmos-motion="reduced"]')).not.toBeNull();
  });
});
