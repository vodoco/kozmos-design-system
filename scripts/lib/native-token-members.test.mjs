import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  KOTLIN_TOKEN_PACKAGE,
  nativeTokenMembers,
  stripCommentsAndStrings,
  tokenMemberReads,
  tokenTypeNames,
} from "./native-token-members.mjs";

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-token-members-"));
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  }
  return root;
}

test("comments and strings hide their braces and declarations", () => {
  const code = stripCommentsAndStrings(
    'let a = "{ public static let fake = 1"\n/* outer /* inner } */ still */ b // { c\n',
  );
  assert.equal(code, 'let a = ""\n b \n');
});

test("only what a caller can reach on the type counts as a member", () => {
  const root = fixture({
    [`${KOTLIN_TOKEN_PACKAGE}/KozmosColors.kt`]: `
package com.kozmos.tokens
object KozmosColors {
  val semanticsSurface0 = Color(0xffffffff)
  const val count: Int = 2
  private fun themed(light: Color): Color = light
  internal val hidden = 1
  val wrapped: Color
      @Composable get() { val inner = 1; return Color.Red }
}
/** object KozmosInComment { } */
val KozmosColors.extra: Color get() = semanticsSurface0
private val KozmosColors.secret: Color get() = semanticsSurface0
`,
    "packages/ios/Sources/KozmosColors.swift": `
public class KozmosColors {
    public static var semanticsSurface0: Color {
        let nestedHelper = 1
        return Color.white
    }
    static let internalOnly: CGFloat = 1
    public var instanceOnly: Int { 1 }
    public enum Role { case a }
}
extension KozmosColors {
    public static let fromExtension = Color.red
}
`,
    "packages/ios/Sources/KozmosMotionLike.swift": `
public enum KozmosColorsShade { case light, dark(Int, Int) }
`,
  });
  try {
    assert.deepEqual([...tokenTypeNames(root)], ["KozmosColors"]);
    const members = nativeTokenMembers(root);
    assert.deepEqual([...members.kotlin.get("KozmosColors").members].sort(), [
      "count",
      "extra",
      "semanticsSurface0",
      "wrapped",
    ]);
    assert.deepEqual([...members.swift.get("KozmosColors").members].sort(), [
      "Role",
      "fromExtension",
      "semanticsSurface0",
    ]);
    assert.deepEqual(
      [...members.swift.get("KozmosColors").files],
      ["packages/ios/Sources/KozmosColors.swift"],
    );
    const cases = nativeTokenMembers(root, new Set(["KozmosColorsShade"]));
    assert.deepEqual([...cases.swift.get("KozmosColorsShade").members].sort(), [
      "dark",
      "light",
    ]);
  } finally {
    fs.rmSync(root, { recursive: true });
  }
});

test("reads name the type, the member and the line, and no longer type", () => {
  const reads = tokenMemberReads(
    "Text(title)\n  .foregroundColor(KozmosColors.semanticColorTextDefault)\nlet d = KozmosColorsDark.x\nKozmosColors\n  .wrapped",
    new Set(["KozmosColors"]),
  );
  assert.deepEqual(reads, [
    { type: "KozmosColors", member: "semanticColorTextDefault", line: 1 },
    { type: "KozmosColors", member: "wrapped", line: 3 },
  ]);
});
