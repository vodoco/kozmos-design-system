import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "../components/Alert";
import { Notice } from "../components/Notice";
import { MapStatusPill } from "../components/MapStatusPill";
import { Spinner } from "../components/Spinner";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { FieldWrapper } from "../components/FieldWrapper";
import { impliedLive } from "./live-region";

// GAP-193: a modal Radix primitive (Select, Menu, Dialog) hides the page with
// aria-hidden's hideOthers as it opens, which keeps only boxes marked
// aria-live visible. A Kozmos live part named by its role alone was hidden,
// silenced, with its buttons still focusable. Each says both.
const LIVE_ROLES = '[role~="status"], [role~="alert"], [role~="log"]';
function liveParts(container: HTMLElement) {
  return [...container.querySelectorAll(LIVE_ROLES)].map((node) => ({
    role: node.getAttribute("role"),
    live: node.getAttribute("aria-live"),
  }));
}
const languages = [
  { id: "en", label: "English" },
  { id: "tr", label: "Türkçe" },
];

describe("live parts say the liveness their role implies (GAP-193)", () => {
  it.each([
    [
      "Alert polite",
      () => <Alert live="polite">Saved</Alert>,
      "status",
      "polite",
    ],
    [
      "Alert assertive",
      () => <Alert live="assertive">Not saved</Alert>,
      "alert",
      "assertive",
    ],
    ["Notice", () => <Notice summary="Check allergens." />, "status", "polite"],
    [
      "Notice assertive",
      () => <Notice live="assertive" summary="Leave the building." />,
      "alert",
      "assertive",
    ],
    [
      "MapStatusPill",
      () => <MapStatusPill>Locating</MapStatusPill>,
      "status",
      "polite",
    ],
    [
      "MapStatusPill assertive",
      () => <MapStatusPill live="assertive">Off route</MapStatusPill>,
      "alert",
      "assertive",
    ],
    ["Spinner", () => <Spinner />, "status", "polite"],
    [
      "FieldWrapper error",
      () => (
        <FieldWrapper label="Name" error="Enter a name">
          <input aria-label="Name" />
        </FieldWrapper>
      ),
      "alert",
      "assertive",
    ],
  ] as const)("%s", (_name, part, role, live) => {
    const { container } = render(part());
    expect(liveParts(container)).toEqual([{ role, live }]);
  });

  it("LanguageSwitcher's pending line and error", () => {
    const { container } = render(
      <LanguageSwitcher
        languages={languages}
        selectedLocale="en"
        onLocaleRequest={() => {}}
        error="Could not change the language"
      />,
    );
    expect(liveParts(container)).toEqual([
      { role: "status", live: "polite" },
      { role: "alert", live: "assertive" },
    ]);
  });

  it("follows a caller's own role, and a caller's own aria-live wins", () => {
    const { container, rerender } = render(<Alert role="alert">Lost</Alert>);
    expect(liveParts(container)).toEqual([
      { role: "alert", live: "assertive" },
    ]);
    rerender(
      <Alert live="polite" aria-live="off">
        Quiet
      </Alert>,
    );
    expect(liveParts(container)).toEqual([{ role: "status", live: "off" }]);
    rerender(<Notice live="assertive" role="note" summary="Anything." />);
    expect(container.firstChild).not.toHaveAttribute("aria-live");
  });

  it("says nothing when the part is not live", () => {
    const { container, rerender } = render(<Alert>Read only</Alert>);
    expect(container.querySelector("[aria-live]")).toBeNull();
    rerender(<Notice live="off" summary="Shown in English." />);
    expect(container.querySelector("[aria-live]")).toBeNull();
    rerender(<MapStatusPill live="off">Quiet</MapStatusPill>);
    expect(container.querySelector("[aria-live]")).toBeNull();
    expect(impliedLive(undefined)).toBeUndefined();
    expect(impliedLive("note")).toBeUndefined();
  });
});
