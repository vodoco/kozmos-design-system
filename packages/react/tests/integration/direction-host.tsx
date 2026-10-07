import { createRoot } from "react-dom/client";
import { Progress, ThemeProvider } from "@kozmos-ds/react";

// The real components check-direction-rules.mjs measures in both directions.
createRoot(document.getElementById("root")!).render(
  <>
    {(["ltr", "rtl"] as const).map((dir) => (
      <ThemeProvider key={dir} dir={dir} defaultTheme="light">
        <div data-direction={dir} style={{ width: 300, padding: 8 }}>
          <Progress value={30} aria-label={`Progress ${dir}`} />
        </div>
      </ThemeProvider>
    ))}
  </>,
);
