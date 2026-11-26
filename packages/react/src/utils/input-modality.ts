import React from "react";
import {
  readInputModality,
  subscribeInputModality,
  type InputModality,
} from "../recipes/input-modality";

// The store moved to recipes/input-modality.ts, shared with @kozmos-ds/vue's
// lists: framework-free, so Vue builds it in.
export type { InputModality };

/** The last hand to move: "pointer" on the server and before any input. */
export function useInputModality(): InputModality {
  return React.useSyncExternalStore(
    subscribeInputModality,
    readInputModality,
    () => "pointer",
  );
}
