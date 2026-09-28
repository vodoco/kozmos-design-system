import type { ReactNode } from "react";

/**
 * Text from the components' docs, where code is written between backticks
 * (`Chip`, `tokens`): the code as <code>, the rest as it is. Text with an odd
 * number of backticks is left alone rather than guessed at.
 */
export function withCode(text: string): ReactNode {
  const parts = text.split("`");
  if (parts.length % 2 === 0) return text;
  return parts.map((part, index) =>
    index % 2 === 1 ? <code key={index}>{part}</code> : part,
  );
}

/** The same text where no markup goes: a meta description, a search result. */
export function withoutCode(text: string): string {
  return text.replace(/`/g, "");
}
