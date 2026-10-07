import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { POIResultCard } from "./POIResultCard/POIResultCard";
import { CategoryField } from "./CategoryField/CategoryField";
import { AIInputBar } from "./AIInputBar/AIInputBar";
import { AICompanionPanel } from "./AICompanionPanel/AICompanionPanel";
import { WayfindingInputRow } from "./WayfindingCard/WayfindingCard";

describe("SDK standard controls compose Core", () => {
  it("uses Core buttons for result actions without selecting or submitting", () => {
    const select = vi.fn(),
      action = vi.fn(),
      submit = vi.fn();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <POIResultCard
          poi={{
            id: "gallery",
            name: "Gallery",
            media: [],
            actions: ["navigate"],
          }}
          result={{
            poiId: "gallery",
            resultIndex: 1,
            selected: true,
            featured: false,
            actions: [
              { action: "navigate", label: "Go", primary: true },
              { action: "details", label: "Details", disabled: true },
            ],
          }}
          onSelect={select}
          onAction={action}
        />
      </form>,
    );
    const go = screen.getByRole("button", { name: "Go" });
    expect(go).toHaveClass("kozmos-button", "kozmos-button-default");
    expect(screen.getByRole("button", { name: "Details" })).toHaveClass(
      "kozmos-button",
    );
    fireEvent.click(go);
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith("navigate", "gallery");
    expect(select).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });

  it("uses Core IconButton and Counter in the chosen category", () => {
    const clear = vi.fn();
    render(<CategoryField label="Gates" count={0} onClear={clear} />);
    expect(screen.getByRole("button", { name: "Clear category" })).toHaveClass(
      "kozmos-button",
    );
    expect(
      screen.getByRole("button", { name: "Clear category" }).firstElementChild,
    ).not.toHaveClass("group-focus-visible:ring-2");
    const group = screen.getByRole("group", { name: "Gates, 0 places" });
    const counter = group.querySelector('[data-slot="counter"]');
    expect(counter).toHaveTextContent("0");
    expect(counter).toHaveAttribute("aria-hidden", "true");
    expect(counter).not.toHaveAttribute("aria-label");
    fireEvent.click(screen.getByRole("button", { name: "Clear category" }));
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("keeps assistant send a real submit button supplied by Core", () => {
    const submit = vi.fn();
    render(
      <AIInputBar
        value="  gates  "
        onValueChange={vi.fn()}
        onSubmit={submit}
      />,
    );
    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toHaveClass("kozmos-button", "kozmos-button-default");
    expect(send).toHaveAttribute("type", "submit");
    fireEvent.click(send);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith("gates");
  });

  it("uses Core for the assistant close without losing its name or callback", () => {
    const close = vi.fn();
    render(
      <AICompanionPanel onClose={close} closeLabel="Close conversation" />,
    );
    const button = screen.getByRole("button", { name: "Close conversation" });
    expect(button).toHaveClass("kozmos-button");
    fireEvent.click(button);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("uses complete Core Inputs, with independent IDs and controlled changes", () => {
    const origin = vi.fn(),
      destination = vi.fn();
    const { container } = render(
      <WayfindingInputRow
        originValue="Lobby"
        destinationValue="Gallery"
        onOriginChange={origin}
        onDestinationChange={destination}
      />,
    );
    const fields = container.querySelectorAll(".kozmos-field");
    expect(fields).toHaveLength(2);
    const from = within(fields[0] as HTMLElement).getByRole("textbox", {
      name: "Origin",
    });
    const to = within(fields[1] as HTMLElement).getByRole("textbox", {
      name: "Destination",
    });
    expect(from.id).toBeTruthy();
    expect(to.id).not.toBe(from.id);
    fireEvent.change(from, { target: { value: "Door" } });
    fireEvent.change(to, { target: { value: "Cafe" } });
    expect(origin).toHaveBeenCalledTimes(1);
    expect(origin).toHaveBeenCalledWith("Door");
    expect(destination).toHaveBeenCalledTimes(1);
    expect(destination).toHaveBeenCalledWith("Cafe");
  });
});
