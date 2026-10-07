import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AICompanionPanel } from "./AICompanionPanel";

/** A control outside the panel, as AISearchButton is in the SDK's sheet. */
function outsideButton(name: string) {
  const button = document.createElement("button");
  button.textContent = name;
  document.body.append(button);
  return button;
}

afterEach(() => {
  document.body
    .querySelectorAll(":scope > button")
    .forEach((button) => button.remove());
});

describe("AICompanionPanel", () => {
  it("opens without a close button when the host has no way to close it", () => {
    // Story 18 lets a host turn the assistant off; Story 5 AC1 says the panel
    // must tolerate AISearchButton being absent.
    const { rerender } = render(<AICompanionPanel />);
    expect(
      screen.queryByRole("button", { name: "Close assistant" }),
    ).not.toBeInTheDocument();

    const onClose = vi.fn();
    rerender(<AICompanionPanel onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close assistant" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape, so a surface covering the frame is not a keyboard trap", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <AICompanionPanel onClose={onClose}>thread</AICompanionPanel>,
    );
    fireEvent.keyDown(screen.getByText("thread"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Nothing to close, nothing to do — Story 18 allows a host with no close.
    rerender(<AICompanionPanel>thread</AICompanionPanel>);
    fireEvent.keyDown(screen.getByText("thread"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe("Escape, with the product's own key handler (R2)", () => {
    // The panel's Escape handler sat before `...props`, so a product that
    // passed `onKeyDown` — analytics, a shortcut — replaced it, and Escape
    // stopped closing the panel. And a part inside that handled Escape for
    // itself, and said so with preventDefault(), closed the panel anyway.
    it("runs the product's handler, and still closes", () => {
      const onClose = vi.fn();
      const onKeyDown = vi.fn(() => expect(onClose).not.toHaveBeenCalled());
      render(
        <AICompanionPanel onClose={onClose} onKeyDown={onKeyDown}>
          thread
        </AICompanionPanel>,
      );
      fireEvent.keyDown(screen.getByText("thread"), { key: "Escape" });
      // The product's first, then the close.
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("stays open when the product's handler prevents Escape", () => {
      const onClose = vi.fn();
      const onKeyDown = vi.fn((event: React.KeyboardEvent) => {
        if (event.key === "Escape") event.preventDefault();
      });
      render(
        <AICompanionPanel onClose={onClose} onKeyDown={onKeyDown}>
          thread
        </AICompanionPanel>,
      );
      fireEvent.keyDown(screen.getByText("thread"), { key: "Escape" });
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("stays open when a part inside has handled Escape for itself", () => {
      // A field that clears itself on Escape, a list of suggestions that
      // closes: each says it handled the key, and the panel leaves it be.
      const onClose = vi.fn();
      render(
        <AICompanionPanel onClose={onClose}>
          <input
            aria-label="Ask"
            onKeyDown={(event) => {
              if (event.key === "Escape") event.preventDefault();
            }}
          />
        </AICompanionPanel>,
      );
      fireEvent.keyDown(screen.getByRole("textbox", { name: "Ask" }), {
        key: "Escape",
      });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on nothing but Escape, and closes this panel only", () => {
      const onClose = vi.fn();
      const onKeyDown = vi.fn();
      const outside = vi.fn();
      render(
        <div onKeyDown={outside}>
          <AICompanionPanel onClose={onClose} onKeyDown={onKeyDown}>
            thread
          </AICompanionPanel>
        </div>,
      );
      const thread = screen.getByText("thread");
      for (const key of ["Enter", " ", "a", "Tab"])
        fireEvent.keyDown(thread, { key });
      expect(onKeyDown).toHaveBeenCalledTimes(4);
      expect(onClose).not.toHaveBeenCalled();
      expect(outside).toHaveBeenCalledTimes(4);

      // Escape closes this panel, and goes no further: a host with a second
      // panel, or a dialog round this one, does not close too.
      fireEvent.keyDown(thread, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(outside).toHaveBeenCalledTimes(4);
    });

    it("hands Escape on when there is nothing to close", () => {
      const onKeyDown = vi.fn();
      const outside = vi.fn();
      render(
        <div onKeyDown={outside}>
          <AICompanionPanel onKeyDown={onKeyDown}>thread</AICompanionPanel>
        </div>,
      );
      fireEvent.keyDown(screen.getByText("thread"), { key: "Escape" });
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(outside).toHaveBeenCalledTimes(1);
    });
  });

  describe("what it covers is out of reach while it is open (GAP-93)", () => {
    // It covers the frame it is laid over, and moves focus in as it opens,
    // but what it covered stayed in the tab order: Shift+Tab from the panel
    // landed on the search's tiles beneath, where nobody could see them
    // (WCAG 2.2, 2.4.11). jsdom lays nothing out, so the layout is stated:
    // a 360 by 560 frame, and the panel filling it, as `absolute inset-0`
    // does, or not.
    const frameSize = { width: 360, height: 560 };
    const viewport = { width: 1024, height: 768 };
    let spies: { mockRestore(): void }[] = [];
    afterEach(() => {
      spies.forEach((spy) => spy.mockRestore());
      spies = [];
    });
    function layOut(panel: {
      width: number;
      height: number;
      left?: number;
      top?: number;
      /** The box it is laid against: the frame, or none (fixed). */
      against?: "frame" | "page";
    }) {
      const isPanel = (node: HTMLElement) =>
        node.getAttribute("role") === "region";
      const isFrame = (node: HTMLElement) => node.dataset.testid === "frame";
      const size = (axis: "width" | "height") =>
        function (this: HTMLElement) {
          if (isPanel(this)) return panel[axis];
          if (isFrame(this)) return frameSize[axis];
          if (this === document.documentElement) return viewport[axis];
          return 0;
        };
      const at = (edge: "left" | "top") =>
        function (this: HTMLElement) {
          return isPanel(this) ? (panel[edge] ?? 0) : 0;
        };
      spies = [
        vi
          .spyOn(HTMLElement.prototype, "offsetParent", "get")
          .mockImplementation(function (this: HTMLElement) {
            if (!isPanel(this) || panel.against === "page") return null;
            return document.querySelector('[data-testid="frame"]');
          }),
        vi
          .spyOn(HTMLElement.prototype, "offsetWidth", "get")
          .mockImplementation(size("width")),
        vi
          .spyOn(HTMLElement.prototype, "offsetHeight", "get")
          .mockImplementation(size("height")),
        vi
          .spyOn(HTMLElement.prototype, "clientWidth", "get")
          .mockImplementation(size("width")),
        vi
          .spyOn(HTMLElement.prototype, "clientHeight", "get")
          .mockImplementation(size("height")),
        vi
          .spyOn(HTMLElement.prototype, "offsetLeft", "get")
          .mockImplementation(at("left")),
        vi
          .spyOn(HTMLElement.prototype, "offsetTop", "get")
          .mockImplementation(at("top")),
      ];
    }

    /** A phone's frame: the search beneath, and the assistant over it. */
    function Phone({
      open,
      position = "absolute",
      onCloseAutoFocus,
      coverItself = false,
    }: {
      open?: boolean;
      position?: "absolute" | "fixed" | "static";
      onCloseAutoFocus?: (event: Event) => void;
      /** GAP-93's workaround: the product makes the search inert itself. */
      coverItself?: boolean;
    }) {
      return (
        <>
          <button type="button">Toolbar</button>
          <div data-testid="frame" style={{ position: "relative" }}>
            <div
              data-testid="search"
              ref={(node) => {
                if (node) node.inert = Boolean(coverItself && open);
              }}
            >
              <button type="button">Shops</button>
              <button type="button">Ask the assistant</button>
              <p aria-live="polite">3 places</p>
            </div>
            <AICompanionPanel
              onClose={vi.fn()}
              onCloseAutoFocus={onCloseAutoFocus}
              open={open}
              style={position === "static" ? undefined : { position, inset: 0 }}
            >
              <input aria-label="Ask" />
            </AICompanionPanel>
          </div>
          <div data-kozmos-portal="" data-testid="portal" />
        </>
      );
    }
    const inert = (name: string) =>
      screen.getByRole("button", { name }).closest("[inert]") !== null;

    it("makes the frame it fills inert while open, and gives it back as it closes", () => {
      layOut(frameSize);
      const { rerender } = render(<Phone open={false} />);
      const ask = screen.getByRole("button", { name: "Ask the assistant" });
      ask.focus();
      rerender(<Phone open />);

      const panel = screen.getByRole("region", { name: "Assistant" });
      expect(panel).toHaveFocus();
      expect(inert("Shops")).toBe(true);
      expect(inert("Ask the assistant")).toBe(true);
      expect(panel.closest("[inert]")).toBeNull();
      // A live region beneath still speaks, and the page beyond the frame is
      // left alone.
      expect(screen.getByText("3 places").closest("[inert]")).toBeNull();
      expect(inert("Toolbar")).toBe(false);

      rerender(<Phone open={false} />);
      expect(document.querySelector("[inert]")).toBeNull();
      expect(ask).toHaveFocus();
    });

    it("covers nothing in flow, or over only part of its frame", () => {
      layOut(frameSize);
      const { rerender, unmount } = render(
        <Phone open={false} position="static" />,
      );
      rerender(<Phone open position="static" />);
      expect(document.querySelector("[inert]")).toBeNull();
      unmount();

      // Laid over half the frame: the other half is still there to use.
      layOut({ ...frameSize, width: 180, left: 180 });
      const half = render(<Phone open={false} />);
      half.rerender(<Phone open />);
      expect(document.querySelector("[inert]")).toBeNull();
    });

    it("makes what it covers inert when it mounts open, and leaves focus where it was", () => {
      // Decision 16: a panel on screen from the start takes no focus.
      layOut(frameSize);
      render(<button type="button">Elsewhere</button>);
      screen.getByRole("button", { name: "Elsewhere" }).focus();
      render(<Phone open />);
      expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
      expect(inert("Shops")).toBe(true);
    });

    it("gives what it covered back before it hands focus back, and as it unmounts", () => {
      layOut(frameSize);
      const shops = () => screen.getByRole("button", { name: "Shops" });
      // The close under test; the unmount at the end closes it once more.
      const onCloseAutoFocus = vi
        .fn()
        .mockImplementationOnce((event: Event) => {
          // What the product focuses here is under the panel: it must be in
          // reach again by now.
          expect(shops().closest("[inert]")).toBeNull();
          event.preventDefault();
          shops().focus();
        });
      const { rerender, unmount } = render(
        <Phone onCloseAutoFocus={onCloseAutoFocus} open={false} />,
      );
      screen.getByRole("button", { name: "Ask the assistant" }).focus();
      rerender(<Phone onCloseAutoFocus={onCloseAutoFocus} open />);
      expect(inert("Shops")).toBe(true);
      rerender(<Phone onCloseAutoFocus={onCloseAutoFocus} open={false} />);
      expect(onCloseAutoFocus).toHaveBeenCalledTimes(1);
      expect(shops()).toHaveFocus();

      rerender(<Phone onCloseAutoFocus={onCloseAutoFocus} open />);
      expect(inert("Shops")).toBe(true);
      unmount();
      expect(document.querySelector("[inert]")).toBeNull();
    });

    it("leaves a product's own inert to the product, as GAP-93's workaround did", () => {
      layOut(frameSize);
      const { rerender } = render(<Phone coverItself open={false} />);
      rerender(<Phone coverItself open />);
      expect(inert("Shops")).toBe(true);
      rerender(<Phone coverItself open={false} />);
      expect(screen.getByTestId("search")).not.toHaveAttribute("inert");
      expect(document.querySelector("[inert]")).toBeNull();
    });

    describe("while it is open, as the layout changes", () => {
      // What it covered was decided once, as it opened. A layout that moved
      // it from covering the frame to half of it left the other half inert
      // and out of reach; the other way, the covered half stayed in reach.
      // A stand-in ResizeObserver, told when the stated layout changes.
      let observers: {
        callback: ResizeObserverCallback;
        targets: Set<Element>;
      }[] = [];
      beforeEach(() => {
        observers = [];
        vi.stubGlobal(
          "ResizeObserver",
          class {
            targets = new Set<Element>();
            constructor(public callback: ResizeObserverCallback) {
              observers.push(this);
            }
            observe(target: Element) {
              this.targets.add(target);
            }
            unobserve(target: Element) {
              this.targets.delete(target);
            }
            disconnect() {
              this.targets.clear();
            }
          },
        );
      });
      afterEach(() => {
        vi.unstubAllGlobals();
      });
      const resized = () =>
        observers.forEach((observer) =>
          observer.callback([], observer as unknown as ResizeObserver),
        );

      it("gives what it no longer covers back, and takes it again when it covers it again", () => {
        const layout = { ...frameSize, left: 0 };
        layOut(layout);
        const { rerender } = render(<Phone open={false} />);
        screen.getByRole("button", { name: "Ask the assistant" }).focus();
        rerender(<Phone open />);
        expect(inert("Shops")).toBe(true);
        // It watches itself and the box it is laid against.
        expect(
          observers.some(
            (observer) =>
              observer.targets.has(
                screen.getByRole("region", { name: "Assistant" }),
              ) && observer.targets.has(screen.getByTestId("frame")),
          ),
        ).toBe(true);

        // A narrower layout lays it over half the frame: the other half is
        // there to use.
        Object.assign(layout, { width: 180, left: 180 });
        resized();
        expect(document.querySelector("[inert]")).toBeNull();

        // And back.
        Object.assign(layout, { width: frameSize.width, left: 0 });
        resized();
        expect(inert("Shops")).toBe(true);
        expect(inert("Toolbar")).toBe(false);

        rerender(<Phone open={false} />);
        expect(document.querySelector("[inert]")).toBeNull();
      });

      it("takes focus from a control it has just covered, which nobody can see now", () => {
        const layout = { ...frameSize, width: 180, left: 180 };
        layOut(layout);
        const { rerender } = render(<Phone open={false} />);
        screen.getByRole("button", { name: "Ask the assistant" }).focus();
        rerender(<Phone open />);
        expect(document.querySelector("[inert]")).toBeNull();
        // Beside the panel, the visitor goes back to a tile.
        screen.getByRole("button", { name: "Shops" }).focus();

        Object.assign(layout, { width: frameSize.width, left: 0 });
        resized();
        expect(inert("Shops")).toBe(true);
        expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();
      });

      it.each(["input", "portal", "live region", "outside frame"])(
        "keeps focus in the %s when the panel grows to cover its frame",
        (place) => {
          const layout = { ...frameSize, width: 180, left: 180 };
          layOut(layout);
          render(<Phone open />);
          let target: HTMLElement;
          if (place === "input") {
            target = screen.getByRole("textbox", { name: "Ask" });
          } else if (place === "outside frame") {
            target = screen.getByRole("button", { name: "Toolbar" });
          } else {
            // A popup and a live region inside the frame stay reachable by
            // the same policy as when the assistant first covers it.
            const host = document.createElement("div");
            if (place === "portal") host.setAttribute("data-kozmos-portal", "");
            else host.setAttribute("role", "status");
            target = document.createElement("button");
            target.textContent = "Reachable control";
            host.append(target);
            screen.getByTestId("frame").append(host);
          }
          target.focus();
          expect(target).toHaveFocus();

          Object.assign(layout, { width: frameSize.width, left: 0 });
          resized();

          expect(inert("Shops")).toBe(true);
          expect(target.closest("[inert]")).toBeNull();
          expect(target).toHaveFocus();
        },
      );
    });

    it("covers the page when it is fixed over the whole viewport, and keeps the page's popups in reach", () => {
      layOut({ ...viewport, against: "page" });
      const { rerender } = render(<Phone open={false} position="fixed" />);
      rerender(<Phone open position="fixed" />);
      expect(inert("Toolbar")).toBe(true);
      expect(inert("Shops")).toBe(true);
      // Popups a part inside the panel opens are drawn in the portal.
      expect(screen.getByTestId("portal").closest("[inert]")).toBeNull();
      rerender(<Phone open={false} position="fixed" />);
      expect(document.querySelector("[inert]")).toBeNull();
    });
  });

  it("puts a banner above the thread, for the Story 14 notice", () => {
    render(
      <AICompanionPanel banner={<p>AI results may be incomplete.</p>}>
        <p>thread</p>
      </AICompanionPanel>,
    );
    expect(screen.getByText("AI results may be incomplete.")).toBeVisible();
  });

  it("draws its title as a heading, at the level the product gives", () => {
    // Row 60: the title was a <p>, so a screen reader moving by heading
    // passed the assistant by. The level follows whatever sits above it.
    const { rerender } = render(<AICompanionPanel />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Assistant" }),
    ).toBeVisible();

    rerender(<AICompanionPanel titleLevel={3} />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Assistant" }),
    ).toBeVisible();
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });

  it("is a region named by its title, in the product's language", () => {
    // Row 60: a surface covering the frame had no name at all, so there was
    // nothing to land on or to announce.
    const { rerender } = render(<AICompanionPanel title="Asistente" />);
    expect(
      screen.getByRole("region", { name: "Asistente" }),
    ).toBeInTheDocument();

    // A name the product gives the region itself still wins.
    rerender(<AICompanionPanel aria-label="Chat" title="Asistente" />);
    expect(screen.getByRole("region", { name: "Chat" })).toBeInTheDocument();
  });

  it("leaves focus where it was when it mounts with open already true", () => {
    // Decision 16: a panel on screen from the start was not opened by the
    // visitor, so it takes focus from nothing on the page.
    const search = outsideButton("Search");
    search.focus();
    const onOpenAutoFocus = vi.fn();
    render(
      <AICompanionPanel onOpenAutoFocus={onOpenAutoFocus} open>
        thread
      </AICompanionPanel>,
    );
    expect(screen.getByRole("region", { name: "Assistant" })).toBeVisible();
    expect(search).toHaveFocus();
    expect(onOpenAutoFocus).not.toHaveBeenCalled();
  });

  describe("given no open, mounting it is opening it, as in 0.5.0 (B1)", () => {
    // 0.5.0 had no `open`: "The panel opens when it mounts, and takes focus
    // then." A product that mounts the panel as the visitor taps the AI
    // button is following that contract, and #133 (decision 16) left its
    // focus on the button beneath, covered.
    it("takes focus as it mounts, calling onOpenAutoFocus first", () => {
      const ask = outsideButton("Ask the assistant");
      ask.focus();
      const onOpenAutoFocus = vi.fn(() => expect(ask).toHaveFocus());
      const { unmount } = render(
        <AICompanionPanel onClose={vi.fn()} onOpenAutoFocus={onOpenAutoFocus}>
          thread
        </AICompanionPanel>,
      );
      expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();

      // Unmounted, it hands focus back to the button, as it always has.
      unmount();
      expect(ask).toHaveFocus();
    });

    it("keeps focus where onOpenAutoFocus puts it", () => {
      outsideButton("Ask the assistant").focus();
      render(
        <AICompanionPanel
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            screen.getByRole("textbox", { name: "Ask" }).focus();
          }}
        >
          <input aria-label="Ask" />
        </AICompanionPanel>,
      );
      expect(screen.getByRole("textbox", { name: "Ask" })).toHaveFocus();
    });

    it("takes focus once under StrictMode's rehearsal of its mount", () => {
      const ask = outsideButton("Ask the assistant");
      ask.focus();
      const onOpenAutoFocus = vi.fn();
      const onCloseAutoFocus = vi.fn();
      const { unmount } = render(
        <React.StrictMode>
          <AICompanionPanel
            onCloseAutoFocus={onCloseAutoFocus}
            onOpenAutoFocus={onOpenAutoFocus}
          >
            thread
          </AICompanionPanel>
        </React.StrictMode>,
      );
      expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
      expect(onCloseAutoFocus).not.toHaveBeenCalled();
      expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();
      unmount();
      expect(onCloseAutoFocus).toHaveBeenCalledTimes(1);
      expect(ask).toHaveFocus();
    });

    it("keeps decision 16 for a product that passes open", () => {
      // Given `open`, the product says when the visitor opens the panel:
      // only false turning true is an opening.
      const ask = outsideButton("Ask the assistant");
      ask.focus();
      const onOpenAutoFocus = vi.fn();
      const panel = (open: boolean) => (
        <AICompanionPanel onOpenAutoFocus={onOpenAutoFocus} open={open}>
          thread
        </AICompanionPanel>
      );
      const { rerender } = render(panel(true));
      expect(ask).toHaveFocus();
      rerender(panel(false));
      rerender(panel(true));
      expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();
    });
  });

  it("takes focus when a panel that mounted open is closed and opened again", () => {
    // On screen from the start, then closed by the visitor: opening it again
    // is the visitor's doing.
    const search = outsideButton("Search");
    search.focus();
    const onOpenAutoFocus = vi.fn();
    const panel = (open: boolean) => (
      <AICompanionPanel onOpenAutoFocus={onOpenAutoFocus} open={open}>
        thread
      </AICompanionPanel>
    );
    const { rerender } = render(panel(true));
    expect(search).toHaveFocus();

    rerender(panel(false));
    rerender(panel(true));
    expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();
    expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
  });

  it("moves focus into itself when it is opened", () => {
    // Row 60: it covers the frame, and focus stayed on the button beneath it.
    const opener = outsideButton("Ask the assistant");
    opener.focus();
    const panel = (open: boolean) => (
      <AICompanionPanel onClose={vi.fn()} open={open}>
        thread
      </AICompanionPanel>
    );
    const { rerender } = render(panel(false));
    // Closed, it leaves focus alone and draws nothing.
    expect(opener).toHaveFocus();
    expect(screen.queryByRole("region")).toBeNull();

    rerender(panel(true));
    expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();
  });

  it("leaves focus with a part inside that takes it as the panel opens", () => {
    const opener = outsideButton("Ask the assistant");
    opener.focus();
    const onOpenAutoFocus = vi.fn();
    const panel = (open: boolean) => (
      <AICompanionPanel onOpenAutoFocus={onOpenAutoFocus} open={open}>
        <input aria-label="Ask" autoFocus />
      </AICompanionPanel>
    );
    const { rerender } = render(panel(false));
    rerender(panel(true));
    expect(screen.getByRole("textbox", { name: "Ask" })).toHaveFocus();
    expect(onOpenAutoFocus).not.toHaveBeenCalled();

    // The opener was read before the field took focus, so the close still
    // finds its way back to the button.
    rerender(panel(false));
    expect(opener).toHaveFocus();
  });

  it("hands focus back to the opener when it closes", () => {
    // Row 60: closing it removed whatever had focus, and focus fell to the
    // page — the visitor had to find their place in the search again.
    const opener = outsideButton("Ask the assistant");
    opener.focus();
    const panel = (open: boolean) => (
      <AICompanionPanel onClose={vi.fn()} open={open}>
        thread
      </AICompanionPanel>
    );
    const { rerender } = render(panel(false));
    rerender(panel(true));
    screen.getByRole("button", { name: "Close assistant" }).focus();
    rerender(panel(false));
    expect(opener).toHaveFocus();
    expect(screen.queryByRole("region")).toBeNull();

    // Each open reads its own opener.
    const again = outsideButton("Ask again");
    again.focus();
    rerender(panel(true));
    expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();
    rerender(panel(false));
    expect(again).toHaveFocus();
  });

  it("hands focus back as it unmounts, to what had it when it mounted", () => {
    // A product that unmounts the panel to close it is closing it too.
    const opener = outsideButton("Ask the assistant");
    opener.focus();
    const { unmount } = render(
      <AICompanionPanel onClose={vi.fn()}>thread</AICompanionPanel>,
    );
    screen.getByRole("button", { name: "Close assistant" }).focus();
    unmount();
    expect(opener).toHaveFocus();
  });

  it("calls onOpenAutoFocus when it is opened, so the product can put focus elsewhere", () => {
    const elsewhere = outsideButton("Details");
    const onOpenAutoFocus = vi.fn((event: Event) => {
      event.preventDefault();
      screen.getByRole("textbox", { name: "Ask" }).focus();
    });
    const onCloseAutoFocus = vi.fn((event: Event) => {
      event.preventDefault();
      elsewhere.focus();
    });
    const panel = (open: boolean) => (
      <AICompanionPanel
        onCloseAutoFocus={onCloseAutoFocus}
        onOpenAutoFocus={onOpenAutoFocus}
        open={open}
      >
        <input aria-label="Ask" />
      </AICompanionPanel>
    );
    const { rerender } = render(panel(false));
    expect(onOpenAutoFocus).not.toHaveBeenCalled();

    rerender(panel(true));
    expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "Ask" })).toHaveFocus();

    rerender(panel(false));
    expect(onCloseAutoFocus).toHaveBeenCalledTimes(1);
    expect(elsewhere).toHaveFocus();
  });

  it("never takes back focus the product has already moved", () => {
    // A place picked from the thread: the product opens its details, puts
    // focus there, then closes the assistant. Returning focus to the button
    // beneath would undo that — Radix's close does exactly this, late.
    outsideButton("Ask the assistant").focus();
    const details = outsideButton("Details");
    const onCloseAutoFocus = vi.fn();
    const panel = (open: boolean) => (
      <AICompanionPanel onCloseAutoFocus={onCloseAutoFocus} open={open}>
        thread
      </AICompanionPanel>
    );
    const { rerender } = render(panel(false));
    rerender(panel(true));
    expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();

    details.focus();
    rerender(panel(false));
    expect(details).toHaveFocus();
    expect(onCloseAutoFocus).not.toHaveBeenCalled();
  });

  it("is neither opened nor closed by StrictMode's rehearsal of its mount", () => {
    // StrictMode runs every effect, its cleanup, and the effect again. The
    // panel is still in the document through that, so it is no close, and a
    // panel that mounted open is still one nobody opened.
    const onOpenAutoFocus = vi.fn();
    const onCloseAutoFocus = vi.fn();
    const panel = (open: boolean) => (
      <React.StrictMode>
        <AICompanionPanel
          onCloseAutoFocus={onCloseAutoFocus}
          onOpenAutoFocus={onOpenAutoFocus}
          open={open}
        >
          thread
        </AICompanionPanel>
      </React.StrictMode>
    );
    // As a page starts: nothing has focus, which a close would read as lost.
    expect(document.body).toHaveFocus();
    const { unmount } = render(panel(true));
    expect(document.body).toHaveFocus();
    expect(onOpenAutoFocus).not.toHaveBeenCalled();
    expect(onCloseAutoFocus).not.toHaveBeenCalled();
    unmount();

    // Mounted closed and opened later, it opens once and closes once.
    const opener = outsideButton("Ask the assistant");
    opener.focus();
    onCloseAutoFocus.mockClear();
    const { rerender } = render(panel(false));
    rerender(panel(true));
    expect(screen.getByRole("region", { name: "Assistant" })).toHaveFocus();
    expect(onOpenAutoFocus).toHaveBeenCalledTimes(1);
    rerender(panel(false));
    expect(onCloseAutoFocus).toHaveBeenCalledTimes(1);
    expect(opener).toHaveFocus();
  });

  it("hands its ref the panel while it is open", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { rerender } = render(<AICompanionPanel open={false} ref={ref} />);
    expect(ref.current).toBeNull();

    rerender(<AICompanionPanel open ref={ref} />);
    expect(ref.current).toBe(screen.getByRole("region", { name: "Assistant" }));

    rerender(<AICompanionPanel open={false} ref={ref} />);
    expect(ref.current).toBeNull();
  });

  it("gives close a 44px target round the 36px mark the header is drawn for", () => {
    // Row 60: close was 36px to hit. The mark stays 36 so the header keeps
    // the prototype's height; an owned rule carries the 44px target.
    render(<AICompanionPanel onClose={vi.fn()} />);
    const close = screen.getByRole("button", { name: "Close assistant" });
    expect(close).toHaveClass("kozmos-ai-companion-close");
    expect(close).toHaveClass("h-9", "w-9");
  });
});
