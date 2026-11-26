/**
 * ControlText's recipe: a control's label with a description under it
 * (GAP-162), for every framework that draws one beside a Checkbox, a Switch
 * or a default radio. It follows the control as the `peer` it reads:
 * disabled, the words are drawn at half with it. The label is 20 tall, the
 * control's own height, so the control sits beside its first line.
 * Framework-free (`recipes.framework-free.test.ts`).
 */

/** The box holding the label and its description. */
export const CONTROL_TEXT_CLASS =
  "flex min-w-0 flex-col gap-0.5 peer-disabled:cursor-not-allowed peer-disabled:opacity-50";

/** The label, over its description. */
export const CONTROL_TEXT_LABEL_CLASS = "text-sm font-medium leading-5";

/** The description, under the label. */
export const CONTROL_TEXT_DESCRIPTION_CLASS =
  "text-sm leading-5 text-muted-foreground";
