/**
 * The loading arc's drawing, for every framework that draws it (React's
 * `SpinnerArc`, Vue's inside `KozmosButton`): three quarters of a circle,
 * radius 9 in the icons' own 24 box, round caps, stroke 2, from the top. The
 * large-arc flag is set because the sweep is over half a turn. Framework-free.
 */
export const SPINNER_ARC = {
  className: "kozmos-spinner-arc",
  viewBox: "0 0 24 24",
  path: "M12 3a9 9 0 1 1-9 9",
  strokeWidth: "2",
  strokeLinecap: "round",
  defaultSize: 24,
} as const;
