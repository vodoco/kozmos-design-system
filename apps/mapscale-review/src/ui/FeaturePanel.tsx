import { Copy } from "./icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  buttonVariants,
  Card,
  Icon,
  IconButton,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Text,
} from "@kozmos-ds/react";
import { PanelHeader, PANEL_PAD } from "./PanelHeader";
import {
  CLASS_LABEL,
  categoryLabel,
  categoryOf,
  classOf,
  suggestedFor,
  typeLabel,
} from "../mock/taxonomy";
import {
  TYPE_LABEL,
  isTruthy,
  propertyDef,
  propertyLabel,
  segmentRank,
  toArray,
  type PropertyDef,
} from "../mock/properties";

/**
 * The POI properties panel (§19) — what a selected feature *is*, and now what it can be *made* to
 * be.
 *
 * **Floating over the map's right edge, not a third column** (Olcay, 2026-08-12: *"floating panel
 * on the map's right, don't resize map but center — offset the key element on the map"*). The map
 * keeps its width and the *camera* makes room: `focusPadRight` frames the feature in the part of
 * the map the panel doesn't cover.
 *
 * **Two modes, deliberately modelled on two different real screens** (Olcay, 2026-08-12, with the
 * dashboard's *Editing Map Content* panel and the SDK's POI-card contract attached — *"all
 * properties should be editable… maybe we can align with that a little using our design system"*):
 *
 * - **Reading is the SDK's POI card.** That card derives its sections from `properties` — 23
 *   sections out of 60 properties in the published contract — so this one does too: an array or
 *   enum becomes a titled chip group, a boolean becomes a chip only when it is *true*, a hyperlink
 *   becomes an action, and `description` gets the paragraph under the title. Nothing here is a
 *   hand-written list of fields; add `cuisines` in edit mode and a **Cuisines** section appears,
 *   for the same reason it appears on the real card.
 * - **Editing is the dashboard's *Editing Map Content*.** FID read-only with a copy button, the
 *   type selector, a required Name, **Featured**, then *+ Add additional field* with its
 *   **Suggested / Others** split and the value type printed beside each row — and every field
 *   removable by its own bin. Controls are chosen by the taxonomy's own `inputType`.
 *
 * ⚠️ **The identifiers are never editable.** `fid`/`bid`/`sid`/`lvl` say *which feature this is and
 * where it lives*; a text box around them offers to re-parent a feature into another building,
 * which is not an edit. The real panel agrees — its FID field is read-only with a copy button, and
 * that is exactly what is built here.
 *
 * ⚠️ **Two DS components that look right and are not**, worth knowing before reaching for them:
 * `POICard` is the *consumer wayfinding* card (hero image, `text-xl` heading, action footer) and
 * `Badge` is touch-sized at `h-11`. Both are scaled for the end-user SDK app, not a 340px dashboard
 * inspector. The DS has no dense property-list component, so the rows are the app's own, built from
 * DS type and tokens.
 */
export const FEATURE_PANEL_WIDTH = 360;
/** The inset from the map's edges — matched to the Map Settings control in the opposite corner. */
const PANEL_INSET = 12;

const MUTED = "var(--primitives-colors-background-600)";
const LINE = "var(--primitives-colors-background-900)";
const INK = "var(--review-ink)";

/** The tile properties that are identity, not content — shown, never edited. See the note above. */
const IDENTITY: { key: string; label: string }[] = [
  { key: "fid", label: "FID" },
  { key: "bid", label: "Building ID" },
  { key: "sid", label: "Site ID" },
  { key: "lvl", label: "Level index" },
];
/** Handled by their own dedicated controls rather than as generic properties. */
const RESERVED = new Set([
  "fid",
  "bid",
  "sid",
  "lvl",
  "name",
  "mainType",
  "subType",
  "mapPersonas",
]);

/** `copy-01` from the Pointr Icon Library (see `./icons`). */
function CopyGlyph() {
  return <Copy size={16} />;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        display: "block",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".04em",
        textTransform: "uppercase",
        color: MUTED,
      }}
    >
      {children}
    </Text>
  );
}

/** A value chip — the SDK card's own unit for "one of a set". */
function ValueChip({ children, muted }: { children: string; muted?: boolean }) {
  return (
    <span
      style={{
        fontSize: 11.5,
        padding: "4px 9px",
        borderRadius: 999,
        border: `1px ${muted ? "dashed" : "solid"} ${LINE}`,
        background: muted
          ? "transparent"
          : "var(--primitives-colors-background-100)",
        color: muted ? MUTED : INK,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/* ── reading: the card, derived from properties ──────────────────────────────── */

/**
 * One derived section of the read view.
 *
 * Built by walking the property bag rather than a field list, which is what makes this *the same
 * shape* as the SDK card instead of a lookalike: the card has 23 sections because the feature has
 * 23 properties worth drawing, not because anybody enumerated them.
 */
function DerivedSections({ values }: { values: Record<string, unknown> }) {
  const sections = useMemo(() => {
    const out: { key: string; def: PropertyDef; chips: string[] }[] = [];
    for (const [key, v] of Object.entries(values)) {
      if (RESERVED.has(key)) continue;
      const def = propertyDef(key);
      // Booleans and hyperlinks are drawn elsewhere (stat chips / actions); text is a paragraph.
      if (def.valueType !== "array" && def.valueType !== "enum") continue;
      const chips = toArray(v);
      if (chips.length) out.push({ key, def, chips });
    }
    return out.sort(
      (a, b) => segmentRank(a.def.segment) - segmentRank(b.def.segment),
    );
  }, [values]);

  if (!sections.length) return null;
  return (
    <>
      {sections.map((s) => (
        <div key={s.key} style={{ marginTop: 16 }}>
          <Text
            style={{
              display: "block",
              fontSize: 12.5,
              fontWeight: 600,
              color: INK,
              marginBottom: 6,
            }}
          >
            {propertyLabel(s.key)}
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {s.chips.map((c) => (
              <ValueChip key={c}>{c}</ValueChip>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/* ── editing several features at once ─────────────────────────────────────────
   Olcay, 2026-08-16: *"edit metadata panel would update based on the combined information (e.g.
   multiple values - or a value if same for both POIs) ... changing metadata or values would affect
   all selected."* */

/**
 * The value of a field the selected features **disagree** about.
 *
 * A sentinel rather than `undefined`, and this is the whole reason it exists: "they differ" and
 * "nobody has set it" have to stay distinguishable all the way to the save. Blank them together and
 * an untouched *Multiple values* field would be written back as empty to every feature in the
 * selection — silently erasing four descriptions because somebody renamed a room.
 *
 * ⚠️ Written as the **escape** `\u0000`, never as a literal NUL in the source — an invisible
 * control character in a file is a trap for every diff, editor and search that touches it. The
 * value survives the `JSON.stringify` comparisons the dirty check and the merge both use, and
 * can never collide with anything a person could type.
 */
export const MULTIPLE = "\u0000multiple";

/**
 * Fields that belong to one feature and are never merged — the panel shows the primary's.
 *
 * Wider than `IDENTITY` above, which is only the four the read view prints: `mainType` classifies
 * the feature and drives the icon and the sub-type list, and `mapPersonas` has no control here.
 * None of the three is editable, so merging them could only ever produce a sentinel nobody could
 * clear.
 */
const PER_FEATURE = new Set([
  "fid",
  "bid",
  "sid",
  "lvl",
  "mainType",
  "mapPersonas",
]);

/** What a differing field says where it has room to say it. */
const MULTI_LABEL = "Multiple values";

/**
 * The same thing where there is no placeholder to put it in — a switch has no third position, and
 * a chip row's emptiness would otherwise read as "none of them have any".
 */
function MultiHint() {
  return (
    <Text
      as="span"
      style={{
        marginLeft: 8,
        fontSize: 11,
        fontStyle: "italic",
        color: MUTED,
        // Never broken across two lines — "Multiple / values" reads as two separate words about
        // two separate things, which is the one thing this label must not do.
        whiteSpace: "nowrap",
      }}
    >
      {MULTI_LABEL}
    </Text>
  );
}

/**
 * One property bag standing for the whole selection: a shared value where they agree, `MULTIPLE`
 * where they do not.
 *
 * A key missing from one bag counts as a disagreement, because it is one — three features with a
 * description and one without do not share a description.
 */
export function mergeForEditing(
  bags: Record<string, unknown>[],
): Record<string, unknown> {
  if (bags.length <= 1) return bags[0] ?? {};
  const keys = new Set<string>();
  for (const b of bags) for (const k of Object.keys(b)) keys.add(k);
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (PER_FEATURE.has(k)) {
      out[k] = bags[0][k];
      continue;
    }
    const first = JSON.stringify(bags[0][k] ?? null);
    out[k] = bags.every((b) => JSON.stringify(b[k] ?? null) === first)
      ? bags[0][k]
      : MULTIPLE;
  }
  return out;
}

/* ── editing: the dashboard's field editor ───────────────────────────────────── */

/** One editable property, drawn by the control its taxonomy `inputType` asks for. */
function PropertyField({
  def,
  value,
  onChange,
  onRemove,
}: {
  def: PropertyDef;
  value: unknown;
  onChange: (v: unknown) => void;
  onRemove: () => void;
}) {
  const label = propertyLabel(def.key);
  const [pick, setPick] = useState(false);
  /**
   * ⚠️ **A field the selection disagrees about shows as EMPTY with a placeholder, never as its
   * sentinel.** Every control below reads `shown` rather than `value`, so the sentinel exists only
   * between the merge and the save and is never something a person can see or type over by
   * accident. Typing replaces it outright, which is exactly "changing it affects all selected".
   */
  const many = value === MULTIPLE;
  const shown = many ? undefined : value;
  const chips = toArray(shown);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        marginTop: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {def.valueType === "boolean" ? (
          /**
           * **Label first, switch at the right edge** (Olcay, 2026-08-16: *"the toggles should be
           * on the right side not left"*).
           *
           * Not only a preference — it is what makes the column read. Every other field in this
           * panel puts its name at the left edge and its control below or beside it, so a leading
           * switch made the booleans the one row whose *text* started 44px in, and their labels
           * lined up with nothing. Right-aligned controls also share one edge down the form, which
           * is the thing that makes a settings list scannable.
           *
           * ⚠️ The DS `Switch`'s own `label` prop puts the label AFTER the control, so it is not
           * used here — the label is the app's, and the switch is given the row's far end.
           */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "6px 0",
            }}
          >
            <label
              htmlFor={`f-${def.key}`}
              style={{
                fontSize: 13,
                color: INK,
                cursor: "pointer",
                minWidth: 0,
              }}
            >
              {label}
              {/* A switch has no third position, so a disagreement is said beside the label
                  instead — and it reads OFF, which is the safe way round: nothing is written to
                  any feature until it is actually toggled. */}
              {many && <MultiHint />}
            </label>
            {/**
             * ⚠️ **A span, because the DS wrapper is `w-full` and `wrapperClassName` cannot undo
             * it.** Passing `!w-auto` looked like the fix and did nothing: this app does not run
             * Tailwind over its own source, so a class it invents is never compiled and the
             * attribute lands on an element with no rule behind it. Measured, not assumed — the
             * wrapper was still 254px and the switch still sat where the label left it.
             *
             * Shrink-to-fit here resolves the inner `width: 100%` against the switch's own
             * max-content, so the control ends up its natural width at the row's right edge.
             */}
            <span style={{ display: "inline-flex", flex: "0 0 auto" }}>
              <Switch
                checked={isTruthy(shown)}
                onCheckedChange={(c: boolean) => onChange(c)}
                id={`f-${def.key}`}
              />
            </span>
          </div>
        ) : def.valueType === "text" && def.inputType === "textArea" ? (
          <div>
            <Text
              style={{
                display: "block",
                fontSize: 11,
                color: MUTED,
                marginBottom: 4,
              }}
            >
              {label}
            </Text>
            <textarea
              value={String(shown ?? "")}
              placeholder={many ? MULTI_LABEL : undefined}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              aria-label={label}
              style={{
                width: "100%",
                resize: "vertical",
                fontFamily: "inherit",
                fontSize: 13,
                color: INK,
                padding: "8px 10px",
                borderRadius: "var(--primitives-radius-lg, 8px)",
                border: `1px solid ${LINE}`,
                background: "var(--primitives-colors-background-0, #fff)",
              }}
            />
          </div>
        ) : def.options?.length ? (
          /* A closed list: chips you have, plus a picker. `array` takes many, `enum` takes one —
             which is the only difference between them and the reason both are kept. */
          <div>
            <Text
              style={{
                display: "block",
                fontSize: 11,
                color: MUTED,
                marginBottom: 4,
              }}
            >
              {label}
              {/* An empty chip row would otherwise read as "none of them have any", which is a
                  different and wronger claim than "they differ". */}
              {many && <MultiHint />}
            </Text>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                alignItems: "center",
                padding: "7px 8px",
                borderRadius: "var(--primitives-radius-lg, 8px)",
                border: `1px solid ${LINE}`,
                minHeight: 38,
              }}
            >
              {chips.map((c) => (
                <span
                  key={c}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11.5,
                    padding: "3px 4px 3px 9px",
                    borderRadius: 999,
                    background: "var(--primitives-colors-background-100)",
                    color: INK,
                  }}
                >
                  {c}
                  <button
                    onClick={() => onChange(chips.filter((x) => x !== c))}
                    aria-label={`Remove ${c}`}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: MUTED,
                      lineHeight: 1,
                      padding: 2,
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
              <Popover open={pick} onOpenChange={setPick}>
                <PopoverTrigger asChild>
                  <button
                    aria-label={`Add ${label}`}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "var(--primitives-colors-theme-700)",
                      fontSize: 12,
                      padding: "2px 4px",
                    }}
                  >
                    + Add
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  style={{
                    width: 260,
                    padding: 4,
                    maxHeight: 260,
                    overflow: "auto",
                  }}
                >
                  {def.options
                    .filter((o) => !chips.includes(o))
                    .map((o) => (
                      <button
                        key={o}
                        onClick={() => {
                          onChange(
                            def.valueType === "enum" ? [o] : [...chips, o],
                          );
                          setPick(false);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "7px 10px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontSize: 12.5,
                          color: INK,
                          borderRadius: 6,
                        }}
                      >
                        {o}
                      </button>
                    ))}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        ) : (
          <Input
            label={label}
            value={String(shown ?? "")}
            onChange={(e) => onChange(e.target.value)}
            type={def.valueType === "integer" ? "number" : "text"}
            placeholder={
              many
                ? MULTI_LABEL
                : def.valueType === "hyperlink"
                  ? "https://"
                  : undefined
            }
            aria-label={label}
          />
        )}
      </div>
      {/* The dashboard's own affordance: a field you added is a field you can take away. */}
      <IconButton
        variant="ghost"
        size="sm"
        onClick={onRemove}
        aria-label={`Remove ${label} field`}
        title="Remove field"
        style={{ flex: "0 0 auto", marginTop: 18 }}
      >
        <Icon name="trash-01" />
      </IconButton>
    </div>
  );
}

/**
 * *+ Add additional field* — the dashboard's searchable picker, with the taxonomy's own
 * **Suggested / Others** split and the value type printed on the right of every row.
 *
 * "Suggested" is not a ranking: it is `suggestedProperties` for this exact `(mainType, subType)`,
 * i.e. what the product expects a feature of this type to carry. Everything else the vocabulary
 * knows sits under "Others", which is what stops the split from being a dead end.
 */
function AddFieldPicker({
  suggested,
  others,
  onAdd,
}: {
  suggested: string[];
  others: string[];
  onAdd: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const match = (k: string) =>
    !q || propertyLabel(k).toLowerCase().includes(q.toLowerCase());
  const s = suggested.filter(match);
  const o = others.filter(match);

  const row = (k: string) => {
    const def = propertyDef(k);
    return (
      <button
        key={k}
        onClick={() => {
          onAdd(k);
          setOpen(false);
          setQ("");
        }}
        title={def.description}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          textAlign: "left",
          padding: "8px 10px",
          border: "none",
          background: "none",
          cursor: "pointer",
          borderRadius: 6,
        }}
      >
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: INK }}>
          {propertyLabel(k)}
        </span>
        <span style={{ flex: "0 0 auto", fontSize: 11, color: MUTED }}>
          {TYPE_LABEL[def.valueType]}
        </span>
      </button>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 14,
            padding: 0,
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--primitives-colors-theme-700)",
            fontSize: 13,
          }}
        >
          <Icon name="plus" /> Add additional field
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        style={{ width: 300, padding: 6, maxHeight: 320, overflow: "auto" }}
      >
        <div style={{ padding: 4 }}>
          <Input
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search properties"
          />
        </div>
        {s.length > 0 && (
          <>
            <div
              style={{
                padding: "6px 10px",
                background: "var(--primitives-colors-background-100)",
                borderRadius: 4,
              }}
            >
              <SectionTitle>Suggested</SectionTitle>
            </div>
            {s.map(row)}
          </>
        )}
        {o.length > 0 && (
          <>
            <div
              style={{
                padding: "6px 10px",
                marginTop: 4,
                background: "var(--primitives-colors-background-100)",
                borderRadius: 4,
              }}
            >
              <SectionTitle>Others</SectionTitle>
            </div>
            {o.map(row)}
          </>
        )}
        {!s.length && !o.length && (
          <Text
            style={{
              display: "block",
              padding: 10,
              fontSize: 12,
              color: MUTED,
            }}
          >
            Nothing matches “{q}”.
          </Text>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function FeaturePanel({
  props: p,
  icon,
  onDirtyChange,
  geometryDirty,
  onCommitGeometry,
  subTypeOptions,
  selection,
  onDeselect,
  recomposable,
  onEdited,
  onSaved,
  onCancelEdit,
  saveSignal,
  reviewNote,
  reviewFootnote,
  onClose,
}: {
  /** The tile's own property bag plus any local edits, exactly as the app holds it. */
  props: Record<string, unknown>;
  icon?: React.ReactNode;
  /**
   * Told whenever the panel gains or loses unsaved changes — the app guards feature switches with
   * it (Olcay: *"warn the user if they changed a POI then tried to select some other POI"*).
   */
  onDirtyChange?: (dirty: boolean, canSave: boolean) => void;
  /**
   * The shape is edited on the map, but committed HERE — geometry and properties are one edit, so
   * they share one Update and one Cancel rather than each growing their own pair.
   */
  geometryDirty?: boolean;
  onCommitGeometry?: () => void;
  subTypeOptions?: string[];
  /**
   * **Everything selected, primary first** (Olcay, 2026-08-16). One entry is the ordinary case and
   * changes nothing; more than one turns on the count strip, the *Multiple values* placeholders,
   * and a save that writes to all of them.
   *
   * The panel is given the whole list rather than just a number because it has to be able to *show*
   * which features they are — a count alone leaves you unable to check what you are about to edit.
   */
  selection?: {
    fid: string;
    name: string;
    typeLabel: string;
    /**
     * What happened to this row (Olcay, 2026-08-16: *"we should update the selected items section
     * for combination results - what's joined for what's removed"*).
     *
     * ⚠️ **Three fates, and they must not be conflated.** `selected` is the ordinary case, still
     * its own feature. `joined` means a Combine took its floor into this shape. `removed` means it
     * was standing *between* two of them — a wall, a threshold — and has been taken off the map.
     * Absent means selected, so nothing outside Combine has to think about it.
     */
    fate?: "joined" | "removed";
  }[];
  /**
   * A row's ✕. **What it means depends on the row's fate** — drop from the selection, take back out
   * of the combined shape (which recomputes the geometry), or put back on the map.
   */
  onDeselect?: (fid: string, fate?: "joined" | "removed") => void;
  /**
   * Can a joined row still be taken back out? False once the shape has been hand-edited since the
   * combine, because recomputing from fewer members would discard that work. The row says so rather
   * than offering a ✕ that would either lie or destroy something.
   */
  recomposable?: boolean;
  /**
   * An edit was saved. Carries the flag-clearing consequence (§18a) up. D3: nothing persists.
   *
   * ⚠️ `next` holds **only the fields the editor actually settled** — a field the selection
   * disagreed about and nobody touched is left out entirely, so it is not flattened onto every
   * feature. `removed` is the fields binned, which cannot be inferred from `next` for the same
   * reason: absent means "leave alone", and only this says "take it away".
   */
  onEdited?: (next: Record<string, unknown>, removed?: string[]) => void;
  /**
   * Update finished — the panel is done and the screen should close it. Separate from `onEdited`
   * because they answer different questions: `onEdited` is *what changed*, and every surface that
   * reads `edits` cares; this is *the task is over*, which only the screen owning the panel cares
   * about. Carries the name so the confirmation can say which feature it means.
   */
  onSaved?: (name: string) => void;
  /**
   * **Cancel is the screen's to answer, not the panel's** (Olcay, 2026-08-15: *"Cancel edit should
   * close the panel completely and close all the geometry edit. Ask user to confirm if they changed
   * something"*).
   *
   * Cancel used to drop `editing` and leave the panel sitting there in its read view — with the
   * geometry toolbar still up, because the toolbar follows the panel. You had cancelled and nothing
   * looked cancelled. The panel cannot fix that itself: closing is the screen's job, and so is
   * asking before throwing work away, because the screen already owns that conversation for
   * feature switches and there should be exactly one of it.
   */
  onCancelEdit?: () => void;
  /**
   * Bumped by the screen to mean "save now, I am waiting on it" — the *Save changes* answer to the
   * unsaved-work overlay. The draft lives in here, so the save has to happen in here; the screen
   * can only ask.
   */
  saveSignal?: number;
  /**
   * **What saving means on THIS screen**, when it is not the plain answer.
   *
   * Map Content's Update writes the feature. Review & Finalise's writes an **override on a change**,
   * and for a removal it does something the default sentence cannot say at all — it stops the
   * deletion. So the subtitle is passed in rather than assumed, and it is the only string in this
   * panel that varies by where it is mounted.
   */
  reviewNote?: string;
  /**
   * ⚠️ The body's closing line is **misleading in a review** if left alone: *"nothing is written
   * back to Pointr Cloud"* is true, and it is not the whole truth once the override goes live when
   * the review completes. Both halves are said where this is passed.
   */
  reviewFootnote?: string;
  onClose: () => void;
}) {
  const mainType = String(p.mainType ?? "");
  const subType = p.subType ? String(p.subType) : undefined;
  const name = p.name ? String(p.name) : "";
  const cls = classOf(mainType, subType);
  const category = categoryOf(mainType, subType);
  const suggested = suggestedFor(mainType, subType);

  /**
   * **The panel opens in EDIT mode** (Olcay, 2026-08-14: *"click on a feature on the map and on
   * the listing should show the details panel in edit mode ... No need to add additional edit
   * button"*). Selecting a feature in a dashboard IS the intent to work on it; a read-only stop
   * with an Edit button in it was a step between the click and the thing the click was for.
   *
   * Safe because nothing commits until **Update**, which stays disabled until something actually
   * changes — so a look still costs nothing, exactly as it did before.
   */
  const [editing, setEditing] = useState(true);
  /**
   * ⚠️ **Live rows only.** After a Combine the list still carries the joined and removed features —
   * that is the point of it — but only one feature is actually being edited. Counting the whole
   * list would title the panel "3 features" and promise that a change here reaches all of them,
   * about two rows that no longer have an outline between them.
   */
  const liveRows = (selection ?? []).filter((s) => !s.fate);
  const multi = liveRows.length > 1;
  /** The strip appears whenever there is more than one row to report, whatever became of them. */
  const showStrip = (selection?.length ?? 0) > 1;
  /**
   * What the strip's one line says. Three counts, each named for what actually happened to it, and
   * only the ones that are non-zero — "3 selected · 0 removed" is noise pretending to be data.
   */
  const tally = useMemo(() => {
    const rows = selection ?? [];
    const kept = rows.filter((s) => !s.fate).length;
    const joined = rows.filter((s) => s.fate === "joined").length;
    const gone = rows.filter((s) => s.fate === "removed").length;
    const parts: string[] = [];
    // "selected" only while that is still true of them; once a combine has run they are one shape.
    if (kept) parts.push(joined ? `${kept} kept` : `${kept} features selected`);
    if (joined) parts.push(`${joined} joined`);
    if (gone) parts.push(`${gone} removed`);
    return parts.join(" · ");
  }, [selection]);
  /** The list of what is selected, collapsed by default — a count you can check when you want to. */
  const [listOpen, setListOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  /** Which optional properties the editor is showing — those with values, plus what you add. */
  const [fields, setFields] = useState<string[]>([]);

  /**
   * Selecting a different feature must not carry the previous one's half-typed edit across — and it
   * lands in edit mode like the first one did, because that is what selecting now means.
   *
   * This is the only thing that seeds the draft. There used to be a `reset()` beside it saying the
   * same two lines, for Cancel to call; Cancel now closes the panel instead of emptying it in
   * place, so re-seeding on the way *in* is the whole story.
   */
  /**
   * ⚠️ **The seed key is the whole SELECTION, not the primary's fid.**
   *
   * Shift-clicking a second feature does not change which feature is primary, so keying on
   * `p.fid` alone left the draft holding the first feature's values while the merged bag beside it
   * said *Multiple values* — and Update would then have written those stale values to everything
   * selected. Any change to who is selected re-seeds.
   */
  const seed =
    (selection ?? []).map((s) => s.fid).join(",") || String(p.fid ?? "");
  useEffect(() => {
    setEditing(true);
    setDraft({ ...p });
    setFields(Object.keys(p).filter((k) => !RESERVED.has(k)));
    // Keyed on the seed alone: re-seeding on every property change would wipe a half-typed
    // edit. (No eslint-disable — this config has no `react-hooks/exhaustive-deps` rule, so
    // the directive is itself an error and fails the pre-commit hook.)
  }, [seed]);

  /**
   * Has anything actually been changed? Both halves count: a value edited, and a field added or
   * binned — removing a property is an edit even though no value was typed.
   *
   * This is what makes "opens in edit mode" safe. Update stays dark until there is something to
   * save, so selecting a feature to LOOK at it commits nothing and warns about nothing.
   */
  const dirty = useMemo(() => {
    const original = Object.keys(p).filter((k) => !RESERVED.has(k));
    if (
      fields.length !== original.length ||
      fields.some((f) => !original.includes(f))
    )
      return true;
    const keys = new Set([...Object.keys(p), ...Object.keys(draft)]);
    for (const k of keys)
      if (JSON.stringify(p[k]) !== JSON.stringify(draft[k])) return true;
    return false;
  }, [p, draft, fields]);
  /**
   * The SHAPE counts as an edit too. Geometry lives on the map, but it is the same edit session, so
   * dragging a corner must light Update exactly as typing a name does — otherwise the only way to
   * save a reshaped outline would be to also change a property, which is absurd.
   */
  const anyDirty = dirty || !!geometryDirty;
  /**
   * ⚠️ **Exactly the condition on the Update button**, and it has to be, because *Save changes* in
   * the unsaved-work overlay runs the same `save()` from outside the panel. Without this the
   * overlay could save a feature with an empty **Name** — a required field the button itself
   * refuses — so the one route enforced the rule and the other quietly walked around it.
   */
  const canSave = anyDirty && !!String(draft.name ?? "").trim();
  useEffect(() => {
    onDirtyChange?.(anyDirty, canSave);
  }, [anyDirty, canSave, onDirtyChange]);
  // Leaving the panel must not leave the app believing an edit is still open.
  useEffect(() => () => onDirtyChange?.(false, false), [onDirtyChange]);

  const values = editing ? draft : p;
  const description = String(values.description ?? "");
  const options = subTypeOptions?.length
    ? subTypeOptions
    : subType
      ? [subType]
      : [];

  /** Not-yet-added properties, split the way the picker shows them. */
  const canAdd = useMemo(() => {
    const have = new Set(fields);
    const sug = (suggested ?? []).filter((k) => !have.has(k));
    const others = [
      "description",
      "websiteUrl",
      "hasAssistance",
      "serviceTypes",
      "openingHours",
      "priceRange",
    ].filter((k) => !have.has(k) && !sug.includes(k));
    return { sug, others };
  }, [fields, suggested]);

  /** Booleans that are true, and scalars worth a chip — the card's stat row. */
  const stats = useMemo(() => {
    const out: string[] = [];
    for (const [k, v] of Object.entries(values)) {
      if (RESERVED.has(k)) continue;
      const def = propertyDef(k);
      if (def.valueType === "boolean" && isTruthy(v))
        out.push(propertyLabel(k));
      else if (def.valueType === "integer" && v != null && v !== "")
        out.push(
          k === "priceRange"
            ? "$".repeat(Math.max(1, Math.min(4, Number(v) || 1)))
            : `${propertyLabel(k)} ${v}`,
        );
    }
    return out;
  }, [values]);

  const links = useMemo(
    () =>
      Object.entries(values)
        .filter(
          ([k, v]) =>
            !RESERVED.has(k) && propertyDef(k).valueType === "hyperlink" && v,
        )
        .map(([k, v]) => ({
          key: k,
          label: propertyDef(k).actionName ?? propertyLabel(k),
          href: String(v),
        })),
    [values],
  );

  /**
   * **Update saves and finishes.** (Olcay, 2026-08-15: *"update a feature should close the edit and
   * save the changes"*.) Selecting a feature IS edit mode here, so leaving the panel open after
   * Update left you in an edit you had already completed — with a primary button gone grey and
   * nothing left to do but hunt for the ✕. Saving is the end of the task, so it ends the task.
   *
   * The order matters: commit the shape and the fields FIRST, then hand over to `onSaved`, which
   * closes the panel. Closing tears the geometry editor down, and a teardown before the commit
   * would discard the outline it was about to save.
   */
  const save = () => {
    setEditing(false);
    // One Update commits both halves. The map keeps the shape and re-baselines, so the panel does
    // not stay dirty against an outline it has just saved.
    onCommitGeometry?.();
    // Only the keys the editor owns; identity is never in the draft's gift.
    const next: Record<string, unknown> = {
      name: draft.name ?? "",
      subType: draft.subType,
    };
    for (const k of fields) next[k] = draft[k];
    /**
     * ⚠️ **A field still showing its sentinel was never settled, so it is not saved.**
     *
     * This is the line that stops a multi-edit from flattening everything it did not touch:
     * rename four rooms and their four different descriptions must survive it. Dropped rather than
     * sent as `undefined`, because absent means "leave this alone" to the caller and `undefined`
     * would mean "make it empty".
     */
    for (const k of Object.keys(next)) if (next[k] === MULTIPLE) delete next[k];
    /**
     * Fields the editor binned. They cannot be read off `next` — absent there means "leave alone" —
     * so removal has to be said out loud, or taking a property away would silently do nothing to
     * every feature but the one whose bag happened to be shown.
     */
    const removed = Object.keys(p).filter(
      (k) => !RESERVED.has(k) && !fields.includes(k),
    );
    onEdited?.(next, removed);
    /**
     * What the confirmation calls this. With several selected the name is either shared or a
     * sentinel, and neither is worth announcing — the count is what happened.
     */
    const n = liveRows.length || 1;
    onSaved?.(n > 1 ? `${n} features` : String(draft.name ?? "").trim());
  };

  /**
   * The screen asking for a save. Guarded on a non-zero signal so the initial render never fires
   * one, and keyed on the signal alone — `save` is redefined every render, and depending on it
   * would save on every keystroke.
   */
  const saveRef = useRef(save);
  saveRef.current = save;
  const canSaveRef = useRef(canSave);
  canSaveRef.current = canSave;
  useEffect(() => {
    // Guarded, not assumed: the screen only offers *Save changes* when it can be done, but the
    // panel owns the rule and must not rely on the caller to have checked it.
    if (saveSignal && canSaveRef.current) saveRef.current();
  }, [saveSignal]);

  return (
    <Card
      style={{
        position: "absolute",
        top: PANEL_INSET,
        right: PANEL_INSET,
        bottom: PANEL_INSET,
        width: FEATURE_PANEL_WIDTH,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        zIndex: 5,
      }}
    >
      {/* The header is chrome, not content: its own non-scrolling block with PANEL_PAD, so the ✕
          can neither scroll away nor be pushed left by the scrollbar the body grows (§0). */}
      <div style={{ padding: PANEL_PAD, flex: "0 0 auto" }}>
        <PanelHeader
          // Its own column, so the name and the line beneath it share a left edge — see the note
          // on `leading`. It used to be folded into the title node, and only the title moved.
          leading={icon}
          title={
            /* Wraps, never truncates — a feature's name is the one thing here you can't
               reconstruct from anything else. */
            <Text
              style={{
                display: "block",
                fontSize: 16,
                fontWeight: 600,
                lineHeight: 1.3,
                color: "var(--primitives-colors-theme-900)",
                overflowWrap: "anywhere",
              }}
            >
              {multi
                ? `${liveRows.length} features`
                : /**
                   * ⚠️ **Never the sentinel.** It leaked into the title on the bench the moment
                   * one live feature was left holding a merged bag, and a raw `\u0000multiple`
                   * on screen is the worst possible way to find out. Guarded here rather than
                   * only upstream: this is the one string a person always reads.
                   */
                  (editing && draft.name !== MULTIPLE
                    ? String(draft.name ?? "")
                    : name === MULTIPLE
                      ? ""
                      : name) || `Unnamed ${typeLabel(subType || mainType)}`}
            </Text>
          }
          subtitle={
            multi
              ? "Editing all of them — a change here is a change to every one."
              : editing
                ? (reviewNote ?? "You are editing this feature’s properties.")
                : [
                    CLASS_LABEL[cls],
                    category ? categoryLabel(category) : null,
                    typeLabel(subType || mainType),
                  ]
                    .filter(Boolean)
                    .join(" · ")
          }
          onClose={onClose}
          closeLabel="Close feature properties"
        />
      </div>

      <Separator />

      <div
        style={{
          overflow: "auto",
          flex: 1,
          minHeight: 0,
          padding: "14px 20px 16px",
        }}
      >
        {/**
         * **What is selected, and the way to check it** (Olcay, 2026-08-16: *"There should be an
         * indicator of multiple items selected and upon expand the items should be listed to show
         * which ones."*).
         *
         * Collapsed by default and at the very top of the body: a count is enough almost always,
         * and the moment it is not — you are about to rename all of them — the answer is one click
         * away rather than a trip back to the map to count outlines.
         *
         * Each row can drop itself out. Shift-clicking the outline does the same thing, but only if
         * you can still find it on screen; a selection you built by panning around cannot always be
         * unpicked the way it was picked.
         */}
        {showStrip && (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 10,
              border: `1px solid ${LINE}`,
              background: "var(--primitives-colors-background-50, #f7f8fa)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setListOpen((o) => !o)}
              aria-expanded={listOpen}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "9px 12px",
                border: "none",
                background: "none",
                font: "inherit",
                fontSize: 12.5,
                color: INK,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  transition: "transform .15s ease",
                  transform: listOpen ? "rotate(90deg)" : "none",
                  fontSize: 10,
                  color: MUTED,
                }}
              >
                ▶
              </span>
              {/* After a combine the count is not a selection any more — it is a report of what
                  the shape now consists of, and saying "selected" about a removed wall would be
                  plainly untrue. */}
              <span style={{ fontWeight: 500 }}>{tally}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: MUTED }}>
                {listOpen ? "Hide" : "Show"}
              </span>
            </button>
            {listOpen && (
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: "0 0 4px",
                  maxHeight: 180,
                  overflow: "auto",
                }}
              >
                {selection!.map((s, i) => (
                  <li
                    key={s.fid}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 12px 5px 30px",
                    }}
                  >
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <Text
                        style={{
                          display: "block",
                          fontSize: 12.5,
                          color: INK,
                          overflowWrap: "anywhere",
                        }}
                      >
                        <Text
                          as="span"
                          style={{
                            // A removed feature is struck through: it is on this list to say what
                            // happened to it, not because it is still there.
                            textDecoration:
                              s.fate === "removed" ? "line-through" : "none",
                            color: s.fate === "removed" ? MUTED : INK,
                          }}
                        >
                          {s.name || `Unnamed ${s.typeLabel}`}
                        </Text>
                        {/* What happened to it. The first row is the anchor — the panel's
                            identity, the shape the geometry tools act on, and the one Escape
                            leaves behind — which is why the list has an order at all. */}
                        <Text
                          as="span"
                          style={{
                            marginLeft: 6,
                            fontSize: 10.5,
                            color: MUTED,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.fate ?? (i === 0 ? "primary" : "")}
                        </Text>
                      </Text>
                      <Text
                        style={{ display: "block", fontSize: 11, color: MUTED }}
                      >
                        {s.typeLabel}
                      </Text>
                    </span>
                    {/**
                     * ⚠️ **Three meanings, one control.** Dropping a *selected* row changes only
                     * the selection; taking a *joined* one out **recomputes the shape**; putting a
                     * *removed* one back draws it over the combined room again — which is a
                     * coherent thing to want, and what was asked for.
                     *
                     * A joined row is only offered while the combine is still a composition. Once
                     * the shape has been hand-edited, recomputing from fewer members would throw
                     * that work away, so the control goes quiet and the title says why instead of
                     * doing it silently.
                     */}
                    <IconButton
                      variant="ghost"
                      size="sm"
                      disabled={s.fate === "joined" && !recomposable}
                      title={
                        s.fate === "joined"
                          ? recomposable
                            ? "Take this feature back out of the combined shape"
                            : "The shape has been edited since it was combined — undo to take this back out"
                          : s.fate === "removed"
                            ? "Put this back on the map, over the combined shape"
                            : "Remove from selection"
                      }
                      onClick={() => onDeselect?.(s.fid, s.fate)}
                      aria-label={
                        s.fate === "joined"
                          ? `Take ${s.name || "this feature"} back out of the combined shape`
                          : s.fate === "removed"
                            ? `Put ${s.name || "this feature"} back on the map`
                            : `Remove ${s.name || "this feature"} from the selection`
                      }
                    >
                      <span aria-hidden style={{ fontSize: 13 }}>
                        ✕
                      </span>
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/*
          ⚠️ **A "Flagged during review" alert stood here until 2026-08-25.** It carried the
          reviewer's note in their own words, and the honest admission that a flag matched by name
          might belong to any of the features sharing it. Flagging is gone (Olcay: *"once review
          concluded the map becomes the current map"*), and with it the one state this panel could
          inherit from a finished review. A feature you open while browsing is simply a feature.
        */}
        {!editing ? (
          /* ── reading: the POI card, derived ─────────────────────────────────── */
          <>
            {/* No Edit button: the panel opens in edit mode, so there is nothing to switch INTO.
                Reading is what you get after saving, or on a feature the taxonomy will not edit. */}
            <SectionTitle>Details</SectionTitle>

            {description && (
              <Text
                style={{
                  display: "block",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: INK,
                  marginTop: 8,
                }}
              >
                {description}
              </Text>
            )}

            {links.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 10,
                }}
              >
                {links.map((l) => (
                  <a
                    key={l.key}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            )}

            {stats.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 10,
                }}
              >
                {stats.map((s) => (
                  <ValueChip key={s}>{s}</ValueChip>
                ))}
              </div>
            )}

            <DerivedSections values={values} />

            {/* What this type SHOULD carry that nothing has filled in — the honest other half.
                It doubles as the reason to press Edit. */}
            <div style={{ marginTop: 20 }}>
              <SectionTitle>Expected for this type</SectionTitle>
              <div style={{ marginTop: 6 }}>
                {suggested == null ? (
                  <Text style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                    This type isn’t in the cached taxonomy, so what it should
                    carry isn’t known here.
                  </Text>
                ) : suggested.length === 0 ? (
                  <Text style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                    The taxonomy suggests no additional properties for this
                    type.
                  </Text>
                ) : (
                  <>
                    <Text
                      style={{
                        fontSize: 12,
                        color: MUTED,
                        lineHeight: 1.5,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      The taxonomy expects a{" "}
                      {typeLabel(subType || mainType).toLowerCase()} to carry
                      these. Values live in the content API, which this
                      prototype doesn’t call — so the unfilled ones are named,
                      not invented.
                    </Text>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {suggested.map((s) => (
                        <ValueChip key={s} muted={!values[s]}>
                          {propertyLabel(s)}
                        </ValueChip>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Identity last and quiet: the SDK card never shows an id, but a dashboard has to. */}
            <div style={{ marginTop: 22 }}>
              <SectionTitle>Identifiers</SectionTitle>
              <div style={{ marginTop: 4 }}>
                {IDENTITY.map((f, i) => (
                  <div key={f.key}>
                    {i > 0 && <Separator />}
                    <div style={{ padding: "8px 0" }}>
                      <Text
                        style={{
                          display: "block",
                          fontSize: 11,
                          lineHeight: "14px",
                          color: MUTED,
                        }}
                      >
                        {f.label}
                      </Text>
                      <Text
                        style={{
                          display: "block",
                          fontSize: 12.5,
                          lineHeight: "17px",
                          marginTop: 2,
                          color: INK,
                          // Long, space-free ids wrap rather than ellipsis away the half you need.
                          overflowWrap: "anywhere",
                        }}
                      >
                        {String(p[f.key] ?? "—")}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ── editing: the dashboard's field editor ──────────────────────────── */
          <>
            <Text
              style={{
                display: "block",
                fontSize: 12.5,
                color: MUTED,
                marginBottom: 12,
              }}
            >
              Provide essential information below.
            </Text>

            {/* FID: read-only with a copy button, exactly as the real panel draws it. */}
            <div>
              <Text
                style={{
                  display: "block",
                  fontSize: 11,
                  color: MUTED,
                  marginBottom: 4,
                }}
              >
                FID
              </Text>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: "var(--primitives-radius-lg, 8px)",
                  border: `1px solid ${LINE}`,
                  background: "var(--primitives-colors-theme-0)",
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 12,
                    color: INK,
                    overflowWrap: "anywhere",
                  }}
                >
                  {String(p.fid ?? "—")}
                </Text>
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Copy FID"
                  title="Copy"
                  onClick={() =>
                    navigator.clipboard?.writeText(String(p.fid ?? ""))
                  }
                  style={{ flex: "0 0 auto" }}
                >
                  <CopyGlyph />
                </IconButton>
              </div>
            </div>

            {/* Select type: the mainType is context, the subType is the value — the real panel's
                anatomy, and it is right, because a feature's mainType is not a free choice. */}
            <div style={{ marginTop: 12 }}>
              <Text style={{ display: "block", fontSize: 11, color: MUTED }}>
                Select type
              </Text>
              <Text
                style={{
                  display: "block",
                  fontSize: 11,
                  color: MUTED,
                  marginBottom: 4,
                }}
              >
                {typeLabel(mainType)}
              </Text>
              <Select
                value={
                  draft.subType === MULTIPLE ? "" : String(draft.subType ?? "")
                }
                onValueChange={(v) => setDraft((d) => ({ ...d, subType: v }))}
              >
                <SelectTrigger aria-label="Sub type">
                  <SelectValue
                    placeholder={draft.subType === MULTIPLE ? MULTI_LABEL : "—"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {typeLabel(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div style={{ marginTop: 12 }}>
              <Input
                label="Name *"
                value={draft.name === MULTIPLE ? "" : String(draft.name ?? "")}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                /* ⚠️ Typing here renames EVERY selected feature — leaving it be keeps their own
                   names, which is why the placeholder has to say what is in there rather than
                   look like an empty required field. */
                placeholder={draft.name === MULTIPLE ? MULTI_LABEL : "Unnamed"}
                aria-label="Feature name"
              />
            </div>

            {fields.map((k) => (
              <PropertyField
                key={k}
                def={propertyDef(k)}
                value={draft[k]}
                onChange={(v) => setDraft((d) => ({ ...d, [k]: v }))}
                onRemove={() => {
                  setFields((f) => f.filter((x) => x !== k));
                  setDraft((d) => {
                    const n = { ...d };
                    delete n[k];
                    return n;
                  });
                }}
              />
            ))}

            <AddFieldPicker
              suggested={canAdd.sug}
              others={canAdd.others}
              onAdd={(k) => {
                setFields((f) => [...f, k]);
                setDraft((d) => ({
                  ...d,
                  [k]: propertyDef(k).valueType === "boolean" ? false : "",
                }));
              }}
            />

            <Text
              style={{
                display: "block",
                fontSize: 11,
                color: MUTED,
                marginTop: 14,
              }}
            >
              * Required
            </Text>

            <Text
              style={{
                display: "block",
                fontSize: 11,
                color: MUTED,
                lineHeight: 1.45,
                marginTop: 10,
              }}
            >
              {reviewFootnote ??
                "Edits are local to this prototype — nothing is written back to Pointr Cloud."}
            </Text>
          </>
        )}
      </div>

      {/* The editor's footer, pinned like the real panel's — Cancel beside a primary that only
          lights when there is something to save. */}
      {editing && (
        <>
          <Separator />
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "12px 20px",
              flex: "0 0 auto",
            }}
          >
            <Button
              variant="outline"
              style={{ flex: 1 }}
              /**
               * ⚠️ **Hands over without touching anything first.** It used to `reset()` the draft
               * and revert the shape here and then ask — so choosing *Keep editing* in the
               * confirmation returned you to a panel whose work had already been thrown away. The
               * question has to be asked while the answer still matters.
               *
               * Nothing needs undoing on the way out either: closing unmounts this panel, draft and
               * all, and drops `focused`, which sends the map `end` with `commit: false`.
               */
              onClick={() => onCancelEdit?.()}
            >
              Cancel
            </Button>
            <Button style={{ flex: 1 }} onClick={save} disabled={!canSave}>
              Update
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
