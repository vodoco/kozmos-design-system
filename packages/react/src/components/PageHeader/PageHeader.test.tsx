import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../Breadcrumb/Breadcrumb";
import { PageHeader } from "./PageHeader";

const crumbs = (
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/sites">Sites</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Settings</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
);

describe("PageHeader (GAP-036, decision 135)", () => {
  it("titles the page with its one h1", () => {
    render(<PageHeader title="Settings" />);
    const title = screen.getByRole("heading", { level: 1, name: "Settings" });
    expect(title.tagName).toBe("H1");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("draws the title at Heading 3's size by default and Heading 2's at lg", () => {
    const { rerender } = render(<PageHeader title="Settings" />);
    expect(screen.getByRole("heading")).toHaveClass("kozmos-text-2xl");
    rerender(<PageHeader title="Home" size="lg" />);
    expect(screen.getByRole("heading")).toHaveClass("kozmos-text-3xl");
    expect(screen.getByRole("heading").tagName).toBe("H1");
  });

  it("paints the tinted band by default, and none with tone='default'", () => {
    const { container, rerender } = render(<PageHeader title="Home" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-slot", "page-header");
    expect(root).toHaveClass("kozmos-page-header", "kozmos-page-header-subtle");
    expect(root).toHaveAttribute("data-tone", "subtle");
    rerender(<PageHeader title="Home" tone="default" />);
    expect(root).not.toHaveClass("kozmos-page-header-subtle");
    expect(root).toHaveAttribute("data-tone", "default");
  });

  it("sets its content in a Container with the block inset, 32 above and 24 below (GAP-116)", () => {
    const { container } = render(<PageHeader title="Home" />);
    const inner = (container.firstElementChild as HTMLElement)
      .firstElementChild as HTMLElement;
    expect(inner).toHaveClass("pt-8", "pb-6", "mx-auto", "max-w-7xl");
    expect(inner).toHaveClass("px-4", "sm:px-6", "lg:px-8");
  });

  it("passes inset and centered to its Container", () => {
    const { container } = render(
      <PageHeader title="Floor plan" inset="panel" centered={false} />,
    );
    const inner = (container.firstElementChild as HTMLElement)
      .firstElementChild as HTMLElement;
    expect(inner).toHaveClass("px-4", "pt-8", "pb-6");
    expect(inner).not.toHaveClass("sm:px-6", "max-w-7xl");
  });

  it("puts the breadcrumb above the title, the description under it, and the actions after both", () => {
    render(
      <PageHeader
        breadcrumb={crumbs}
        title="Settings"
        description="Manage the site's map and its people."
        actions={<button type="button">Save</button>}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "breadcrumb" });
    const title = screen.getByRole("heading", { name: "Settings" });
    const description = screen.getByText(
      "Manage the site's map and its people.",
    );
    const save = screen.getByRole("button", { name: "Save" });
    const follows = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(nav, title)).toBe(true);
    expect(follows(title, description)).toBe(true);
    expect(follows(description, save)).toBe(true);
    expect(nav.parentElement).toHaveAttribute(
      "data-slot",
      "page-header-breadcrumb",
    );
    expect(description.tagName).toBe("P");
    expect(description).toHaveAttribute("data-slot", "page-header-description");
    expect(description).toHaveClass("kozmos-text-sm", "kozmos-text-muted");
    expect(save.parentElement).toHaveAttribute(
      "data-slot",
      "page-header-actions",
    );
    expect(save.parentElement).toHaveClass("kozmos-page-header-actions");
  });

  it("puts the info button on the title's line, after the title", () => {
    render(
      <PageHeader
        title="Map content"
        info={<button type="button" aria-label="About map content" />}
      />,
    );
    const title = screen.getByRole("heading", { name: "Map content" });
    const info = screen.getByRole("button", { name: "About map content" });
    const line = title.parentElement!;
    expect(line).toHaveClass("kozmos-page-header-title");
    expect(within(line).getByRole("button")).toBe(info);
    expect(info.parentElement).toHaveAttribute("data-slot", "page-header-info");
    // The info button names itself: it is not inside the heading.
    expect(title).not.toContainElement(info);
  });

  it("draws no empty slot for what it is not given", () => {
    const { container } = render(<PageHeader title="Home" />);
    for (const slot of [
      "page-header-breadcrumb",
      "page-header-info",
      "page-header-description",
      "page-header-actions",
    ])
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeNull();
  });

  it("keeps the caller's class and attributes and forwards its ref", () => {
    let node: HTMLDivElement | null = null;
    const { container } = render(
      <PageHeader
        ref={(el) => {
          node = el;
        }}
        title="Home"
        className="custom"
        id="top"
        aria-label="Page header"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("custom", "kozmos-page-header");
    expect(root).toHaveAttribute("id", "top");
    expect(node).toBe(root);
  });
});
