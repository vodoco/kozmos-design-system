import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AIMessage } from "./AIMessage";

describe("AIMessage", () => {
  it("streams an acknowledgement beside its dots, not instead of it", () => {
    // Story 10 counts a streamed acknowledgement as the first visible
    // response, so the words must show while the dots are still going.
    render(<AIMessage status="streaming">Looking through this building…</AIMessage>);
    expect(screen.getByText("Looking through this building…")).toBeVisible();
    expect(screen.getByText("Assistant is replying")).toHaveClass("sr-only");
  });

  it("says plainly when a turn timed out", () => {
    // Story 10's ten-second stop: a thread that simply stops reads the same
    // as one still thinking.
    render(<AIMessage status="timedOut" />);
    expect(screen.getByText("The assistant did not reply in time.")).toBeVisible();
  });

  it("carries rich content under the bubble", () => {
    render(<AIMessage actionCard={<span>rows</span>}>Found it</AIMessage>);
    expect(screen.getByText("rows")).toBeVisible();
  });
});
