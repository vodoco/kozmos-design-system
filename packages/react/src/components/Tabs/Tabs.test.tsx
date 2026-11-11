import { render, screen } from "@testing-library/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
import { describe, it, expect } from "vitest";

describe("Tabs", () => {
  it("renders correctly", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  // GAP-152: an icon over the tab's words.
  it("stacks an icon over its words, drawn only, so the tab is named by its words", () => {
    render(
      <Tabs defaultValue="poi">
        <TabsList>
          <TabsTrigger
            value="poi"
            icon={<svg role="img" aria-label="Pin" data-testid="pin" />}
          >
            POI
          </TabsTrigger>
          <TabsTrigger value="virtual">Virtual</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const tab = screen.getByRole("tab", { name: "POI" });
    const icon = screen.getByTestId("pin").parentElement as HTMLElement;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("data-slot", "tabs-trigger-icon");
    // The icon comes first, in a column: it sits over the words.
    expect(tab.firstElementChild).toBe(icon);
    expect(tab.className).toMatch(/\bflex-col\b/);
    expect(tab.className).toMatch(/\bgap-1\b/);
    // The raised active tab is kept (decision 65).
    expect(tab).toHaveAttribute("data-state", "active");
    expect(tab.className).toContain("data-[state=active]:shadow-raised");
    // The list grows to hold the stack.
    expect(screen.getByRole("tablist").className).toContain(
      "has-[[data-slot=tabs-trigger-icon]]:h-auto",
    );
  });

  it("draws a tab without an icon as one row, its child untouched for asChild", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Account</TabsTrigger>
          <TabsTrigger value="b" asChild>
            <a href="#b">Billing</a>
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const tab = screen.getByRole("tab", { name: "Account" });
    expect(tab.className).not.toMatch(/\bflex-col\b/);
    expect(tab.querySelector('[data-slot="tabs-trigger-icon"]')).toBeNull();
    expect(screen.getByRole("tab", { name: "Billing" }).tagName).toBe("A");
  });
});
