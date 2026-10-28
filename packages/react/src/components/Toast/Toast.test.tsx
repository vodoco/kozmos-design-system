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

  // GAP-182: the close shows only a cross. SwiftUI and Compose name theirs
  // "Dismiss notification" and take a product's own words; React's had no
  // name of its own unless the caller passed one.
  it("names the close Dismiss notification when a product passes no name", () => {
    render(
      <ToastProvider>
        <Toast open={true}>
          <ToastTitle>Saved</ToastTitle>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Dismiss notification" }),
    ).toBeInTheDocument();
  });

  it("names the close in a product's own words", () => {
    render(
      <ToastProvider>
        <Toast open={true}>
          <ToastTitle>Gespeichert</ToastTitle>
          <ToastClose aria-label="Mitteilung schließen" />
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Mitteilung schließen" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Dismiss notification" }),
    ).not.toBeInTheDocument();
  });

  // GAP-167: toast()'s tones, on the part as well. A tone draws its icon in
  // the start padding, in the tone's text colour; no tone changes nothing.
  it("draws a tone's icon in the tone's colour, and nothing without one", () => {
    render(
      <ToastProvider>
        <Toast open={true} tone="warning">
          <ToastTitle>Location is approximate</ToastTitle>
        </Toast>
        <Toast open={true}>
          <ToastTitle>Saved</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    const toned = screen.getByText("Location is approximate").closest("li")!;
    expect(toned).toHaveAttribute("data-tone", "warning");
    expect(toned).toHaveClass("ps-14");
    const icon = toned.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("text-warning-text", "absolute", "start-6");
    const plain = screen.getByText("Saved").closest("li")!;
    expect(plain).not.toHaveAttribute("data-tone");
    expect(plain).not.toHaveClass("ps-14");
    expect(plain.querySelector("svg")).toBeNull();
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
