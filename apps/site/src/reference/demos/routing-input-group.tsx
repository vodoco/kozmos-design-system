import { useState } from "react";
import { Box, RoutingInputGroup, type RoutePoint } from "@kozmos-ds/react";
import { GlassBackdrop } from "../GlassBackdrop";
import type { DemoModule } from "../types";

const initial: RoutePoint[] = [
  { id: "from", value: "Main entrance", placeholder: "From" },
  { id: "to", value: "", placeholder: "To" },
];

function usePoints() {
  const [points, setPoints] = useState<RoutePoint[]>(initial);
  const change = (id: string, value: string) =>
    setPoints((list) =>
      list.map((point) => (point.id === id ? { ...point, value } : point)),
    );
  const swap = () =>
    setPoints((list) =>
      [...list].reverse().map((point, index) => ({
        ...point,
        placeholder:
          index === 0 ? "From" : index === list.length - 1 ? "To" : "Via",
      })),
    );
  const add = () =>
    setPoints((list) => [
      ...list.slice(0, -1),
      { id: `via-${list.length}`, value: "", placeholder: "Via" },
      list[list.length - 1],
    ]);
  const remove = (id: string) =>
    setPoints((list) => list.filter((point) => point.id !== id));
  return { points, change, swap, add, remove };
}

function FromTo() {
  const { points, change, swap, add, remove } = usePoints();
  return (
    <Box className="site-demo-column">
      <RoutingInputGroup
        points={points}
        onPointChange={change}
        onSwap={swap}
        onAddPoint={add}
        onRemovePoint={remove}
      />
    </Box>
  );
}

function OnGlass() {
  const { points, change, swap } = usePoints();
  return (
    <GlassBackdrop colours={["turquoise", "blue"]}>
      <RoutingInputGroup
        surface="glass"
        points={points}
        onPointChange={change}
        onSwap={swap}
      />
    </GlassBackdrop>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "From, via, to",
    description:
      "points is the list; onSwap reverses it, onAddPoint adds a stop, onRemovePoint takes one away.",
    Component: FromTo,
  },
  { title: "On glass", Component: OnGlass },
];
