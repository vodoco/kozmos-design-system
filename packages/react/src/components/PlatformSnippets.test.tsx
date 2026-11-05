import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlatformSnippets } from "./PlatformSnippets";
import type { ReactNode } from "react";

// These unit tests cover our selection/status contract in the React 19 harness.
// Storybook's React 18 UI is exercised unmocked by check-storybook-docs.mjs.
vi.mock("storybook/internal/components", () => ({
  SyntaxHighlighter: ({ children }: { children: string }) => (
    <pre>{children}</pre>
  ),
}));
vi.mock("storybook/internal/theming", () => ({
  themes: { dark: {} },
  convert: (theme: unknown) => theme,
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("PlatformSnippets", () => {
  it("does not render an empty reference section", () => {
    const { container } = render(<PlatformSnippets react="  " />);
    expect(container).toBeEmptyDOMElement();
  });

  it("starts with the first supplied example, inside an owned theme", () => {
    render(<PlatformSnippets swift="KozmosButton()" />);
    const tab = screen.getByRole("tab", { name: "Swift (iOS)" });
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(tab.closest("[data-kozmos-root]")).not.toBeNull();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("KozmosButton()");
  });

  it("distinguishes internal Vue examples from a released native library", async () => {
    render(<PlatformSnippets react="<Button />" vue="<KozmosButton />" />);
    await userEvent.click(
      screen.getByRole("tab", { name: "Vue 3 · Internal" }),
    );
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveTextContent(
      "main entry is native Vue on Reka UI, imports no React and renders on the server",
    );
    expect(panel).toHaveTextContent(
      "@kozmos-ds/vue/react-bridge wraps the React parts not yet ported",
    );
    expect(panel).not.toHaveTextContent("React-wrapper package");
    expect(panel).toHaveTextContent("<KozmosButton />");
  });

  it("explains missing examples instead of claiming missing implementations", async () => {
    render(<PlatformSnippets react="<Button />" />);
    await userEvent.click(
      screen.getByRole("tab", { name: "Kotlin (Android)" }),
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "No example is documented",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "does not establish",
    );
  });
});
