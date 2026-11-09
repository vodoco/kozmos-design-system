import assert from "node:assert/strict";
import { test } from "node:test";
import {
  declaredIn,
  pixelDimensions,
  referencedIn,
  unresolvedReferences,
} from "./android-resource-references.mjs";

const xml = (body) => `<?xml version="1.0" encoding="UTF-8"?>\n<resources>\n${body}\n</resources>\n`;

test("a typed item is declared as its type, and an untyped item as nothing", () => {
  const names = declaredIn(
    xml(`  <dimen name="a">4dp</dimen>
  <item name="b" type="dimen" format="float">0.5</item>
  <integer name="c">16</integer>
  <color name="d">#ff000000</color>
  <item name="e">1</item>`),
  );
  assert.deepEqual([...names].sort(), ["color/d", "dimen/a", "dimen/b", "integer/c"]);
});

test("references are read with their lines, and the framework's are not", () => {
  const refs = referencedIn(
    xml(`  <dimen name="a">@dimen/b</dimen>
  <color name="c">@android:color/white</color>`),
  );
  assert.deepEqual(refs, [{ ref: "dimen/b", line: 3 }]);
});

test("a dimen that names an integer names nothing: the 13 Sep radii", () => {
  const missing = unresolvedReferences({
    values: [
      {
        file: "values/colors.xml",
        xml: xml(`  <integer name="primitives_layout_radius_200">16</integer>
  <dimen name="semantics_radius_control">@dimen/primitives_layout_radius_200</dimen>`),
      },
    ],
  });
  assert.deepEqual(missing, [
    { file: "values/colors.xml", line: 4, ref: "dimen/primitives_layout_radius_200" },
  ]);
});

test("a reference resolves against its own folder and then values, never another folder", () => {
  const missing = unresolvedReferences({
    values: [{ file: "values/a.xml", xml: xml(`  <dimen name="base">4dp</dimen>\n  <dimen name="x">@dimen/night_only</dimen>`) }],
    "values-night": [
      { file: "values-night/a.xml", xml: xml(`  <dimen name="night_only">2dp</dimen>\n  <dimen name="y">@dimen/base</dimen>`) },
    ],
  });
  assert.deepEqual(missing, [{ file: "values/a.xml", line: 4, ref: "dimen/night_only" }]);
});

test("a resolved file reports nothing", () => {
  assert.deepEqual(
    unresolvedReferences({
      values: [{ file: "values/a.xml", xml: xml(`  <dimen name="a">16dp</dimen>\n  <dimen name="b">@dimen/a</dimen>`) }],
    }),
    [],
  );
});

test("a dimen written in px is found, and dp, sp and references are not: the 9 Nov touch sizes", () => {
  const found = pixelDimensions(
    xml(`  <dimen name="primitives_touch_min">44px</dimen>
  <item name="b" type="dimen">2px</item>
  <dimen name="c">44dp</dimen>
  <dimen name="d">14sp</dimen>
  <dimen name="e">@dimen/c</dimen>
  <string name="f">4px</string>`),
  );
  assert.deepEqual(found, [
    { name: "primitives_touch_min", value: "44px", line: 3 },
    { name: "b", value: "2px", line: 4 },
  ]);
});
