// Controls for scripts/check-ios-line-spacing.mjs: each shape of a line
// spacing SwiftUI may not draw, beside the forms it accepts.
import assert from "node:assert/strict";
import test from "node:test";
import {
  declaredSpacings,
  lineSpacingCalls,
  refusal,
  testedSpacings,
} from "../check-ios-line-spacing.mjs";

test("it reads every .lineSpacing argument, and none in a comment or string", () => {
  const source = `
    Text(a).lineSpacing(KozmosTypography.footnoteOn16ptLineSpacing)
    // Text(b).lineSpacing(-9)
    let s = ".lineSpacing(-9)"
    Text(c)
        .lineSpacing(max(0, 14 - font.lineHeight))
  `;
  assert.deepEqual(
    lineSpacingCalls(source).map((call) => call.argument),
    [
      "KozmosTypography.footnoteOn16ptLineSpacing",
      "max(0, 14 - font.lineHeight)",
    ],
  );
});

test("a negative number is refused, zero and a positive one are not", () => {
  assert.match(refusal("-2"), /negative line spacing/);
  assert.match(refusal("- 0.5"), /negative line spacing/);
  assert.equal(refusal("0"), null);
  assert.equal(refusal("4"), null);
});

test("KozmosTypography's spacings pass, anything worked out at the call does not", () => {
  assert.equal(refusal("KozmosTypography.caption2On14ptLineSpacing"), null);
  assert.match(refusal("16 - font.lineHeight"), /not one of KozmosTypography/);
  assert.match(refusal("spacing"), /not one of KozmosTypography/);
  assert.match(
    refusal("KozmosTypography.footnote"),
    /not one of KozmosTypography/,
  );
});

test("the declared spacings, and those the test draws by their own value", () => {
  assert.deepEqual(
    declaredSpacings(`
      static let caption2On14ptLineSpacing: CGFloat = { 0 }()
      // static let oldLineSpacing: CGFloat = 0
      static var displayOn54ptLineSpacing: CGFloat { -3 }
    `),
    ["caption2On14ptLineSpacing", "displayOn54ptLineSpacing"],
  );
  assert.deepEqual(
    testedSpacings(`
      Spacing(name: "caption2On14ptLineSpacing", style: .caption2, font: f,
              value: KozmosTypography.caption2On14ptLineSpacing),
      Spacing(name: "footnoteOn16ptLineSpacing", style: .footnote, font: f,
              value: KozmosTypography.caption2On14ptLineSpacing),
    `),
    ["caption2On14ptLineSpacing"],
  );
});
