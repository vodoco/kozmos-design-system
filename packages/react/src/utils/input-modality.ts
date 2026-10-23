import React from "react";

/**
 * Which hand moved last, the keyboard or a pointer, for a list's active row
 * (decision 26, 21 Oct 2026): reached by the keyboard it draws a ring, under
 * the pointer it does not. Read from the events themselves, never from
 * :focus-visible: Radix Select focuses its items when the pointer moves over
 * them too, and Combobox's rows never take focus (aria-activedescendant).
 *
 * One listener of each kind on the document, in the capture phase, so a key
 * reaches it before the list's own handler moves the row. A modifier pressed
 * alone is not the keyboard: a Shift- or Cmd-click over a row, or Cmd-Tab
 * away and back, would otherwise ring the row under the pointer. A modifier
 * with another key still is (Alt+ArrowDown opens a list, Shift+Arrow extends
 * a selection): that key's keydown carries its own name. A pointermove at
 * the same place is not a move: a list that scrolls under a still pointer
 * (the keyboard scrolling the active row into view) can be sent one. The
 * listeners stay once added: the key that opens a list comes before the list.
 */
export type InputModality = "keyboard" | "pointer";

let modality: InputModality = "pointer";
let at = "";
const listeners = new Set<() => void>();
let listening = false;

/** `KeyboardEvent.key` of a modifier or lock pressed on its own. */
const LONE_MODIFIERS = new Set([
  "Shift",
  "Control",
  "Alt",
  "AltGraph",
  "Meta",
  "OS",
  "CapsLock",
  "Fn",
]);

function set(next: InputModality) {
  if (next === modality) return;
  modality = next;
  for (const listener of listeners) listener();
}

function onKey(event: KeyboardEvent) {
  if (LONE_MODIFIERS.has(event.key)) return;
  set("keyboard");
}

function onPointer(event: PointerEvent) {
  const place = `${event.clientX},${event.clientY}`;
  if (event.type === "pointermove" && place === at) return;
  at = place;
  set("pointer");
}

function subscribe(listener: () => void) {
  if (!listening && typeof document !== "undefined") {
    listening = true;
    const options = { capture: true, passive: true };
    document.addEventListener("keydown", onKey, options);
    document.addEventListener("pointermove", onPointer, options);
    document.addEventListener("pointerdown", onPointer, options);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The last hand to move: "pointer" on the server and before any input. */
export function useInputModality(): InputModality {
  return React.useSyncExternalStore(
    subscribe,
    () => modality,
    () => "pointer",
  );
}
