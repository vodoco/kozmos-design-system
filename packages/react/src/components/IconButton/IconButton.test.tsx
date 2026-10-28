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

it("draws a counter read with its name, once (GAP-197)", () => {
  const { rerender } = render(
    <IconButton aria-label="Help" counter={3}>
      <Search aria-hidden="true" />
    </IconButton>,
  );
  // The count joins the name; the drawn number is hidden from readers.
  const button = screen.getByRole("button", { name: "Help, 3" });
  const counter = button.querySelector('[data-slot="counter"]');
  expect(counter).toHaveTextContent("3");
  expect(counter).toHaveAttribute("aria-hidden", "true");
  expect(counter).toHaveClass("kozmos-icon-button-counter", "bg-theme-fill");
  expect(button).toHaveClass("kozmos-icon-button-counted");

  // In the product's words.
  rerender(
    <IconButton
      aria-label="Ayuda"
      counter={2}
      counterLabel={(count) => `${count} recorridos pendientes`}
    >
      <Search aria-hidden="true" />
    </IconButton>,
  );
  expect(
    screen.getByRole("button", { name: "Ayuda, 2 recorridos pendientes" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button")).toHaveTextContent("2");

  // Named by its content, the count is read from a hidden line.
  rerender(
    <IconButton counter={5}>
      <Search aria-hidden="true" />
      <span className="sr-only">Notices</span>
    </IconButton>,
  );
  expect(
    screen.getByRole("button", { name: /^Notices\s*, 5$/ }),
  ).toBeInTheDocument();

  // Unset, the button as it was.
  rerender(
    <IconButton aria-label="Help">
      <Search aria-hidden="true" />
    </IconButton>,
  );
  expect(screen.getByRole("button", { name: "Help" })).not.toHaveClass(
    "kozmos-icon-button-counted",
  );
  expect(
    screen.getByRole("button").querySelector('[data-slot="counter"]'),
  ).toBeNull();
});

// A caller that names the button with aria-labelledby set no aria-label, so
// the count was read nowhere: the hidden line was skipped for the name the
// caller pointed at. The count joins that name now, after the separator.
it("reads the count with a name from aria-labelledby", () => {
  render(
    <>
      <span id="help-name">Help</span>
      <IconButton
        aria-labelledby="help-name"
        counter={3}
        counterLabel={(count) => `${count} tours left`}
      >
        <Search aria-hidden="true" />
      </IconButton>
    </>,
  );
  expect(
    screen.getByRole("button", { name: /^Help\s*, 3 tours left$/ }),
  ).toBeInTheDocument();
});

// The words between the name and the count are the product's, as the
// count's own are: ", " by default, as English writes it.
it("joins the name and the count with counterSeparator", () => {
  const { rerender } = render(
    <IconButton aria-label="ヘルプ" counter={3} counterSeparator="、">
      <Search aria-hidden="true" />
    </IconButton>,
  );
  expect(screen.getByRole("button", { name: "ヘルプ、3" })).toBeInTheDocument();
  rerender(
    <IconButton counter={5} counterSeparator="、">
      <Search aria-hidden="true" />
      <span className="sr-only">お知らせ</span>
    </IconButton>,
  );
  expect(
    screen.getByRole("button", { name: /^お知らせ\s*、5$/ }),
  ).toBeInTheDocument();
});
