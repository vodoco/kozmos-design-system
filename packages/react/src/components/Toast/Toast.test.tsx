import { render, screen } from "@testing-library/react";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastProvider,
  ToastViewport,
  ToastTitle,
} from "./Toast";
import { describe, it, expect } from "vitest";

describe("Toast", () => {
  it("renders correctly", () => {
    render(
      <ToastProvider>
        <Toast open={true}>
          <ToastTitle>Test Toast</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    expect(screen.getByText("Test Toast")).toBeInTheDocument();
  });

  it("draws on the background, as SwiftUI and Compose do, not on whatever is behind it", () => {
    render(
      <ToastProvider>
        <Toast open={true}>
          <ToastTitle>Saved</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    const toast = screen.getByText("Saved").closest("li");
    expect(toast).toHaveClass("bg-background", "text-foreground");
  });

  it("draws a destructive toast's controls in Kozmos roles, not Tailwind's red", () => {
    render(
      <ToastProvider>
        <Toast open={true} className="destructive">
          <ToastTitle>Route failed</ToastTitle>
          <ToastAction altText="Try again">Try again</ToastAction>
          <ToastClose aria-label="Dismiss notification" />
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    // A raw palette step, at any variant: `group-[.destructive]:text-red-300`
    // is a fixed rgb(252 165 165) a re-themed product never reaches.
    const raw =
      /(?:^|[\s:])(?:bg|text|ring|ring-offset|border)-(?:red|rose|slate|gray|zinc|neutral|white|black)(?:-\d{2,3})?(?:\/\d{1,3})?(?=\s|$)/;
    for (const control of [
      screen.getByRole("button", { name: "Dismiss notification" }),
      screen.getByRole("button", { name: "Try again" }),
    ])
      expect(control.className).not.toMatch(raw);
  });
});
