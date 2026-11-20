import { render, screen } from "@testing-library/react";
import { Avatar, AvatarFallback } from "./Avatar";
import { describe, it, expect } from "vitest";

describe("Avatar", () => {
  it("renders fallback when image is missing", () => {
    render(
      <Avatar>
        <AvatarFallback>FB</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("FB")).toBeInTheDocument();
  });

  it("draws 24 with size sm, 40 by default (decision 221)", () => {
    const { container } = render(
      <>
        <Avatar size="sm" data-testid="sm">
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
        <Avatar data-testid="default">
          <AvatarFallback>DF</AvatarFallback>
        </Avatar>
      </>,
    );
    const sm = screen.getByTestId("sm");
    expect(sm).toHaveClass("h-6", "w-6", "text-xs");
    expect(sm).toHaveAttribute("data-size", "sm");
    expect(sm).not.toHaveClass("h-10");
    const fallback = screen.getByTestId("default");
    expect(fallback).toHaveClass("h-10", "w-10");
    expect(fallback).not.toHaveAttribute("data-size");
    expect(container.querySelectorAll(".h-6")).toHaveLength(1);
  });
});
