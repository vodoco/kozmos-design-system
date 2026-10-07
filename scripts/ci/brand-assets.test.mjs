import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { check, resolveConfig } from "prettier";
import test from "node:test";

const root = fileURLToPath(new URL("../../", import.meta.url));

test("committed brand assets match the generator after commit formatting", async () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/build-pointr-brand.mjs", "--check"],
    {
      cwd: root,
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  for (const name of [
    "packages/react/src/components/MapAttribution/pointr-logo.ts",
    "packages/ios/Sources/Resources/PointrBrand.xcassets/Contents.json",
    "packages/ios/Sources/Resources/PointrBrand.xcassets/PointrLogo.imageset/Contents.json",
  ]) {
    const filepath = root + name;
    assert.ok(
      await check(await readFile(filepath, "utf8"), {
        ...(await resolveConfig(filepath)),
        filepath,
      }),
      `${name} must also be unchanged by the pre-commit formatter`,
    );
  }
});

test("the compact web data URL decodes to the unchanged official artwork", async () => {
  const source = await readFile(
    root + "packages/react/src/components/MapAttribution/pointr-logo.ts",
    "utf8",
  );
  const encoded = source.match(/"data:image\/svg\+xml,([^"]+)"/);
  assert.ok(
    encoded,
    "web logo must use a percent-encoded SVG, without base64 overhead",
  );
  // Read as a browser reads it: the URL parser drops tabs and newlines and
  // strips a trailing space, which decodeURIComponent alone would keep.
  assert.equal(
    await (await fetch("data:image/svg+xml," + encoded[1])).text(),
    await readFile(root + "assets/brand/pointr-logo.svg", "utf8"),
  );
});

test("the data URL keeps what a URL parser drops", async () => {
  const { svgDataUri } = await import(root + "scripts/lib/svg-data-uri.mjs");
  for (const svg of [
    '<svg>\t<g/>\r\n<path d="M0 0"/> </svg> ',
    '<svg viewBox="0 0 1 1"><text>100% #1 {a|b} ^`[]</text></svg>\n',
    "<svg>\u0000\u001f\u007f</svg>",
  ])
    assert.equal(await (await fetch(svgDataUri(svg))).text(), svg);
});
