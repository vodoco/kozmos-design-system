import { render, screen } from "@testing-library/react";
import { IconButton } from "./IconButton";
import { describe, it, expect } from "vitest";
import { SearchMd as Search } from "@kozmos-ds/icons";

describe("IconButton", () => {
  it("renders correctly", () => {
    render(
      <IconButton aria-label="search">
        <Search />
      </IconButton>,
    );
    expect(screen.getByLabelText("search")).toBeInTheDocument();
  });

  it("keeps icon-only sizes square", () => {
    render(
      <IconButton aria-label="small search" size="sm">
        <Search />
      </IconButton>,
    );
    const button = screen.getByLabelText("small search");

    // The small size reads its density's token: 44 in touch, 28 in compact
    // (decision 82; scripts/check-density.mjs measures both).
    expect(button).toHaveClass("h-icon-control-sm");
    expect(button).toHaveClass("w-icon-control-sm");
    expect(button).toHaveClass("px-0");
    expect(button).not.toHaveClass("rounded-pill");
    expect(button).toHaveClass("kozmos-button");
  });
});

it("draws the large size at 48, the prototype's, beside a 44 field", () => {
  render(
    <IconButton size="lg" aria-label="Filters">
      <svg />
    </IconButton>,
  );
  const button = screen.getByRole("button", { name: "Filters" });
  // 48 in touch, 40 in compact (decision 82).
  expect(button).toHaveClass("h-icon-control-lg", "w-icon-control-lg");
  // The icon is the button's child, where the large size draws it at 20.
  expect(button.querySelector(":scope > svg")).not.toBeNull();
});
