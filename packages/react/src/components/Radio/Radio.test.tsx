import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RadioGroup, RadioGroupItem } from "./Radio";
import "@testing-library/jest-dom/vitest";

describe("RadioGroup", () => {
  it("renders correctly", () => {
    render(
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" label="Option A" />
        <RadioGroupItem value="b" label="Option B" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("renders label associated with the group", () => {
    render(
      <RadioGroup label="Choose option" defaultValue="a">
        <RadioGroupItem value="a" label="Option A" />
      </RadioGroup>,
    );
    const label = screen.getByText("Choose option");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("LABEL");
  });

  it("renders error message with aria-describedby linkage", () => {
    render(
      <RadioGroup error="Selection required" defaultValue="a">
        <RadioGroupItem value="a" label="Option A" />
      </RadioGroup>,
    );
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAttribute("aria-describedby");

    const errorMessage = screen.getByText("Selection required");
    expect(errorMessage).toBeInTheDocument();
    expect(group.getAttribute("aria-describedby")).toBe(errorMessage.id);
  });

  it("renders item labels with correct htmlFor association", () => {
    render(
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" label="Option A" />
      </RadioGroup>,
    );
    const radio = screen.getByRole("radio");
    const label = screen.getByText("Option A");
    expect(label).toHaveAttribute("for", radio.id);
  });

  it("renders item error state", () => {
    render(
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" label="Option A" error />
      </RadioGroup>,
    );
    const radio = screen.getByRole("radio");
    expect(radio).toHaveAttribute("aria-invalid", "true");
    expect(radio).toHaveClass("h-5", "w-5", "border-destructive");
    expect(screen.getByText("Option A")).toHaveClass("text-destructive-text");
  });
});
