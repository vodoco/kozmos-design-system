import { render, screen } from "@testing-library/react";
import { Toast, ToastProvider, ToastViewport, ToastTitle } from "./Toast";
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
});
