import { useState } from "react";
import { Box, OTPInput, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function SixDigits() {
  const [code, setCode] = useState("");
  return (
    <Box className="site-demo-column">
      <OTPInput
        label="Verification code"
        helperText="Sent to +44 ••• 2231."
        onChange={setCode}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {code.length === 6 ? "Complete." : `${code.length} of 6 digits`}
      </Text>
    </Box>
  );
}

function FourDigitsWithAnError() {
  return (
    <Box className="site-demo-column">
      <OTPInput
        label="PIN"
        length={4}
        error="That PIN is not right. Two attempts left."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Six digits",
    description:
      "One box per character; typing, pasting and arrow keys move through them.",
    Component: SixDigits,
  },
  { title: "Four digits, with an error", Component: FourDigitsWithAnError },
];
