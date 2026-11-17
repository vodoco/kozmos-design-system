import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kotlinDeclarations,
  nativeCodeConnectProblems,
  swiftDeclarations,
} from "../lib/native-code-connect.mjs";

const composeDoc = (component, imports) => ({
  figmaNode: "https://figma.com/design/x?node-id=1-1",
  component,
  templateData: { imports },
});

test("Kotlin declarations: top-level functions, classes, objects and values, by package", () => {
  const text = `package com.kozmos.components.icon

@Composable
fun KozmosIcon(name: String) {}
internal data class IconSpec(val name: String)
object KozmosIcons
private const val Size = 24
fun Modifier.kozmosIconSize(): Modifier = this
`;
  assert.deepEqual(kotlinDeclarations(text).sort(), [
    "com.kozmos.components.icon.IconSpec",
    "com.kozmos.components.icon.KozmosIcon",
    "com.kozmos.components.icon.KozmosIcons",
    "com.kozmos.components.icon.Size",
    "com.kozmos.components.icon.kozmosIconSize",
  ]);
});

test("Compose: an import of a declared Kozmos name passes, and androidx imports are not Kozmos's to check", () => {
  const declared = new Set(["com.kozmos.components.icon.KozmosIcon"]);
  const docs = [
    composeDoc("KozmosIcon", ["import com.kozmos.components.icon.KozmosIcon"]),
    composeDoc("Spacer", ["import androidx.compose.foundation.layout.Spacer"]),
    composeDoc("Icon", []),
  ];
  assert.deepEqual(nativeCodeConnectProblems("android", docs, declared), []);
});

test("Compose: a comment-only body's fallback import of the function's own name fails (17 Nov 2026)", () => {
  const declared = new Set(["com.kozmos.components.feedbackcard.KozmosFeedbackCard"]);
  const doc = composeDoc("ComponentExample", [
    "import com.kozmos.components.feedbackcard.ComponentExample",
  ]);
  const problems = nativeCodeConnectProblems("android", [doc], declared);
  assert.equal(problems.length, 1);
  assert.match(
    problems[0].message,
    /com\.kozmos\.components\.feedbackcard\.ComponentExample, which nothing declares/,
  );
});

test("Swift declarations: types and functions by name, with modifiers and attributes", () => {
  const text = `public struct KozmosDialog<Content: View>: View {}
@MainActor public final class KozmosToaster {}
enum KozmosTone { case info }
public func kozmosToast(_ title: String) {}
`;
  assert.deepEqual(swiftDeclarations(text).sort(), [
    "KozmosDialog",
    "KozmosToaster",
    "KozmosTone",
    "kozmosToast",
  ]);
});

test("SwiftUI: a generic component is checked by its name, and an undeclared one fails", () => {
  const declared = new Set(["KozmosDialog", "KozmosIcon"]);
  const docs = [
    { figmaNode: "n?node-id=1-1", component: "KozmosDialog<EmptyView>" },
    { figmaNode: "n?node-id=1-2", component: "KozmosIcon" },
    { figmaNode: "n?node-id=1-3", component: "KozmosIconMissing" },
  ];
  const problems = nativeCodeConnectProblems("ios", docs, declared);
  assert.deepEqual(
    problems.map((p) => p.doc.component),
    ["KozmosIconMissing"],
  );
});
