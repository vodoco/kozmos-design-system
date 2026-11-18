import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { CodeBlock } from "../src/components/CodeBlock/CodeBlock";

// A line far wider than the block, and two short ones under it.
export const LONG_CODE = `{
  "mapStyleUrl": "https://styles.example.com/persona/staff/levels/1/v2026-10-29/style.json",
  "fid": "f-1209"
}`;

// GAP-216: a CodeBlock 240 wide, wrapped or scrolling, with or without a copy.
export function CodeBlockFixture({
  wrap,
  copyable,
}: {
  wrap?: boolean;
  copyable?: boolean;
}) {
  return (
    <ThemeProvider theme="light">
      <div style={{ width: 240 }}>
        <CodeBlock
          label="mergedUnit JSON"
          code={LONG_CODE}
          wrap={wrap}
          copyable={copyable}
        />
      </div>
    </ThemeProvider>
  );
}
