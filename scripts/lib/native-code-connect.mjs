// What a native Code Connect snippet names, checked against the platform's own
// sources. Used by scripts/check-native-code-connect.mjs; tested in
// scripts/ci/native-code-connect.test.mjs.

/** Top-level Kotlin declarations in one file, as `package.Name`. */
export function kotlinDeclarations(text) {
  const pkg = text.match(/^package\s+([\w.]+)/m)?.[1];
  if (!pkg) return [];
  const declaration =
    /^(?:@[\w.]+(?:\([^)]*\))?\s+)*(?:(?:public|internal|private|inline|data|sealed|enum|value|annotation|abstract|open|operator|infix|tailrec|suspend|const|lateinit)\s+)*(?:fun|class|object|interface|val|var|typealias)\s+(?:<[^>]*>\s*)?(?:[A-Za-z_][\w.]*\.)?([A-Za-z_]\w*)/gm;
  return [...text.matchAll(declaration)].map((match) => `${pkg}.${match[1]}`);
}

/** Swift types and functions declared in one file, by name. */
export function swiftDeclarations(text) {
  const declaration =
    /^\s*(?:@\w+(?:\([^)]*\))?\s+)*(?:(?:public|internal|private|fileprivate|open|final|static|indirect)\s+)*(?:struct|class|enum|protocol|actor|typealias|func)\s+([A-Za-z_]\w*)/gm;
  return [...text.matchAll(declaration)].map((match) => match[1]);
}

/**
 * The problems in a parse's docs: each a `{ doc, message }`.
 *
 * Compose: every `com.kozmos.` import a snippet shows must be declared. The
 * parser takes a snippet's first call as its component and imports it; with
 * no call it imports the enclosing function's name from any included file
 * that declares one.
 *
 * SwiftUI: every snippet's component must be declared; the parser writes a
 * generic type with its arguments (`KozmosDialog<EmptyView>`).
 */
export function nativeCodeConnectProblems(platform, docs, declared) {
  const problems = [];
  for (const doc of docs) {
    if (platform === "android") {
      for (const line of doc.templateData?.imports ?? []) {
        const name = line.replace(/^import\s+/, "").trim();
        if (name.startsWith("com.kozmos.") && !declared.has(name)) {
          problems.push({
            doc,
            message: `imports ${name}, which nothing declares`,
          });
        }
      }
    } else {
      const component = (doc.component ?? "").replace(/<.*$/s, "");
      if (!declared.has(component)) {
        problems.push({
          doc,
          message: `${component || "(no component)"}: no type or function of that name in packages/ios/Sources`,
        });
      }
    }
  }
  return problems;
}
