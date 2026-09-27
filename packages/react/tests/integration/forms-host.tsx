import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Input,
  Textarea,
  ThemeProvider,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kozmos-ds/react";

function Fields({ id }: { id: string }) {
  return (
    <section data-testid={id} style={{ width: 220 }}>
      <div
        data-testid={`${id}-surface`}
        style={{ background: "var(--primitives-colors-background-0)" }}
      >
        Reference surface
      </div>
      <Input label={`${id} name`} data-testid={`${id}-input`} />
      <Textarea label={`${id} notes`} data-testid={`${id}-textarea`} />
    </section>
  );
}

function Fixture() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  return (
    <>
      <ThemeProvider theme={theme} onThemeChange={setTheme}>
        <Fields id="outer" />
        <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          Toggle outer theme
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Open form</Button>
          </PopoverTrigger>
          <PopoverContent>
            <Fields id="portal" />
          </PopoverContent>
        </Popover>
        <ThemeProvider defaultTheme="light">
          <Fields id="nested-light" />
        </ThemeProvider>
      </ThemeProvider>
      <ThemeProvider defaultTheme="light">
        <Fields id="sibling-light" />
      </ThemeProvider>
    </>
  );
}

createRoot(document.getElementById("fixture")!).render(<Fixture />);
