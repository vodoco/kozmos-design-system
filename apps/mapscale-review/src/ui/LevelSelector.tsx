import { useState } from "react";
import { Icon } from "@kozmos-ds/react";
import type { MapBuilding } from "../map/PointrMap";

/**
 * v9's map-pane building/level selector (Figma `b8dqhE3CPxitYfqlXuQJTC`, node 19553:26750):
 * a building stepper — ← name → — over the current level, which expands into the building's
 * levels with the current one held. Sits top-centre of the map.
 */
const LINE = "#e3e4e8";
const INK = "#1F2328";

const ROW: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "9px 14px",
  background: "none",
  border: "none",
  borderTop: `1px solid ${LINE}`,
  fontSize: 13,
  color: INK,
  textAlign: "center",
  cursor: "pointer",
};

export function LevelSelector({
  buildings,
  buildingId,
  levelIndex,
  onChange,
  offsetRight = 0,
}: {
  buildings: MapBuilding[];
  buildingId: string;
  levelIndex: number;
  onChange: (buildingId: string, levelIndex: number) => void;
  /**
   * Width taken out of the map on the right — the POI panel, when it is open (§19). The selector
   * re-centres on the map you can still SEE, for the same reason the focused feature does: at
   * 1280px the map pane is 744px wide, so a 340px panel and a centred 268px selector overlap by
   * 114px. Centring in the free space is not a nudge to dodge a collision; it is the selector
   * continuing to mean "the middle of the map".
   */
  offsetRight?: number;
}) {
  const [open, setOpen] = useState(false);
  const i = Math.max(
    0,
    buildings.findIndex((b) => b.id === buildingId),
  );
  const building = buildings[i];
  if (!building) return null;
  const level =
    building.levels.find((l) => l.index === levelIndex) ?? building.levels[0];

  // Stepping to another building lands on its nearest level to the one you were on, so you keep
  // your place vertically instead of being dumped on the ground floor.
  const step = (by: number) => {
    const next = buildings[(i + by + buildings.length) % buildings.length];
    const nearest = next.levels.reduce(
      (best, l) =>
        Math.abs(l.index - levelIndex) < Math.abs(best.index - levelIndex)
          ? l
          : best,
      next.levels[0],
    );
    setOpen(false);
    onChange(next.id, nearest.index);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: `translateX(calc(-50% - ${offsetRight / 2}px))`,
        transition: "transform .18s ease",
        width: 268,
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        boxShadow: "0 4px 16px rgba(0,0,0,.10)",
        overflow: "hidden",
        zIndex: 4,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", padding: "8px 10px" }}
      >
        <button
          onClick={() => step(-1)}
          aria-label="Previous building"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#5d626f",
            display: "grid",
          }}
        >
          <Icon name="arrow-left" />
        </button>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 14,
            fontWeight: 600,
            color: INK,
          }}
        >
          {building.name}
        </div>
        <button
          onClick={() => step(1)}
          aria-label="Next building"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#5d626f",
            display: "grid",
          }}
        >
          <Icon name="arrow-right" />
        </button>
      </div>

      {open ? (
        building.levels.map((l) => (
          <button
            key={l.index}
            onClick={() => {
              setOpen(false);
              onChange(building.id, l.index);
            }}
            style={{
              ...ROW,
              background: l.index === level.index ? "#eceef1" : "none",
            }}
          >
            {l.long} ({l.short})
          </button>
        ))
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-expanded={false}
          style={{
            ...ROW,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span style={{ flex: 1, textAlign: "center" }}>
            {level.long} ({level.short})
          </span>
          <Icon name="chevron-down" />
        </button>
      )}
    </div>
  );
}
