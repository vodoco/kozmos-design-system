import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@kozmos-ds/react";

/**
 * The walkthrough — **anchored, not a wall of prose.**
 *
 * The first version was a modal of paragraphs shown before you'd seen anything; Olcay's verdict
 * was that it "feels more like a pre-text". This one behaves like a product tour: it drives the
 * app to the screen each step is about, spotlights the actual element, and puts one short
 * sentence beside it. You watch the prototype work rather than read about it.
 *
 * Anchoring: steps name a `data-tour` attribute rather than a CSS class, so restyling a screen
 * can't silently break the tour, and a step whose target is missing simply centres its card
 * instead of pointing at nothing.
 */

const ACCENT = "#7A5AF8";

export type TourScreen = "mapContent" | "levelEditor" | "review";

export interface TourStep {
  /** Which screen this step lives on — the tour navigates there before anchoring. */
  screen?: TourScreen;
  /** `data-tour` value of the element to spotlight. Omit for a centred card. */
  target?: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    screen: "mapContent",
    title: "Auto Map Updates",
    body: "A new floor-plan arrives, MapScale maps it, Pointr's mapping team corrects it — then how much of the floor changed decides what happens next. This is that flow, running on the live map.",
  },
  {
    screen: "mapContent",
    target: "tree",
    title: "Every level says where it stands",
    body: "You never have to open a level to find out. Terminal 3 and B Gates shows one of each state at once.",
  },
  {
    screen: "mapContent",
    target: "level-tags",
    title: "The traffic light, as tags",
    body: "Under 20% changed publishes itself. 20–50% waits for you, and publishes after 7 days if you don't act. Over 50% is rejected — that much change means the wrong file, not a remodel.",
  },
  {
    screen: "levelEditor",
    target: "floorplan",
    title: "The floor-plan is the subject",
    body: "The current file, and MapScale's status attached to it — because the job belongs to this floor-plan, not beside it.",
  },
  {
    screen: "levelEditor",
    target: "upload",
    title: "Try an upload",
    body: "Each press walks one outcome in turn: amber review, green auto-publish, red rejection, then an unreadable file. You can also drag a file straight onto the map.",
  },
  {
    screen: "review",
    target: "magnitude",
    title: "How much changed",
    body: "The number is the share of floor area, measured after the mapping team has corrected the AI — not a count of features.",
  },
  {
    screen: "review",
    target: "changelog",
    title: "Colour is what a feature IS",
    body: "Green new, blue updated, red removed, purple your own override. The map previews the result: confirm and it stays, reject and the published value comes back, edit and it turns purple because it is yours. Risk is a neutral ⚠, never amber.",
  },
  {
    screen: "review",
    target: "review-map",
    title: "The list and the map are one thing",
    body: "Every row here is a real feature on this floor, highlighted beside it. Hover a row or a shape and they answer each other.",
  },
  {
    screen: "mapContent",
    target: "add-building",
    title: "Adding a building",
    body: "Five steps: details, drop floor-plans to make levels, align them to one reference floor, place the building on the globe, then review MapScale's guesses on the screen you just saw.",
  },
  {
    target: "feedback-comment",
    title: "Now tell us what you think",
    body: "Press Comment and click anything on screen to pin a note to it. Everyone reviewing sees everyone's notes.",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function Tour({
  step,
  onStep,
  onClose,
  onNavigate,
}: {
  step: number;
  onStep: (n: number) => void;
  onClose: () => void;
  onNavigate: (screen: TourScreen) => void;
}) {
  const s = TOUR_STEPS[step];
  const [rect, setRect] = useState<Rect | null>(null);

  /**
   * Navigate first; the anchor is measured once the screen has had a chance to render.
   *
   * `onNavigate` is held in a ref and kept OUT of the dep array on purpose. The caller passes an
   * inline arrow, so its identity changes on every App render — with it in the deps this effect
   * re-fired after each navigation, navigated again, and React died with "Maximum update depth
   * exceeded". Only a change of STEP should navigate.
   */
  const navRef = useRef(onNavigate);
  navRef.current = onNavigate;
  useEffect(() => {
    if (s.screen) navRef.current(s.screen);
  }, [step, s.screen]);

  const measure = useCallback(() => {
    if (!s.target) return setRect(null);
    const el = document.querySelector(`[data-tour="${s.target}"]`);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return setRect(null);
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [s.target]);

  useLayoutEffect(() => {
    measure();
    // screens mount asynchronously (and the map even more so), so re-measure for a moment
    const timers = [80, 220, 500, 900].map((ms) =>
      window.setTimeout(measure, ms),
    );
    window.addEventListener("resize", measure);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("resize", measure);
    };
  }, [measure, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight")
        onStep(Math.min(step + 1, TOUR_STEPS.length - 1));
      if (e.key === "ArrowLeft") onStep(Math.max(step - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onStep, onClose]);

  const pad = 6;
  const hole = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // card placement: beside the hole when there's room, otherwise centred
  const CARD_W = 340;
  let cardStyle: React.CSSProperties = {
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
  };
  if (hole) {
    const spaceRight = window.innerWidth - (hole.left + hole.width);
    const left =
      spaceRight > CARD_W + 24
        ? hole.left + hole.width + 16
        : Math.max(16, hole.left - CARD_W - 16);
    const top = Math.min(Math.max(16, hole.top), window.innerHeight - 240);
    cardStyle = { left, top, transform: "none" };
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70 }}>
      {/* the dim, with a hole punched by an enormous shadow — one element, no seams */}
      {hole ? (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            ...hole,
            borderRadius: 10,
            boxShadow: "0 0 0 9999px rgba(12,14,20,.62)",
            border: `2px solid ${ACCENT}`,
            pointerEvents: "none",
            transition:
              "top .18s ease, left .18s ease, width .18s ease, height .18s ease",
          }}
        />
      ) : (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12,14,20,.62)",
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          width: CARD_W,
          ...cardStyle,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 18px 44px rgba(0,0,0,.34)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: ACCENT,
            color: "#fff",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>
            {s.title}
          </span>
          <span style={{ fontSize: 11.5, opacity: 0.85 }}>
            {step + 1}/{TOUR_STEPS.length}
          </span>
        </div>
        <div
          style={{
            padding: "14px 16px",
            fontSize: 13,
            lineHeight: 1.55,
            color: "#1a1c24",
          }}
        >
          {s.body}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 16px 14px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              color: "#737373",
              fontSize: 12,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Skip tour
          </button>
          <span style={{ flex: 1 }} />
          {step > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStep(step - 1)}
            >
              Back
            </Button>
          )}
          <Button
            size="sm"
            onClick={() =>
              step + 1 < TOUR_STEPS.length ? onStep(step + 1) : onClose()
            }
          >
            {step + 1 < TOUR_STEPS.length ? "Next" : "Start exploring"}
          </Button>
        </div>
      </div>
    </div>
  );
}
