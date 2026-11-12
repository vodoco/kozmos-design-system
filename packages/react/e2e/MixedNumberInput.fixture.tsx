import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { NumberInput } from "../src/components/NumberInput/NumberInput";

/**
 * A property of a multi-selection whose heights differ, as Pointr Cloud's
 * editor holds it (GAP-153): mixed until a number is typed. Every value the
 * field reports is written into the page, so a test reads what a product
 * would have written over every selected feature.
 */
export function MixedNumberInputFixture() {
  const [edit, setEdit] = React.useState<number | null | undefined>(undefined);
  const [reported, setReported] = React.useState<string[]>([]);
  return (
    <ThemeProvider theme="light">
      <div style={{ width: 320 }}>
        <NumberInput
          label="Height"
          mixed={edit === undefined}
          value={edit ?? ""}
          onValueChange={(value) => {
            setReported((previous) => [...previous, String(value)]);
            setEdit(value);
          }}
          onResetMixed={() => setEdit(undefined)}
        />
        <output data-testid="reported">{reported.join(",")}</output>
      </div>
    </ThemeProvider>
  );
}
