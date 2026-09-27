import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kozmos-ds/react";
import { ConfirmOverlay } from "./ConfirmOverlay";
import type { MapBuilding } from "../map/PointrMap";
import type { LevelRef } from "../screens/MapContent";

/**
 * The drop-a-file-on-the-map confirmation (Olcay, 2026-08-10 evening): dragging a compatible
 * floor-plan file onto the map asks *"Did you want to upload a floor-plan for …?"* with a
 * building + level selector prefilled from what the map is showing — the drop names the file,
 * the map names the target, and the overlay lets the user confirm, retarget, or cancel.
 *
 * Reuses the v9 confirmation overlay (the same one Save speaks through) rather than inventing a
 * new modal. An incompatible file gets the warning variant of the same overlay: what was wrong
 * and what would work, one OK.
 */

/** v9's Add-level flow accepts "GeoJSON & DWG/DXF, PDF (experimental)" — same gate here. */
export function dropKind(fileName: string): "floor-plan" | "geojson" | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "geojson" || ext === "json") return "geojson";
  if (ext === "dwg" || ext === "dxf" || ext === "pdf") return "floor-plan";
  return null;
}

/** The Level select's pinned last option — v9's Level Manager creates levels from dropped files. */
const NEW_LEVEL = "__new-level__";

export function UploadDropConfirm({
  file,
  buildings,
  initialBuildingId,
  initialLevel,
  onConfirm,
  onCancel,
}: {
  file: string;
  buildings: MapBuilding[];
  /** What the map is showing — the overlay's prefill. */
  initialBuildingId: string;
  initialLevel: number;
  onConfirm: (target: LevelRef, file: string) => void;
  onCancel: () => void;
}) {
  const [buildingId, setBuildingId] = useState(initialBuildingId);
  const [levelIndex, setLevelIndex] = useState<number | typeof NEW_LEVEL>(
    initialLevel,
  );
  const building = buildings.find((b) => b.id === buildingId) ?? buildings[0];
  // A building with no levels is a real data shape (the SDK returns `levels: []`), so never spread
  // an empty array into Math.max — that yields -Infinity and offers to create "Level -Infinity".
  const hasLevels = building.levels.length > 0;
  const addingNew = levelIndex === NEW_LEVEL || !hasLevels;
  // a new level takes the next free index above the building's top floor
  const newIndex = hasLevels
    ? Math.max(...building.levels.map((l) => l.index)) + 1
    : 0;
  const level = addingNew
    ? { index: newIndex, short: `L${newIndex}`, long: `New Level ${newIndex}` }
    : (building.levels.find((l) => l.index === levelIndex) ??
      building.levels[0]);

  if (!dropKind(file)) {
    return (
      <ConfirmOverlay
        open
        tone="warning"
        title="That file isn't a floor-plan"
        confirmLabel="OK"
        cancelLabel="Cancel"
        onConfirm={onCancel}
        onCancel={onCancel}
      >
        <b>{file}</b> can’t be uploaded — floor-plans arrive as GeoJSON, DWG/DXF
        or PDF (experimental).
      </ConfirmOverlay>
    );
  }

  return (
    <ConfirmOverlay
      open
      tone="info"
      title="Upload floor-plan?"
      confirmLabel="Upload"
      onConfirm={() =>
        onConfirm(
          {
            building: building.name,
            buildingId: building.id,
            index: level.index,
            short: level.short,
            name: level.long,
            ...(addingNew ? { isNew: true } : null),
          },
          file,
        )
      }
      onCancel={onCancel}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span>
          Did you want to upload{" "}
          <b style={{ wordBreak: "break-all" }}>{file}</b> as a new floor-plan
          for:
        </span>
        <div>
          <label
            htmlFor="drop-building"
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Building
          </label>
          <Select
            value={buildingId}
            onValueChange={(id) => {
              setBuildingId(id);
              // keep the same floor number when the new building has it, else its first level —
              // and fall to "add as new" when it has none at all (b.levels[0] used to throw)
              const b = buildings.find((x) => x.id === id);
              if (b && !b.levels.some((l) => l.index === levelIndex))
                setLevelIndex(b.levels.length ? b.levels[0].index : NEW_LEVEL);
            }}
          >
            <SelectTrigger id="drop-building" aria-label="Building">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label
            htmlFor="drop-level"
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Level
          </label>
          <Select
            value={addingNew ? NEW_LEVEL : String(level.index)}
            onValueChange={(v) =>
              setLevelIndex(v === NEW_LEVEL ? NEW_LEVEL : Number(v))
            }
          >
            <SelectTrigger id="drop-level" aria-label="Level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {building.levels.map((l) => (
                <SelectItem key={l.index} value={String(l.index)}>
                  {l.short} — {l.long}
                </SelectItem>
              ))}
              {/* v9's Level Manager creates levels from dropped floor-plans — same door here */}
              <SelectItem value={NEW_LEVEL}>＋ Add as new level</SelectItem>
            </SelectContent>
          </Select>
          {addingNew && (
            <div
              style={{
                fontSize: 12,
                color: "#5d626f",
                marginTop: 6,
                lineHeight: 1.4,
              }}
            >
              Creates <b>{level.short}</b> (index {level.index}) in{" "}
              {building.name} — rename it in the editor once it opens.
            </div>
          )}
        </div>
      </div>
    </ConfirmOverlay>
  );
}
