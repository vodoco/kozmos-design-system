// What Figma desktop's Dev Mode MCP server answered to get_code_connect_map,
// read as a Code Connect map.
//
// The server answers in content parts. On 2026-11-05 the readback, which
// joined the parts and JSON-parsed the join, read nothing: every one of the
// 299 nodes asked failed with "Unexpected non-whitespace character after
// JSON", so the reply holds a JSON value followed by more text. No raw reply
// was kept, so this reads every shape that error allows: each part on its
// own, a map followed by text in its part up to where the map ends, and the
// join of the parts last, for a map split across them.
//
// A map is an object whose keys are node ids ("1:2", or "I1:2;3:4" for an
// instance) and whose values are objects. Any other JSON object, metadata or
// an error, is never taken for the map: read as one, it has no entries the
// readback can fault, and every node would pass. A map with entries wins over
// an empty one.

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

const NODE_ID = /^I?\d+:\d+(?:;\d+:\d+)*$/;
const isPlainObject = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);
const isMap = (value) =>
  isPlainObject(value) &&
  Object.entries(value).every(
    ([key, entry]) => NODE_ID.test(key) && isPlainObject(entry),
  );

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
  const maps = [...parts, parts.join("")]
    .map(leadingJson)
    .filter(isMap);
  const map = maps.find((value) => Object.keys(value).length) ?? maps[0];
  if (map) return { map };
  return {
    error: `the server answered ${parts.join(" ").slice(0, 120)}, not a map`,
    retry: false,
  };
}
