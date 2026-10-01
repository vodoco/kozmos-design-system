import { expect, test } from "@playwright/test";
import { prepareStillPage } from "./stillness";

test("motion is suppressed before a component's first render", async ({
  page,
}) => {
  await prepareStillPage(page);
  await page.route("**/stillness-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><style>
      @keyframes enter { from { transform: scale(.95); } to { transform: scale(1); } }
      #component, #component::before { animation: enter 1s; transition: opacity 1s; caret-color: red; }
      #component::before { content: "arrow"; }
    </style><div id="component">Tooltip</div><script>
      window.firstPaintStyles = [null, "::before"].map(pseudo => {
        const style = getComputedStyle(document.querySelector("#component"), pseudo);
        return { animation: style.animationName, transition: style.transitionDuration, caret: style.caretColor };
      });
    </script>`,
    }),
  );
  await page.goto("/stillness-fixture");
  const firstPaint = await page.evaluate(
    () =>
      (
        window as unknown as {
          firstPaintStyles: {
            animation: string;
            transition: string;
            caret: string;
          }[];
        }
      ).firstPaintStyles,
  );
  expect(firstPaint).toEqual([
    { animation: "none", transition: "0s", caret: "rgba(0, 0, 0, 0)" },
    { animation: "none", transition: "0s", caret: "rgba(0, 0, 0, 0)" },
  ]);
});
