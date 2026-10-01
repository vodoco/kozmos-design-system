import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MapInfoPanel, safeMapInfoHref } from "./MapInfoPanel";

afterEach(cleanup);
const content = {
  title: "About this map",
  introduction: "Find your way through Terminal 2.",
  faqs: [
    {
      id: "help",
      question: "Where can I get help?",
      answer: "Visit the information desk.",
    },
  ],
  credits: [{ id: "owner", label: "Indoor data © Example" }],
  links: [
    { id: "privacy", label: "Privacy", href: "https://example.com/privacy" },
  ],
  versions: [{ id: "sdk", label: "SDK version", value: "10.11.0" }],
};
describe("MapInfoPanel", () => {
  it("renders host-supplied content and explicit version labels", () => {
    render(<MapInfoPanel content={content} onClose={() => {}} />);
    expect(
      screen.getByRole("heading", { name: content.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Indoor data © Example")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "https://example.com/privacy",
    );
    expect(screen.getByText("SDK version: 10.11.0")).toBeInTheDocument();
  });
  it("opens and closes a FAQ using the shared accordion", () => {
    render(<MapInfoPanel content={content} onClose={() => {}} />);
    const question = screen.getByRole("button", {
      name: content.faqs[0].question,
    });
    expect(question).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(content.faqs[0].answer)).toBeVisible();
    fireEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "false");
  });
  it("localizes controls, omits empty sections, and calls close once", () => {
    const close = vi.fn();
    render(
      <MapInfoPanel
        content={{ title: "Information" }}
        onClose={close}
        closeLabel="Fermer"
      />,
    );
    expect(
      screen.queryByText("Frequently asked questions"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Copyright")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(close).toHaveBeenCalledOnce();
  });
  it("renders untrusted markup as text and unsafe destinations as non-links", () => {
    render(
      <MapInfoPanel
        content={{
          title: "<script>bad()</script>",
          links: [{ id: "bad", label: "Bad", href: "javascript:bad()" }],
        }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("heading")).toHaveTextContent(
      "<script>bad()</script>",
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Bad")).toBeInTheDocument();
  });
  it("allows web/contact links but rejects credentials, relative URLs and unsafe schemes", () => {
    for (const href of [
      "https://example.com",
      "http://example.com",
      "mailto:support@example.com",
      "tel:+4412345678",
    ])
      expect(safeMapInfoHref(href)).toBe(href);
    for (const href of [
      "/relative",
      "javascript:alert(1)",
      "data:text/html,bad",
      "https://user:secret@example.com",
      "mailto:",
      "tel:",
    ])
      expect(safeMapInfoHref(href)).toBeUndefined();
  });
});
