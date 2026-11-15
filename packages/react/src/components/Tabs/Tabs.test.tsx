import * as React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

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
    // The list's height (measured in e2e/Tabs.spec.tsx) comes from rules a
    // caller's own height class beats.
    expect(screen.getByRole("tablist").className).toContain(
      "[:where(&:not(:has([data-slot=tabs-trigger-icon])))]:h-10",
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

  it("keeps an asChild tab the caller's element, with the icon inside it", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Account</TabsTrigger>
          <TabsTrigger value="b" asChild icon={<svg data-testid="card" />}>
            <a href="#b">Billing</a>
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const tab = screen.getByRole("tab", { name: "Billing" });
    expect(tab.tagName).toBe("A");
    expect(tab).toHaveAttribute("href", "#b");
    expect(tab).toHaveAttribute("aria-selected", "false");
    const icon = screen.getByTestId("card").parentElement as HTMLElement;
    expect(icon.parentElement).toBe(tab);
    expect(tab.firstElementChild).toBe(icon);
    expect(tab.className).toMatch(/\bflex-col\b/);
  });
});

// GAP-254, decision 182: a list wider than its space scrolls inside its
// track, its selected tab kept in view. jsdom lays nothing out, so these
// tests give the list and its tabs a layout: a 300 wide track and tabs 100
// wide, from the inline start, 4 in from its edge, moved by its scrollLeft.
// Real layout, right to left and the browsers' own focus scroll are proven
// in e2e/TabsScroll.spec.tsx.
describe("Tabs wider than their space", () => {
  const TRACK = 300;
  let contentWidth = 508;
  const scrolled = new WeakMap<Element, number>();
  const scrollTo = vi.fn(function (
    this: HTMLElement,
    options: ScrollToOptions,
  ) {
    scrolled.set(this, options.left ?? 0);
  });
  const saved: [object, string, PropertyDescriptor | undefined][] = [];
  const define = (target: object, key: string, value: PropertyDescriptor) => {
    saved.push([target, key, Object.getOwnPropertyDescriptor(target, key)]);
    Object.defineProperty(target, key, { configurable: true, ...value });
  };
  const listOf = (el: Element) => el.closest('[role="tablist"]');

  beforeEach(() => {
    contentWidth = 508;
    scrollTo.mockClear();
    define(HTMLElement.prototype, "clientWidth", {
      get(this: HTMLElement) {
        return this.getAttribute("role") === "tablist" ? TRACK : 0;
      },
    });
    define(Element.prototype, "scrollWidth", {
      get(this: Element) {
        return this.getAttribute("role") === "tablist"
          ? Math.max(contentWidth, TRACK)
          : 0;
      },
    });
    define(Element.prototype, "scrollLeft", {
      get(this: Element) {
        return scrolled.get(this) ?? 0;
      },
    });
    define(Element.prototype, "scrollTo", { value: scrollTo });
    define(Element.prototype, "getBoundingClientRect", {
      value(this: Element) {
        const list = listOf(this);
        if (this.getAttribute("role") === "tablist")
          return new DOMRect(0, 0, TRACK, 64);
        if (this.getAttribute("role") !== "tab" || !list)
          return new DOMRect(0, 0, 0, 0);
        const index = Array.from(list.children).indexOf(this);
        const offset = scrolled.get(list) ?? 0;
        const rtl = (list as HTMLElement).style.direction === "rtl";
        const x = rtl
          ? TRACK - 4 - (index + 1) * 100 - offset
          : 4 + index * 100 - offset;
        return new DOMRect(x, 4, 100, 56);
      },
    });
  });
  afterEach(() => {
    for (const [target, key, descriptor] of saved.reverse()) {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else delete (target as Record<string, unknown>)[key];
    }
    saved.length = 0;
  });

  const five = (
    props: React.ComponentProps<typeof Tabs> = {},
    listProps: React.ComponentProps<typeof TabsList> = {},
  ) => (
    <Tabs defaultValue="d" {...props}>
      <TabsList aria-label="Family" {...listProps}>
        {["a", "b", "c", "d", "e"].map((value) => (
          <TabsTrigger key={value} value={value}>
            {value.toUpperCase()}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  it("marks the list scrollable and shows the selected tab at once", () => {
    render(five());
    const list = screen.getByRole("tablist");
    expect(list).toHaveAttribute("data-scrollable");
    expect(list.className).toMatch(/\bkozmos-tabs-list\b/);
    // D runs 304 to 404: scrolled by the 104 that brings its end in.
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ left: 104, behavior: "auto" });
    // The tabs are still the tablist's own children: the track adds no box,
    // role or tab stop of its own.
    for (const tab of screen.getAllByRole("tab"))
      expect(tab.parentElement).toBe(list);
  });

  it("leaves a list that fits as it was", () => {
    contentWidth = 300;
    render(five());
    expect(screen.getByRole("tablist")).not.toHaveAttribute("data-scrollable");
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("brings a newly selected tab into view, smoothly, and leaves a visible one", async () => {
    render(five());
    scrollTo.mockClear();
    // C is in view (204 to 304, less the 104 scrolled): the list stays.
    fireEvent.mouseDown(screen.getByRole("tab", { name: "C" }));
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "C" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    await Promise.resolve();
    expect(scrollTo).not.toHaveBeenCalled();
    // E is past the end: the list scrolls by what brings it in, animated.
    fireEvent.mouseDown(screen.getByRole("tab", { name: "E" }));
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({ left: 204, behavior: "smooth" }),
    );
  });

  it("does not animate under reduced motion", async () => {
    render(
      <div data-kozmos-motion="reduced">{five({ defaultValue: "a" })}</div>,
    );
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "E" }));
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({ left: 204, behavior: "auto" }),
    );
  });

  it("brings a focused tab into view, the selection staying put", () => {
    render(five({ defaultValue: "a", activationMode: "manual" }));
    expect(scrollTo).not.toHaveBeenCalled();
    const e = screen.getByRole("tab", { name: "E" });
    act(() => e.focus());
    // E runs 404 to 504: scrolled by the 204 that brings its end in.
    expect(scrollTo).toHaveBeenCalledWith({ left: 204, behavior: "smooth" });
    expect(e).toHaveAttribute("aria-selected", "false");
  });

  it("scrolls right to left by a negative offset", () => {
    render(five({ dir: "rtl" }, { style: { direction: "rtl" } }));
    // D runs from -104 to -4: the list scrolls 104 towards its end, left.
    expect(scrollTo).toHaveBeenCalledWith({ left: -104, behavior: "auto" });
  });

  it("still calls a caller's onFocus", () => {
    const onFocus = vi.fn();
    render(five({}, { onFocus }));
    act(() => screen.getByRole("tab", { name: "A" }).focus());
    expect(onFocus).toHaveBeenCalledTimes(1);
  });
});
