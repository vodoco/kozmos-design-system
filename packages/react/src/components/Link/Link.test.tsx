import { render, screen } from "@testing-library/react";
import { Link } from "./Link";
import { describe, it, expect } from "vitest";

describe("Link", () => {
  it("renders correctly", () => {
    render(<Link href="#">Link</Link>);
    expect(screen.getByRole("link")).toHaveTextContent("Link");
  });

  it("opens in the same tab and draws no icon unless external", () => {
    const { container } = render(<Link href="/venues">Browse venues</Link>);
    const link = screen.getByRole("link", { name: "Browse venues" });
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
    expect(container.querySelector("svg")).toBeNull();
  });

  describe("external (GAP-202)", () => {
    it("opens a new tab without handing it the page", () => {
      render(
        <Link href="https://example.com/privacy" external>
          Privacy Policy
        </Link>,
      );
      // jsdom's name drops the no-break space that parts the two; the
      // browsers keep it (scripts/check-link-external.mjs reads them).
      const link = screen.getByRole("link", {
        name: /^Privacy Policy\s*opens in a new tab$/,
      });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("keeps a caller's own target and rel", () => {
      render(
        <Link
          href="https://example.com/docs"
          external
          target="docs"
          rel="noopener"
        >
          Documentation
        </Link>,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "docs");
      expect(link).toHaveAttribute("rel", "noopener");
    });

    it("draws the new-tab icon at the inline end, hidden, mirrored right to left", () => {
      render(
        <Link href="https://example.com/terms" external>
          Terms of Service
        </Link>,
      );
      const link = screen.getByRole("link");
      const icon = link.querySelector("svg");
      expect(icon).not.toBeNull();
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveClass("kozmos-link-external-icon");
      expect(icon).toHaveClass("kozmos-rtl-mirror");
      // Sized with the text: the attribute and the owned class both say 1em.
      expect(icon).toHaveAttribute("width", "1em");
      expect(icon).toHaveAttribute("height", "1em");
      // After the text, joined to its last word by a no-break space inside
      // the one unbreakable run.
      const run = icon!.parentElement!;
      expect(run).toHaveClass("kozmos-link-external");
      expect(run.parentElement).toBe(link);
      expect(link.lastElementChild).toBe(run);
      expect(run.firstChild?.nodeType).toBe(Node.TEXT_NODE);
      expect(run.firstChild?.textContent).toBe("\u00a0");
    });

    it("says the product's own words after the link's name", () => {
      render(
        <Link
          href="https://example.com/datenschutz"
          external
          externalLabel="öffnet in einem neuen Tab"
        >
          Datenschutz
        </Link>,
      );
      expect(
        screen.getByRole("link", {
          name: /^Datenschutz\s*öffnet in einem neuen Tab$/,
        }),
      ).toBeInTheDocument();
      expect(screen.queryByText("opens in a new tab")).toBeNull();
    });

    it("says nothing more with an empty label, and keeps the icon", () => {
      const { container } = render(
        <Link href="https://example.com" external externalLabel="">
          Pointr
        </Link>,
      );
      expect(screen.getByRole("link", { name: "Pointr" })).toBeInTheDocument();
      expect(container.querySelector(".kozmos-link-external-label")).toBeNull();
      expect(container.querySelector("svg")).not.toBeNull();
    });
  });
});
