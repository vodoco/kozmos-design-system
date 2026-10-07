import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsProvider, type AnalyticsEvent } from "./analytics";
import { WithoutGenericClick } from "./generic-click";
import { Button } from "../components/Button";
import { SearchBar } from "../components/SearchBar";
import { POIResultCard } from "../components/POIResultCard";
import {
  WayfindingCard,
  WayfindingInputRow,
} from "../components/WayfindingCard";
import { RoutingInputGroup } from "../components/RoutingInputGroup";
import { FeedbackCard } from "../components/FeedbackCard";
import { SaveLocationCard } from "../components/SaveLocationCard";
import { SplitButton } from "../components/SplitButton";
import { FloorSelector } from "../components/FloorSelector";
import { FileUpload } from "../components/FileUpload";
import { Dialog, DialogContent, DialogTitle } from "../components/Dialog";

/** The events one press sends, as component:event. */
function eventsOf(ui: React.ReactElement, press: () => void) {
  const dispatch = vi.fn((events: AnalyticsEvent[]) => events);
  const { unmount } = render(
    <AnalyticsProvider onDispatch={dispatch}>{ui}</AnalyticsProvider>,
  );
  press();
  unmount();
  return dispatch.mock.calls
    .flatMap(([batch]) => batch)
    .map(({ component, eventName }) => `${component}:${eventName}`);
}
const press = (name: string | RegExp) => () =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("one press, one event (D9)", () => {
  it("a Core Button reports button_clicked, except where a component reports the press itself", () => {
    expect(eventsOf(<Button>Go</Button>, press("Go"))).toEqual([
      "Button:button_clicked",
    ]);
    expect(
      eventsOf(
        <WithoutGenericClick>
          <Button>Go</Button>
        </WithoutGenericClick>,
        press("Go"),
      ),
    ).toEqual([]);
  });

  it.each<[string, () => React.ReactElement, () => void, string]>([
    [
      "SearchBar clear",
      () => <SearchBar value="Museum" onChange={() => {}} />,
      press("Clear search"),
      "SearchBar:search_cleared",
    ],
    [
      "POIResultCard action",
      () => (
        <POIResultCard
          poi={{
            id: "p",
            name: "Cafe",
            floorLabel: "Level 2",
            media: [],
            actions: ["navigate"],
          }}
          result={{
            poiId: "p",
            resultIndex: 0,
            selected: true,
            featured: false,
            actions: [{ action: "navigate", label: "Go" }],
          }}
          onSelect={() => {}}
          onAction={() => {}}
        />
      ),
      press("Go"),
      "POIResultCard:poi_result_action",
    ],
    [
      "WayfindingInputRow swap",
      () => <WayfindingInputRow originValue="A" destinationValue="B" />,
      press("Swap origin and destination"),
      "WayfindingInputRow:wayfinding_route_swapped",
    ],
    [
      "WayfindingCard close",
      () => <WayfindingCard onClose={() => {}}>Route</WayfindingCard>,
      press("Close navigation"),
      "WayfindingCard:wayfinding_card_closed",
    ],
    [
      "FeedbackCard submit",
      () => <FeedbackCard onSubmitFeedback={() => {}} />,
      () => {
        fireEvent.click(screen.getAllByRole("radio")[3]);
        fireEvent.click(
          screen.getByRole("button", { name: "Submit Feedback" }),
        );
      },
      // The rating is its own press, reported by Rating.
      "Rating:rating_changed FeedbackCard:feedback_submitted",
    ],
    [
      "SaveLocationCard save",
      () => <SaveLocationCard onSaveToggle={() => {}} />,
      press("Save Location"),
      "SaveLocationCard:save_toggled",
    ],
    [
      "SaveLocationCard route",
      () => <SaveLocationCard isSaved onRouteToLocation={() => {}} />,
      press(/Guide Me/),
      "SaveLocationCard:route_requested",
    ],
    [
      "SplitButton main action",
      () => <SplitButton>Action</SplitButton>,
      press("Action"),
      "SplitButton:split_button_main_clicked",
    ],
    [
      "FloorSelector level",
      () => (
        <FloorSelector
          floors={["2", "1", "g"]}
          selectedFloor="1"
          onFloorSelect={() => {}}
        />
      ),
      () => fireEvent.click(screen.getAllByRole("button", { name: /2/ })[0]),
      "FloorSelector:floor_selected",
    ],
    [
      "Dialog close",
      () => (
        <Dialog open onOpenChange={() => {}}>
          <DialogContent closeLabel="Close">
            <DialogTitle>Route</DialogTitle>
          </DialogContent>
        </Dialog>
      ),
      press("Close"),
      "Dialog:dialog_closed",
    ],
  ])("%s sends only its own event", (_, ui, act, expected) => {
    expect(eventsOf(ui(), act)).toEqual(expected.split(" "));
  });

  it("RoutingInputGroup swap, add and remove send only their own events", () => {
    const ui = (
      <RoutingInputGroup
        points={[
          { id: "a", value: "A", label: "From" },
          { id: "s", value: "S", label: "Stop" },
          { id: "b", value: "B", label: "To" },
        ]}
        onPointChange={() => {}}
        onAddPoint={() => {}}
        onRemovePoint={() => {}}
        onSwap={() => {}}
        addPointLabel="Add stop"
        removePointLabel={(point) => `Remove ${point.label}`}
      />
    );
    expect(eventsOf(ui, press("Add stop"))).toEqual([
      "RoutingInputGroup:point_added",
    ]);
    expect(eventsOf(ui, press("Remove Stop"))).toEqual([
      "RoutingInputGroup:point_removed",
    ]);
  });

  it("FileUpload remove sends only its own event", () => {
    const file = new File(["x"], "plan.pdf", { type: "application/pdf" });
    const events = eventsOf(<FileUpload label="Documents" />, () => {
      fireEvent.change(
        document.querySelector<HTMLInputElement>('input[type="file"]')!,
        { target: { files: [file] } },
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Remove file: plan.pdf" }),
      );
    });
    expect(events).toEqual([
      "FileUpload:files_selected",
      "FileUpload:file_removed",
    ]);
  });
});
