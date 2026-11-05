// What Figma desktop's Dev Mode MCP server answered to get_code_connect_map,
// read as a Code Connect map.
//
// The server answers in content parts. On 2026-11-05 it sent the map in one
// text part and more text after it (in another part, or after the map in the
// same one), and the readback, which joined the parts and JSON-parsed the
// join, read nothing: 299 of 299 replies failed with "Unexpected
// non-whitespace character after JSON". Each part is read on its own here,
// and a map followed by text in its part is read up to where the map ends.

/** The JSON value at the start of `text`, or undefined when it holds none. */
function leadingJson(text) {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    // V8 says where a complete value ended: "Unexpected non-whitespace
    // character after JSON at position N".
    const end = String(error.message).match(/after JSON at position (\d+)/);
    if (!end) return undefined;
    try {
      return JSON.parse(trimmed.slice(0, Number(end[1])));
    } catch {
      return undefined;
    }
  }
}

const isMap = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);

/**
 * `{ map }` when the reply holds a map (an empty one included), or
 * `{ error, retry }`: `retry` is false where asking again would answer the
 * same (a reply that holds no map) or spend the day's allowance for nothing
 * (the rate limit, also returned as `rateLimited`).
 */
export function mapFromReply(reply) {
  const parts = (reply?.result?.content ?? [])
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .filter((part) => part.trim());
  if (reply?.error || reply?.result?.isError) {
    const error = JSON.stringify(reply.error ?? parts.join("\n")).slice(0, 200);
    return /rate limit/i.test(error)
      ? { error, retry: false, rateLimited: error }
      : { error, retry: true };
  }
  // An answer with no text is not an empty map: read as "{}", it would be
  // reported as "nothing published reads back".
  if (!parts.length)
    return { error: "the server answered with no text", retry: true };
  for (const part of parts) {
    const value = leadingJson(part);
    if (isMap(value)) return { map: value };
  }
  return {
    error: `the server answered ${parts.join(" ").slice(0, 120)}, not a map`,
    retry: false,
  };
}
