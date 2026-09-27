import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionCard } from "./ActionCard";

describe("ActionCard", () => {
  it("holds rich content under an optional heading and adds nothing to it", () => {
    // Story 5 AC3: results here must open the same details and start the same
    // wayfinding as Agentic Search, which only holds if this does not
    // reimplement a result row.
    render(<ActionCard title="2 results">rows</ActionCard>);
    expect(screen.getByText("2 results")).toBeVisible();
    expect(screen.getByText("rows")).toBeVisible();
  });
});
