import assert from "node:assert/strict";
import test from "node:test";
import { assignments, renderDocument } from "../lib/code-connect-render.mjs";

// The shape `figma connect parse` gives a React document.
const doc = (body, props = {}, variant) => ({
  component: "Part",
  figmaNode: "https://figma.com/design/x?node-id=1-2",
  variant,
  templateData: {
    props,
    imports: ["import { Part } from '@kozmos-ds/react';"],
  },
  template: `const figma = require('figma')\n${body}`,
});
const enumProp = (name, valueMapping) => ({
  kind: "enum",
  args: { figmaPropName: name, valueMapping },
});

test("each enum value and each boolean is rendered once, around the first values", () => {
  const props = {
    size: enumProp("Size", { Small: "sm", Large: "lg" }),
    on: { kind: "boolean", args: { figmaPropName: "On" } },
  };
  assert.deepEqual(assignments(doc("", props)), [
    { Size: "Small", On: false },
    { Size: "Large", On: false },
    { Size: "Small", On: true },
  ]);
  assert.deepEqual(assignments(doc("", props, { Size: "Large" })), [
    { Size: "Large", On: false },
    { Size: "Large", On: true },
  ]);
});

test("a template renders its properties as Figma substitutes them", () => {
  const rendered = renderDocument(
    doc(
      `const size = figma.currentLayer.__properties__.enum('Size', {"Small": 'sm', "Large": 'lg'})
const on = figma.currentLayer.__properties__.boolean('On')
export default { ...figma.tsx\`<Part size="\${size}" on={\${on}}>\${figma.currentLayer.__properties__.instance('Icon')}</Part>\`, metadata: {} }`,
      { size: enumProp("Size", { Small: "sm", Large: "lg" }) },
    ),
  );
  assert.deepEqual(
    rendered.map((r) => r.code),
    [
      '<Part size="sm" on={false}><></></Part>',
      '<Part size="lg" on={false}><></></Part>',
    ],
  );
});

test("a template that throws in Figma throws here, and says so", () => {
  // POIMediaGallery's, 22 Nov 2026: `${current}` meant for the snippet's own
  // template literal was read by the template's.
  const [rendered] = renderDocument(
    doc(
      "export default figma.tsx`<Part label={(current) => \\`${current}\\`} />`",
    ),
  );
  assert.match(rendered.error, /current is not defined/);
});
