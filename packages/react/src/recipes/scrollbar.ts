/**
 * A scroll region's scrollbar, by how the map shell presents its panel:
 * none that lasts on a phone (decision 75: touch platforms show none at
 * rest), Kozmos's thin one elsewhere (GAP-139). Set as
 * `data-kozmos-scrollbar`; owned CSS draws it. For every framework whose
 * lists scroll: React's Combobox and MultiSelect, Vue's KozmosCombobox.
 * Framework-free (`recipes.framework-free.test.ts`).
 */
export function scrollbarFor(presentation: string | null): "hidden" | "thin" {
  return presentation === "bottom" ? "hidden" : "thin";
}
