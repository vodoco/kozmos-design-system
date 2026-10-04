import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapAttribution } from "./MapAttribution";

const credits = [
  { id: "owner", label: "© Example indoor data" },
  {
    id: "provider",
    label: "Outdoor contributors",
    href: "https://example.com/credits",
  },
];
describe("MapAttribution", () => {
  it("defaults to map text with an optional opaque surface without duplicating labels", () => {
    const { rerender } = render(<MapAttribution credits={credits} />);
    expect(screen.getByRole("region")).toHaveAttribute(
      "data-appearance",
      "map",
    );
    expect(screen.getAllByText("Outdoor contributors")).toHaveLength(1);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    rerender(<MapAttribution credits={credits} appearance="surface" />);
    expect(screen.getByRole("region")).toHaveAttribute(
      "data-appearance",
      "surface",
    );
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
  it("shows bundled Pointr branding by default and allows replacement", () => {
    const { rerender } = render(<MapAttribution credits={credits} />);
    expect(screen.getByRole("img", { name: "Pointr" })).toBeInTheDocument();
    rerender(
      <MapAttribution credits={credits} brand={<img alt="Custom venue" />} />,
    );
    expect(
      screen.queryByRole("img", { name: "Pointr" }),
    ).not.toBeInTheDocument();
    expect(screen.getByAltText("Custom venue")).toBeInTheDocument();
    rerender(<MapAttribution credits={credits} showBrand={false} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("© Example indoor data")).toBeInTheDocument();
  });
  it("keeps credits when optional branding is hidden", () => {
    const { rerender } = render(
      <MapAttribution credits={credits} brand={<img alt="Approved brand" />} />,
    );
    expect(screen.getByAltText("Approved brand")).toBeInTheDocument();
    rerender(
      <MapAttribution
        credits={credits}
        brand={<img alt="Approved brand" />}
        showBrand={false}
      />,
    );
    expect(screen.queryByAltText("Approved brand")).not.toBeInTheDocument();
    expect(screen.getByText("© Example indoor data")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Outdoor contributors" }),
    ).toHaveAttribute("href", credits[1].href);
  });
  it("updates supplied copy without guessing a provider or a year", () => {
    const { rerender } = render(<MapAttribution credits={credits} />);
    rerender(
      <MapAttribution
        credits={[{ id: "new", label: "Replacement credit" }]}
        label="Map credits"
      />,
    );
    expect(screen.queryByText("Outdoor contributors")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Map credits" }),
    ).toHaveTextContent("Replacement credit");
  });
  it("renders unsafe URLs and HTML-like labels as plain text", () => {
    render(
      <MapAttribution
        credits={[
          { id: "bad", label: "<b>Credit</b>", href: "javascript:alert(1)" },
        ]}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("<b>Credit</b>")).toBeInTheDocument();
  });
  it("links no credit that hides a host behind credentials or whitespace", () => {
    // A credit is a provider's link, as an entry in MapInfoPanel is: the
    // same rule refuses `https://maps.example@evil.example`, which reads as
    // one host and goes to another (audit H4, 2026-10-04).
    render(
      <MapAttribution
        showBrand={false}
        credits={[
          {
            id: "credentials",
            label: "Credentials credit",
            href: "https://maps.example@evil.example",
          },
          {
            id: "space",
            label: "Spaced credit",
            href: "https://example.com/credits page",
          },
        ]}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Credentials credit")).toBeInTheDocument();
    expect(screen.getByText("Spaced credit")).toBeInTheDocument();
  });
  it("does not invent content for an empty input", () => {
    const { container } = render(
      <MapAttribution credits={[]} showBrand={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
  describe("the credit line", () => {
    afterEach(() => vi.restoreAllMocks());
    const scroller = (container: HTMLElement) =>
      container.querySelector<HTMLElement>(".kozmos-map-attribution-scroll")!;

    it("adds no tab stop while it fits", () => {
      const { container } = render(<MapAttribution credits={credits} />);
      expect(scroller(container)).toHaveAttribute("tabindex", "-1");
      expect(scroller(container)).not.toHaveAttribute("role");
    });

    it("is a named tab stop when it overflows, so a keyboard can scroll it", () => {
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(
        400,
      );
      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(
        200,
      );
      const { container } = render(
        <MapAttribution credits={credits} label="Credits" />,
      );
      expect(scroller(container)).toHaveAttribute("tabindex", "0");
      expect(screen.getByRole("group", { name: "Credits" })).toBe(
        scroller(container),
      );
    });
  });
});
