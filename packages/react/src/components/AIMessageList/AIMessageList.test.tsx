import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AIMessageList } from "./AIMessageList";

describe("AIMessageList", () => {
  it("announces the thread politely, as a log", () => {
    // Story 5 AC2 and Story 10: turns arrive over time and must be heard
    // without taking the visitor's place. Assertive would interrupt.
    render(<AIMessageList>a turn</AIMessageList>);
    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log).toHaveAccessibleName("Assistant conversation");
  });
});
