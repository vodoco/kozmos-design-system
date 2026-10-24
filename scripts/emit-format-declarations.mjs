import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// API Extractor (via unplugin-dts) rolls the public graph into index.d.ts.
// Its named API is identical in both runtime builds, but TypeScript requires
// independent module-format identities. Never point both conditions at one file.
export function emitFormatDeclarations(directory) {
  const sourcePath = path.join(directory, "index.d.ts");
  const source = fs.readFileSync(sourcePath, "utf8");
  const ast = ts.createSourceFile(
    sourcePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  if (!ts.isExternalModule(ast))
    throw new Error("Expected a module declaration bundle");
  if (ast.referencedFiles.length)
    throw new Error("Declaration bundle contains file references");
  function visit(node) {
    const specifier =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? node.moduleSpecifier
        : ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)
          ? node.argument.literal
          : ts.isExternalModuleReference(node)
            ? node.expression
            : undefined;
    if (
      specifier &&
      ts.isStringLiteral(specifier) &&
      specifier.text.startsWith(".")
    ) {
      throw new Error(
        `Unbundled relative declaration dependency: ${specifier.text}`,
      );
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  // A copied declaration map would point to the wrong extension/file. Bundled
  // declaration output intentionally has no map; retain the legacy .d.ts entry.
  const body = source.replace(/^\/\/# sourceMappingURL=.*$/gm, "");
  for (const extension of ["mts", "cts"]) {
    fs.writeFileSync(path.join(directory, `index.d.${extension}`), body);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  emitFormatDeclarations(path.resolve(process.argv[2] ?? "dist"));
}
