import React from "react";
import type { Instruction } from "@kozmos-ds/product-contracts";

/** For non-rendered consumers only; rendering must retain each part's language. */
export function instructionText(instruction: Instruction): string {
  return typeof instruction === "string"
    ? instruction
    : instruction.map((part) => part.text).join("");
}

/** Inline fragments, not separate layout boxes: wrapping and bidi remain sentence-owned. */
export function InstructionText({ instruction }: { instruction: Instruction }) {
  if (typeof instruction === "string")
    return <React.Fragment>{instruction}</React.Fragment>;
  return (
    <React.Fragment>
      {instruction.map((part, index) => (
        <span
          key={index}
          lang={part.lang}
          className={
            part.role === "secondary"
              ? "font-normal kozmos-muted-text"
              : undefined
          }
        >
          {part.text}
        </span>
      ))}
    </React.Fragment>
  );
}
