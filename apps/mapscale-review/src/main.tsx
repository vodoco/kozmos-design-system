import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@kozmos-ds/react";
import "@kozmos-ds/react/dist/style.css";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="mapscale-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
);
