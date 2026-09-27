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

    expect(button).toHaveClass("h-11");
    expect(button).toHaveClass("w-11");
    expect(button).toHaveClass("px-0");
    expect(button).not.toHaveClass("rounded-pill");
    expect(button).toHaveClass("kozmos-button");
  });
});

it("draws the large size at 48, the prototype's, beside a 44 field", () => {
  render(<IconButton size="lg" aria-label="Filters" icon={<svg />} />);
  expect(screen.getByRole("button", { name: "Filters" })).toHaveClass(
    "h-12",
    "w-12",
  );
});
