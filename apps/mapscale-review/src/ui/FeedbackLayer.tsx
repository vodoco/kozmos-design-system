import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Icon, Input, Text } from "@kozmos-ds/react";
import { Tour, TOUR_STEPS, type TourScreen } from "./Tour";

/**
 * **Prototype-only.** The review layer: a guided tour (see `Tour.tsx`) and Figma-style comment
 * pins the team drops on any screen.
 *
 * This is a REVIEW TOOL LAYERED ON TOP of the prototype, not part of the Pointr dashboard design.
 * It is deliberately violet and dashed so nobody mistakes it for product UI — the one surface here
 * that ignores the v9 design language on purpose.
 *
 * **Comments are shared** (Olcay: *"everyone should be able to see each comment"*): they live in a
 * Vercel Blob store behind `/api/feedback`, so every reviewer reads and writes one list. When that
 * endpoint isn't there — local `vite dev`, or before the Blob store is connected — the layer falls
 * back to this browser's `localStorage` and *says so in the panel* rather than pretending. Nothing
 * is ever silently lost: local notes stay local and can still be copied out.
 */

const LOCAL_KEY = "map566-feedback-v1";
const NAME_KEY = "map566-feedback-author";
const TOUR_SEEN = "map566-tour-seen";
const API = "/api/feedback";
/** Long enough not to hammer the store, short enough that a live review feels shared. */
const POLL_MS = 25000;

const ACCENT = "#7A5AF8";
const ACCENT_DARK = "#5B3FD1";

export interface Note {
  id: string;
  screen: string;
  /** Viewport-relative, so a pin lands in the same place on another laptop. */
  xPct: number;
  yPct: number;
  text: string;
  /** Who wrote it. Required at the point of writing — see `authorReady`. */
  author: string;
  at: string;
  /** Set when the text was changed after posting, so an edit is visible rather than silent. */
  editedAt?: string;
  /**
   * Dealt with (Olcay, 2026-08-11). Deliberately NOT a deletion: a resolved note stays readable so
   * the thread of a review survives — you can see what was raised and that it was handled.
   */
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

/** First letters of a name, for the pin card's little author badge. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (
    parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
}

const SCREEN_LABEL: Record<string, string> = {
  mapContent: "Map Content",
  levelEditor: "Editing Level",
  review: "Review & Finalise",
  history: "Version History",
  wizard: "Building wizard",
};

function loadLocal(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function when(at: string) {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? at : d.toLocaleString();
}

export function FeedbackLayer({
  screen,
  onNavigate,
}: {
  screen: string;
  /** The tour drives the app; App maps these to real screens with a demo level. */
  onNavigate: (screen: TourScreen) => void;
}) {
  const [notes, setNotes] = useState<Note[]>(loadLocal);
  /** `shared` once /api/feedback answers; `local` when it doesn't. Decided on first load. */
  const [mode, setMode] = useState<"unknown" | "shared" | "local">("unknown");
  const [placing, setPlacing] = useState(false);
  const [draft, setDraft] = useState<{
    xPct: number;
    yPct: number;
    text: string;
  } | null>(null);
  const [openNote, setOpenNote] = useState<string | null>(null);
  /** The note being edited in place, and its working text. Shared by the pin card and the panel. */
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(
    null,
  );
  /** Resolved notes are hidden by default — the panel is a to-do list, not an archive. */
  const [showResolved, setShowResolved] = useState(false);
  const [panel, setPanel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [author, setAuthor] = useState(
    () => localStorage.getItem(NAME_KEY) || "",
  );
  /**
   * The newest list revision this browser has seen. The 25s poll is what made a deleted note come
   * back (Olcay, 2026-08-11): the store's read path is eventually consistent, so a poll landing
   * seconds after your delete could return the list from *before* it and overwrite the screen.
   * A response older than what we already have is dropped.
   */
  const revRef = useRef(-1);
  const [tourStep, setTourStep] = useState<number | null>(() =>
    localStorage.getItem(TOUR_SEEN) ? null : 0,
  );

  useEffect(() => {
    if (author) localStorage.setItem(NAME_KEY, author);
  }, [author]);

  /**
   * Accept a server payload only if it is at least as new as what we already hold. `rev` is
   * monotonic per write, so an older one is a stale read and must not repaint the screen.
   */
  const accept = useCallback((data: { notes?: Note[]; rev?: number }) => {
    if (!Array.isArray(data?.notes)) return;
    const rev = typeof data.rev === "number" ? data.rev : revRef.current;
    if (rev < revRef.current) return; // stale — drop it
    revRef.current = rev;
    setNotes(data.notes);
  }, []);

  /** Pull the shared list. Falls back to local — and stays there — if the endpoint isn't live. */
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(API, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      accept(await res.json());
      setMode("shared");
    } catch {
      setMode((m) => (m === "shared" ? "shared" : "local"));
      setNotes(loadLocal());
    }
  }, [accept]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // keep a live review roughly in sync without anyone pressing anything
  useEffect(() => {
    if (mode !== "shared") return;
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [mode, refresh]);

  // local mode persists here; shared mode's source of truth is the server
  useEffect(() => {
    if (mode === "local")
      localStorage.setItem(LOCAL_KEY, JSON.stringify(notes));
  }, [notes, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) setEditing(null);
        else if (draft) setDraft(null);
        else if (placing) setPlacing(false);
        else if (openNote) setOpenNote(null);
        return;
      }
      /**
       * **C arms a comment** (Olcay, 2026-08-11) — the same key Figma uses, so it costs nobody a
       * lesson. Then click the thing you're commenting on.
       *
       * The guard is the whole trick: this is a bare letter with no modifier, so it MUST NOT fire
       * while someone is typing. A reviewer writing "click here" into a comment box, or a level's
       * Long Name into the editor, would otherwise arm the crosshair mid-word. Anything focused
       * that accepts text is excluded — inputs, textareas, selects and contenteditable — as are
       * modifier chords, which belong to the browser.
       */
      if (e.key !== "c" && e.key !== "C") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el?.isContentEditable
      )
        return;
      if (draft || editing) return;
      e.preventDefault();
      setPlacing((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, placing, openNote, editing]);

  const here = useMemo(
    () => notes.filter((n) => n.screen === screen),
    [notes, screen],
  );
  /**
   * **A note must be signed** (Olcay, 2026-08-11: *"the comments should have Names"*). It used to
   * default silently to "Anonymous", and the name field only appeared while the field was empty —
   * so the first note you ever wrote was unsigned and there was no way to correct it afterwards.
   * Save is now gated on a name, and the field is always reachable.
   */
  const authorReady = author.trim().length > 0;
  const open = useMemo(() => notes.filter((n) => !n.resolved), [notes]);

  const place = useCallback((e: React.MouseEvent) => {
    setDraft({
      xPct: (e.clientX / window.innerWidth) * 100,
      yPct: (e.clientY / window.innerHeight) * 100,
      text: "",
    });
    setPlacing(false);
  }, []);

  const save = async () => {
    if (!draft?.text.trim() || !authorReady) return;
    const note: Note = {
      id: `n${Date.now()}${Math.round(Math.random() * 1e4)}`,
      screen,
      xPct: draft.xPct,
      yPct: draft.yPct,
      text: draft.text.trim(),
      author: author.trim(),
      at: new Date().toISOString(),
    };
    setDraft(null);
    if (mode === "shared") {
      setBusy(true);
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ note }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "save failed");
        accept(data);
      } catch {
        // don't lose what they typed: keep it locally and tell them the truth
        setNotes((n) => [...n, note]);
        setMode("local");
      } finally {
        setBusy(false);
      }
    } else {
      setNotes((n) => [...n, note]);
    }
  };

  const remove = async (id: string) => {
    setOpenNote(null);
    setEditing(null);
    if (mode === "shared") {
      setBusy(true);
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ deleteId: id }),
        });
        const data = await res.json();
        if (res.ok) accept(data);
        else await refresh(); // same reason as patch(): show reality, not a no-op
      } finally {
        setBusy(false);
      }
    } else {
      setNotes((all) => all.filter((x) => x.id !== id));
    }
  };

  /**
   * Patch a note — the one path behind both **Edit** and **Resolve** (Olcay, 2026-08-11).
   *
   * Local mode applies the same patch by hand, so the two modes can't drift into behaving
   * differently; the server stamps `editedAt` / `resolvedAt`, and local mirrors that here.
   */
  const patch = async (
    id: string,
    body: { text?: string; resolved?: boolean },
  ) => {
    if (mode === "shared") {
      setBusy(true);
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ updateId: id, ...body, by: author.trim() }),
        });
        const data = await res.json();
        // A failed patch must not look like a dead button. The store is eventually consistent, so
        // a write issued moments after another can be told "no such note" — re-read and show the
        // truth rather than leaving the UI silently unchanged. See api/feedback.mjs.
        if (res.ok) accept(data);
        else await refresh();
      } finally {
        setBusy(false);
      }
    } else {
      const now = new Date().toISOString();
      setNotes((all) =>
        all.map((n) =>
          n.id !== id
            ? n
            : {
                ...n,
                ...(body.text !== undefined
                  ? { text: body.text, editedAt: now }
                  : {}),
                ...(body.resolved !== undefined
                  ? {
                      resolved: body.resolved,
                      resolvedBy: body.resolved ? author.trim() : "",
                      resolvedAt: body.resolved ? now : "",
                    }
                  : {}),
              },
        ),
      );
    }
  };

  const commitEdit = async () => {
    if (!editing) return;
    const text = editing.text.trim();
    setEditing(null);
    if (text) await patch(editing.id, { text });
  };

  const copyAll = async () => {
    const byScreen = notes.reduce<Record<string, Note[]>>((acc, n) => {
      (acc[n.screen] ||= []).push(n);
      return acc;
    }, {});
    const md = [
      `# MAP-566 prototype feedback`,
      `${notes.length} note${notes.length === 1 ? "" : "s"}`,
      "",
      ...Object.entries(byScreen).flatMap(([s, list]) => [
        `## ${SCREEN_LABEL[s] ?? s}`,
        ...list.map(
          (n) =>
            `- ${n.resolved ? "~~" : ""}${n.text}${n.resolved ? "~~" : ""}  \n  _${n.author} · ${when(n.at)}${n.editedAt ? " · edited" : ""}${n.resolved ? ` · resolved${n.resolvedBy ? ` by ${n.resolvedBy}` : ""}` : ""}_`,
        ),
        "",
      ]),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(md);
      alert(`Copied ${notes.length} note(s).`);
    } catch {
      window.prompt("Copy the feedback:", md);
    }
  };

  const pill = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    border: `1px dashed ${active ? ACCENT_DARK : ACCENT}`,
    background: active ? ACCENT : "#F6F3FF",
    color: active ? "#fff" : ACCENT_DARK,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          data-tour="feedback-comment"
          style={pill(placing)}
          onClick={() => {
            setPlacing((p) => !p);
            setDraft(null);
          }}
          title="Click anywhere on the screen to pin a comment  (shortcut: C)"
        >
          <Icon name="edit-01" /> {placing ? "Click a spot…" : "Comment"}
          {!placing && (
            <kbd
              style={{
                marginLeft: 2,
                padding: "0 4px",
                borderRadius: 3,
                fontSize: 10,
                fontWeight: 700,
                border: `1px solid ${ACCENT}`,
                background: "#fff",
                color: ACCENT_DARK,
                fontFamily: "inherit",
              }}
            >
              C
            </kbd>
          )}
        </button>
        <button
          style={pill(panel)}
          onClick={() => {
            setPanel((p) => !p);
            if (!panel) refresh();
          }}
          title="All feedback"
        >
          {/* The count is what's OPEN — a resolved note is done, and counting it makes the pill
              read like a backlog that never shrinks. */}
          {open.length} note{open.length === 1 ? "" : "s"}
        </button>
        <button
          style={pill(false)}
          onClick={() => setTourStep(0)}
          title="Guided walkthrough"
        >
          Tour
        </button>
      </div>

      {placing && (
        <div
          onClick={place}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            cursor: "crosshair",
            background: "rgba(122,90,248,0.06)",
          }}
        />
      )}

      {here
        // A resolved pin stops covering the screen it was about, but is never lost — the panel's
        // "Show resolved" brings them all back.
        .filter((n) => !n.resolved || showResolved)
        .map((n, i) => (
          <div
            key={n.id}
            style={{
              position: "fixed",
              left: `${n.xPct}%`,
              top: `${n.yPct}%`,
              zIndex: 61,
            }}
          >
            <button
              onClick={() => setOpenNote((o) => (o === n.id ? null : n.id))}
              title={`${n.text}\n— ${n.author}${n.resolved ? " (resolved)" : ""}`}
              style={{
                transform: "translate(-50%, -100%)",
                width: 26,
                height: 26,
                borderRadius: "50% 50% 50% 2px",
                background: n.resolved ? "#8B92A0" : ACCENT,
                opacity: n.resolved ? 0.75 : 1,
                color: "#fff",
                border: "2px solid #fff",
                boxShadow: "0 2px 6px rgba(0,0,0,.3)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {n.resolved ? "✓" : i + 1}
            </button>
            {openNote === n.id && (
              <div
                style={{
                  position: "absolute",
                  left: 16,
                  top: 0,
                  width: 260,
                  background: "#fff",
                  border: `1px solid ${n.resolved ? "#c9cedb" : ACCENT}`,
                  borderRadius: 10,
                  boxShadow: "0 6px 20px rgba(0,0,0,.18)",
                  padding: 12,
                }}
              >
                {/* Who said it, said first — a review note is worth as much as knowing whose it is. */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      flex: "0 0 auto",
                      background: n.resolved ? "#8B92A0" : ACCENT,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {initials(n.author)}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#1a1c24",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.author}
                    </div>
                    <div style={{ fontSize: 10.5, color: "#737373" }}>
                      {when(n.at)}
                      {n.editedAt ? " · edited" : ""}
                    </div>
                  </div>
                  {/* Every card closes from its own header (Olcay, 2026-08-11) — clicking the pin
                    again worked, but only if you knew that; Escape only helps if you knew that too. */}
                  <button
                    onClick={() => {
                      setOpenNote(null);
                      setEditing(null);
                    }}
                    aria-label="Close comment"
                    title="Close"
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "#737373",
                      fontSize: 14,
                      lineHeight: 1,
                      padding: 2,
                      flex: "0 0 auto",
                    }}
                  >
                    ✕
                  </button>
                </div>

                {editing?.id === n.id ? (
                  <>
                    <textarea
                      autoFocus
                      // Caret to the END, not the start. `autoFocus` alone leaves it at position 0,
                      // so the first thing you type when correcting a note lands *before* it.
                      ref={(el) =>
                        el?.setSelectionRange(el.value.length, el.value.length)
                      }
                      value={editing.text}
                      onChange={(e) =>
                        setEditing((s) =>
                          s ? { ...s, text: e.target.value } : s,
                        )
                      }
                      style={{
                        width: "100%",
                        minHeight: 66,
                        resize: "vertical",
                        borderRadius: 8,
                        border: "1px solid #e3e4e8",
                        padding: 8,
                        fontSize: 12.5,
                        fontFamily: "inherit",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 8,
                        marginTop: 8,
                      }}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy || !editing.text.trim()}
                        onClick={commitEdit}
                      >
                        Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "#1a1c24",
                        lineHeight: 1.45,
                      }}
                    >
                      {n.text}
                    </div>
                    {n.resolved && (
                      <div
                        style={{
                          fontSize: 10.5,
                          color: "#4b7a5c",
                          marginTop: 6,
                          fontWeight: 600,
                        }}
                      >
                        ✓ Resolved{n.resolvedBy ? ` by ${n.resolvedBy}` : ""}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 4,
                        marginTop: 8,
                      }}
                    >
                      <Button
                        size="sm"
                        variant="link"
                        disabled={busy}
                        onClick={() => patch(n.id, { resolved: !n.resolved })}
                      >
                        {n.resolved ? "Reopen" : "Resolve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="link"
                        disabled={busy}
                        onClick={() => setEditing({ id: n.id, text: n.text })}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="link"
                        disabled={busy}
                        onClick={() => remove(n.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

      {draft && (
        <div
          style={{
            position: "fixed",
            left: `${draft.xPct}%`,
            top: `${draft.yPct}%`,
            zIndex: 62,
            width: 260,
            transform: "translate(-50%, 8px)",
            background: "#fff",
            border: `1px solid ${ACCENT}`,
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,.2)",
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: ACCENT_DARK,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Comment on {SCREEN_LABEL[screen] ?? screen}
          </div>
          <textarea
            autoFocus
            value={draft.text}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, text: e.target.value } : d))
            }
            placeholder="What's wrong, missing, or good here?"
            style={{
              width: "100%",
              minHeight: 70,
              resize: "vertical",
              borderRadius: 8,
              border: "1px solid #e3e4e8",
              padding: 8,
              fontSize: 12.5,
              fontFamily: "inherit",
            }}
          />
          {/* Always here, not just while it's empty: a name you can't revisit is a name you got
              wrong once and live with forever. Save is gated on it, so no note goes out unsigned. */}
          <div style={{ marginTop: 8 }}>
            <Input
              label="Your name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="So the team knows whose note this is"
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <span style={{ flex: 1, fontSize: 10.5, color: "#737373" }}>
              {authorReady ? "" : "Add your name to post"}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={busy || !draft.text.trim() || !authorReady}
              onClick={save}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {panel && (
        <div
          style={{
            position: "fixed",
            right: 16,
            top: 62,
            bottom: 16,
            width: 320,
            zIndex: 63,
            background: "#fff",
            border: `1px solid ${ACCENT}`,
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,.2)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid #e3e4e8",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: ACCENT_DARK,
                flex: 1,
              }}
            >
              {mode === "shared" ? "Team feedback" : "Your feedback"}
              <span style={{ fontWeight: 400, color: "#737373", fontSize: 11 }}>
                {" "}
                · {open.length} open
                {notes.length - open.length
                  ? ` · ${notes.length - open.length} resolved`
                  : ""}
              </span>
            </Text>
            <button
              onClick={refresh}
              title="Refresh"
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#737373",
                fontSize: 11,
              }}
            >
              Refresh
            </button>
            <button
              onClick={() => setPanel(false)}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#737373",
              }}
            >
              <Icon name="x-close" />
            </button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
            {notes.length === 0 && (
              <div
                style={{ fontSize: 12.5, color: "#737373", lineHeight: 1.5 }}
              >
                No notes yet. Press <b>Comment</b>, then click anything on
                screen to pin one to it.
              </div>
            )}
            {notes
              .filter((n) => !n.resolved || showResolved)
              .map((n, i) => (
                <div
                  key={n.id}
                  style={{
                    borderBottom: "1px solid #f1f2f4",
                    padding: "8px 0",
                    opacity: n.resolved ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: ACCENT_DARK,
                        fontWeight: 600,
                        flex: 1,
                      }}
                    >
                      {n.resolved ? "✓" : i + 1} ·{" "}
                      {SCREEN_LABEL[n.screen] ?? n.screen}
                    </span>
                  </div>
                  {editing?.id === n.id ? (
                    <>
                      <textarea
                        autoFocus
                        ref={(el) =>
                          el?.setSelectionRange(
                            el.value.length,
                            el.value.length,
                          )
                        }
                        value={editing.text}
                        onChange={(e) =>
                          setEditing((s) =>
                            s ? { ...s, text: e.target.value } : s,
                          )
                        }
                        style={{
                          width: "100%",
                          minHeight: 56,
                          resize: "vertical",
                          borderRadius: 8,
                          border: "1px solid #e3e4e8",
                          padding: 6,
                          fontSize: 12.5,
                          fontFamily: "inherit",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 6,
                          marginTop: 4,
                        }}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy || !editing.text.trim()}
                          onClick={commitEdit}
                        >
                          Save
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "#1a1c24",
                          lineHeight: 1.45,
                          textDecoration: n.resolved ? "line-through" : "none",
                        }}
                      >
                        {n.text}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "#737373",
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <b style={{ color: "#4a4f5c" }}>{n.author}</b> ·{" "}
                          {when(n.at)}
                          {n.editedAt ? " · edited" : ""}
                        </span>
                        <Button
                          size="sm"
                          variant="link"
                          disabled={busy}
                          onClick={() => patch(n.id, { resolved: !n.resolved })}
                        >
                          {n.resolved ? "Reopen" : "Resolve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="link"
                          disabled={busy}
                          onClick={() => setEditing({ id: n.id, text: n.text })}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="link"
                          disabled={busy}
                          onClick={() => remove(n.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
          {/* Your name lives here too, so it can be set or corrected without writing a note —
              and so it is obvious whose name is going on the next one. */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #e3e4e8",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 11, color: "#737373", flex: "0 0 auto" }}>
              Commenting as
            </span>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              style={{
                flex: 1,
                minWidth: 0,
                borderRadius: 6,
                border: `1px solid ${authorReady ? "#e3e4e8" : ACCENT}`,
                padding: "4px 8px",
                fontSize: 12,
                fontFamily: "inherit",
              }}
            />
          </div>
          <div
            style={{
              padding: 12,
              borderTop: "1px solid #e3e4e8",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "#737373",
                cursor: "pointer",
                flex: 1,
              }}
            >
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
              />
              Show resolved
            </label>
            <Button size="sm" onClick={copyAll} disabled={!notes.length}>
              Copy all
            </Button>
          </div>
          <div
            style={{
              padding: "0 12px 12px",
              fontSize: 11,
              color: "#737373",
              lineHeight: 1.4,
            }}
          >
            {mode === "shared" ? (
              <>
                Notes are <b>shared with everyone</b> reviewing this prototype.
              </>
            ) : (
              <>
                Saved <b>in this browser only</b> — the shared store isn’t
                reachable, so use <b>Copy all</b> to send these on.
              </>
            )}
          </div>
        </div>
      )}

      {tourStep !== null && (
        <Tour
          step={tourStep}
          onStep={setTourStep}
          onNavigate={onNavigate}
          onClose={() => {
            setTourStep(null);
            localStorage.setItem(TOUR_SEEN, "1");
          }}
        />
      )}
    </>
  );
}

export { TOUR_STEPS };
