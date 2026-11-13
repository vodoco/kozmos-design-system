import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RadioGroup, RadioGroupItem } from "./Radio";
import "@testing-library/jest-dom/vitest";

// GAP-158 (decision 132): an option drawn as a card or a tile is still one
// radio, named by its title, described by its description, its image or
// icon hidden; the group keeps one Tab stop and the arrows; and the chosen
// option shows a mark, not only a colour.
function MapStyles({ variant }: { variant: "card" | "tile" }) {
  return (
    <RadioGroup aria-label="Map style" defaultValue="satellite">
      <RadioGroupItem
        value="vector"
        variant={variant}
        label="Vector"
        description="Drawn from the building's plans"
        media={<img src="vector.png" alt="Vector preview" />}
      />
      <RadioGroupItem
        value="satellite"
        variant={variant}
        label="Satellite"
        description="Aerial imagery under the plans"
        media={<img src="satellite.png" alt="Satellite preview" />}
      />
      <RadioGroupItem value="none" variant={variant} label="None" />
    </RadioGroup>
  );
}

describe.each(["card", "tile"] as const)(
  "RadioGroupItem variant=%s",
  (variant) => {
    it("is one radio per option, named by its title alone", () => {
      const { container } = render(<MapStyles variant={variant} />);
      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(3);
      expect(radios[0]).toHaveAccessibleName("Vector");
      expect(radios[1]).toHaveAccessibleName("Satellite");
      expect(radios[2]).toHaveAccessibleName("None");
      // The image is drawn inside the radio, and never read: no image role.
      const image = container.querySelector('img[alt="Vector preview"]');
      expect(image).not.toBeNull();
      expect(radios[0].contains(image)).toBe(true);
      expect(screen.queryByRole("img")).toBeNull();
    });

    it("reads the description as the radio's description", () => {
      render(<MapStyles variant={variant} />);
      const [vector, satellite, none] = screen.getAllByRole("radio");
      expect(vector).toHaveAccessibleDescription(
        "Drawn from the building's plans",
      );
      expect(satellite).toHaveAccessibleDescription(
        "Aerial imagery under the plans",
      );
      expect(none).not.toHaveAttribute("aria-describedby");
    });

    it("keeps a caller's aria-describedby before its own", () => {
      render(
        <>
          <p id="style-hint">Changes the map for everyone</p>
          <RadioGroup aria-label="Map style">
            <RadioGroupItem
              value="vector"
              variant={variant}
              label="Vector"
              description="Drawn from plans"
              aria-describedby="style-hint"
            />
          </RadioGroup>
        </>,
      );
      expect(screen.getByRole("radio")).toHaveAccessibleDescription(
        "Changes the map for everyone Drawn from plans",
      );
    });

    it("marks only the chosen option, not by colour alone", () => {
      const { container } = render(<MapStyles variant={variant} />);
      const [vector, satellite] = screen.getAllByRole("radio");
      expect(satellite).toBeChecked();
      expect(vector).not.toBeChecked();
      const mark = variant === "card" ? "mark" : "check";
      // The dot (card) or the check (tile) is drawn in the chosen option only.
      const indicators =
        variant === "card"
          ? container.querySelectorAll(
              `[data-slot="${mark}"] [data-state="checked"]`,
            )
          : container.querySelectorAll(`[data-slot="${mark}"]`);
      expect(indicators).toHaveLength(1);
      expect(satellite.contains(indicators[0])).toBe(true);
      expect(satellite).toHaveClass("kozmos-radio-card");
      expect(satellite).toHaveAttribute("data-variant", variant);
    });

    it("is one Tab stop, and the arrows move and choose", async () => {
      const user = userEvent.setup();
      render(
        <>
          <MapStyles variant={variant} />
          <button type="button">After</button>
        </>,
      );
      const [vector, satellite, none] = screen.getAllByRole("radio");
      // The focus lands on the box itself, title and all, not on a ring.
      expect(satellite).toHaveTextContent("Satellite");
      await user.tab();
      expect(satellite).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(satellite).toHaveFocus();
      // Radix moves the focus a tick after the key goes down, and chooses on
      // focus only while it is down: so the key is held until the focus moves.
      await user.keyboard("{ArrowDown>}");
      await waitFor(() => expect(none).toHaveFocus());
      await user.keyboard("{/ArrowDown}");
      expect(none).toBeChecked();
      await user.keyboard("{ArrowRight>}");
      await waitFor(() => expect(vector).toHaveFocus());
      await user.keyboard("{/ArrowRight}");
      expect(vector).toBeChecked();
    });

    it("chooses an option when the box is clicked anywhere", async () => {
      const user = userEvent.setup();
      render(<MapStyles variant={variant} />);
      await user.click(screen.getByText("Drawn from the building's plans"));
      expect(screen.getByRole("radio", { name: "Vector" })).toBeChecked();
    });

    it("says an option's error", () => {
      render(
        <RadioGroup aria-label="Map style" defaultValue="vector">
          <RadioGroupItem
            value="vector"
            variant={variant}
            label="Vector"
            error
          />
        </RadioGroup>,
      );
      const radio = screen.getByRole("radio");
      expect(radio).toHaveAttribute("aria-invalid", "true");
      expect(radio).toHaveAttribute("data-error");
      expect(radio).toHaveClass("border-destructive");
    });
  },
);

describe("RadioGroupItem description (default)", () => {
  it("is read as the radio's description, not its name", () => {
    render(
      <RadioGroup aria-label="Floors" defaultValue="all">
        <RadioGroupItem
          value="all"
          label="All floors"
          description="Shows every level of the building"
          media={<span>Picture</span>}
        />
      </RadioGroup>,
    );
    const radio = screen.getByRole("radio");
    expect(radio).toHaveAccessibleName("All floors");
    expect(radio).toHaveAccessibleDescription(
      "Shows every level of the building",
    );
    // Media is a card's or a tile's: the default ring draws none.
    expect(screen.queryByText("Picture")).toBeNull();
  });
});

describe("an untitled card or tile (GAP-158)", () => {
  it("is never named by its description, warns once in development, and takes aria-label", async () => {
    vi.resetModules();
    const { RadioGroup: Group, RadioGroupItem: Item } = await import("./Radio");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Group aria-label="Geometry">
        <Item value="auto" variant="card" description="Traced for you" />
        <Item value="manual" variant="tile" description="Drawn by hand" />
        <Item value="fade" variant="tile" aria-label="Fade" media={<svg />} />
      </Group>,
    );
    const [card, tile, iconOnly] = screen.getAllByRole("radio");
    // An icon-only tile is named by its aria-label.
    expect(iconOnly).toHaveAccessibleName("Fade");
    expect(card).toHaveAccessibleName("");
    expect(tile).toHaveAccessibleName("");
    expect(card).toHaveAccessibleDescription("Traced for you");
    const untitled = warn.mock.calls.filter((call) =>
      String(call[0]).includes("has no label and no aria-label"),
    );
    expect(untitled).toHaveLength(1);
    warn.mockRestore();
  });
});
