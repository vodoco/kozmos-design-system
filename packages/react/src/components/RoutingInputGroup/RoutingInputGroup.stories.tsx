import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RoutingInputGroup, type RoutePoint } from "./RoutingInputGroup";

const meta = {
  title: "Map/RoutingInputGroup",
  component: RoutingInputGroup,
  parameters: { layout: "centered" },
} satisfies Meta<typeof RoutingInputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const initialPoints: RoutePoint[] = [
  {
    id: "origin",
    value: "Current location",
    placeholder: "Choose starting point",
  },
  { id: "destination", value: "Gate A12", placeholder: "Choose destination" },
];

export const Default: Story = {
  render: () => {
    const [points, setPoints] = useState(initialPoints);

    return (
      <RoutingInputGroup
        style={{ width: "min(420px, calc(100vw - 32px))" }}
        points={points}
        onPointChange={(id, value) =>
          setPoints((current) =>
            current.map((point) =>
              point.id === id ? { ...point, value } : point,
            ),
          )
        }
        onSwap={() =>
          setPoints(([origin, destination]) => [destination, origin])
        }
        onAddPoint={() =>
          setPoints((current) => [
            ...current.slice(0, -1),
            {
              id: `stop-${current.length}`,
              value: "",
              placeholder: "Add stop",
            },
            current[current.length - 1],
          ])
        }
      />
    );
  },
};

export const WithStop: Story = {
  render: () => {
    const [points, setPoints] = useState<RoutePoint[]>([
      initialPoints[0],
      { id: "stop", value: "Coffee bar", placeholder: "Add stop" },
      initialPoints[1],
    ]);

    return (
      <RoutingInputGroup
        style={{ width: "min(420px, calc(100vw - 32px))" }}
        points={points}
        onPointChange={(id, value) =>
          setPoints((current) =>
            current.map((point) =>
              point.id === id ? { ...point, value } : point,
            ),
          )
        }
        onRemovePoint={(id) =>
          setPoints((current) => current.filter((point) => point.id !== id))
        }
      />
    );
  },
};
