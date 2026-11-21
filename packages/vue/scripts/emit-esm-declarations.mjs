// The ES entries' declarations. Beside a package.json with no "type", every
// .d.ts is read as CommonJS, so the `import` condition, which resolves to
// .mjs, needs a .d.mts of its own or TypeScript under node16 and nodenext
// types an ES import as CommonJS (arethetypeswrong's "Masquerading as CJS",
// which test:release:packages fails). vue-tsc emits a tree of declarations,
// not one bundle, so each ES entry's .d.mts re-exports its .d.ts rather than
// copying it (as ../../scripts/emit-format-declarations.mjs does for a bundle):
// a copy's relative imports would name CommonJS declarations from ESM ones.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
for (const entry of ["index", "react-bridge/index"]) {
  const declaration = path.join(dist, `${entry}.d.ts`);
  if (!fs.existsSync(declaration))
    throw new Error(`No ${path.relative(dist, declaration)}: build first`);
  fs.writeFileSync(
    path.join(dist, `${entry}.d.mts`),
    'export * from "./index.js";\n',
  );
}
