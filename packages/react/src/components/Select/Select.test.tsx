import { render, screen, cleanup } from "@testing-library/react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./Select";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(cleanup);

describe("Select", () => {
  it("merges consumer descriptions without allowing an error to be hidden", () => {
    render(
      <>
        <p id="hint">Choose one</p>
        <Select>
          <SelectTrigger
            aria-label="Fruit"
            aria-describedby="hint"
            aria-invalid={false}
            error="Required"
          >
            <SelectValue />
          </SelectTrigger>
        </Select>
      </>,
    );
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAccessibleDescription("Choose one Required");
  });
  it("renders correctly", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText("Select")).toBeInTheDocument();
  });

  it("renders error messages and aria attributes correctly", () => {
    const { getByRole, getByText } = render(
      <Select>
        <SelectTrigger error="Selection required">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
      </Select>,
    );
    const trigger = getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAttribute("aria-describedby");

    const errorMessage = getByText("Selection required");
    expect(errorMessage).toBeInTheDocument();
    expect(trigger.getAttribute("aria-describedby")).toBe(errorMessage.id);
  });

  // GAP-164: a count in an option.
  it("reads an option's count with its words, outside the item text", () => {
    render(
      <Select open defaultValue="everything">
        <SelectTrigger aria-label="Content">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="everything" count={128}>
            Everything
          </SelectItem>
          <SelectItem value="poi" count="96">
            POI
          </SelectItem>
          <SelectItem value="virtual">Virtual</SelectItem>
        </SelectContent>
      </Select>,
    );
    const poi = screen.getByRole("option", { name: "POI 96" });
    const count = poi.querySelector('[data-slot="counter"]');
    expect(count).toHaveTextContent("96");
    // The item text, the words the closed select repeats, holds no count.
    const text = document.getElementById(
      (poi.getAttribute("aria-labelledby") ?? "").split(" ")[0],
    );
    expect(text).toHaveTextContent(/^POI$/);
    expect(
      screen.getByRole("option", { name: "Everything 128" }),
    ).toBeInTheDocument();
    // An option with no count is named by its words, as before.
    const virtual = screen.getByRole("option", { name: "Virtual" });
    expect(virtual.querySelector('[data-slot="counter"]')).toBeNull();
  });

  it("shows the chosen option's words alone in the closed select", () => {
    render(
      <Select defaultValue="poi">
        <SelectTrigger aria-label="Content">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="poi" count={96}>
            POI
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "Content" })).toHaveTextContent(
      /^POI$/,
    );
  });
});
