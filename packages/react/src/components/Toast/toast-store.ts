import type { ReactNode } from "react";

/**
 * Notice's tones (warning, info, critical), with the success GAP-160 asks
 * of Notice, and neutral, the default, which draws no icon. A toast keeps
 * its surface, the background (GAP-58), whatever its tone: the tone is its
 * icon, in the tone's text colour.
 */
export type ToastTone = "neutral" | "success" | "info" | "warning" | "critical";

export interface ToastOptions {
  /** The words under the title. */
  description?: ReactNode;
  /** Defaults to `neutral`. */
  tone?: ToastTone;
  /**
   * How a screen reader announces it, in Notice's words. `assertive` for a
   * `critical` toast, which interrupts; `polite` for every other tone.
   */
  live?: "polite" | "assertive";
  /**
   * How long it shows, in milliseconds, from when it is drawn. Defaults to
   * the Toaster's `duration`; `Infinity` keeps it until it is dismissed.
   * Hovering or focusing the toasts pauses it.
   */
  duration?: number;
  /**
   * One button beside the words, which closes the toast as it runs.
   * `altText` says how to do the same without the toast, for a screen
   * reader, which announces it in place of the button (Radix's `altText`);
   * it defaults to `label`.
   */
  action?: { label: string; onClick?: () => void; altText?: string };
  /**
   * A toast already showing with this id is replaced, in its place, and
   * announced again: "Saving…" becomes "Saved". Its `onDismiss` is kept:
   * it still runs once, when the replacement closes.
   */
  id?: string;
  /** The `id` of the Toaster that draws it, when a page has more than one. */
  toaster?: string;
  /**
   * Runs once when it closes, however it closes. Being replaced is not
   * closing: a replaced toast's `onDismiss` runs when its replacement
   * closes, before the replacement's own (one function given to both runs
   * once).
   */
  onDismiss?: () => void;
}

export interface ToastRecord extends ToastOptions {
  id: string;
  /** Changes when the toast is replaced, so it is drawn and announced anew. */
  key: string;
  title: ReactNode;
  open: boolean;
  /**
   * Every `onDismiss` given to this id while it showed, first call first,
   * each once: they all run when it closes.
   */
  dismissals: (() => void)[];
}

// One queue for the page. Nothing is added on the server: there is no one
// there to show a toast to, and a module's state on a server is shared by
// every request it renders.
let records: ToastRecord[] = [];
const none: ToastRecord[] = [];
const listeners = new Set<() => void>();
// The toasts a Toaster has drawn, so one dismissed before it is drawn (queued,
// or with no Toaster) goes at once, and one drawn goes once it has animated out.
const drawn = new Set<string>();
// The Toasters mounted for each id, in mount order: the first draws.
const owners = new Map<string, object[]>();
let made = 0;

function emit(next: ToastRecord[]) {
  records = next;
  listeners.forEach((listener) => listener());
}

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const snapshot = () => records;
export const serverSnapshot = () => none;

function dismiss(id?: string) {
  const closing = records.filter(
    (record) => record.open && (id === undefined || record.id === id),
  );
  if (!closing.length) return;
  emit(
    records.flatMap((record) =>
      !closing.includes(record)
        ? [record]
        : drawn.has(record.id)
          ? [{ ...record, open: false }]
          : [],
    ),
  );
  // After the queue has changed, so a callback that shows the next toast
  // adds to it rather than being overwritten.
  closing.forEach((record) =>
    record.dismissals.forEach((onDismiss) => onDismiss()),
  );
}

export interface ToastFunction {
  /**
   * Shows a toast from anywhere: an event handler, a request's callback, a
   * module outside React. The page's `<Toaster>` draws it. Returns its id,
   * for `toast.dismiss(id)` or to replace it. Does nothing on the server.
   */
  (title: ReactNode, options?: ToastOptions): string;
  /** Closes the toast with this id, or every toast when given none. */
  dismiss(id?: string): void;
}

export const toast: ToastFunction = Object.assign(
  (title: ReactNode, options: ToastOptions = {}) => {
    const id = options.id ?? `kozmos-toast-${++made}`;
    if (typeof document !== "undefined") {
      // A toast still showing keeps the callbacks it was given; one already
      // closing has run them.
      const replaced = records.find((other) => other.id === id && other.open);
      const dismissals = [...(replaced?.dismissals ?? [])];
      if (options.onDismiss && !dismissals.includes(options.onDismiss))
        dismissals.push(options.onDismiss);
      const record = {
        ...options,
        id,
        key: `${id}:${++made}`,
        title,
        open: true,
        dismissals,
      };
      emit(
        records.some((other) => other.id === id)
          ? records.map((other) => (other.id === id ? record : other))
          : [...records, record],
      );
    }
    return id;
  },
  { dismiss },
);

/** A Toaster's toast was drawn (a node) or taken away (null). */
export function track(id: string, node: unknown) {
  if (node) drawn.add(id);
  else {
    drawn.delete(id);
    // Radix's toast hands React a new ref each time it renders, and React
    // detaches the old one (null) and attaches the new in one commit: as a
    // toast starts to close, too. Only a toast still undrawn once that commit
    // is done has gone; letting it go at the null took it away before its
    // exit animation had run.
    queueMicrotask(() => {
      if (
        !drawn.has(id) &&
        records.some((record) => record.id === id && !record.open)
      )
        emit(records.filter((record) => record.id !== id));
    });
  }
}

/** A Toaster mounts for `id`; returns its unmount. The first one draws. */
export function claim(id: string, token: object) {
  owners.set(id, [...(owners.get(id) ?? []), token]);
  emit([...records]);
  return () => {
    owners.set(
      id,
      (owners.get(id) ?? []).filter((other) => other !== token),
    );
    emit([...records]);
  };
}

export const owner = (id: string) => owners.get(id)?.[0];
