/**
 * The app's language, for every framework that writes numbers or dates in
 * it: Calendar's dates and Select's counts in React, and Vue's
 * `KozmosSelectItem`. Framework-free (`recipes.framework-free.test.ts`).
 */

/**
 * The locale to name dates in: the caller's, else the document's language,
 * else the browser's, else English. A tag no engine knows falls back too.
 */
export function resolveLocale(locale?: string) {
  const document = globalThis.document;
  for (const tag of [
    locale,
    document?.documentElement.lang,
    globalThis.navigator?.language,
  ]) {
    if (!tag) continue;
    try {
      if (Intl.DateTimeFormat.supportedLocalesOf(tag).length) return tag;
    } catch {
      // An invalid tag throws; try the next.
    }
  }
  return "en-US";
}
