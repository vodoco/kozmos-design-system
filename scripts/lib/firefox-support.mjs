import assert from "node:assert/strict";

// Native @scope is enabled by default from Firefox 146, not 128:
// https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/146
// This checks one necessary CSS prerequisite, not whole-browser certification.
export function assertFirefoxScopeFloor(browserslist) {
  assert.ok(
    Array.isArray(browserslist),
    "Expected an explicit browser floor list",
  );
  // Browserslist entries are unioned. A broad query beside the Firefox row
  // can admit older versions, so a different query policy needs review.
  for (const entry of browserslist) {
    assert.ok(
      typeof entry === "string" &&
        /^(chrome|edge|safari|ios_saf|firefox|android) >= \d+(?:\.\d+)?$/.test(
          entry,
        ),
      "Review the browser policy before using anything except explicit supported-engine minimums",
    );
  }
  const declarations = browserslist.filter((entry) =>
    /^(?:firefox|ff)\b/i.test(entry),
  );
  assert.equal(
    declarations.length,
    1,
    "Declare exactly one explicit Firefox minimum",
  );
  const floor = /^firefox >= (\d+(?:\.\d+)?)$/.exec(declarations[0]);
  assert.ok(
    floor,
    "Review the Firefox policy before using a non-minimum browser query",
  );
  assert.ok(
    Number(floor[1]) >= 146,
    `Scoped utility CSS requires Firefox >= 146; declared ${declarations[0]}`,
  );
}
