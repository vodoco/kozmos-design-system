import assert from "node:assert/strict";
import test from "node:test";
import { mapFromReply } from "../lib/figma-mcp-reply.mjs";

/**
 * How the Code Connect readback reads a Dev Mode MCP reply. On 2026-11-05
 * Figma desktop answered get_code_connect_map with the map in one text part
 * and more text after it, and the readback, which joined the parts and
 * JSON-parsed the join, read nothing: 299 of 299 replies failed with
 * "Unexpected non-whitespace character after JSON", and each was asked
 * twice, which spent the day's allowance.
 */
const text = (...parts) => ({
  result: { content: parts.map((part) => ({ type: "text", text: part })) },
});
const MAP = { "1:2": { snippet: "<Button />" } };

test("reads the map from its own part when the reply has more than one", () => {
  assert.deepEqual(
    mapFromReply(
      text(JSON.stringify(MAP), "Use the snippet above as the starting point."),
    ),
    { map: MAP },
  );
  // The map need not come first.
  assert.deepEqual(
    mapFromReply(text("Code Connect for the node:", JSON.stringify(MAP))),
    { map: MAP },
  );
});

test("reads a map with text after it in the same part", () => {
  assert.deepEqual(
    mapFromReply(text(`${JSON.stringify(MAP)}\n\nIMPORTANT: follow the snippet.`)),
    { map: MAP },
  );
});

test("an empty map is a map", () => {
  assert.deepEqual(mapFromReply(text("{}")), { map: {} });
});

test("a reply that holds no map is not retried: asking again answers the same", () => {
  assert.deepEqual(mapFromReply(text('["not", "a", "map"]')), {
    error: 'the server answered ["not", "a", "map"], not a map',
    retry: false,
  });
  assert.deepEqual(mapFromReply(text("Nothing is published for this node")), {
    error: "the server answered Nothing is published for this node, not a map",
    retry: false,
  });
});

test("an answer with no text is retried, and is never read as an empty map", () => {
  assert.deepEqual(mapFromReply(text("", "  ")), {
    error: "the server answered with no text",
    retry: true,
  });
  assert.deepEqual(mapFromReply({ result: {} }), {
    error: "the server answered with no text",
    retry: true,
  });
});

test("the rate limit stops the run; another error is retried", () => {
  const limited = mapFromReply({
    result: {
      isError: true,
      content: [
        {
          type: "text",
          text: "Rate limit exceeded, please try again tomorrow",
        },
      ],
    },
  });
  assert.equal(limited.retry, false);
  assert.match(limited.rateLimited, /Rate limit exceeded/);
  assert.deepEqual(mapFromReply({ error: { code: -32000, message: "busy" } }), {
    error: '{"code":-32000,"message":"busy"}',
    retry: true,
  });
});
