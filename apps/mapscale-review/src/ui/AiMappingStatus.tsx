import {
  Button,
  Icon,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@kozmos-ds/react";

/**
 * The v9 dashboard's `AiMappingActionStatus` (Figma `b8dqhE3CPxitYfqlXuQJTC`, node 4355:50805),
 * rebuilt here rather than reinvented: 288px card, 24px glyph, an 11px caption over a 13px status,
 * an optional destructive text action, and a tinted progress fill behind the content.
 *
 * The first nine states are v9's. The last three — `user-review`, `rejected`, `published` — are the
 * MAP-566 outcomes that don't exist in v9 yet; they reuse v9's own palettes so they'll drop straight
 * onto the real variants once those are added to the design file.
 */
export type MapScaleState =
  | "not-applicable"
  | "available"
  | "ready"
  | "in-queue"
  | "validating"
  | "in-progress"
  | "completed"
  | "expert-review"
  | "failed"
  | "user-review"
  | "rejected"
  | "published";

/** v9 colour tokens, straight off the component. */
const T = {
  theme0: "#f1f5fe",
  theme100: "#cad9fc",
  theme200: "#a4bef9",
  theme500: "#346df1",
  theme700: "#0d44c2",
  theme1000: "#051c4f",
  success0: "#f6fdf9",
  success200: "#a0ecc6",
  success600: "#23b26b",
  success1000: "#0f4c2d",
  // alert900, not alert600, for the caption: #f9a707 on the #fffcf8 tint is ~2:1 and unreadable,
  // which is why the DS component itself resolves this slot to alert/900 (checked against the S2
  // instance, Figma 2451:78). The success and danger 600s are dark enough to stay.
  alert0: "#fffcf8",
  alert200: "#fde0a8",
  alert900: "#744d03",
  alert1000: "#472f02",
  danger0: "#fceaee",
  danger200: "#f3a2b3",
  danger500: "#e43458",
  danger600: "#d41c42",
  danger1000: "#430915",
  line: "#e3e4e8",
  fg500: "#747b8b",
  fg800: "#2e3138",
};

type Look = {
  caption: string;
  status: string;
  bg: string;
  border: string;
  capColor: string;
  statColor: string;
  icon: string;
};

const LOOK: Record<MapScaleState, Look> = {
  "not-applicable": {
    caption: "AI Mapping",
    status: "Not applicable",
    bg: "#f7f8f9",
    border: T.line,
    capColor: T.fg500,
    statColor: T.fg800,
    icon: "/icons/ai-muted.svg",
  },
  available: {
    caption: "Ready for AI Mapping",
    status: "Start MapScale™",
    bg: T.theme700,
    border: T.theme700,
    capColor: T.theme100,
    statColor: "#fff",
    icon: "/icons/ai-white.svg",
  },
  ready: {
    caption: "AI Mapping",
    status: "Ready",
    bg: T.theme0,
    border: T.theme200,
    capColor: T.theme500,
    statColor: T.theme1000,
    icon: "/icons/ai-ready.svg",
  },
  "in-queue": {
    caption: "AI Mapping",
    status: "In Queue",
    bg: T.theme0,
    border: T.theme200,
    capColor: T.theme500,
    statColor: T.theme1000,
    icon: "/icons/ai-theme.svg",
  },
  validating: {
    caption: "AI Mapping",
    status: "Validating integrity",
    bg: T.theme0,
    border: T.theme200,
    capColor: T.theme500,
    statColor: T.theme1000,
    icon: "/icons/ai-theme.svg",
  },
  "in-progress": {
    caption: "AI Mapping",
    status: "In Progress",
    bg: T.theme0,
    border: T.theme200,
    capColor: T.theme500,
    statColor: T.theme1000,
    icon: "/icons/ai-theme.svg",
  },
  completed: {
    caption: "AI Mapping",
    status: "Completed",
    bg: T.success0,
    border: T.success200,
    capColor: T.success600,
    statColor: T.success1000,
    icon: "/icons/ai-success.svg",
  },
  "expert-review": {
    caption: "AI Mapping",
    status: "Awaiting Expert Review",
    bg: T.alert0,
    border: T.alert200,
    capColor: T.alert900,
    statColor: T.alert1000,
    icon: "/icons/ai-alert.svg",
  },
  failed: {
    caption: "AI Mapping",
    status: "Failed",
    bg: T.danger0,
    border: T.danger200,
    capColor: T.danger600,
    statColor: T.danger1000,
    icon: "/icons/ai-danger.svg",
  },
  // MAP-566 additions
  "user-review": {
    caption: "AI Mapping",
    status: "Awaiting your review",
    bg: T.alert0,
    border: T.alert200,
    capColor: T.alert900,
    statColor: T.alert1000,
    icon: "/icons/ai-alert.svg",
  },
  rejected: {
    caption: "AI Mapping",
    status: "Rejected",
    bg: T.danger0,
    border: T.danger200,
    capColor: T.danger600,
    statColor: T.danger1000,
    icon: "/icons/ai-danger.svg",
  },
  published: {
    caption: "AI Mapping",
    status: "Published",
    bg: T.success0,
    border: T.success200,
    capColor: T.success600,
    statColor: T.success1000,
    icon: "/icons/ai-success.svg",
  },
};

export function AiMappingStatus({
  state,
  note,
  progress,
  action,
  onAction,
  primary,
  onPrimary,
  info,
}: {
  state: MapScaleState;
  /** Replaces the 13px status line — used to hang the change magnitude off the state. */
  note?: string;
  /** 0–1; paints v9's progress fill behind the content. */
  progress?: number;
  /** v9's destructive text action (Cancel while running, Reset after a failure). */
  action?: string;
  onAction?: () => void;
  /** The one state that needs a real button: review the detected changes. */
  primary?: string;
  onPrimary?: () => void;
  /**
   * An explanation in the trailing slot instead of a control (Figma 2451:78 puts info-circle where
   * the running states put Cancel). Expert Review is the state that needs it: nothing here is
   * yours to act on, so the only useful thing the slot can hold is what is going on and what
   * happens next.
   */
  info?: string;
}) {
  const look = LOOK[state];
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 8,
        borderRadius: 8,
        background: look.bg,
        border: `1px solid ${look.border}`,
      }}
    >
      {progress !== undefined && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            right: `${Math.round((1 - progress) * 100)}%`,
            background: T.theme100,
          }}
        />
      )}
      <img
        src={look.icon}
        alt=""
        width={24}
        height={24}
        style={{ position: "relative", flex: "0 0 24px" }}
      />
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <div style={{ fontSize: 11, lineHeight: "14px", color: look.capColor }}>
          {look.caption}
        </div>
        <div
          style={{ fontSize: 13, lineHeight: "18px", color: look.statColor }}
        >
          {note ?? look.status}
        </div>
      </div>
      {action && (
        <button
          onClick={onAction}
          style={{
            position: "relative",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 11,
            lineHeight: "14px",
            color: T.danger500,
          }}
        >
          {action}
        </button>
      )}
      {primary && (
        <span style={{ position: "relative" }}>
          <Button size="sm" onClick={onPrimary}>
            {primary}
          </Button>
        </span>
      )}
      {info && (
        <Tooltip>
          <TooltipTrigger asChild>
            {/* the whole label lives in the tooltip, so the glyph still needs an accessible name */}
            <span
              role="img"
              aria-label={info}
              tabIndex={0}
              style={{
                position: "relative",
                display: "grid",
                placeItems: "center",
                flex: "0 0 24px",
                color: look.capColor,
              }}
            >
              <Icon name="info-circle" size="lg" />
            </span>
          </TooltipTrigger>
          <TooltipContent style={{ maxWidth: 280 }}>{info}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
