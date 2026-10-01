import type { Page } from "@playwright/test";

export const stillStyles = `*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}`;

export async function prepareStillPage(page: Page) {
  // Install before application code can start an entrance animation. Stopping
  // it after rendering can retain an SVG rasterized at an intermediate scale,
  // even when the final geometry and two successive screenshots are stable.
  await page.addInitScript((css) => {
    const install = () => {
      if (!document.documentElement) return false;
      const style = document.createElement("style");
      style.textContent = css;
      document.documentElement.append(style);
      return true;
    };
    if (install()) return;
    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });
    observer.observe(document, { childList: true });
  }, stillStyles);
}
