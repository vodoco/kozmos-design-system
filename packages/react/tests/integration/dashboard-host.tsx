import { createRoot } from "react-dom/client";
import { Button, ThemeProvider } from "@kozmos-ds/react";
import { BrandLoader } from "@kozmos-ds/react/dashboard";

/**
 * The Dashboard entry in the built package, for scripts/check-dashboard-css.mjs
 * (decision 183): a BrandLoader in place, light and dark, and one over the
 * page, drawn from @kozmos-ds/react/dashboard with dashboard.css loaded after
 * style.css.
 */
function Host() {
  return (
    <>
      <ThemeProvider defaultTheme="light">
        <BrandLoader data-testid="light" label="Loading Pointr Cloud" />
      </ThemeProvider>
      <ThemeProvider defaultTheme="dark">
        <BrandLoader data-testid="dark" label="Loading Pointr Cloud" />
      </ThemeProvider>
      <ThemeProvider defaultTheme="light">
        <Button data-testid="under">Open</Button>
        <BrandLoader data-testid="overlay" label="Loading" overlay />
      </ThemeProvider>
    </>
  );
}

createRoot(document.getElementById("fixture")!).render(<Host />);
