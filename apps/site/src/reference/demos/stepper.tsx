import { useState } from "react";
import { Box, Button, Stack, Stepper } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

const steps = ["Details", "Floors", "Places", "Review"];

function Interactive() {
  const [current, setCurrent] = useState(1);
  return (
    <Box className="site-demo-wide">
      <Stepper steps={steps} currentStep={current} />
      <Stack direction="row" gap={2}>
        <Button
          variant="outline"
          size="sm"
          disabled={current === 0}
          onClick={() => setCurrent((v) => v - 1)}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={current === steps.length - 1}
          onClick={() => setCurrent((v) => v + 1)}
        >
          Next
        </Button>
      </Stack>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Four steps",
    description:
      "steps and a zero-based currentStep: done, current and upcoming are drawn differently.",
    Component: Interactive,
  },
];
