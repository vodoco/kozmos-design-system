import { render, screen } from "@testing-library/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./Dialog";
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
});
