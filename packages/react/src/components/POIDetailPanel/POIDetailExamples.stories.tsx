import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { POIAction } from "@kozmos-ds/product-contracts";
import {
  POIDetailPanel,
  type POIDetailPanelProps,
  type POIActionState,
} from "./POIDetailPanel";
import { AdaptiveMapShell } from "../AdaptiveMapShell";
import { Button } from "../Button";
import { Text } from "../Text";
import {
  entranceDetails,
  entrancePOI,
  poiActionLabels,
  restaurantDetails,
  restaurantPOI,
  retailPOI,
  retailDetails,
  fitnessPOI,
  fitnessDetails,
  parkingPOI,
  parkingDetails,
  fullFieldDetails,
  longContentPOI,
  longContentDetails,
} from "./POIDetailPanel.fixtures";

function Example({
  map = false,
  ...props
}: Omit<POIDetailPanelProps, "onAction"> & { map?: boolean }) {
  const [favourite, setFavourite] = React.useState(false);
  const [bookmark, setBookmark] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [open, setOpen] = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);
  const [bottom, setBottom] = React.useState(true);
  const opener = React.useRef<HTMLButtonElement>(null);
  const panel = React.useRef<HTMLElement>(null);
  const panelId = React.useId();
  const onAction = (action: POIAction) => {
    if (action === "favourite") setFavourite(!favourite);
    else if (action === "bookmark") setBookmark(!bookmark);
    else
      setMessage(
        action === "navigate"
          ? "Demo route requested. No route has been calculated."
          : `Demo ${action} requested. No external action was performed.`,
      );
  };
  const reopen = () => {
    setOpen(true);
    requestAnimationFrame(() => panel.current?.focus());
  };
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => opener.current?.focus());
  };
  const actionStates: Partial<Record<POIAction, POIActionState>> = {
    favourite: { pressed: favourite },
    bookmark: { pressed: bookmark },
    ...props.actionStates,
  };
  const details = open ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: map ? "100%" : undefined,
        minHeight: 0,
      }}
    >
      {map && bottom && (
        <Button
          variant="ghost"
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show more map" : "Show more details"}
        </Button>
      )}
      <POIDetailPanel
        {...props}
        ref={panel}
        id={panelId}
        tabIndex={-1}
        style={{
          width: "100%",
          flex: map ? 1 : undefined,
          minHeight: 0,
          ...props.style,
        }}
        presentation={map ? (bottom ? "sheet" : "panel") : "inline"}
        actionStates={actionStates}
        onAction={onAction}
        onClose={close}
        onSupplementaryAction={(action) =>
          setMessage(
            `Demo ${action} requested. No external action was performed.`,
          )
        }
      />
    </div>
  ) : undefined;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: map ? "100dvh" : undefined,
        minHeight: 0,
      }}
    >
      <div style={{ padding: "0.75rem 1rem", flexShrink: 0 }}>
        <Text size="sm" color="muted">
          SDK reference example · illustrative data, no live map or external
          actions. Photos and logos not supplied.
        </Text>
        <Text size="sm" role="status">
          {message}
        </Text>
      </div>
      {map ? (
        <AdaptiveMapShell
          style={{ flex: 1, minHeight: 0 }}
          panel={details}
          panelLabel="Place details"
          panelFraction={expanded ? 0.88 : 0.55}
          onLayoutChange={(layout) =>
            setBottom(layout.presentation === "bottom")
          }
          map={
            <div
              style={{
                display: "grid",
                placeContent: "start",
                height: "100%",
                padding: "1rem",
                gap: "1rem",
              }}
            >
              <Text size="sm" color="muted">
                Map renderer placeholder
              </Text>
              {!open && (
                <Button ref={opener} variant="outline" onClick={reopen}>
                  View {props.poi.name}
                </Button>
              )}
            </div>
          }
        />
      ) : (
        <div
          style={{
            width: "100%",
            maxWidth: "25rem",
            marginInline: "auto",
            padding: "0.75rem",
          }}
        >
          {!open && (
            <Button ref={opener} onClick={reopen}>
              View {props.poi.name}
            </Button>
          )}
          {details}
        </div>
      )}
    </div>
  );
}

const meta = {
  title: "Product SDK/POI Detail Examples",
  component: POIDetailPanel,
  parameters: { layout: "fullscreen" },
  args: {
    poi: restaurantPOI,
    details: restaurantDetails,
    actionLabels: poiActionLabels,
  },
  render: (args) => <Example key={args.poi.id} {...args} />,
} satisfies Meta<typeof POIDetailPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Restaurant: Story = {};
export const Entrance: Story = {
  args: { poi: entrancePOI, details: entranceDetails },
};
export const Retail: Story = {
  args: { poi: retailPOI, details: retailDetails },
};
export const Fitness: Story = {
  args: { poi: fitnessPOI, details: fitnessDetails },
};
export const Parking: Story = {
  args: { poi: parkingPOI, details: parkingDetails },
};
export const FullFieldCatalogue: Story = {
  args: {
    poi: {
      ...restaurantPOI,
      id: "catalogue",
      name: "POI field catalogue",
      description: "Synthetic all-fields stress test. Not a real venue.",
    },
    details: fullFieldDetails,
  },
};
export const OnMap: Story = {
  render: (args) => <Example key={args.poi.id} {...args} map />,
};
export const MissingData: Story = {
  args: {
    poi: {
      ...entrancePOI,
      availability: "unknown",
      availabilityLabel: "Hours unavailable",
      buildingLabel: undefined,
      actions: ["navigate", "share"],
    },
    details: { groups: [{ id: "empty", heading: "Amenities", items: [] }] },
  },
};
export const FailedMedia: Story = {
  args: {
    poi: {
      ...restaurantPOI,
      media: [
        {
          id: "failed",
          src: "data:image/png;base64,broken",
          alt: "Il Forno dining room",
        },
      ],
    },
  },
};
export const ActionStates: Story = {
  args: {
    actionStates: {
      navigate: {
        disabled: true,
        message: "Route unavailable. Select a starting point.",
        messageTone: "error",
      },
    },
    supplementaryActionStates: {
      book: {
        loading: true,
        message: "Booking request in progress (example state).",
      },
    },
  },
};
export const LongContent: Story = {
  args: { poi: longContentPOI, details: longContentDetails },
};
