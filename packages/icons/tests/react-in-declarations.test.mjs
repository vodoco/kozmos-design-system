/**
 * The Vue entry's declarations must reach no React at all: not `react`, not a
 * subpath of it such as `react/jsx-runtime`, not `react-dom`, and not
 * `@kozmos-ds/react`. scripts/roll-vue-declarations.mjs fails the build on
 * what this module finds. These plant each form a declaration file can use.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { reactImportsIn } from "../scripts/react-in-declarations.mjs";

const PLANTED = {
  "import from react": `import { ReactNode } from 'react';\nexport declare const a: ReactNode;`,
  "import from react/jsx-runtime": `import { JSX } from "react/jsx-runtime";\nexport declare const a: JSX.Element;`,
  "namespace import of react": `import * as React_2 from 'react';\nexport declare const a: React_2.ReactNode;`,
  "import type from react-dom": `import type { Root } from "react-dom";\nexport declare const a: Root;`,
  "react-dom/client": `import { Root } from 'react-dom/client';\nexport declare const a: Root;`,
  "an import() type": `export declare const a: import("react").ReactElement;`,
  "a re-export": `export { Fragment } from "react";`,
  "@kozmos-ds/react": `import { Button } from "@kozmos-ds/react";\nexport declare const a: typeof Button;`,
  "a subpath of @kozmos-ds/react": `export type { ButtonProps } from '@kozmos-ds/react/button';`,
  "a reference directive": `/// <reference types="react" />\nexport declare const a: number;`,
  "require()": `import R = require("react");\nexport declare const a: typeof R;`,
  "a module augmentation of react": `declare module "react" {\n  interface CSSProperties { [key: \`--\${string}\`]: string }\n}\nexport {};`,
  "an augmentation of react/jsx-runtime": `declare module 'react/jsx-runtime' {\n  namespace JSX { interface IntrinsicElements { "kozmos-icon": object } }\n}\nexport {};`,
  "an augmentation of @kozmos-ds/react": `declare module "@kozmos-ds/react" {\n  interface ButtonProps { tone?: string }\n}\nexport {};`,
};

for (const [what, text] of Object.entries(PLANTED)) {
  test(`finds React in ${what}`, () => {
    assert.ok(reactImportsIn(text).length > 0, text);
  });
}

test("finds nothing in the Vue entry's own imports", () => {
  const clean = [
    `import { FunctionalComponent } from 'vue';`,
    `import type { SVGAttributes } from "vue";`,
    `export declare const reactive: number; // react, in a word, is not an import`,
    `import { x } from "react-native-svg-ish";`,
    `import { y } from "@kozmos-ds/react-native";`,
    `import { z } from "preact";`,
    `declare module "vue" {\n  interface ComponentCustomProperties { $kozmos: object }\n}`,
    `declare namespace React {}`,
  ].join("\n");
  assert.deepEqual(reactImportsIn(clean), []);
});
