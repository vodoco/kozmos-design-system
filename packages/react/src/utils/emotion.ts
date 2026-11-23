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
 */
export function emotionSurfaceProperties(
  emotion: Emotion,
): React.CSSProperties {
  return emotionSurfaceVariables(emotion) as React.CSSProperties;
}
