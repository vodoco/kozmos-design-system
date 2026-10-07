import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { InstructionPart } from "@kozmos-ds/product-contracts";
import { DirectionStep } from "./DirectionStep";
import { Itinerary } from "../Itinerary";
import { ManoeuvreCard } from "../ManoeuvreCard";

const examples: readonly (readonly InstructionPart[])[] = [
  [
    { text: "Biegen Sie bei " },
    { text: "Marlow Pharmacy", lang: "en" },
    { text: " auf der linken Seite", role: "secondary" },
    { text: " rechts ab" },
  ],
  [
    { text: "左側の", role: "secondary" },
    { text: "Bean & Leaf Café", lang: "en" },
    { text: "で右折してください" },
  ],
  [
    { text: "عند " },
    { text: "Lumen Books", lang: "en" },
    { text: " على يسارك", role: "secondary" },
    { text: " انعطف يميناً" },
  ],
];

describe("ordered navigation instruction parts", () => {
  for (const parts of examples) {
    for (const kind of ["step", "itinerary", "manoeuvre"] as const) {
      it(`${kind} preserves ${parts[0].text} wording, emphasis and speech language`, () => {
        const onToggle = vi.fn();
        const instruction = parts;
        const { container } = render(
          kind === "step" ? (
            <DirectionStep type="right" instruction={instruction} />
          ) : kind === "itinerary" ? (
            <Itinerary
              origin="Start"
              destination="End"
              steps={[{ id: "one", instruction, type: "right", current: true }]}
            />
          ) : (
            <ManoeuvreCard
              type="right"
              instruction={instruction}
              expanded={false}
              onToggle={onToggle}
            />
          ),
        );
        const landmark = parts.find((part) => part.lang)!;
        const node = screen.getByText(landmark.text);
        expect(node).toHaveAttribute("lang", "en");
        expect(node.parentElement?.textContent).toBe(
          parts.map((part) => part.text).join(""),
        );
        const secondary = screen.getByText(
          parts.find((part) => part.role)?.text.trim() ?? "",
        );
        expect(secondary).toHaveClass("font-normal", "kozmos-muted-text");
        expect(container.querySelector('[lang="en"]')).toBe(node);
        if (kind === "manoeuvre") {
          const button = node.closest("button")!;
          expect(button).not.toHaveAttribute("aria-label");
          fireEvent.click(button);
          expect(onToggle).toHaveBeenCalledTimes(1);
        }
      });
    }
  }
});
