import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "../../utils/analytics";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
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
    // Floating (decision 139): 16 from its side and the top, 420 wide at
    // most, as tall as its content, every corner the container's.
    expect(dialog).toHaveClass(
      "right-4",
      "top-4",
      "w-[min(26.25rem,calc(100%-2rem))]",
      "max-h-[calc(100%-3rem)]",
      "rounded-container",
    );
    expect(dialog).not.toHaveClass(
      "h-full",
      "inset-y-0",
      "rounded-l-container",
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
      "border-r",
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
