import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserMessage } from "./UserMessage";

describe("UserMessage", () => {
  it("is filled and right-aligned, so it differs from the assistant by more than colour", () => {
    const { container } = render(<UserMessage>Visitor turn</UserMessage>);
    expect(container.querySelector(".justify-end")).not.toBeNull();
    expect(screen.getByText("Visitor turn")).toHaveClass("bg-primary");
  });
});
