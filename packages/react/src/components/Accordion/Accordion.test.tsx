import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./Accordion";
import { describe, it, expect } from "vitest";

describe("Accordion", () => {
  it("expands and collapses", () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const trigger = screen.getByText("Trigger");
    fireEvent.click(trigger);
    expect(screen.getByText("Content")).toBeVisible();
  });

  // Every existing use renders as it did: the classes are the ones Accordion
  // has always carried, and neither the form's DOM nor its marks are added.
  it("draws the default form as it always has", () => {
    const { container } = render(
      <Accordion type="single" defaultValue="one">
        <AccordionItem value="one">
          <AccordionTrigger>Title</AccordionTrigger>
          <AccordionContent>Body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const root = container.firstElementChild!;
    const item = root.firstElementChild!;
    const header = item.firstElementChild!;
    const trigger = header.firstElementChild!;
    const region = item.querySelector('[role="region"]')!;

    expect(root.getAttribute("class")).toBeNull();
    expect(item.className).toBe("border-b");
    expect(header.className).toBe("flex");
    expect(trigger.className).toBe(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
    );
    expect(Array.from(trigger.childNodes, (node) => node.nodeName)).toEqual([
      "#text",
      "svg",
    ]);
    expect(trigger.querySelector("svg")?.getAttribute("class")).toContain(
      "kozmos-accordion-chevron h-4 w-4 shrink-0",
    );
    expect(region.className).toBe(
      "kozmos-accordion-content overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
    );
    expect(region.firstElementChild?.className).toBe("pb-4 pt-0");
  });

  it("draws neither a label nor an icon in the default form", () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="one">
          <AccordionTrigger icon={<svg data-testid="icon" />} label="Step 1/5">
            Title
          </AccordionTrigger>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.queryByText("Step 1/5")).toBeNull();
    expect(screen.queryByTestId("icon")).toBeNull();
    expect(screen.getByRole("button").textContent).toBe("Title");
  });

  it("takes the root's className beside the boxed form's", () => {
    const { container } = render(
      <Accordion type="multiple" variant="boxed" className="mine">
        <AccordionItem value="one">
          <AccordionTrigger>Title</AccordionTrigger>
        </AccordionItem>
      </Accordion>,
    );
    expect(container.firstElementChild).toHaveClass(
      "kozmos-accordion-boxed",
      "mine",
    );
    expect(container.firstElementChild).not.toHaveAttribute("variant");
  });

  describe('variant="boxed"', () => {
    function Sections({
      loading = false,
      disabled = false,
    }: {
      loading?: boolean;
      disabled?: boolean;
    }) {
      return (
        <Accordion type="single" variant="boxed" defaultValue="one" collapsible>
          <AccordionItem value="one">
            <AccordionTrigger
              icon={<svg data-testid="icon" />}
              label="Step 1/5"
            >
              Building details
            </AccordionTrigger>
            <AccordionContent className="mine">The form</AccordionContent>
          </AccordionItem>
          <AccordionItem value="two" disabled={disabled}>
            <AccordionTrigger label="Step 2/5" loading={loading}>
              Levels
            </AccordionTrigger>
            <AccordionContent>More</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    it("says the label before the title, and draws no rule on the item", () => {
      const { container } = render(<Sections />);
      expect(
        screen.getByRole("button", { name: "Step 1/5 Building details" }),
      ).toHaveAttribute("aria-expanded", "true");
      expect(container.querySelector(".border-b")).toBeNull();
    });

    it("draws the icon first and the chevron last", () => {
      render(<Sections />);
      const trigger = screen.getByRole("button", { name: /Building details/ });
      expect(trigger.firstElementChild).toBe(screen.getByTestId("icon"));
      expect(trigger.lastElementChild).toHaveClass("kozmos-accordion-chevron");
    });

    it("keeps a caller's class on the content's body", () => {
      render(<Sections />);
      expect(screen.getByText("The form")).toHaveClass(
        "kozmos-accordion-body",
        "mine",
      );
    });

    it("leaves the content unclipped at rest", () => {
      render(<Sections />);
      expect(screen.getByRole("region")).not.toHaveClass("overflow-hidden");
    });

    it("is busy and disabled while loading, with a spinner for a chevron", () => {
      render(<Sections loading />);
      const trigger = screen.getByRole("button", { name: /Levels/ });
      expect(trigger).toBeDisabled();
      expect(trigger).toHaveAttribute("aria-busy", "true");
      expect(trigger.querySelector(".kozmos-accordion-chevron")).toBeNull();
      expect(trigger.lastElementChild).toHaveClass("kozmos-spinner-arc");
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("goes back to a chevron when loading ends", () => {
      const { rerender } = render(<Sections loading />);
      rerender(<Sections />);
      const trigger = screen.getByRole("button", { name: /Levels/ });
      expect(trigger).toBeEnabled();
      expect(trigger).not.toHaveAttribute("aria-busy");
      expect(trigger.lastElementChild).toHaveClass("kozmos-accordion-chevron");
    });

    // `loading={false}` must not clear the item's own `disabled`: Radix hands
    // the trigger that state as the same attribute a loading trigger sets.
    it("keeps the item's disabled while not loading", () => {
      render(<Sections disabled />);
      const trigger = screen.getByRole("button", { name: /Levels/ });
      expect(trigger).toBeDisabled();
      expect(trigger).not.toHaveAttribute("aria-busy");
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("has no accessibility violations", async () => {
      const { container } = render(<Sections loading />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
