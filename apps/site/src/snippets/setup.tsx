import "@kozmos-ds/react/style.css";
import type { ReactNode } from "react";
import { ThemeProvider } from "@kozmos-ds/react";

export function App({ children }: { children: ReactNode }) {
  return <ThemeProvider defaultTheme="system">{children}</ThemeProvider>;
}
