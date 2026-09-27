import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Button,
  Icon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@kozmos-ds/react";
import { BAND, MAGNITUDE } from "../mock/diff";
import { SITE_SNAPSHOT, SITE_ID, SITE_NAME } from "../mock/site";
import {
  CURRENT_USER,
  DIRECTORY,
  GRACE_OPTIONS,
  NO_ADMIN_REASON,
  SELF_REMOVE_NOTE,
  addRecipient,
  canAdminister,
  canRemove,
  getSettings,
  graceAdvice,
  recipientsAt,
  removeRecipient,
  setSetting,
  subscribeSettings,
  type NotifyScope,
  type ScopeLevel,
} from "../mock/settings";

/**
 * Settings → **System Settings** (Figma `2002:41171` — the real dashboard, captured at
 * `design.pointr.cloud/map-studio`).
 *
 * This replaced a first build against `2487:776`, an earlier MAP-566 sketch that called the page
 * *SDK Configuration* and put the settings in a left text panel. `2002:41171` is the authoritative
 * chrome: **System Settings** is its own rail item, SDK Configuration is a *different* page, and
 * the settings sit in cards across the full page width with no second panel. Olcay, 2026-08-11:
 * *"I don't think this should be SDK configuration."*
 *
 * **Three departures from the frame, all deliberate:**
 *
 * 1. Its Expert Review row says *"Maps stay read-only until the review is approved"* — decision 8
 *    reversed that on 2026-08-10. The level stays editable; only frame-changing operations lock.
 * 2. It labels that row **"Expert Review (Manual Review)"**, conflating two things this project
 *    keeps carefully apart (§1): *Expert Review* is Pointr's mapping team, *Manual Review* is the
 *    customer's own per-change pass and a separate config flag. They are two toggles here.
 * 3. It has no grace period and no notification recipients, because it predates them — both are
 *    required by the stories ("User Story: Configure grace period", and US6), so they are built
 *    in the frame's own card idiom and flagged as needing frames.
 */

const LINE = "var(--primitives-colors-background-100)";
const INK = "var(--primitives-colors-theme-900)";
const LINK = "var(--primitives-colors-theme-800)";
const TINT = "#f1f5fe";
const MUTED = "var(--primitives-colors-background-600)";
const FG = "#2e3138";

function useSettings() {
  return useSyncExternalStore(subscribeSettings, getSettings);
}

/* ── layout pieces, in the frame's idiom ──────────────────────────────────── */

function Card({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${LINE}`,
        borderRadius: 8,
        background: "#fff",
        marginBottom: 24,
      }}
    >
      <div style={{ padding: "18px 20px 14px" }}>
        <Text
          style={{
            display: "block",
            fontSize: 15,
            fontWeight: 600,
            color: INK,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            display: "block",
            fontSize: 13,
            color: MUTED,
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          {sub}
        </Text>
      </div>
      {children}
    </div>
  );
}

/**
 * One setting: what it is on the left, the control on the right. The description carries the
 * consequence rather than the mechanism — what turning it off does *to you*.
 */
function Row({
  title,
  detail,
  children,
  last,
}: {
  title: string;
  detail: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 24,
        padding: "14px 20px",
        borderTop: `1px solid ${LINE}`,
        borderBottom: last ? "none" : "none",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            display: "block",
            fontSize: 13.5,
            fontWeight: 600,
            color: FG,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            display: "block",
            fontSize: 12.5,
            color: MUTED,
            marginTop: 3,
            lineHeight: 1.5,
          }}
        >
          {detail}
        </Text>
      </div>
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingTop: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** The DS Switch wrapper is `w-full`, which would eat the row's label column. */
function Toggle({
  on,
  onChange,
  label,
  state,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  state: string;
}) {
  return (
    <>
      <Switch
        checked={on}
        onCheckedChange={onChange}
        aria-label={label}
        wrapperClassName="w-auto shrink-0"
      />
      <Text style={{ fontSize: 12.5, color: on ? LINK : MUTED, minWidth: 66 }}>
        {state}
      </Text>
    </>
  );
}

/**
 * The three bands as a rule rather than an outcome — templated from `MAGNITUDE` so it can't drift
 * from the thresholds the code actually routes on.
 */
function BandLegend({ autoUpdates }: { autoUpdates: boolean }) {
  const items = [
    {
      tone: BAND.minor,
      text: `<${MAGNITUDE.minorBelow}% · ${autoUpdates ? "auto-publish" : "your review"}`,
    },
    {
      tone: BAND.medium,
      text: `${MAGNITUDE.minorBelow}–${MAGNITUDE.largeAbove}% · your review`,
    },
    { tone: BAND.large, text: `>${MAGNITUDE.largeAbove}% · rejected` },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        padding: "12px 20px",
        borderTop: `1px solid ${LINE}`,
        background: "#fbfcfd",
      }}
    >
      {items.map((it) => (
        <span
          key={it.text}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: MUTED,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: it.tone.solid,
            }}
          />
          {it.text}
        </span>
      ))}
    </div>
  );
}

/* ── US6 · recipients ─────────────────────────────────────────────────────── */

const SCOPE_TABS: { level: ScopeLevel; label: string }[] = [
  { level: "client", label: "Client" },
  { level: "site", label: "Site" },
  { level: "building", label: "Building" },
];

const SCOPE_BLURB: Record<ScopeLevel, string> = {
  client:
    "Everyone here is notified about map updates anywhere in the client — every site, every building.",
  site: "Notified about map updates anywhere in this site, on top of the client-level list.",
  building:
    "Notified about map updates in this building only, on top of the client and site lists.",
};

function RecipientList() {
  const s = useSettings();
  const [level, setLevel] = useState<ScopeLevel>("client");
  const [buildingId, setBuildingId] = useState(SITE_SNAPSHOT[2].id);
  const [adding, setAdding] = useState(false);

  const scope: NotifyScope = useMemo(() => {
    if (level === "client") return { level: "client", name: "Client" };
    if (level === "site")
      return { level: "site", id: SITE_ID, name: SITE_NAME };
    const b = SITE_SNAPSHOT.find((x) => x.id === buildingId)!;
    return { level: "building", id: b.id, name: b.name };
  }, [level, buildingId]);

  // read so the list re-renders on every store write; the store is the source, not local state
  void s;
  const people = recipientsAt(scope);
  const admin = canAdminister(scope);
  const available = DIRECTORY.filter((d) => !people.some((p) => p.id === d.id));

  return (
    <div style={{ padding: "14px 20px 18px", borderTop: `1px solid ${LINE}` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            border: `1px solid ${LINE}`,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {SCOPE_TABS.map((t) => (
            <button
              key={t.level}
              onClick={() => {
                setLevel(t.level);
                setAdding(false);
              }}
              style={{
                padding: "6px 14px",
                fontSize: 12.5,
                border: "none",
                cursor: "pointer",
                color: level === t.level ? LINK : MUTED,
                background: level === t.level ? TINT : "#fff",
                fontWeight: level === t.level ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {level === "building" && (
          <Select
            value={buildingId}
            onValueChange={(v) => {
              setBuildingId(v);
              setAdding(false);
            }}
          >
            <SelectTrigger aria-label="Building" style={{ width: 220 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SITE_SNAPSHOT.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Text
        style={{
          display: "block",
          fontSize: 12.5,
          color: MUTED,
          marginTop: 10,
          lineHeight: 1.5,
        }}
      >
        {SCOPE_BLURB[level]}
      </Text>

      {/* the lacking-admin state — US6 gates six of its seven criteria on it */}
      {!admin && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            marginTop: 12,
            padding: "10px 12px",
            background: "#f6f7f9",
            border: `1px solid ${LINE}`,
            borderRadius: 8,
            fontSize: 12.5,
            color: MUTED,
            lineHeight: 1.5,
          }}
        >
          <Icon name="info-circle" />
          <span>
            {NO_ADMIN_REASON} {SELF_REMOVE_NOTE}
          </span>
        </div>
      )}

      <div
        style={{
          marginTop: 12,
          border: `1px solid ${LINE}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {people.length === 0 && (
          <div style={{ padding: "14px", fontSize: 12.5, color: MUTED }}>
            Nobody is notified at this level.
          </div>
        )}
        {people.map((p, i) => {
          const self = p.id === CURRENT_USER.id;
          const may = canRemove(scope, p.id);
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 16,
                  flex: "0 0 auto",
                  display: "grid",
                  placeItems: "center",
                  background: TINT,
                  color: LINK,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {p.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ display: "block", fontSize: 13, color: FG }}>
                  {p.name}
                  {self && (
                    <span style={{ color: MUTED, fontWeight: 400 }}>
                      {" "}
                      · you
                    </span>
                  )}
                </Text>
                <Text style={{ display: "block", fontSize: 12, color: MUTED }}>
                  {p.email}
                </Text>
              </div>
              {/* a disabled <button> swallows its own hover, so the reason rides a wrapping span
                  — the same pattern every locked control in the expert hold uses */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span style={{ display: "inline-flex" }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!may}
                      onClick={() => removeRecipient(scope, p.id)}
                    >
                      Remove
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {may
                    ? self
                      ? "Remove yourself from these notifications"
                      : `Stop notifying ${p.name} at this level`
                    : NO_ADMIN_REASON}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        {adding ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Select
              value=""
              onValueChange={(v) => {
                addRecipient(scope, v);
                setAdding(false);
              }}
            >
              <SelectTrigger
                aria-label="Add a recipient"
                style={{ width: 300 }}
              >
                <SelectValue placeholder="Choose a user…" />
              </SelectTrigger>
              <SelectContent>
                {available.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} · {d.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span style={{ display: "inline-flex" }}>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!admin || available.length === 0}
                  onClick={() => setAdding(true)}
                >
                  <Icon name="plus" /> Add recipient
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {!admin
                ? NO_ADMIN_REASON
                : available.length === 0
                  ? "Everyone in the directory is already notified at this level"
                  : "Assign someone to these notifications"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/* ── the screen ───────────────────────────────────────────────────────────── */

export function Settings() {
  const s = useSettings();
  const advice = graceAdvice(s.graceSeconds);

  return (
    <div
      style={{ flex: 1, minWidth: 0, overflowY: "auto", background: "#fff" }}
    >
      {/* page header — the frame's own copy, including the auto-save note */}
      <div
        style={{ padding: "24px 32px 20px", borderBottom: `1px solid ${LINE}` }}
      >
        <Text style={{ display: "block", fontSize: 12.5, color: MUTED }}>
          Settings
        </Text>
        <Text
          style={{
            display: "block",
            fontSize: 24,
            fontWeight: 700,
            color: INK,
            marginTop: 2,
          }}
        >
          System Settings
        </Text>
        <Text
          style={{
            display: "block",
            fontSize: 13,
            color: MUTED,
            marginTop: 6,
            lineHeight: 1.6,
            maxWidth: 660,
          }}
        >
          All platform parameters can be managed below. By default, they apply
          system-wide but you can override them via Site settings screen. Please
          note that changes are auto-saved but they are effective only once
          published by an admin. Parameters can be reset to default anytime.
        </Text>
      </div>

      <div style={{ padding: "24px 32px 48px", maxWidth: 1000 }}>
        {/* the frame's own card, verbatim but for the read-only copy decision 8 reversed */}
        <Card
          title="MapScale® Manager"
          sub="Configure how Floor-plans are processed and checked before they go live. These settings apply to the entire client."
        >
          <Row
            title="Expert Review"
            /* NOT the frame's copy. `2002:41171` says "Maps stay read-only until the review is
               approved" — true of the morning of 2026-08-10 and reversed that afternoon
               (decision 8). It also titles this row "Expert Review (Manual Review)", which
               conflates two separate things — Manual Review is its own row below. */
            detail="Have Pointr's Mapping Team check each map after AI processing — so the change percentage you're shown is the corrected one. You can keep editing the level while they work; uploading, restoring and georeferencing wait until they're done."
          >
            <Toggle
              on={s.expertReview}
              onChange={(v) => setSetting("expertReview", v)}
              label="Expert Review"
              state={s.expertReview ? "Enabled" : "Disabled"}
            />
          </Row>

          <Row
            title="Expert Georeferencing"
            detail="Let Pointr's Mapping Team precisely align each floorplan to real-world coordinates during processing. Improves positioning accuracy; adds some processing time."
            last
          >
            <Toggle
              on={s.expertGeoreferencing}
              onChange={(v) => setSetting("expertGeoreferencing", v)}
              label="Expert Georeferencing"
              state={s.expertGeoreferencing ? "Enabled" : "Disabled"}
            />
          </Row>
        </Card>

        {/* Not in `2002:41171` — required by the stories, built in the frame's idiom. */}
        <Card
          title="Auto-Map Updates"
          sub="What happens to a processed floor-plan: how much can change before someone has to look, and how long they have to look before it publishes itself."
        >
          <Row
            title="Enable Auto-Map Updates"
            detail="When on, MapScale detects changes in new floor-plans and updates maps automatically based on change magnitude."
          >
            <Toggle
              on={s.autoUpdates}
              onChange={(v) => setSetting("autoUpdates", v)}
              label="Enable Auto-Map Updates"
              state={s.autoUpdates ? "Enabled" : "Disabled"}
            />
          </Row>

          <Row
            title="Review & Finalise"
            detail="Have your team confirm, reject, or edit each detected change before it's applied. Off = changes apply automatically by magnitude. This is your team's pass, not Pointr's."
          >
            <Toggle
              on={s.manualReview}
              onChange={(v) => setSetting("manualReview", v)}
              label="Review & Finalise"
              state={s.manualReview ? "On · default" : "Off"}
            />
          </Row>

          <Row
            title="Grace period"
            detail={`How long medium changes (${MAGNITUDE.minorBelow}–${MAGNITUDE.largeAbove}%) wait for your review before auto-publishing. Applies to the entire client — it can't be set per site or building.`}
            last
          >
            <Select
              value={String(s.graceSeconds)}
              onValueChange={(v) => setSetting("graceSeconds", Number(v))}
            >
              <SelectTrigger aria-label="Grace period" style={{ width: 160 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRACE_OPTIONS.map((o) => (
                  <SelectItem key={o.seconds} value={String(o.seconds)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          {/* The story asks for advice at ≤1 week and a warning above 2 weeks. Neither blocks the
              choice — it is the client's to make, and a warning that refuses is a rule in
              disguise. */}
          {advice && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                margin: "0 20px 16px",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                lineHeight: 1.5,
                background:
                  advice.tone === "warn" ? BAND.medium.tint : "#f6f7f9",
                border: `1px solid ${advice.tone === "warn" ? BAND.medium.border : LINE}`,
                color: advice.tone === "warn" ? BAND.medium.ink : MUTED,
              }}
            >
              <Icon
                name={advice.tone === "warn" ? "alert-triangle" : "info-circle"}
              />
              <span>{advice.text}</span>
            </div>
          )}

          <BandLegend autoUpdates={s.autoUpdates} />
        </Card>

        {/* US6 — no Figma frame exists for this at all; see the handoff. */}
        <Card
          title="Update notifications"
          sub="Who gets emailed when a map update needs attention. The three levels stack — a client-level recipient hears about every site and building beneath it."
        >
          <RecipientList />
        </Card>
      </div>
    </div>
  );
}
