/**
 * Compile-time only: Progress's public types equal the shared recipe's
 * (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing here is
 * exported or bundled.
 */
import type {
  ProgressRingSize,
  ProgressSpan,
  progressTrackSpans,
} from "#kozmos-recipes";
import type {
  KozmosProgressRange,
  KozmosProgressSize,
  KozmosProgressTrackMotion,
  KozmosProgressTrackPositionMode,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;
type Spans = Parameters<typeof progressTrackSpans>[0];

export type ProgressTypesMatchTheRecipe = [
  Expect<Equal<KozmosProgressSize, ProgressRingSize>>,
  Expect<Equal<KozmosProgressRange, ProgressSpan>>,
  Expect<Equal<KozmosProgressTrackPositionMode, Spans["positionMode"]>>,
  Expect<Equal<KozmosProgressTrackMotion, Spans["motion"]>>,
];
