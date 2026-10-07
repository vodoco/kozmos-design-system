import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DatePicker, DateRangePicker } from "./DatePicker";
import { TimePicker } from "../TimePicker/TimePicker";

for (const [name, Control] of [
  ["DatePicker", DatePicker],
  ["TimePicker", TimePicker],
] as const) {
  describe(name, () => {
    it("merges consumer guidance with owned error and cannot hide invalid state", () => {
      render(
        <Control
          label="Value"
          aria-describedby="external external"
          aria-invalid={false}
          error="Invalid value"
        />,
      );
      const input = screen.getByLabelText("Value");
      const error = screen.getByText("Invalid value");
      expect(input).toHaveAttribute("aria-describedby", `external ${error.id}`);
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
    it("preserves consumer invalid spelling and helper text for an empty error", () => {
      render(
        <Control
          label="Value"
          aria-invalid="spelling"
          aria-describedby="external"
          error=""
          helperText="Help"
        />,
      );
      expect(screen.getByLabelText("Value")).toHaveAttribute(
        "aria-invalid",
        "spelling",
      );
      expect(screen.getByLabelText("Value")).toHaveAttribute(
        "aria-describedby",
        `external ${screen.getByText("Help").id}`,
      );
    });
  });
}
describe("DateRangePicker native limits", () => {
  it("does not relax outer min/max when the other date lies outside the range", () => {
    render(
      <DateRangePicker
        min="2026-09-10"
        max="2026-09-20"
        value={{ start: "2026-09-01", end: "2026-09-30" }}
      />,
    );
    expect(screen.getByLabelText("Start date")).toHaveAttribute(
      "max",
      "2026-09-20",
    );
    expect(screen.getByLabelText("End date")).toHaveAttribute(
      "min",
      "2026-09-10",
    );
  });
});
