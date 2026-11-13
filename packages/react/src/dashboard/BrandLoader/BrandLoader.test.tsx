import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { BrandLoader } from "./BrandLoader";
import * as dashboard from "../index";

/** matchMedia as a reader who asks for reduced motion, or not, would have it. */
function emulateReducedMotion(reduce: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: reduce,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) =>
      media === query.media ? query : { ...query, matches: false },
    ),
  );
  return {
    set(next: boolean) {
      query.matches = next;
      act(() => listeners.forEach((listener) => listener()));
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BrandLoader (CLOUD-UI-008)", () => {
  it("is exported from the dashboard entry", () => {
    expect(dashboard.BrandLoader).toBe(BrandLoader);
  });

  it("says its label once, in a status mounted before the words", () => {
    // The first markup holds the status with no words, so their arrival is a
    // change a screen reader announces.
    const html = renderToStaticMarkup(
      <BrandLoader label="Loading Pointr Cloud" />,
    );
    expect(html).toMatch(/role="status"/);
    expect(html).not.toContain("Loading Pointr Cloud");

    const { rerender } = render(<BrandLoader label="Loading Pointr Cloud" />);
    const statuses = screen.getAllByRole("status");
    expect(statuses).toHaveLength(1);
    const status = statuses[0];
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(/^Loading Pointr Cloud$/);
    const words = status.querySelector(
      ".kozmos-brand-loader-label",
    )!.firstChild;
    // Re-rendering while it loads says nothing again.
    rerender(<BrandLoader label="Loading Pointr Cloud" />);
    expect(
      screen.getByRole("status").querySelector(".kozmos-brand-loader-label")!
        .firstChild,
    ).toBe(words);
    // What moves is hidden from assistive technology.
    for (const part of status.querySelectorAll(
      ".kozmos-brand-loader-ring, .kozmos-brand-loader-pin",
    ))
      expect(part).toHaveAttribute("aria-hidden", "true");
  });

  it("says Loading when it is given no label", () => {
    render(<BrandLoader />);
    expect(screen.getByRole("status")).toHaveTextContent(/^Loading$/);
  });

  it("draws two rings and the pin, in motion by default", () => {
    emulateReducedMotion(false);
    render(<BrandLoader />);
    const status = screen.getByRole("status");
    expect(status).toHaveClass("kozmos-brand-loader");
    expect(status.querySelectorAll(".kozmos-brand-loader-ring")).toHaveLength(
      2,
    );
    expect(status.querySelector("svg.kozmos-brand-loader-pin")).not.toBeNull();
    expect(status).not.toHaveAttribute("data-motion");
  });

  it("stands still under reduced motion, and follows the setting as it changes", () => {
    const media = emulateReducedMotion(true);
    render(<BrandLoader />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("data-motion", "reduced");
    media.set(false);
    expect(status).not.toHaveAttribute("data-motion");
    media.set(true);
    expect(status).toHaveAttribute("data-motion", "reduced");
  });

  it("draws in place unless it is an overlay", () => {
    const { container } = render(<BrandLoader className="mine" />);
    expect(container.firstElementChild).toHaveClass(
      "kozmos-brand-loader",
      "mine",
    );
    expect(document.querySelector(".kozmos-brand-loader-overlay")).toBeNull();
  });

  describe("as an overlay", () => {
    it("covers the window with the theme's scrim, the loader in it", () => {
      const { container } = render(<BrandLoader overlay />);
      // In the theme's portal, not where it was rendered.
      expect(container).toBeEmptyDOMElement();
      const scrim = document.querySelector(".kozmos-brand-loader-overlay")!;
      expect(scrim).toHaveClass("fixed", "inset-0", "bg-overlay-scrim");
      expect(scrim.querySelector('[role="status"]')).not.toBeNull();
    });

    it("keeps the pointer: a click on it reaches nothing it was rendered in", () => {
      const onClick = vi.fn();
      const onPointerDown = vi.fn();
      render(
        <div onClick={onClick} onPointerDown={onPointerDown}>
          <BrandLoader overlay />
        </div>,
      );
      const scrim = document.querySelector(".kozmos-brand-loader-overlay")!;
      fireEvent.pointerDown(scrim);
      fireEvent.click(scrim);
      fireEvent.click(screen.getByRole("status"));
      expect(onClick).not.toHaveBeenCalled();
      expect(onPointerDown).not.toHaveBeenCalled();
    });

    it("makes the page inert and busy while it shows, and gives focus back when it goes", () => {
      const page = document.createElement("div");
      const save = document.createElement("button");
      save.type = "button";
      save.textContent = "Save";
      page.append(save);
      document.body.prepend(page);
      save.focus();
      const { rerender } = render(<BrandLoader overlay />);
      expect(page).toHaveAttribute("inert");
      expect(page).toHaveAttribute("aria-busy", "true");
      const scrim = document.querySelector(".kozmos-brand-loader-overlay")!;
      expect(scrim.closest("[inert]")).toBeNull();
      // Focus is not moved to the loader. A browser drops it from the inert
      // page; when the loader goes, it is where it was.
      expect(document.activeElement).not.toBe(scrim);
      save.blur();
      rerender(<BrandLoader overlay={false} />);
      expect(page).not.toHaveAttribute("inert");
      expect(page).not.toHaveAttribute("aria-busy");
      expect(document.activeElement).toBe(save);
      page.remove();
    });

    it("leaves what was inert or busy before it as it was", () => {
      const before = document.createElement("div");
      before.setAttribute("inert", "");
      const busy = document.createElement("div");
      busy.setAttribute("aria-busy", "false");
      document.body.prepend(before, busy);
      const { unmount } = render(<BrandLoader overlay />);
      expect(busy).toHaveAttribute("aria-busy", "true");
      unmount();
      expect(before).toHaveAttribute("inert");
      expect(busy).toHaveAttribute("aria-busy", "false");
      expect(busy).not.toHaveAttribute("inert");
      before.remove();
      busy.remove();
    });
  });
});
