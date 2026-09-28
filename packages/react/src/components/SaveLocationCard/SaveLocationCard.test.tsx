import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SaveLocationCard } from "./SaveLocationCard";

describe("SaveLocationCard", () => {
  it("does not submit an enclosing form when using card actions", () => {
    const submit = vi.fn();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <SaveLocationCard
          isSaved
          onRouteToLocation={() => {}}
          onEditNote={() => {}}
        />
      </form>,
    );
    for (const button of screen.getAllByRole("button")) fireEvent.click(button);
    expect(submit).not.toHaveBeenCalled();
  });
  it("renders unsaved state and toggles save", () => {
    const onSaveToggle = vi.fn();

    render(<SaveLocationCard onSaveToggle={onSaveToggle} />);

    fireEvent.click(screen.getByRole("button", { name: /save location/i }));
    expect(onSaveToggle).toHaveBeenCalledTimes(1);
  });

  it("renders saved actions", () => {
    const onRouteToLocation = vi.fn();
    const onEditNote = vi.fn();

    render(
      <SaveLocationCard
        isSaved
        description="Level 2, Row C"
        onRouteToLocation={onRouteToLocation}
        onEditNote={onEditNote}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /guide me/i }));
    fireEvent.click(screen.getByLabelText("Edit location note"));

    expect(screen.getByText("Level 2, Row C")).toBeInTheDocument();
    expect(onRouteToLocation).toHaveBeenCalledTimes(1);
    expect(onEditNote).toHaveBeenCalledTimes(1);
  });

  it("draws its description muted through the class a glass surface turns to ink", () => {
    // Decision 48, on every glass surface: text that is muted elsewhere
    // takes the foreground colour on glass (measured over a saturated map
    // in check-adaptive-edge-cases.mjs). A `text-muted-foreground` beside
    // the class would outrank it.
    render(
      <SaveLocationCard
        title="Gate 12"
        description="Terminal 2, Level 1"
        surface="glass"
      />,
    );
    const description = screen.getByText("Terminal 2, Level 1");
    expect(description.classList.contains("kozmos-muted-text")).toBe(true);
    expect(description.className).not.toMatch(/\btext-muted-foreground\b/);
  });
});
