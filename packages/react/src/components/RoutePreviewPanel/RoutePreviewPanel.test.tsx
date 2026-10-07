import { readFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { fireEvent, render, screen } from "@testing-library/react";
import type { RouteOptionPresentation } from "@kozmos-ds/product-contracts";
import postcss, { type Rule } from "postcss";
import { describe, expect, it, vi } from "vitest";
import { RoutePreviewPanel } from "./RoutePreviewPanel";

// The component-owned rules, as the package ships them. jsdom evaluates a
// selector, `:dir()` among them, but applies no stylesheet: the transform an
// element is given is read by matching the owned rules against it.
const OWNED = readFileSync(
  resolvePath(
    dirname(fileURLToPath(import.meta.url)),
    "../../styles/owned-components.css",
  ),
  "utf8",
);
function ownedTransform(element: Element): string | undefined {
  let transform: string | undefined;
  postcss.parse(OWNED).walkRules((rule: Rule) => {
    if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name))
      return;
    const applies = rule.selectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });
    if (applies)
      rule.walkDecls("transform", (decl) => {
        transform = decl.value;
      });
  });
  return transform;
}

const options: RouteOptionPresentation[] = [
  {
    id: "quickest",
    label: "Quickest",
    durationSeconds: 240,
    durationLabel: "4 min",
    distanceMetres: 150,
    distanceLabel: "150 m",
    preference: "quickest",
    selected: true,
    available: true,
  },
  {
    id: "step-free",
    label: "Step-free",
    durationSeconds: 360,
    durationLabel: "6 min",
    distanceMetres: 173,
    distanceLabel: "173 m",
    preference: "step-free",
    selected: false,
    available: true,
  },
];

describe("RoutePreviewPanel", () => {
  it.each(["multiple-selected", "duplicate-id"])(
    "does not continue an ambiguous %s snapshot",
    (kind) => {
      const onContinue = vi.fn();
      const bad =
        kind === "multiple-selected"
          ? options.map((option) => ({ ...option, selected: true }))
          : [options[0], { ...options[1], id: options[0].id }];
      render(
        <RoutePreviewPanel
          destinationName="Gallery"
          options={bad}
          status="ready"
          backLabel="Back"
          continueLabel="Continue"
          onBack={() => {}}
          onOptionSelect={() => {}}
          onContinue={onContinue}
        />,
      );
      const button = screen.getByRole("button", { name: "Continue" });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onContinue).not.toHaveBeenCalled();
    },
  );
  it.each(["calculating", "error", "no-route"] as const)(
    "prevents stale option selection while %s without optional status content",
    (status) => {
      const onSelect = vi.fn();
      render(
        <RoutePreviewPanel
          destinationName="Destination"
          backLabel="Back"
          continueLabel="Continue"
          onBack={() => undefined}
          onContinue={() => undefined}
          onOptionSelect={onSelect}
          options={options}
          status={status}
        />,
      );
      const staleOption = screen.getByRole("button", { name: /Quickest/ });
      expect(staleOption).toBeDisabled();
      fireEvent.click(staleOption);
      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    },
  );

  it("selects alternatives and continues with the selected stable ID", () => {
    const onSelect = vi.fn();
    const onContinue = vi.fn();
    render(
      <RoutePreviewPanel
        backLabel="Back"
        continueLabel="Continue"
        destinationName="Burger King"
        onBack={() => undefined}
        onContinue={onContinue}
        onOptionSelect={onSelect}
        options={options}
        optionsCountLabel="2 route options"
        selectedRouteAnnouncement="Quickest route selected, 4 minutes."
        status="ready"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Step-free/ }));
    expect(onSelect).toHaveBeenCalledWith("step-free");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledWith("quickest");
    expect(screen.getByText("Quickest route selected, 4 minutes.")).toHaveClass(
      "sr-only",
    );
  });

  it("tops up only its first row to what a map shell's panel leaves above it", () => {
    // Decision 14: hosted at the top of AdaptiveMapShell's panel, the
    // destination row tops its 16 up to what the panel leaves (owned CSS,
    // measured in scripts/check-adaptive-edge-cases.mjs). The options under
    // it sit under that row and keep their 16. A `p-4` or `pt-4` on the row
    // would outrank the owned rule.
    const { container } = render(
      <RoutePreviewPanel
        backLabel="Back"
        continueLabel="Continue"
        destinationName="Burger King"
        onBack={() => undefined}
        onContinue={() => undefined}
        onOptionSelect={() => undefined}
        options={options}
        status="ready"
      />,
    );
    const [row, body] = Array.from(
      container.querySelector("section")!.children,
    );
    expect(row.tagName).toBe("HEADER");
    expect(row.classList.contains("kozmos-route-preview-first-row")).toBe(true);
    expect(row.className).not.toMatch(/\b(p|pt|py)-/);
    expect(body.classList.contains("kozmos-route-preview-first-row")).toBe(
      false,
    );
    expect(body.className).toMatch(/\bp-4\b/);
  });

  it("paints its fill through the class a map shell's panel can turn off", () => {
    // Decision 43: hosted in AdaptiveMapShell's panel, whose surface is the
    // one surface, the preview paints no fill (owned CSS reads the shell's
    // --kozmos-panel-part-fill; measured in check-adaptive-edge-cases.mjs).
    // Its fill is that class's alone: a `bg-background` beside it would
    // outrank it and paint the block back.
    const { container } = render(
      <RoutePreviewPanel
        backLabel="Back"
        continueLabel="Continue"
        destinationName="Burger King"
        onBack={() => undefined}
        onContinue={() => undefined}
        onOptionSelect={() => undefined}
        options={options}
        status="ready"
      />,
    );
    const section = container.querySelector("section")!;
    expect(section.classList.contains("kozmos-route-preview")).toBe(true);
    expect(section.className).not.toMatch(/(^|\s)bg-/);
    expect(section.className).toMatch(/\btext-foreground\b/);
  });

  it("draws its muted text through the class a glass surface turns to ink", () => {
    // Decision 48: on glass, text that is muted elsewhere takes the
    // foreground colour (owned CSS reads the glass surface's
    // --kozmos-surface-muted-foreground; measured over a saturated map in
    // check-adaptive-edge-cases.mjs). "To", the count of options and the
    // status box draw muted through that class alone: a
    // `text-muted-foreground` beside it would outrank it.
    const muted = "kozmos-muted-text";
    const ready = render(
      <RoutePreviewPanel
        backLabel="Back"
        continueLabel="Continue"
        destinationName="Burger King"
        onBack={() => undefined}
        onContinue={() => undefined}
        onOptionSelect={() => undefined}
        options={options}
        optionsCountLabel="2 route options"
        status="ready"
      />,
    );
    for (const text of ["To", "2 route options"]) {
      const node = screen.getByText(text);
      expect(node.classList.contains(muted)).toBe(true);
      expect(node.className).not.toMatch(/\btext-muted-foreground\b/);
    }
    ready.unmount();
    render(
      <RoutePreviewPanel
        backLabel="Back"
        continueLabel="Continue"
        destinationName="Burger King"
        onBack={() => undefined}
        onContinue={() => undefined}
        onOptionSelect={() => undefined}
        options={[]}
        status="calculating"
        statusContent="Calculating routes…"
      />,
    );
    const status = screen.getByRole("status");
    expect(status.classList.contains(muted)).toBe(true);
    expect(status.className).not.toMatch(/\btext-muted-foreground\b/);
  });

  it("points its back arrow to the start edge in either direction", () => {
    // Back leads to where the reader came from: the start edge, left to
    // right on the left and right to left on the right. The arrow is drawn
    // pointing left, and the owned stylesheet mirrors it where the reading
    // direction is right to left, as SwiftUI's arrow.backward and Compose's
    // AutoMirrored ArrowBack mirror themselves.
    for (const dir of ["ltr", "rtl"] as const) {
      const { unmount } = render(
        <div dir={dir}>
          <RoutePreviewPanel
            backLabel="Back"
            continueLabel="Continue"
            destinationName="Burger King"
            onBack={() => undefined}
            onContinue={() => undefined}
            onOptionSelect={() => undefined}
            options={options}
            status="ready"
          />
        </div>,
      );
      const arrow = screen
        .getByRole("button", { name: "Back" })
        .querySelector("svg")!;
      expect(arrow, "the back button draws no arrow").toBeTruthy();
      expect(ownedTransform(arrow), `the arrow, ${dir}`).toBe(
        dir === "rtl" ? "scaleX(-1)" : undefined,
      );
      unmount();
    }
  });

  it("disables continuation while calculating", () => {
    render(
      <RoutePreviewPanel
        backLabel="Back"
        continueLabel="Continue"
        destinationName="Burger King"
        onBack={() => undefined}
        onContinue={() => undefined}
        onOptionSelect={() => undefined}
        options={[]}
        status="calculating"
        statusContent="Calculating routes…"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Calculating routes…");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
