import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Every story in the Storybook being measured, in the light theme and the
// dark. A story opts out with the tag `no-visual`, and says why beside it.
interface IndexEntry {
  id: string;
  type: string;
  tags?: string[];
}

const index = JSON.parse(
  readFileSync("apps/docs/storybook-static/index.json", "utf8"),
) as { entries: Record<string, IndexEntry> };

const stories = Object.values(index.entries).filter(
  (entry) => entry.type === "story" && !entry.tags?.includes("no-visual"),
);

// One grey pixel for any image from outside the Storybook.
const outsideImage = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN4+P/ffwAJhgPdJDWOdgAAAABJRU5ErkJggg==",
  "base64",
);

// A filled circle on transparent, 48 px, for a taxonomy symbol from Pointr's
// CDN. Kozmos draws those symbols through a CSS mask in the text's colour, so
// the circle shows the slot's size, place and colour — what is Kozmos's — as
// an icon would, where an opaque pixel drew a black square that looked
// broken. The artwork itself is the taxonomy's, not the design system's.
const taxonomySymbol = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAiElEQVR42u2YwQGAMAgDIfvvjDNYtQR79zckiA8TAQAAAH3kR7q1a2ZuMv3ZfDWaf/Lcaxuo7muQifllPZmYX9ZVDEdG21/Sl5n523OOPKGxAWqzt+INEIAABPhXgAzDv0VOaFqAdCsbZNRkLOkf+w2kS08lo1IsO01U1yLU3PDl8d0oAADAaC6m4BE2HCrOxQAAAABJRU5ErkJggg==",
  "base64",
);

for (const story of stories) {
  for (const theme of ["light", "dark"] as const) {
    test(`${story.id} ${theme}`, async ({ page, baseURL }) => {
      // Nothing from outside this Storybook. A remote photo becomes one grey
      // pixel, a taxonomy symbol a circle, and anything else is refused —
      // Google Fonts included, so text is drawn in the image's own fonts,
      // which never update underneath a baseline. A run then depends on no
      // CDN and no map server.
      await page.route("**/*", (route) => {
        const request = route.request();
        if (baseURL && request.url().startsWith(baseURL)) {
          return route.continue();
        }
        if (request.resourceType() === "image") {
          const symbol = /\/taxonomy\/[^/]+\/symbols\//.test(request.url());
          return route.fulfill({
            contentType: "image/png",
            body: symbol ? taxonomySymbol : outsideImage,
          });
        }
        return route.abort();
      });
      // The clock stands still and chance repeats itself, so a date, a
      // relative time or a shuffled list draws the same every run.
      await page.clock.setFixedTime(new Date("2026-01-15T10:30:00Z"));
      await page.addInitScript(() => {
        let seed = 42;
        Math.random = () => {
          seed = (seed * 16807) % 2147483647;
          return (seed - 1) / 2147483646;
        };
      });

      await page.goto(
        `/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`,
      );
      await page.locator("#storybook-root").waitFor({ state: "attached" });
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      // `animations: "disabled"` rewinds most motion but not reliably (the AI
      // search ring was caught mid-turn on 2026-09-23), so the page is
      // stopped outright.
      await page.addStyleTag({
        content: `*, *::before, *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }`,
      });

      // The drawing, not the page: the union of what paints — text, images,
      // SVG and form controls, and boxes with a fill, a border, a shadow or an
      // outline — portals included, with a margin. Layout wrappers paint
      // nothing and do not count; a box as large as the viewport is the
      // canvas, not the drawing, though what paints inside it counts. A small
      // part then gets a small baseline, easy to read in a pull request.
      const clip = await page.evaluate(() => {
        const margin = 8;
        const box = {
          left: Infinity,
          top: Infinity,
          right: -Infinity,
          bottom: -Infinity,
        };
        const add = (rect: DOMRect) => {
          if (rect.width < 1 || rect.height < 1) return;
          box.left = Math.min(box.left, rect.left + scrollX);
          box.top = Math.min(box.top, rect.top + scrollY);
          box.right = Math.max(box.right, rect.right + scrollX);
          box.bottom = Math.max(box.bottom, rect.bottom + scrollY);
        };
        const clear = (colour: string) =>
          colour === "transparent" || /rgba\(.*,\s*0\)$/.test(colour);
        const paints = (element: Element, style: CSSStyleDeclaration) =>
          /^(img|svg|canvas|video|input|textarea|select|iframe)$/i.test(
            element.tagName,
          ) ||
          !clear(style.backgroundColor) ||
          style.backgroundImage !== "none" ||
          style.boxShadow !== "none" ||
          (style.outlineStyle !== "none" &&
            parseFloat(style.outlineWidth) > 0) ||
          ["Top", "Right", "Bottom", "Left"].some(
            (side) =>
              parseFloat(
                style.getPropertyValue(`border-${side.toLowerCase()}-width`),
              ) > 0 &&
              style.getPropertyValue(`border-${side.toLowerCase()}-style`) !==
                "none" &&
              !clear(
                style.getPropertyValue(`border-${side.toLowerCase()}-color`),
              ),
          );
        for (const element of document.body.querySelectorAll("*")) {
          if (element.closest("script, style, noscript, template")) continue;
          const style = getComputedStyle(element);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0"
          )
            continue;
          const rect = element.getBoundingClientRect();
          const canvas = rect.width >= innerWidth && rect.height >= innerHeight;
          if (!canvas && paints(element, style)) add(rect);
        }
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
        );
        const range = document.createRange();
        for (let text = walker.nextNode(); text; text = walker.nextNode()) {
          if (!text.textContent?.trim()) continue;
          const parent = text.parentElement;
          if (!parent || parent.closest("script, style, noscript, template"))
            continue;
          range.selectNodeContents(text);
          for (const rect of range.getClientRects()) add(rect);
        }
        const width = document.documentElement.scrollWidth;
        const height = document.documentElement.scrollHeight;
        if (!Number.isFinite(box.left))
          return { x: 0, y: 0, width: 16, height: 16 };
        const x = Math.max(0, Math.floor(box.left) - margin);
        const y = Math.max(0, Math.floor(box.top) - margin);
        return {
          x,
          y,
          width: Math.max(
            16,
            Math.min(width, Math.ceil(box.right) + margin) - x,
          ),
          height: Math.max(
            16,
            Math.min(height, Math.ceil(box.bottom) + margin) - y,
          ),
        };
      });

      await expect(page).toHaveScreenshot(`${story.id}--${theme}.png`, {
        clip,
        fullPage: true,
        // A map draws with WebGL from tiles this run refused; what it would
        // draw is not the design system's, and not reproducible.
        mask: [page.locator("canvas")],
      });
    });
  }
}
