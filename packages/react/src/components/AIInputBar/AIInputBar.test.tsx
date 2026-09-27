import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AIInputBar } from "./AIInputBar";

const submit = () =>
  fireEvent.submit(screen.getByRole("button", { name: "Send" }).closest("form")!);

describe("AIInputBar", () => {
  it("never sends an empty or whitespace-only question, and trims what it does send", () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <AIInputBar onSubmit={onSubmit} onValueChange={vi.fn()} value="   " />,
    );
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    submit();
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <AIInputBar
        onSubmit={onSubmit}
        onValueChange={vi.fn()}
        value="  where is a quiet desk  "
      />,
    );
    submit();
    // No product should have to trim what it is handed.
    expect(onSubmit).toHaveBeenCalledWith("where is a quiet desk");
  });
});
