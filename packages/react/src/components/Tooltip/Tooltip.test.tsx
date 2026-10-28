import { render, screen } from "@testing-library/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./Tooltip";
import { describe, it, expect } from "vitest";
import { axe } from "vitest-axe";
import "@testing-library/jest-dom/vitest";

describe("Tooltip", () => {
  it("renders trigger correctly", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("renders tooltip content in the DOM (sr-only until activated)", () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    // Radix renders tooltip content as a visually hidden span for screen readers
    // even before pointer activation. With open=true, the content should be queryable.
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("overlaps its tip 1px into the body, as Figma's does (site GAP-74)", () => {
    // Flush against the bordered body, the tip left the border running
    // across it. scripts/check-site-gaps.mjs reads the join's pixels on
    // every side in every engine.
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const tip = document.querySelector("[data-side] svg");
    expect(tip).not.toBeNull();
    expect(tip).toHaveClass("-translate-y-px", "fill-popover");
    expect(tip).toHaveAttribute("width", "8");
    expect(tip).toHaveAttribute("height", "4");
  });

  it("keeps a disabled trigger reachable by keyboard", () => {
    // The case the whole prop exists for. A disabled <button> emits no
    // pointer events and cannot take focus, so without the wrapper the
    // tooltip is silently dead — and a wrapper WITHOUT tabIndex is dead
    // only for keyboard users, which is worse because hovering still works
    // and it looks fixed.
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger disabled>
            <button disabled>Combine</button>
          </TooltipTrigger>
          <TooltipContent>Select two adjacent levels first</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const button = screen.getByText("Combine");
    const wrapper = button.parentElement as HTMLElement;
    expect(wrapper).toHaveAttribute("data-disabled-trigger");
    expect(wrapper).toHaveAttribute("tabindex", "0");

    wrapper.focus();
    expect(document.activeElement).toBe(wrapper);
  });

  it("does not wrap a trigger that is not disabled", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(document.querySelector("[data-disabled-trigger]")).toBeNull();
  });

  it("describes a disabled trigger to a screen reader, not just to the eye", async () => {
    // Focus alone shows the bubble to a sighted keyboard user and announces
    // nothing. A focusable wrapper with no description reaches the reason
    // silently — the same failure as the missing tab stop, one step later.
    // Radix wires describedby because the wrapper IS the trigger; a
    // hand-rolled bubble has to do it by hand and usually doesn't.
    const { container } = render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger disabled>
            <button disabled>Combine</button>
          </TooltipTrigger>
          <TooltipContent>Shift-click another feature first</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const wrapper = screen.getByText("Combine").parentElement as HTMLElement;
    const describedby = wrapper.getAttribute("aria-describedby");
    expect(describedby).toBeTruthy();
    expect(
      document.getElementById(describedby as string)?.textContent,
    ).toContain("Shift-click");

    // A focusable element with no accessible name is the trap this could
    // have introduced.
    const results = await axe(container);
    expect(
      (results as unknown as { violations: unknown[] }).violations,
    ).toHaveLength(0);
  });
});
