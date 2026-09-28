import type { ReactNode } from "react";
import { Button, ThemeProvider, useTheme } from "@kozmos-ds/react";

export function App({ children }: { children: ReactNode }) {
  // Follows the system until someone chooses; the choice is kept under a
  // storage key your product owns.
  return (
    <ThemeProvider defaultTheme="system" storageKey="my-product-theme">
      {children}
    </ThemeProvider>
  );
}

export function DarkModeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return <Button onClick={() => setTheme(next)}>Use the {next} theme</Button>;
}
