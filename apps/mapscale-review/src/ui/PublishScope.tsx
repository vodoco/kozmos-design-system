import { Icon, Text } from "@kozmos-ds/react";
import { ConfirmOverlay } from "./ConfirmOverlay";
import { levelsHeldFromPublish, type HeldLevel } from "../mock/publishScope";
import { SITE_NAME } from "../mock/site";

const LINE = "#e3e4e8";
const MUTED = "#5d626f";
const INK = "var(--review-ink)";

/**
 * **The site publish confirmation — the product's own overlay, plus what it will leave behind.**
 *
 * ⚠️ This is **not a new dialog**. Publishing already asks *"Ready to publish?"*, names the site and
 * warns about caching; a second overlay competing with it would be the worst outcome. The held
 * levels are an **insert** into that existing copy (Olcay, 2026-08-13: *"merge with the current
 * publish overlay"*), between the sentence and the caching note, and the buttons stay the ones
 * people already know.
 *
 * **Density is the constraint** (Olcay: *"too crowded"*). The first cut gave every level three
 * lines of prose and a *Review it* link, and four of those buried the sentence that matters. So:
 *   · the building is a heading, written **once**, not repeated on every row;
 *   · one line per level;
 *   · the status is two or three words at the right edge, never a sentence;
 *   · the whole row is the target, so no per-row link text.
 *
 * What it must never lose: **the count of what is being skipped**, and a route into each. Excluding
 * a level means shipping a map missing work somebody uploaded — that is only safe if it is said.
 */
export function PublishScope({
  open,
  onCancel,
  onPublish,
  onOpenLevel,
}: {
  open: boolean;
  onCancel: () => void;
  onPublish: () => void;
  onOpenLevel?: (l: HeldLevel) => void;
}) {
  const held = open ? levelsHeldFromPublish() : [];

  // one heading per building, in the order the tree shows them
  const buildings: { name: string; levels: HeldLevel[] }[] = [];
  for (const l of held) {
    const last = buildings[buildings.length - 1];
    if (last && last.name === l.building) last.levels.push(l);
    else buildings.push({ name: l.building, levels: [l] });
  }

  /**
   * Two or three words, never a sentence — and never a number we cannot stand behind.
   *
   * ⚠️ Not "No changelog" (Olcay, 2026-08-13: *"our system doesn't have a changelog at all"*). He is
   * right: "changelog" is OUR word for the per-change list, it names nothing the user has ever
   * seen, and here it would be explaining an absence with a term they do not have. What actually
   * happened is plainer and is what Red B says everywhere else — the floor-plan could not be
   * matched to the published map.
   */
  const status = (l: HeldLevel) =>
    l.changes !== undefined ? `${l.changes} changes` : "Couldn’t be matched";

  return (
    <ConfirmOverlay
      open={open}
      tone="info"
      title="Ready to publish?"
      confirmLabel="Yes, continue"
      cancelLabel="Go back"
      onConfirm={onPublish}
      onCancel={onCancel}
    >
      <Text
        style={{
          display: "block",
          fontSize: 13.5,
          color: INK,
          lineHeight: 1.5,
        }}
      >
        You are about to go live with the content updates for site, {SITE_NAME}.
      </Text>

      {held.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Text
            style={{
              display: "block",
              fontSize: 13,
              color: INK,
              lineHeight: 1.5,
            }}
          >
            <strong>{held.length} levels are still in review</strong> and will
            not be included.
          </Text>

          <div
            style={{
              marginTop: 8,
              border: `1px solid ${LINE}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {buildings.map((b, bi) => (
              <div key={b.name}>
                <div
                  style={{
                    padding: "6px 12px",
                    background: "#f6f7f9",
                    borderTop: bi === 0 ? "none" : `1px solid ${LINE}`,
                    fontSize: 11,
                    letterSpacing: 0.3,
                    color: MUTED,
                  }}
                >
                  {b.name}
                </div>
                {b.levels.map((l) => (
                  <div
                    key={`${l.buildingId}:${l.index}`}
                    onClick={() => onOpenLevel?.(l)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderTop: `1px solid ${LINE}`,
                      cursor: onOpenLevel ? "pointer" : "default",
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 13,
                        color: INK,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l.short} · {l.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: MUTED,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {status(l)}
                    </Text>
                    <Icon name="chevron-right" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <Text
        style={{
          display: "block",
          fontSize: 12.5,
          color: MUTED,
          marginTop: 14,
        }}
      >
        Note: It may take up to 15 minutes due to caching.
      </Text>
    </ConfirmOverlay>
  );
}
