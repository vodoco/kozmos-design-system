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

afterEach(() => {
  cleanup();
  document.documentElement.lang = "";
});

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
  it('reads an option\'s count with its words, "POI, 96", outside the item text', () => {
    document.documentElement.lang = "en";
    const thousands = "1,234";
    render(
      <Select open defaultValue="everything">
        <SelectTrigger aria-label="Content">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="everything" count={1234}>
            Everything
          </SelectItem>
          <SelectItem value="poi" count="96">
            POI
          </SelectItem>
          <SelectItem value="virtual">Virtual</SelectItem>
        </SelectContent>
      </Select>,
    );
    const poi = screen.getByRole("option", { name: "POI, 96" });
    expect(poi.querySelector('[data-slot="counter"]')).toHaveTextContent(
      /^96$/,
    );
    // The item text, the words the closed select repeats, holds no count.
    expect(poi.querySelector(".kozmos-option-content")?.textContent).toBe(
      "POI",
    );
    // A number is written and read in the reader's grouping.
    const everything = screen.getByRole("option", {
      name: `Everything, ${thousands}`,
    });
    expect(everything.querySelector('[data-slot="counter"]')).toHaveTextContent(
      thousands,
    );
    // An option with no count is named by its words, as before.
    const virtual = screen.getByRole("option", { name: "Virtual" });
    expect(virtual.querySelector('[data-slot="counter"]')).toBeNull();
  });

  it('names an option whose words are not plain text "words, count" too', () => {
    render(
      <Select open>
        <SelectTrigger aria-label="Content">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="poi" count={96}>
            <span>POI</span>
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    // The same "words, count" as plain words, read from what they draw.
    expect(screen.getByRole("option", { name: "POI, 96" })).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("writes a count in the app's language, the document's lang", () => {
    document.documentElement.lang = "de";
    try {
      render(
        <Select open>
          <SelectTrigger aria-label="Inhalt">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" count={1234}>
              Alles
            </SelectItem>
          </SelectContent>
        </Select>,
      );
      const option = screen.getByRole("option", { name: "Alles, 1.234" });
      expect(option.querySelector('[data-slot="counter"]')).toHaveTextContent(
        /^1\.234$/,
      );
    } finally {
      document.documentElement.lang = "";
    }
  });

  it("lets a caller's aria-label name the option, with a count or without", () => {
    render(
      <Select open>
        <SelectTrigger aria-label="Content">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="poi"
            count={96}
            aria-label="Points of interest: 96"
          >
            POI
          </SelectItem>
          <SelectItem value="virtual" aria-label="Virtual content">
            Virtual
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(
      screen.getByRole("option", { name: "Points of interest: 96" }),
    ).not.toHaveAttribute("aria-labelledby");
    expect(
      screen.getByRole("option", { name: "Virtual content" }),
    ).not.toHaveAttribute("aria-labelledby");
  });

  it("keeps a mixed Select's counts and every check's place, and checks no row", () => {
    render(
      <Select open mixed onResetMixed={() => {}}>
        <SelectTrigger aria-label="Type">
          <SelectValue placeholder="Choose a type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="poi" count={96}>
            POI
          </SelectItem>
          <SelectItem value="virtual" count={4}>
            Virtual
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    for (const [name, count] of [
      ["POI, 96", "96"],
      ["Virtual, 4", "4"],
    ]) {
      const option = screen.getByRole("option", { name });
      expect(option).toHaveAttribute("data-state", "unchecked");
      expect(option.querySelector('[data-slot="counter"]')).toHaveTextContent(
        count,
      );
      const slot = option.lastElementChild as HTMLElement;
      expect(slot).toHaveAttribute("data-slot", "select-item-check");
      expect(slot.querySelector(".kozmos-option-check")).toBeNull();
    }
  });

  it("keeps the check's place on every row, chosen or not", () => {
    render(
      <Select open defaultValue="poi">
        <SelectTrigger aria-label="Content">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="poi" count={96}>
            POI
          </SelectItem>
          <SelectItem value="virtual" count={4}>
            Virtual
          </SelectItem>
        </SelectContent>
      </Select>,
    );
    for (const option of screen.getAllByRole("option")) {
      const slot = option.lastElementChild as HTMLElement;
      expect(slot).toHaveAttribute("data-slot", "select-item-check");
      expect(slot.className).toMatch(/\bh-4\b/);
      expect(slot.className).toMatch(/\bw-4\b/);
    }
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
