/**
 * Textarea's recipe: the multi-line field, for every framework that draws
 * one. React's `Textarea` and Vue's `KozmosTextarea` both build their
 * element from it. Framework-free (`recipes.framework-free.test.ts`).
 */
import { cva } from "class-variance-authority";

export const textareaVariants = cva("kozmos-reset kozmos-textarea");

/**
 * The edge, the text and the focus ring of a field in error: owned CSS, as
 * Safari 26.0 to 26.3 apply no @scope rule to a <textarea> (GAP-174).
 */
export const TEXTAREA_ERROR_CLASS = "kozmos-textarea-error";
