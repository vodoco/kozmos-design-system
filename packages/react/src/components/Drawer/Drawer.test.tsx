import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
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

    const dialog = screen.getByRole("dialog");
    // In the region it is rendered in, not in a portal at the body's end.
    expect(screen.getByTestId("region")).toContainElement(dialog);
    expect(dialog).toHaveClass("absolute");
    expect(dialog).not.toHaveClass("fixed");
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
