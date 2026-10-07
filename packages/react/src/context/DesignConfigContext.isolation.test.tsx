import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DesignConfigProvider, useDesignConfig } from "./DesignConfigContext";
import {
  ThemeProvider,
  useTheme,
} from "../components/ThemeProvider/ThemeProvider";
import { KozmosTheme } from "../theme/KozmosTheme";

function Controls() {
  const { config, updateConfig, updateGlassConfig } = useDesignConfig();
  return (
    <>
      <output>{JSON.stringify(config)}</output>
      <button onClick={() => updateGlassConfig({ frost: 50 })}>
        Change frost
      </button>
      <button
        onClick={() => updateConfig({ accessibility: { reduceMotion: true } })}
      >
        Reduce motion
      </button>
    </>
  );
}
const read = () => JSON.parse(screen.getByRole("status").textContent!);

describe("scoped design configuration", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deeply merges initial values and partial accessibility updates", () => {
    render(
      <DesignConfigProvider
        initialConfig={{
          glass: { frost: 30 },
          accessibility: { reduceTransparency: true },
        }}
      >
        <Controls />
      </DesignConfigProvider>,
    );
    expect(read().glass.refraction).toBe(40);
    fireEvent.click(screen.getByText("Reduce motion"));
    expect(read().accessibility).toEqual({
      reduceMotion: true,
      reduceTransparency: true,
    });
  });

  it("does not use implicit storage or read storage while rendering on the server", () => {
    const get = vi.spyOn(Storage.prototype, "getItem");
    const set = vi.spyOn(Storage.prototype, "setItem");
    renderToString(
      <DesignConfigProvider persistKey="module">
        <Controls />
      </DesignConfigProvider>,
    );
    expect(get).not.toHaveBeenCalled();
    render(
      <DesignConfigProvider>
        <Controls />
      </DesignConfigProvider>,
    );
    fireEvent.click(screen.getByText("Change frost"));
    expect(get).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });

  it("tolerates storage denial", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    render(
      <DesignConfigProvider persistKey="module">
        <Controls />
      </DesignConfigProvider>,
    );
    fireEvent.click(screen.getByText("Change frost"));
    expect(read().glass.frost).toBe(50);
  });

  it("validates stored shape, enums and bounded numeric values", () => {
    localStorage.setItem(
      "module",
      JSON.stringify({
        glass: null,
        accessibility: [],
        roundness: 999,
        motion: "invalid",
        noise: "yes",
      }),
    );
    render(
      <DesignConfigProvider persistKey="module">
        <Controls />
      </DesignConfigProvider>,
    );
    expect(read().roundness).toBe(2);
    expect(read().motion).toBe("fluid");
    expect(read().glass.refraction).toBe(40);
    expect(read().accessibility.reduceMotion).toBe(false);
    expect(typeof read().noise).toBe("boolean");
  });

  it("uses unique effect IDs, with no fixed page-wide noise element", () => {
    const { container } = render(
      <>
        <DesignConfigProvider>A</DesignConfigProvider>
        <DesignConfigProvider>B</DesignConfigProvider>
      </>,
    );
    const ids = [...container.querySelectorAll("filter")].map(
      (node) => node.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
    expect(
      [...container.querySelectorAll("div")].some(
        (node) => node.style.position === "fixed",
      ),
    ).toBe(false);
  });

  it("honors controlled config without writing persistence", () => {
    const onConfigChange = vi.fn();
    const set = vi.spyOn(Storage.prototype, "setItem");
    const { rerender } = render(
      <DesignConfigProvider
        config={{ glass: { frost: 10 } }}
        onConfigChange={onConfigChange}
        persistKey="module"
      >
        <Controls />
      </DesignConfigProvider>,
    );
    fireEvent.click(screen.getByText("Change frost"));
    expect(onConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        glass: expect.objectContaining({ frost: 50 }),
      }),
    );
    expect(read().glass.frost).toBe(10);
    rerender(
      <DesignConfigProvider config={{ glass: { frost: 50 } }}>
        <Controls />
      </DesignConfigProvider>,
    );
    expect(read().glass.frost).toBe(50);
    expect(set).not.toHaveBeenCalled();
  });

  it("keeps batched uncontrolled partial updates", () => {
    render(
      <DesignConfigProvider>
        <Controls />
      </DesignConfigProvider>,
    );
    act(() => {
      screen.getByText("Change frost").click();
      screen.getByText("Reduce motion").click();
    });
    expect(read().glass.frost).toBe(50);
    expect(read().accessibility.reduceMotion).toBe(true);
  });

  it("hydrates before restoring explicit persistence without clobbering saved settings", async () => {
    localStorage.setItem("module", JSON.stringify({ glass: { frost: 70 } }));
    const writes = vi.spyOn(Storage.prototype, "setItem");
    const app = (
      <DesignConfigProvider
        persistKey="module"
        initialConfig={{ noise: false }}
      >
        <Controls />
      </DesignConfigProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(app);
    document.body.append(container);
    expect(
      JSON.parse(container.querySelector("output")!.textContent!).glass.frost,
    ).toBe(10);
    const error = vi.fn();
    let root: Root;
    await act(async () => {
      root = hydrateRoot(container, app, { onRecoverableError: error });
    });
    expect(read().glass.frost).toBe(70);
    expect(read().noise).toBe(false);
    expect(error).not.toHaveBeenCalled();
    expect(
      writes.mock.calls.every(
        ([, value]) => JSON.parse(value).glass.frost === 70,
      ),
    ).toBe(true);
    act(() => root.unmount());
    container.remove();
  });

  it("isolates configuration from mutation through change callbacks", () => {
    render(
      <DesignConfigProvider
        onConfigChange={(next) => {
          next.glass.frost = 999;
        }}
      >
        <Controls />
      </DesignConfigProvider>,
    );
    fireEvent.click(screen.getByText("Change frost"));
    expect(read().glass.frost).toBe(50);
  });

  it("inherits and updates the parent theme unless a new preference is explicitly requested", () => {
    function ThemeReader() {
      const { theme, setTheme } = useTheme();
      return <button onClick={() => setTheme("light")}>{theme}</button>;
    }
    const onThemeChange = vi.fn();
    render(
      <ThemeProvider defaultTheme="dark">
        <DesignConfigProvider onThemeChange={onThemeChange}>
          <ThemeReader />
        </DesignConfigProvider>
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText("dark"));
    expect(screen.getByText("light")).toBeInTheDocument();
    expect(onThemeChange).toHaveBeenCalledWith("light");
    expect(
      [...document.querySelectorAll("[data-kozmos-root]")].every(
        (node) => node.getAttribute("data-theme") === "light",
      ),
    ).toBe(true);
  });

  it("makes KozmosTheme a reactive compatibility entry, not a second implementation", () => {
    const { rerender, container } = render(
      <KozmosTheme
        defaultTheme="light"
        config={{ noise: false }}
        tokens={{ "colors-background-0": "red" }}
      >
        <Controls />
      </KozmosTheme>,
    );
    expect(read().noise).toBe(false);
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue(
        "--primitives-colors-background-0",
      ),
    ).toBe("red");
    rerender(
      <KozmosTheme defaultTheme="light" config={{ noise: true }} tokens={{}}>
        <Controls />
      </KozmosTheme>,
    );
    expect(read().noise).toBe(true);
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue(
        "--primitives-colors-background-0",
      ),
    ).toBe("");
  });
});
