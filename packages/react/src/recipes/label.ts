/**
 * Label's recipe: the class a Kozmos label draws with, for every framework
 * that draws one. React's `Label` (on Radix) and Vue's `KozmosLabel` (on
 * Reka UI) both build their `<label>` from it. Framework-free
 * (`recipes.framework-free.test.ts`).
 */
import { cva } from "class-variance-authority";

export const labelVariants = cva("kozmos-reset kozmos-label");
