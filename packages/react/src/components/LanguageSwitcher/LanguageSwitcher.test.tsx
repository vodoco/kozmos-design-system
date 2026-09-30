import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LanguageSwitcher } from "./LanguageSwitcher";

afterEach(cleanup);
const languages = [
  { id: "en", label: "English" },
  { id: "ar", label: "العربية", direction: "rtl" as const },
];
describe("LanguageSwitcher", () => {
  it("shows the committed language, with language metadata", () => {
    render(
      <LanguageSwitcher
        languages={languages}
        selectedLocale="ar"
        onLocaleRequest={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveAccessibleName(
      "Language, العربية",
    );
    expect(screen.getByText("العربية")).toHaveAttribute("lang", "ar");
    expect(screen.getByText("العربية")).toHaveAttribute("dir", "rtl");
  });
  it("does not invent a selection for an unknown locale", () => {
    render(
      <LanguageSwitcher
        languages={languages}
        selectedLocale="fr"
        onLocaleRequest={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("fr");
  });
  it("keeps the committed label while pending and disables further changes", () => {
    render(
      <LanguageSwitcher
        languages={languages}
        selectedLocale="en"
        pending
        onLocaleRequest={vi.fn()}
        pendingLabel="Applying…"
      />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("combobox")).toHaveTextContent("English");
    expect(screen.getByRole("status")).toHaveTextContent("Applying…");
  });
  it("offers retry without selecting a language or committing a failed choice", () => {
    const retry = vi.fn(),
      request = vi.fn();
    const { rerender } = render(
      <LanguageSwitcher
        languages={languages}
        selectedLocale="en"
        error="Could not change language"
        onLocaleRequest={request}
        onRetry={retry}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(request).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      "Could not change language",
    );
    rerender(
      <LanguageSwitcher
        languages={languages}
        selectedLocale="en"
        pending
        error="Could not change language"
        onLocaleRequest={request}
        onRetry={retry}
      />,
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeDisabled();
  });
  it("disables an empty or already-selected single choice, but allows recovery", () => {
    const { rerender } = render(
      <LanguageSwitcher
        languages={[]}
        selectedLocale=""
        onLocaleRequest={vi.fn()}
        placeholder="Choose a language"
      />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("combobox")).toHaveTextContent("Choose a language");
    rerender(
      <LanguageSwitcher
        languages={[languages[0]]}
        selectedLocale="en"
        onLocaleRequest={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
    rerender(
      <LanguageSwitcher
        languages={[languages[0]]}
        selectedLocale="missing"
        onLocaleRequest={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).not.toBeDisabled();
  });
});
