/**
 * The `aria-live` a live role implies, said out loud (GAP-193).
 *
 * `role="status"` is polite and `role="alert"` assertive by the role alone,
 * and a screen reader reads them so. But a modal Radix primitive (Select,
 * Dialog, Menu) hides the rest of the page with aria-hidden's `hideOthers` as
 * it opens, and that keeps only boxes marked `[aria-live]` visible: a region
 * with the role alone was hidden, silenced, with its buttons still focusable.
 * Kozmos's live parts set both, so they keep speaking while a popup is open.
 *
 * A caller's own `aria-live`, spread after this, still wins.
 */
const IMPLIED: Partial<Record<string, "polite" | "assertive">> = {
  status: "polite",
  alert: "assertive",
  log: "polite",
};

export function impliedLive(
  role: string | undefined,
): "polite" | "assertive" | undefined {
  return role === undefined ? undefined : IMPLIED[role];
}
