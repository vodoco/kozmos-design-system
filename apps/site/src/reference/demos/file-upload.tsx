import { useState } from "react";
import { Box, FileUpload, Text } from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function FloorPlans() {
  const [count, setCount] = useState(0);
  return (
    <Box className="site-demo-column">
      <FileUpload
        label="Floor plans"
        description="PDF or SVG, up to 10 MB each."
        accept=".pdf,.svg"
        multiple
        maxFiles={5}
        maxSize={10 * 1024 * 1024}
        onFilesChange={(files) => setCount(files.length)}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {count === 0
          ? "Nothing added yet."
          : `${count} file${count === 1 ? "" : "s"} ready.`}
      </Text>
    </Box>
  );
}

function OneFileWithAnError() {
  return (
    <Box className="site-demo-column">
      <FileUpload
        label="Logo"
        accept="image/*"
        error="The file is larger than 2 MB."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Several files",
    description:
      "A dropzone with a browse button; accept, multiple, maxFiles and maxSize constrain it, and the chosen files are listed with a remove button each.",
    Component: FloorPlans,
  },
  { title: "One file, with an error", Component: OneFileWithAnError },
];
