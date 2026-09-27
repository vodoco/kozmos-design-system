import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  ThemeProvider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from "@kozmos-ds/react";

function Samples({ prefix }: { prefix: string }) {
  return (
    <>
      <div data-testid={`${prefix}-plain`} className="bg-background">
        Plain
      </div>
      <div data-testid={`${prefix}-alpha`} className="bg-background/90">
        Alpha
      </div>
      <div data-testid={`${prefix}-text`} className="text-foreground/50">
        Text
      </div>
      <div data-testid={`${prefix}-border`} className="border border-border/70">
        Border
      </div>
    </>
  );
}
function Fixture() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  return (
    <>
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Switch theme
      </button>
      <ThemeProvider theme={theme}>
        <Samples prefix="outer" />
        <ThemeProvider
          theme="dark"
          tokens={{
            "--primitives-colors-background-0": "rgba(20, 40, 60, 0.8)",
            "--primitives-colors-foreground-0": "#abcdef",
            "--semantics-border-subtle": "rgb(80, 100, 120)",
          }}
        >
          <Samples prefix="nested" />
          <Popover open>
            <PopoverTrigger asChild>
              <Button>Open alpha portal</Button>
            </PopoverTrigger>
            <PopoverContent>
              <Samples prefix="portal" />
            </PopoverContent>
          </Popover>
        </ThemeProvider>
      </ThemeProvider>
    </>
  );
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
