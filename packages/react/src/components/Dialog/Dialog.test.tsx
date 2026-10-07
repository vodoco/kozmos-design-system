import { render, screen } from "@testing-library/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
});
