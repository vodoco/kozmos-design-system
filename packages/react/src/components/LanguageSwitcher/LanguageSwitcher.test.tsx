import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import "@testing-library/jest-dom/vitest";
import { LanguageSwitcher } from "./LanguageSwitcher";

afterEach(cleanup);
// jsdom has no scrollIntoView, which Radix Select calls when it opens.
const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});
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
  it("keeps the committed label while pending and refuses further changes", () => {
    const request = vi.fn();
    render(
      <LanguageSwitcher
        languages={languages}
        selectedLocale="en"
        pending
        onLocaleRequest={request}
        pendingLabel="Applying…"
      />,
    );
    const trigger = screen.getByRole("combobox");
    // Focusable, so focus survives the wait, but announced as unavailable.
    expect(trigger).not.toBeDisabled();
    expect(trigger).toHaveAttribute("aria-disabled", "true");
    expect(trigger).toHaveTextContent("English");
    expect(screen.getByRole("status")).toHaveTextContent("Applying…");
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.keyDown(trigger, { key: "a" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });
  it("keeps one status region mounted, empty until pending", () => {
    const { rerender } = render(
      <LanguageSwitcher
        languages={languages}
        selectedLocale="en"
        onLocaleRequest={vi.fn()}
        pendingLabel="Applying…"
      />,
    );
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    rerender(
      <LanguageSwitcher
        languages={languages}
        selectedLocale="en"
        pending
        onLocaleRequest={vi.fn()}
        pendingLabel="Applying…"
      />,
    );
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Applying…");
  });
  it("keeps focus on the trigger while the host applies the choice", async () => {
    // The documented async flow: the host marks the change pending, then
    // commits it. A disabled trigger cannot hold focus, which dropped it to
    // the page for the whole wait and after the commit.
    let commit: () => void = () => {};
    function Host() {
      const [locale, setLocale] = React.useState("en");
      const [pending, setPending] = React.useState(false);
      return (
        <LanguageSwitcher
          languages={languages}
          selectedLocale={locale}
          pending={pending}
          onLocaleRequest={(next) => {
            setPending(true);
            commit = () => {
              setLocale(next);
              setPending(false);
            };
          }}
        />
      );
    }
    render(<Host />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.keyDown(await screen.findByRole("option", { name: "العربية" }), {
      key: "Enter",
    });
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-busy", "true");
    // Radix hands focus back once the closed list unmounts.
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("combobox")),
    );
    act(() => commit());
    expect(screen.getByRole("combobox")).toHaveAccessibleName(
      "Language, العربية",
    );
    expect(document.activeElement).toBe(screen.getByRole("combobox"));
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
