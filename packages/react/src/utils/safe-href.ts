/**
 * The destination Kozmos puts behind a link, or undefined to show the text
 * unlinked. One rule for every link Kozmos draws (MapAttribution's credits,
 * MapInfoPanel's entries), as on iOS and Android:
 *
 * - http or https with a host, and, where a contact link belongs
 *   (`contact`), mailto: or tel: with a target;
 * - no credentials: `https://maps.example@evil.example` reads as one host
 *   and goes to another;
 * - no whitespace or control characters, which a browser strips or encodes
 *   so the link goes somewhere other than the text says.
 *
 * Until 2026-10-04 the credits checked only the scheme and host, so a credit
 * with a user name and password was a live link; MapInfoPanel's entries
 * already refused it.
 */
export function safeHref(
  href: string | undefined,
  options: { contact?: boolean } = {},
): string | undefined {
  if (
    !href ||
    Array.from(href).some((character) => character.charCodeAt(0) <= 32)
  )
    return undefined;
  try {
    const url = new URL(href);
    if (url.username || url.password) return undefined;
    if (["http:", "https:"].includes(url.protocol) && url.hostname) return href;
    if (
      options.contact &&
      ["mailto:", "tel:"].includes(url.protocol) &&
      url.pathname
    )
      return href;
  } catch {
    /* Unsupported destinations stay readable as text. */
  }
  return undefined;
}
