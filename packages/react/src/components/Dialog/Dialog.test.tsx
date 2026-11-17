import { render, screen } from "@testing-library/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "./Dialog";
import { Button } from "../Button";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";

describe("Dialog", () => {
  it("localizes the recovery close action", () => {
    render(
      <Dialog open>
        <DialogContent closeLabel="Schließen">
          <DialogTitle>Route</DialogTitle>
          <DialogDescription>Keine Route</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(
      screen.getByRole("button", { name: "Schließen" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Schließen" })).toHaveClass(
      "kozmos-button",
      "kozmos-button-outline",
    );
    expect(screen.getByRole("button", { name: "Schließen" })).toHaveAttribute(
      "type",
      "button",
    );
  });
  it("offers a stacked action layout without reversing reading or keyboard order", () => {
    render(
      <DialogFooter layout="stacked" data-testid="actions">
        <Button>Choose another starting point</Button>
        <Button variant="ghost">Explore map</Button>
      </DialogFooter>,
    );
    const footer = screen.getByTestId("actions");
    expect(footer).toHaveAttribute("data-layout", "stacked");
    expect(footer).toHaveClass("flex-col");
    expect(footer).not.toHaveClass("flex-col-reverse", "sm:flex-row");
    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["Choose another starting point", "Explore map"]);
  });
  it("renders correctly", () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>Content</DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Open")).toBeInTheDocument();
  });
  it("keeps the existing responsive footer as the default", () => {
    render(<DialogFooter data-testid="footer" />);
    expect(screen.getByTestId("footer")).toHaveClass(
      "flex-col-reverse",
      "sm:flex-row",
    );
  });
  it("dismisses through the shared icon button and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open recovery</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Starting position unavailable</DialogTitle>
          <DialogDescription>Choose a known starting point.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open recovery" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open recovery" })).toHaveFocus();
  });

  it("takes size full: the window less 16 each side, the header then the rest (decision 202)", () => {
    render(
      <Dialog open>
        <DialogContent size="full">
          <DialogHeader>
            <DialogTitle>Image 1</DialogTitle>
          </DialogHeader>
          <img src="https://cdn.example/a.jpg" alt="Main entrance" />
        </DialogContent>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Image 1" });
    expect(dialog).toHaveAttribute("data-size", "full");
    expect(dialog).toHaveClass(
      "kozmos-dialog-content",
      "w-[calc(100%-2rem)]",
      "h-[calc(100dvh-2rem)]",
      "max-w-none",
      "grid-rows-[auto_minmax(0,1fr)]",
    );
    expect(dialog).not.toHaveClass("max-w-lg");
    // Its close and focus are any Dialog's.
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
  it("keeps the default size at most 512 wide", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Route</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Route" });
    expect(dialog).toHaveAttribute("data-size", "default");
    expect(dialog).toHaveClass("max-w-lg");
    expect(dialog).not.toHaveClass("max-w-none", "h-[calc(100dvh-2rem)]");
  });
  it("draws DialogHeader's media above the title, decorative unless named (decision 195)", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader
            data-testid="header"
            media={<img src="https://cdn.example/hero.svg" alt="" />}
          >
            <DialogTitle>Interested in Analytics?</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    const header = screen.getByTestId("header");
    const media = header.firstElementChild as HTMLElement;
    expect(media).toHaveClass("kozmos-dialog-media");
    expect(media).toHaveAttribute("aria-hidden", "true");
    expect(media).not.toHaveAttribute("data-bleed");
    // Above the title, in order.
    expect(media.nextElementSibling).toBe(
      screen.getByRole("heading", { name: "Interested in Analytics?" }),
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
  it("reads named media as one image, and marks media that bleeds", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader
            media={<img src="https://cdn.example/hero.svg" alt="" />}
            mediaLabel="Charts rising over a floor plan"
            mediaBleed
          >
            <DialogTitle>Interested in Analytics?</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    const media = screen.getByRole("img", {
      name: "Charts rising over a floor plan",
    });
    expect(media).toHaveClass("kozmos-dialog-media");
    expect(media).toHaveAttribute("data-bleed", "");
    expect(media).not.toHaveAttribute("aria-hidden");
    // The close keeps its place, the dialog's last child, after the header.
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass(
      "kozmos-dialog-close",
    );
  });
  it("draws no media box without media", () => {
    render(
      <DialogHeader data-testid="header">
        <span>Title</span>
      </DialogHeader>,
    );
    expect(
      screen.getByTestId("header").querySelector(".kozmos-dialog-media"),
    ).toBeNull();
  });
});
