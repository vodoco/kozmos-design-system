import type * as React from "react";
import { emotionSurfaceVariables, type Emotion } from "../recipes/emotion";

// The emotion axis lives in the shared recipes, which Vue's parts draw from
// too (`recipes/emotion.ts`); React's parts keep importing it from here.
export {
  EMOTIONS,
  EMOTION_FILLED_CLASSES,
  EMOTION_OUTLINE_CLASSES,
  type Emotion,
} from "../recipes/emotion";

/**
 * The three roles an emotion carries, as custom properties, in React's
 * style type (`emotionSurfaceVariables` in the recipe says what each is).
 * The recipe's own function, typed for React's `style`: a wrapper around it
 * cost every app a call for nothing.
 */
export const emotionSurfaceProperties = emotionSurfaceVariables as (
  emotion: Emotion,
) => React.CSSProperties;
