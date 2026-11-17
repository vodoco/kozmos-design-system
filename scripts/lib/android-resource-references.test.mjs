import assert from "node:assert/strict";
import { test } from "node:test";
import {
  declaredIn,
  pixelDimensions,
  referencedIn,
  unitlessLengths,
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

test("a length written as an integer, a string or a float is found, and a dimen in dp or sp is not: decision 206", () => {
  const found = unitlessLengths(
    xml(`  <integer name="primitives_layout_spacing_200">16</integer>
  <string name="primitives_typography_font_size_300">16</string>
  <item name="semantics_effect_glass_blur" type="dimen" format="float">20</item>
  <string name="components_html_elements_headings_h1_letter_spacing">-0.4</string>
  <integer name="semantics_motion_slide_sm">4</integer>
  <dimen name="primitives_layout_radius_200">16dp</dimen>
  <dimen name="primitives_typography_line_height_200">22sp</dimen>
  <dimen name="semantics_radius_control">@dimen/primitives_layout_radius_200</dimen>
  <integer name="primitives_layer_10">10</integer>
  <string name="primitives_typography_font_family_primary">Readex Pro</string>`),
  );
  assert.deepEqual(
    found.map(({ name, tag, line }) => [name, tag, line]),
    [
      ["primitives_layout_spacing_200", "integer", 3],
      ["primitives_typography_font_size_300", "string", 4],
      ["semantics_effect_glass_blur", "item (float)", 5],
      ["components_html_elements_headings_h1_letter_spacing", "string", 6],
      ["semantics_motion_slide_sm", "integer", 7],
    ],
  );
});
