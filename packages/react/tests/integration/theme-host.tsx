import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ThemeProvider,
  useTheme,
} from "@kozmos-ds/react";

function Controls({ id }: { id: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <section data-testid={id}>
      <div
        data-testid={`${id}-surface`}
        className="bg-background text-foreground"
      >
        Surface
      </div>
      <div data-testid={`${id}-variant`} className="kozmos-surface-glass">
        Variant
      </div>
      <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        {id} {resolvedTheme}
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button>{id} overlay</Button>
        </PopoverTrigger>
        <PopoverContent
          data-testid={`${id}-overlay`}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {id} overlay content
        </PopoverContent>
      </Popover>
    </section>
  );
}

function Fixture() {
  const [visible, setVisible] = useState(true);
  return (
    <>
      <button id="unmount" onClick={() => setVisible(false)}>
        Unmount modules
      </button>
      {visible && (
        <>
          <ThemeProvider defaultTheme="dark" dir="rtl">
            <Controls id="dark" />
            <ThemeProvider defaultTheme="light">
              <Controls id="nested-light" />
              <ThemeProvider defaultTheme="dark">
                <Controls id="nested-dark" />
              </ThemeProvider>
            </ThemeProvider>
          </ThemeProvider>
          <ThemeProvider defaultTheme="light">
            <Controls id="light" />
          </ThemeProvider>
          <ThemeProvider defaultTheme="system">
            <Controls id="system" />
          </ThemeProvider>
        </>
      )}
    </>
  );
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
