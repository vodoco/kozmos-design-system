import React from "react";

/** Android's double-tap timeout, and about iOS's: a second tap within it opens. */
export const DOUBLE_TAP_MS = 300;
/**
 * The longest a counted double click (`detail` 2) may follow the target's own
 * first press: past any OS's default double-click time, so a slow setting
 * still opens, while a press from another gesture long ago does not.
 */
export const DOUBLE_CLICK_LIMIT_MS = 2000;

/** What a click does: an ordinary press, the open of a double tap, or nothing. */
export type DoubleTapPress = "press" | "open" | "ignore";

/**
 * A double tap on one target (decisions 71 and 72): the second press within
 * the platform's double-tap time opens. The browser counts clicks in `detail`
 * (by the OS's double-click setting); a touch browser that reports every tap
 * as 1 is timed here. Either way this target took the first press, and lately:
 * a browser counts by time and place, so a first press that moved the layout
 * can put another target under the second. A quick tap after an open does
 * nothing, as on SwiftUI and Compose. `detail` 0 is a keyboard press, which
 * the gate always calls an ordinary press: LocationPin decides before it
 * whether Enter opens (decision 79).
 */
export function useDoubleTapGate() {
  const lastPress = React.useRef<{ at: number; opened: boolean } | null>(null);
  return React.useCallback(
    (event: { detail: number; timeStamp: number }): DoubleTapPress => {
      if (event.detail === 0) return "press";
      if (event.detail > 2) return "ignore";
      const previous = lastPress.current;
      const since = previous ? event.timeStamp - previous.at : Infinity;
      const second =
        event.detail === 2
          ? since < DOUBLE_CLICK_LIMIT_MS
          : since < DOUBLE_TAP_MS;
      if (second) {
        const ignore = previous?.opened === true;
        lastPress.current = { at: event.timeStamp, opened: true };
        return ignore ? "ignore" : "open";
      }
      lastPress.current = { at: event.timeStamp, opened: false };
      return "press";
    },
    [],
  );
}
