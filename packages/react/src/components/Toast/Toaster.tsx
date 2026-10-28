"use client";
import React from "react";
import { createPortal } from "react-dom";
import { ThemeProviderContext } from "../../theme/theme-context";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./Toast";
import {
  claim,
  owner,
  serverSnapshot,
  snapshot,
  subscribe,
  toast,
  track,
  type ToastRecord,
} from "./toast-store";

export { toast } from "./toast-store";
export type { ToastFunction, ToastOptions, ToastTone } from "./toast-store";

export interface ToasterProps {
  /**
   * Which toasts it draws: those whose `toaster` option names this id. One
   * with no id draws the toasts that name none. With two Toasters of one id
   * mounted, the first draws and the other stays empty, so no toast is shown
   * or announced twice.
   */
  id?: string;
  /** Each toast's time, in milliseconds, unless it gives its own. 5000. */
  duration?: number;
  /** How many show at once; the rest wait their turn. 3. */
  limit?: number;
  /**
   * The region's name. Radix's "Notifications ({hotkey})": `{hotkey}` is
   * replaced by the keys that move focus to it.
   */
  label?: string;
  /** Said before each toast's words as it is announced. "Notification". */
  toastLabel?: string;
  /** Each toast's close button. "Dismiss notification". */
  closeLabel?: string;
  /** The keys that move focus to the toasts. F8. */
  hotkey?: string[];
  /** The list's classes, as ToastViewport's. */
  className?: string;
}

function ToasterItem({
  record,
  closeLabel,
}: {
  record: ToastRecord;
  closeLabel: string;
}) {
  const { id, title, description, tone, live, duration, action, open } = record;
  // Stable, so the node is reported once as it is drawn and once as it goes,
  // after its exit animation, which is when the queue lets it go.
  const ref = React.useCallback(
    (node: HTMLLIElement | null) => track(id, node),
    [id],
  );
  return (
    <Toast
      ref={ref}
      open={open}
      onOpenChange={(next) => next || toast.dismiss(id)}
      duration={duration}
      // Radix's announcement: assertive for a foreground toast, polite for a
      // background one, on a role="status" region that says its aria-live
      // out loud, as every Kozmos live part does (GAP-193).
      type={
        (live ?? (tone === "critical" ? "assertive" : "polite")) === "assertive"
          ? "foreground"
          : "background"
      }
      tone={tone ?? "neutral"}
      className="kozmos-toast"
    >
      {/* The spaces are for the announcement, which Radix joins from the
          toast's text with nothing between: "Could not saveTry again." A
          flex or grid box draws no space of its own. */}
      <div className="grid min-w-0 gap-1">
        <ToastTitle>{title}</ToastTitle>
        {description && " "}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action && " "}
      {action && (
        <ToastAction
          altText={action.altText ?? action.label}
          onClick={action.onClick}
        >
          {action.label}
        </ToastAction>
      )}
      <ToastClose aria-label={closeLabel} />
    </Toast>
  );
}

/**
 * Draws the toasts `toast()` shows: mount one, inside a ThemeProvider, and
 * call `toast()` from anywhere. It is drawn in the provider's portal, in its
 * theme, direction and density, so no box it is rendered in (a map, a panel
 * that clips or isolates) can trap it, and the design config's reduced
 * motion reaches it there. The toasts queue, `limit` at a time, oldest
 * first; each pauses while the toasts are hovered or focused, closes on a
 * swipe, its close button or Escape (the newest, with focus outside the
 * toasts), and never takes focus.
 */
export function Toaster({
  id = "",
  duration = 5000,
  limit = 3,
  label,
  toastLabel,
  closeLabel = "Dismiss notification",
  hotkey,
  className,
}: ToasterProps) {
  const records = React.useSyncExternalStore(
    subscribe,
    snapshot,
    serverSnapshot,
  );
  const [token] = React.useState({});
  React.useEffect(() => claim(id, token), [id, token]);
  const theme = React.useContext(ThemeProviderContext);
  const viewport = (
    <ToastViewport className={className} label={label} hotkey={hotkey} />
  );
  return (
    <ToastProvider duration={duration} label={toastLabel}>
      {owner(id) === token &&
        records
          .filter((record) => (record.toaster ?? "") === id)
          .slice(0, limit)
          .map((record) => (
            <ToasterItem
              key={record.key}
              record={record}
              closeLabel={closeLabel}
            />
          ))}
      {!theme
        ? viewport
        : theme.portalContainer &&
          createPortal(viewport, theme.portalContainer)}
    </ToastProvider>
  );
}
