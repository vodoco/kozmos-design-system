/**
 * Every React module a declaration file reaches: `react` and its subpaths
 * (`react/jsx-runtime`), `react-dom` and its subpaths, and `@kozmos-ds/react`
 * and its subpaths. roll-vue-declarations.mjs fails the build on any of them,
 * since the Vue entry's types must not need React installed.
 *
 * It reads the file's syntax, not its text, so it sees each way a declaration
 * names a module: an import or export declaration, an `import()` type,
 * `import x = require()`, and a `/// <reference types>` directive. Until
 * 5 Nov it matched the text `from 'react'` alone, and a `react/jsx-runtime`
 * import passed it.
 */
import ts from "typescript";

const REACT = /^(react|react-dom|@kozmos-ds\/react)(\/.*)?$/;

export function reactImportsIn(text, fileName = "index.d.ts") {
  const source = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  const found = [];
  const check = (specifier) => {
    if (REACT.test(specifier)) found.push(specifier);
  };
  for (const reference of source.typeReferenceDirectives) {
    check(reference.fileName);
  }
  const visit = (node) => {
    const specifier =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? node.moduleSpecifier
        : ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)
          ? node.argument.literal
          : ts.isExternalModuleReference(node)
            ? node.expression
            : undefined;
    if (specifier && ts.isStringLiteral(specifier)) check(specifier.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}
