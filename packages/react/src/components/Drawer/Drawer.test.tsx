import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "../../utils/analytics";
import { AICompanionPanel } from "../AICompanionPanel";
import { Search } from "../Search";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./Drawer";

describe("Drawer", () => {
  it("opens on trigger click", async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsProvider onDispatch={() => {}}>
        <Drawer>
          <DrawerTrigger>Open drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Drawer content</DrawerTitle>
            <DrawerDescription>Drawer description</DrawerDescription>
          </DrawerContent>
        </Drawer>
      </AnalyticsProvider>,
    );

    await user.click(screen.getByText("Open drawer"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Drawer content")).toBeInTheDocument();
  });

  it("applies side metadata for placement-aware styling", async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsProvider onDispatch={() => {}}>
        <Drawer>
          <DrawerTrigger>Open details</DrawerTrigger>
          <DrawerContent side="left">
            <DrawerTitle>Navigation</DrawerTitle>
            <DrawerDescription>Choose a section</DrawerDescription>
          </DrawerContent>
        </Drawer>
      </AnalyticsProvider>,
    );

    await user.click(screen.getByText("Open details"));

    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "left");
  });

  it("inline is drawn in place, absolute, and leaves the page usable (GAP-198)", async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsProvider onDispatch={() => {}}>
        <header>
          <button type="button">Help</button>
        </header>
        <div data-testid="region" style={{ position: "relative" }}>
          <Drawer placement="inline">
            <DrawerTrigger>Get started</DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>Get started</DrawerTitle>
              <DrawerDescription>Tours for this page</DrawerDescription>
            </DrawerContent>
          </Drawer>
        </div>
      </AnalyticsProvider>,
    );

    await user.click(screen.getByText("Get started"));

    // Not modal, a labelled panel beside the page rather than a dialog.
    expect(screen.queryByRole("dialog")).toBeNull();
    const dialog = screen.getByRole("complementary", { name: "Get started" });
    // In the region it is rendered in, not in a portal at the body's end.
    expect(screen.getByTestId("region")).toContainElement(dialog);
    expect(dialog).toHaveClass("absolute");
    expect(dialog).not.toHaveClass("fixed");
    // Floating (decisions 139 and 148): 16 from each edge it reaches, 420
    // wide at most, as tall as its content, its corners and border all round.
    expect(dialog).toHaveClass(
      "right-4",
      "top-4",
      "w-[min(26.25rem,calc(100%-2rem))]",
      "max-h-[calc(100%-2rem)]",
      "rounded-container",
      "border",
    );
    expect(dialog).not.toHaveClass(
      "h-full",
      "inset-y-0",
      "rounded-l-container",
      "border-l",
    );
    // Not modal by default: no scrim, nothing outside hidden from readers,
    // and the header's button still pressable by name.
    expect(document.querySelector(".bg-overlay-scrim")).toBeNull();
    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Help" }).closest("[aria-hidden]"),
    ).toBeNull();
  });

  it("inline and modal draws its scrim over the region alone", async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsProvider onDispatch={() => {}}>
        <div data-testid="region" style={{ position: "relative" }}>
          <Drawer placement="inline" modal>
            <DrawerTrigger>Open</DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>Layers</DrawerTitle>
              <DrawerDescription>Map layers</DrawerDescription>
            </DrawerContent>
          </Drawer>
        </div>
      </AnalyticsProvider>,
    );

    await user.click(screen.getByText("Open"));

    const scrim = document.querySelector(".bg-overlay-scrim");
    expect(scrim).not.toBeNull();
    expect(screen.getByTestId("region")).toContainElement(scrim as HTMLElement);
    expect(scrim).toHaveClass("absolute");
    expect(scrim).not.toHaveClass("fixed");
  });

  it("inline and not modal is a panel, not a dialog: no focus taken when code opens it, no trap, open to presses and focus outside, Escape only from inside", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Page({ open }: { open: boolean }) {
      return (
        <AnalyticsProvider onDispatch={() => {}}>
          <input aria-label="Search" />
          <div style={{ position: "relative" }}>
            <Drawer placement="inline" open={open} onOpenChange={onOpenChange}>
              <DrawerContent>
                <DrawerTitle>Get started</DrawerTitle>
                <DrawerDescription>Tours for this page</DrawerDescription>
                <button type="button">Start the tour</button>
              </DrawerContent>
            </Drawer>
          </div>
          <button type="button">After</button>
        </AnalyticsProvider>
      );
    }
    const { rerender } = render(<Page open={false} />);
    const search = screen.getByRole("textbox", { name: "Search" });
    search.focus();
    rerender(<Page open />);
    const panel = await screen.findByRole("complementary", {
      name: "Get started",
    });
    // The product opened it: focus stays in the field.
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(search).toHaveFocus();
    // Escape from the page leaves it open; a press outside too.
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "After" }));
    expect(onOpenChange).not.toHaveBeenCalled();
    // Tab walks in and out again: Start the tour, Close drawer, After.
    search.focus();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Start the tour" }),
    ).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Close drawer" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    expect(onOpenChange).not.toHaveBeenCalled();
    // Shift+Tab walks back in; Escape from inside closes it.
    await user.tab({ shift: true });
    expect(panel).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("inline and not modal leaves Escape in the page to the page: unprevented, for a real Search and a real AICompanionPanel, and open", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onCompanionClose = vi.fn();
    const seen: boolean[] = [];
    const listen = (event: KeyboardEvent) => {
      if (event.key === "Escape") seen.push(event.defaultPrevented);
    };
    document.addEventListener("keydown", listen);
    render(
      <AnalyticsProvider onDispatch={() => {}}>
        <Search aria-label="Sites" />
        <AICompanionPanel aria-label="Assistant" onClose={onCompanionClose}>
          <button type="button">Ask</button>
        </AICompanionPanel>
        <div style={{ position: "relative" }}>
          <Drawer placement="inline" open onOpenChange={onOpenChange}>
            <DrawerContent>
              <DrawerTitle>Get started</DrawerTitle>
              <DrawerDescription>Tours for this page</DrawerDescription>
            </DrawerContent>
          </Drawer>
        </div>
      </AnalyticsProvider>,
    );
    await screen.findByRole("complementary", { name: "Get started" });
    screen.getByRole("searchbox", { name: "Sites" }).focus();
    await user.keyboard("{Escape}");
    expect(seen).toEqual([false]);
    // AICompanionPanel keeps Escape to itself, so its close is the proof.
    screen.getByRole("button", { name: "Ask" }).focus();
    await user.keyboard("{Escape}");
    expect(onCompanionClose).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    document.removeEventListener("keydown", listen);
  });

  it("inline and not modal puts no focus guards round the page; modal still does", async () => {
    const guards = () =>
      document.querySelectorAll("[data-radix-focus-guard]").length;
    const { rerender } = render(
      <AnalyticsProvider onDispatch={() => {}}>
        <Drawer placement="inline" open>
          <DrawerContent>
            <DrawerTitle>Get started</DrawerTitle>
            <DrawerDescription>Tours for this page</DrawerDescription>
          </DrawerContent>
        </Drawer>
      </AnalyticsProvider>,
    );
    await screen.findByRole("complementary");
    expect(guards()).toBe(0);
    rerender(
      <AnalyticsProvider onDispatch={() => {}}>
        <Drawer placement="inline" modal open>
          <DrawerContent>
            <DrawerTitle>Get started</DrawerTitle>
            <DrawerDescription>Tours for this page</DrawerDescription>
          </DrawerContent>
        </Drawer>
      </AnalyticsProvider>,
    );
    await screen.findByRole("dialog");
    expect(guards()).toBe(2);
  });

  it("inline and not modal lets a product's onKeyDown see Tab, on the content and round it", async () => {
    const user = userEvent.setup();
    const onContent = vi.fn();
    const onAround = vi.fn();
    render(
      <AnalyticsProvider onDispatch={() => {}}>
        <div onKeyDown={onAround} style={{ position: "relative" }}>
          <Drawer placement="inline" open>
            <DrawerContent onKeyDown={onContent} showClose={false}>
              <DrawerTitle>Get started</DrawerTitle>
              <DrawerDescription>Tours for this page</DrawerDescription>
              <button type="button">Start the tour</button>
            </DrawerContent>
          </Drawer>
        </div>
        <button type="button">After</button>
      </AnalyticsProvider>,
    );
    await screen.findByRole("complementary");
    screen.getByRole("button", { name: "Start the tour" }).focus();
    await user.tab();
    expect(onContent).toHaveBeenCalledWith(
      expect.objectContaining({ key: "Tab" }),
    );
    expect(onAround).toHaveBeenCalledWith(
      expect.objectContaining({ key: "Tab" }),
    );
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("inline and not modal is named by its title, described by its description, and its trigger controls it as a panel", async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsProvider onDispatch={() => {}}>
        <div style={{ position: "relative" }}>
          <Drawer placement="inline">
            <DrawerTrigger>Open</DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>Get started</DrawerTitle>
              <DrawerDescription>Tours for this page</DrawerDescription>
            </DrawerContent>
          </Drawer>
        </div>
      </AnalyticsProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger).not.toHaveAttribute("aria-haspopup");
    await user.click(trigger);
    const panel = await screen.findByRole("complementary", {
      name: "Get started",
    });
    expect(panel).toHaveAccessibleDescription("Tours for this page");
    expect(trigger).toHaveAttribute("aria-controls", panel.id);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("names its close with closeLabel, and draws it and its header's room on logical sides", () => {
    render(
      <AnalyticsProvider onDispatch={() => {}}>
        <Drawer open>
          <DrawerContent closeLabel="Kapat">
            <DrawerHeader data-testid="header">
              <DrawerTitle>Katmanlar</DrawerTitle>
              <DrawerDescription>Harita katmanları</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      </AnalyticsProvider>,
    );
    const close = screen.getByRole("button", { name: "Kapat" });
    expect(close).toHaveClass("end-4");
    expect(close).not.toHaveClass("right-4");
    const header = screen.getByTestId("header");
    expect(header).toHaveClass("text-start");
    expect(header).not.toHaveClass("text-left");
    expect(header.className).toMatch(/\bpe-\[/);
    expect(header.className).not.toMatch(/\bpr-\[/);
  });

  it("inline and not modal keeps Radix's callbacks: Escape from inside can be refused, and a press outside can close it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    let refuse = true;
    render(
      <AnalyticsProvider onDispatch={() => {}}>
        <div style={{ position: "relative" }}>
          <Drawer placement="inline" defaultOpen onOpenChange={onOpenChange}>
            <DrawerContent
              onEscapeKeyDown={(event) => {
                if (refuse) event.preventDefault();
              }}
              onInteractOutside={() => onOpenChange("outside")}
            >
              <DrawerTitle>Get started</DrawerTitle>
              <DrawerDescription>Tours for this page</DrawerDescription>
              <button type="button">Start the tour</button>
            </DrawerContent>
          </Drawer>
        </div>
        <button type="button">After</button>
      </AnalyticsProvider>,
    );
    const panel = await screen.findByRole("complementary");
    screen.getByRole("button", { name: "Start the tour" }).focus();
    await user.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(panel).toBeInTheDocument();
    refuse = false;
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("complementary")).toBeNull());
    await user.click(screen.getByRole("button", { name: "After" }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("inline and not modal keeps focus callbacks: a product moves focus in from onOpenAutoFocus, and onCloseAutoFocus can keep it from the trigger", async () => {
    const onCloseAutoFocus = vi.fn((event: Event) => event.preventDefault());
    function Page({ open }: { open: boolean }) {
      const tour = React.useRef<HTMLButtonElement>(null);
      return (
        <AnalyticsProvider onDispatch={() => {}}>
          <div style={{ position: "relative" }}>
            <Drawer placement="inline" open={open}>
              <DrawerTrigger>Get started</DrawerTrigger>
              <DrawerContent
                onOpenAutoFocus={() => tour.current?.focus()}
                onCloseAutoFocus={onCloseAutoFocus}
              >
                <DrawerTitle>Get started</DrawerTitle>
                <DrawerDescription>Tours for this page</DrawerDescription>
                <button ref={tour} type="button">
                  Start the tour
                </button>
              </DrawerContent>
            </Drawer>
          </div>
        </AnalyticsProvider>
      );
    }
    const { rerender } = render(<Page open={false} />);
    rerender(<Page open />);
    await screen.findByRole("complementary");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Start the tour" }),
      ).toHaveFocus(),
    );
    rerender(<Page open={false} />);
    await waitFor(() => expect(onCloseAutoFocus).toHaveBeenCalled());
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(
      screen.getByRole("button", { name: "Get started" }),
    ).not.toHaveFocus();
  });

  it("inline and not modal closes from its close, uncontrolled, tracks it once, and gives its trigger focus", async () => {
    const user = userEvent.setup();
    const onDispatch = vi.fn();
    render(
      <AnalyticsProvider onDispatch={onDispatch} batchDelayMs={10}>
        <div style={{ position: "relative" }}>
          <Drawer placement="inline">
            <DrawerTrigger>Get started</DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>Get started</DrawerTitle>
              <DrawerDescription>Tours for this page</DrawerDescription>
            </DrawerContent>
          </Drawer>
        </div>
      </AnalyticsProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Get started" }));
    await screen.findByRole("complementary");
    await user.click(screen.getByRole("button", { name: "Close drawer" }));
    await waitFor(() => expect(screen.queryByRole("complementary")).toBeNull());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Get started" })).toHaveFocus(),
    );
    await waitFor(() => expect(onDispatch).toHaveBeenCalled());
    const events = onDispatch.mock.calls
      .flatMap(([batch]) => batch)
      .map((event) => event.eventName);
    expect(events).toEqual(["drawer_opened", "drawer_closed"]);
  });

  it("inline and not modal takes focus when its trigger opens it", async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsProvider onDispatch={() => {}}>
        <div style={{ position: "relative" }}>
          <Drawer placement="inline">
            <DrawerTrigger>Get started</DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>Get started</DrawerTitle>
              <DrawerDescription>Tours for this page</DrawerDescription>
              <button type="button">Start the tour</button>
            </DrawerContent>
          </Drawer>
        </div>
      </AnalyticsProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Get started" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Start the tour" }),
      ).toHaveFocus(),
    );
  });

  it("inline on the left floats at the left; on the top or bottom it stays at its edge", () => {
    const { rerender } = render(
      <AnalyticsProvider onDispatch={() => {}}>
        <Drawer placement="inline" open>
          <DrawerContent side="left">
            <DrawerTitle>Layers</DrawerTitle>
            <DrawerDescription>Map layers</DrawerDescription>
          </DrawerContent>
        </Drawer>
      </AnalyticsProvider>,
    );
    expect(screen.getByRole("complementary")).toHaveClass(
      "left-4",
      "top-4",
      "rounded-container",
      "border",
    );
    rerender(
      <AnalyticsProvider onDispatch={() => {}}>
        <Drawer placement="inline" open>
          <DrawerContent side="bottom">
            <DrawerTitle>Layers</DrawerTitle>
            <DrawerDescription>Map layers</DrawerDescription>
          </DrawerContent>
        </Drawer>
      </AnalyticsProvider>,
    );
    expect(screen.getByRole("complementary")).toHaveClass(
      "inset-x-0",
      "bottom-0",
      "rounded-t-container",
    );
  });

  it("fixed, the default, is drawn outside the box it is rendered in, modal", async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsProvider onDispatch={() => {}}>
        <div data-testid="region" style={{ position: "relative" }}>
          <Drawer>
            <DrawerTrigger>Open</DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>Layers</DrawerTitle>
              <DrawerDescription>Map layers</DrawerDescription>
            </DrawerContent>
          </Drawer>
        </div>
      </AnalyticsProvider>,
    );

    await user.click(screen.getByText("Open"));

    const dialog = screen.getByRole("dialog");
    expect(screen.getByTestId("region")).not.toContainElement(dialog);
    expect(dialog).toHaveClass("fixed");
    expect(document.querySelector(".bg-overlay-scrim")).not.toBeNull();
  });
});
