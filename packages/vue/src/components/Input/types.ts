import type { Component, VNode } from "vue";

/**
 * Input's public prop types, written out so the package's declarations name
 * nothing outside it. `types.check.ts` holds each to the shared recipe's own
 * type, so a status or a count's option added there fails the typecheck
 * here.
 */
export type KozmosInputStatus = "default" | "error" | "warning" | "success";

/**
 * A field's character count, and what it means, as React's
 * `CharacterCount`: `limit` is a soft maximum, an error the visitor is told
 * about, not a keystroke the browser swallows; `minimum` applies once
 * something has been typed.
 */
export interface KozmosCharacterCount {
  limit: number;
  minimum?: number;
  /** Localisable. The default is the bare `52/512` the prototype draws. */
  label?: (count: number, limit: number) => string;
  overLimit?: string;
  underMinimum?: (minimum: number) => string;
}

/**
 * A button inside the field's end (GAP-154, GAP-212), as React's
 * `InputAction`: a `copy` of the field's value that says it copied, a
 * pressed `toggle` with its own name, or an `edit` pencil that calls
 * `onEdit`. A toggle's `icon` is a Vue component (an `@kozmos-ds/icons/vue`
 * glyph) or a VNode, where React's is a React node.
 */
export type KozmosInputAction =
  | {
      kind: "copy";
      /** The button's name. Default "Copy". */
      label?: string;
      /** What is announced once the value is copied. Default "Copied". */
      copiedLabel?: string;
      onCopy?: (value: string) => void;
    }
  | {
      kind: "toggle";
      label: string;
      icon: Component | VNode;
      pressed: boolean;
      onPressedChange: (pressed: boolean) => void;
    }
  | {
      kind: "edit";
      /** The button's name. Default "Edit". */
      label?: string;
      onEdit: () => void;
    };
