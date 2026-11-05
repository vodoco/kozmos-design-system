/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const postcss = require("postcss");
const plugin = require("./shadow-reach.cjs");
const compile = async (css) =>
  (await postcss([plugin()]).process(css, { from: undefined })).css;
const room = async (tokens, side) =>
  (
    await compile(
      `${tokens} .room {padding: kozmos-shadow-reach(--elevation ${side})}`,
    )
  ).match(/\.room \{padding: ([^}]*)\}/)[1];

test("each side is the blur and spread less the offset towards it", async () => {
  const token = ":root {--elevation: 0 4px 8px rgba(0,0,0,.1)}";
  assert.equal(await room(token, "top"), "4px");
  assert.equal(await room(token, "bottom"), "12px");
  assert.equal(await room(token, "left"), "8px");
  assert.equal(await room(token, "right"), "8px");
  assert.equal(await room(token, "inline"), "8px");
  // Spread adds on every side; an offset past the blur leaves none behind.
  const spread = ":root {--elevation: 3px -12px 6px 2px #000}";
  assert.equal(await room(spread, "top"), "20px");
  assert.equal(await room(spread, "bottom"), "0px");
  assert.equal(await room(spread, "left"), "5px");
  assert.equal(await room(spread, "right"), "11px");
});

test("inline is the larger side, so it holds in either direction", async () => {
  const token = ":root {--elevation: -3px 0 6px black}";
  assert.equal(await room(token, "left"), "9px");
  assert.equal(await room(token, "right"), "3px");
  assert.equal(await room(token, "inline"), "9px");
});

test("the largest over the token's layers and over both themes", async () => {
  const themes =
    ':root {--elevation: 0 1px 2px #0001, 0 4px 8px #0002} [data-theme="dark"] {--elevation: 0 2px 16px rgba(0,0,0,.5)}';
  assert.equal(await room(themes, "top"), "14px");
  assert.equal(await room(themes, "bottom"), "18px");
  assert.equal(await room(themes, "inline"), "16px");
  // An inset layer is drawn inside the box; `none` draws nothing.
  const inset = ":root {--elevation: inset 0 0 40px #000, 0 2px 4px #000}";
  assert.equal(await room(inset, "bottom"), "6px");
  assert.equal(await room(":root {--elevation: none}", "bottom"), "0px");
});

test("several tokens make one room, the largest over all of them", async () => {
  // MapOverlay holds cards that float and map controls that cast their own,
  // heavier role (decision 40): its room is the larger of the two, per side.
  const tokens =
    ":root {--floating: 0 4px 8px red; --map: 0 8px 8px red, 0 24px 24px red, 0 0 32px red}";
  // A refusal is read as the output, so the room is what is asserted.
  const css = await compile(
    `${tokens} .room {padding: kozmos-shadow-reach(--floating --map top) kozmos-shadow-reach(--floating --map inline) kozmos-shadow-reach(--map --floating bottom)}`,
  ).catch((error) => String(error.message));
  assert.match(css, /\.room \{padding: 32px 32px 48px\}/);
  // One token that is missing still fails, whatever the others.
  await assert.rejects(
    compile(`${tokens} .a {padding: kozmos-shadow-reach(--floating --other top)}`),
    /--other is not declared/,
  );
});

test("it composes with calc() and leaves everything else alone", async () => {
  const css = await compile(
    ":root {--elevation: 0 4px 8px red} .a {margin: calc(-1 * kozmos-shadow-reach(--elevation top)) 0; padding: 1px}",
  );
  assert.match(css, /\.a \{margin: calc\(-1 \* 4px\) 0; padding: 1px\}/);
});

test("a token it cannot measure, or none at all, fails the build", async () => {
  await assert.rejects(
    room(":root {--other: 0 1px 2px red}", "top"),
    /--elevation is not declared/,
  );
  await assert.rejects(
    room(":root {--elevation: 0 0.25rem 0.5rem red}", "top"),
    /only px lengths/,
  );
  await assert.rejects(
    room(":root {--elevation: 0 4px var(--blur) red}", "top"),
    /cannot measure var\(\)/,
  );
  await assert.rejects(
    compile(
      ":root {--elevation: 0 4px 8px red} .a {padding: kozmos-shadow-reach(--elevation start)}",
    ),
    /takes one or more custom properties and one of/,
  );
});
