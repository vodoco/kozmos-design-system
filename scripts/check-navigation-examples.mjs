/**
 * The navigation parts, measured in a real browser against the Storybook
 * build: the manoeuvre card closed and open, the itinerary, the rail, the
 * summary's navigation layout, and the Examples/Navigation composition on
 * the shell. Every claim the components make about geometry is checked as
 * a number, and every story is run through axe.
 *
 *   STORYBOOK_URL=http://127.0.0.1:6012 node scripts/check-navigation-examples.mjs
 *   ADAPTIVE_BROWSER=firefox|webkit for the other engines.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const engine = process.env.ADAPTIVE_BROWSER ?? "chromium";
const output = path.resolve("test-results/navigation-examples", engine);
fs.mkdirSync(output, { recursive: true });

const box = (locator) =>
  locator.evaluate((node) => {
    const r = node.getBoundingClientRect();
    return {
      x: r.left,
      y: r.top,
      width: r.width,
      height: r.height,
      bottom: r.bottom,
      right: r.right,
    };
  });

/**
 * What has focus, as a keyboard and a screen reader meet it: its name, its
 * role, whether it is hidden from assistive technology or out of the tab
 * order, whether it still exists, and whether it draws the keyboard's ring.
 */
const focusState = (page) =>
  page.evaluate(() => {
    const node = document.activeElement;
    return {
      tag: node?.tagName ?? null,
      role:
        node?.getAttribute("role") ??
        (node?.tagName === "BUTTON" ? "button" : null),
      name: node?.getAttribute("aria-label") ?? null,
      hidden: Boolean(node?.closest('[aria-hidden="true"]')),
      tabbable: node ? node.tabIndex >= 0 : false,
      connected: node?.isConnected ?? false,
      ring:
        node && node !== document.body ? node.matches(":focus-visible") : false,
    };
  });

/**
 * Records, in the page, what had focus at each click, before the card's own
 * handler runs: the part the click came from decides whether focus moves.
 */
const recordFocusAtClick = (page) =>
  page.evaluate(() => {
    window.__focusAtClick = [];
    document.addEventListener(
      "click",
      () => {
        const node = document.activeElement;
        window.__focusAtClick.push({
          name: node?.getAttribute("aria-label") ?? null,
          tag: node?.tagName ?? null,
          inItinerary: Boolean(node?.closest(".kozmos-manoeuvre-itinerary")),
        });
      },
      true,
    );
  });

/** The Examples/Navigation phone stories' manoeuvres: US1-Escalator, US1-DE-Turn, US1-JA-Turn. */
const englishInstruction =
  "Take the escalator near Fountain Court up to Level 1, then keep to the right";
const germanInstruction =
  "Biegen Sie bei Marlow Apotheke auf der linken Seite rechts ab";
const japaneseInstruction =
  "ファウンテンコート近くのエスカレーターでレベル1へ上がり、右側を進んでください";

const results = [];
for (const theme of ["light", "dark"]) {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 1280, height: 800 },
  ]) {
    // These fixtures are independent. Bound browser-process lifetime to one
    // theme/viewport batch, as test-runner workers do, rather than accumulating
    // dozens of destroyed Storybook contexts in one native WebKit process.
    // No failed fixture is retried and every batch must pass its full checks.
    const browser = await launchFixtureBrowser();
    try {
      const open = async (id) => {
        const context = await browser.newContext({
          viewport,
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const pending = new Set();
        page.on("request", (request) => pending.add(request.url()));
        page.on("requestfinished", (request) => pending.delete(request.url()));
        page.on("requestfailed", (request) => pending.delete(request.url()));
        try {
          await page.goto(
            `${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
          );
        } catch (error) {
          fs.writeFileSync(
            path.join(
              output,
              `${id}-${theme}-${viewport.width}-navigation.json`,
            ),
            JSON.stringify(
              {
                url: page.url(),
                pending: [...pending],
                errors,
                error: error.message,
              },
              null,
              2,
            ),
          );
          await context.close();
          throw error;
        }
        return { context, page, errors };
      };
      const finish = async ({ context, page, errors }, name, checks) => {
        const record = {
          name: `${name}-${theme}-${viewport.width}`,
          status: "pending",
          violations: [],
        };
        try {
          await checks(page);
          const axe = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          record.violations = axe.violations.map(
            (v) =>
              `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
          );
          assert.deepEqual(
            record.violations,
            [],
            `${record.name}: axe violations`,
          );
          assert.deepEqual(errors, [], `${record.name}: page errors`);
          record.status = "ok";
        } catch (error) {
          record.status = `FAIL ${error.message}`;
          console.error(`${record.name}: ${error.stack ?? error.message}`);
        } finally {
          await page.screenshot({
            path: path.join(output, `${record.name}.png`),
            fullPage: true,
          });
          await context.close();
        }
        results.push(record);
        console.log(
          `${record.status === "ok" ? "  ok   " : "  FAIL "} ${record.name}`,
        );
      };

      for (const variant of [
        "hosted",
        "actual-metrics",
        "pending",
        "zero-duration",
        "long-destination",
        "missing-image",
        "arabic",
      ]) {
        await finish(
          await open(`map-arrivalpanel--${variant}`),
          `arrival-${variant}`,
          async (page) => {
            const panel = page.locator(".kozmos-arrival-panel");
            await panel.waitFor();
            const done = panel.getByRole("button");
            assert.equal(await done.count(), 1);
            assert.equal(await done.isDisabled(), variant === "pending");
            const outer = await box(panel);
            const action = await box(done);
            assert.ok(
              Math.abs(action.width - outer.width) <= 1,
              "Done must fill the hosted panel",
            );
            assert.ok(action.height >= 44, "Done target must be at least 44px");
            assert.equal(
              await panel.locator("[aria-live]").count(),
              0,
              "The host owns arrival announcements",
            );
            if (variant === "hosted")
              assert.equal(await panel.locator("dl").count(), 0);
            if (variant === "zero-duration")
              assert.equal(
                await panel.getByText("0 min", { exact: true }).count(),
                1,
              );
            if (variant === "missing-image")
              await panel
                .locator('[data-destination-media="fallback"]')
                .waitFor();
            await page.evaluate(() => {
              document.documentElement.style.fontSize = "200%";
            });
            const overflow = await panel.evaluate(
              (node) => node.scrollWidth - node.clientWidth,
            );
            assert.ok(
              overflow <= 1,
              `Arrival text overflows by ${overflow}px at 200%`,
            );
            assert.ok(
              (await box(done)).bottom <= (await box(panel)).bottom + 1,
              "Done must remain inside the growing content",
            );
          },
        );
      }

      // Ordered fragments remain one sentence at narrow/large-text sizes. A
      // flattened aria-label would erase the landmark's speech language.
      for (const fixture of [
        {
          story: "map-manoeuvrecard--german-parts",
          name: "german-parts",
          landmark: "Marlow Pharmacy",
          glass: false,
        },
        {
          story: "map-manoeuvrecard--japanese-parts",
          name: "japanese-parts",
          landmark: "Bean & Leaf Café",
          glass: false,
        },
        {
          story: "map-manoeuvrecard--arabic-parts",
          name: "arabic-parts",
          landmark: "Lumen Books",
          glass: false,
        },
        {
          story: "map-manoeuvrecard--glass-parts",
          name: "glass-parts",
          landmark: "Marlow Pharmacy",
          glass: true,
        },
        {
          story: "map-directionstep--instruction-parts",
          name: "direction-parts",
          landmark: "Bean & Leaf Café",
          step: true,
        },
      ]) {
        await finish(await open(fixture.story), fixture.name, async (page) => {
          const landmark = page
            .locator('span[lang="en"]')
            .filter({ hasText: fixture.landmark });
          await landmark.waitFor({ timeout: 60000 });
          if (viewport.width === 320)
            await page.evaluate(() => {
              document.documentElement.style.fontSize = "200%";
            });
          const styles = await landmark.evaluate((node) => {
            const sentence = node.parentElement;
            const secondary = sentence.querySelector(".kozmos-muted-text");
            const primaryStyle = getComputedStyle(node),
              secondaryStyle = getComputedStyle(secondary);
            return {
              size: primaryStyle.fontSize,
              secondarySize: secondaryStyle.fontSize,
              color: primaryStyle.color,
              secondaryColor: secondaryStyle.color,
              weight: secondaryStyle.fontWeight,
              wording: sentence.textContent,
              parts: [...sentence.children]
                .map((part) => part.textContent)
                .join(""),
              overflowing: document.documentElement.scrollWidth > innerWidth,
            };
          });
          assert.equal(
            styles.wording,
            styles.parts,
            "no inserted separator or reordered fragment",
          );
          assert.equal(
            styles.size,
            styles.secondarySize,
            "qualifiers retain the sentence's size",
          );
          assert.equal(styles.weight, "400", "qualifiers use regular weight");
          if (fixture.glass || !fixture.step)
            assert.equal(
              styles.secondaryColor,
              styles.color,
              "theme guidance and background glass keep full-contrast foreground",
            );
          else
            assert.notEqual(
              styles.secondaryColor,
              styles.color,
              "solid surfaces visually de-emphasise qualifiers",
            );
          assert.equal(
            styles.overflowing,
            false,
            "large mixed-script instructions wrap inside the host",
          );
          if (!fixture.step) {
            const trigger = landmark.locator("xpath=ancestor::button");
            assert.equal(await trigger.getAttribute("aria-label"), null);
            await trigger.focus();
            await page.keyboard.press("Enter");
            const itinerary = page.locator(".kozmos-manoeuvre-itinerary");
            await itinerary.waitFor();
            assert.equal(
              await itinerary.evaluate((node) =>
                node.contains(document.activeElement),
              ),
              true,
            );
            assert.equal(
              await itinerary.locator('[lang="en"]').textContent(),
              fixture.landmark,
            );
            const close = page.getByRole("button", { name: "Hide itinerary" });
            await close.focus();
            await page.keyboard.press("Enter");
            await itinerary.waitFor({ state: "hidden" });
            assert.equal(
              await landmark
                .locator("xpath=ancestor::button")
                .evaluate((node) => node === document.activeElement),
              true,
            );
          }
        });
      }

      for (const glass of [false, true]) {
        await finish(
          await open(`map-manoeuvrecard--background${glass ? "-glass" : ""}`),
          `card-background${glass ? "-glass" : ""}`,
          async (page) => {
            const card = page.getByRole("region", {
              name: "Current manoeuvre",
            });
            await card.waitFor();
            assert.equal(
              await card.getAttribute("data-appearance"),
              "background",
            );
            assert.ok(
              (await card.getAttribute("class")).includes(
                `kozmos-surface-${glass ? "glass" : "solid"}`,
              ),
            );
            await card.getByRole("button").click();
            await card
              .getByRole("region", { name: "Itinerary", exact: true })
              .waitFor();
            await card.getByRole("button", { name: "Hide itinerary" }).click();
          },
        );
      }

      // 1. The card, closed: one button that reads the manoeuvre; the grab bar silent.
      await finish(
        await open("map-manoeuvrecard--closed"),
        "card-closed",
        async (page) => {
          const card = page.getByRole("region", { name: "Current manoeuvre" });
          await card.waitFor({ timeout: 60000 });
          const manoeuvre = card.getByRole("button", {
            name: "Take Elevator down to First Floor, 58 m · Second Floor",
          });
          await manoeuvre.waitFor();
          assert.equal(await manoeuvre.getAttribute("aria-expanded"), "false");
          assert.equal(
            await card.getByRole("list").count(),
            0,
            "the closed card shows its itinerary",
          );
          const bar = card.locator('[aria-label="Show itinerary"]');
          assert.ok(
            (await box(bar)).height >= 44,
            "the disclosure target is under 44px",
          );
          assert.equal(await card.getAttribute("data-appearance"), "theme");
          const palette = await card.evaluate((node) => {
            const probe = document.createElement("span");
            probe.style.backgroundColor = "var(--primitives-colors-theme-600)";
            probe.style.color = "var(--primitives-colors-foreground-1000)";
            node.append(probe);
            const expected = getComputedStyle(probe);
            const actual = getComputedStyle(node);
            const result = {
              fill: actual.backgroundColor,
              foreground: actual.color,
              expectedFill: expected.backgroundColor,
              expectedForeground: expected.color,
            };
            probe.remove();
            return result;
          });
          assert.equal(
            palette.fill,
            palette.expectedFill,
            "guidance uses the opaque theme fill",
          );
          assert.equal(
            palette.foreground,
            palette.expectedForeground,
            "guidance uses its paired contrasting foreground",
          );
          assert.equal(
            await bar.getAttribute("aria-hidden"),
            "true",
            "the closed grab bar is not silent",
          );
          const arrow = await box(manoeuvre.locator("svg"));
          const text = await box(
            manoeuvre.getByText("Take Elevator down to First Floor", {
              exact: true,
            }),
          );
          assert.ok(
            arrow.right <= text.x + 1,
            "the arrow is not before the instruction",
          );
          // Opening: the itinerary appears, with exactly one current step, and
          // the card hugs it — no taller than its list plus the chrome.
          await manoeuvre.click();
          const itinerary = page.getByRole("region", { name: "Itinerary" });
          await itinerary.waitFor();
          const current = itinerary.locator('[aria-current="step"]');
          assert.equal(await current.count(), 1, "steps reading as current");
          assert.equal(
            await current.textContent(),
            "Take Elevator down to First Floor",
          );
          const list = await box(itinerary.getByRole("list"));
          // The card and the nested itinerary keep distinct names in both states.
          assert.equal(
            await card.count(),
            1,
            "the open card lost its container name",
          );
          assert.equal(
            await card
              .getByRole("region", { name: "Itinerary", exact: true })
              .count(),
            1,
          );
          const cardBox = await box(page.locator(".kozmos-manoeuvre-card"));
          const bar2 = page.getByRole("button", { name: "Hide itinerary" });
          const barBox = await box(bar2);
          assert.ok(
            barBox.height >= 44,
            "the open disclosure target is under 44px",
          );
          // The interactive target is now 44px, rather than the old 13px grip.
          // Check the remaining chrome separately so an inflated card cannot hide here.
          assert.ok(
            cardBox.height - list.height - barBox.height < 47,
            `the open card does not hug its itinerary: card ${cardBox.height}, list ${list.height}, target ${barBox.height}`,
          );
          assert.equal(await bar2.getAttribute("aria-expanded"), "true");
          await bar2.click();
          await manoeuvre.waitFor();
        },
      );

      // 2. The card, open with a long instruction story as the cap check is
      //    not reachable from a story: the Open story's list is short. The cap
      //    is asserted through the style the component sets.
      await finish(
        await open("map-manoeuvrecard--open"),
        "card-open",
        async (page) => {
          const itinerary = page.getByRole("region", { name: "Itinerary" });
          await itinerary.waitFor({ timeout: 60000 });
          // The scroller holds the itinerary, not the other way round.
          const scroller = page.locator(".kozmos-manoeuvre-itinerary");
          assert.equal(
            await scroller.evaluate((n) => n.style.maxHeight),
            "320px",
            "the itinerary is not capped",
          );
          assert.equal(
            await scroller.evaluate((n) => getComputedStyle(n).overflowY),
            "auto",
            "the itinerary cannot scroll past the cap",
          );
        },
      );

      // GAP-109: the card owns a landmark even without the Itinerary component.
      await finish(
        await open("map-manoeuvrecard--custom-content"),
        "card-custom-content",
        async (page) => {
          await page
            .getByText("Continue to the gate")
            .waitFor({ timeout: 60000 });
          const card = page.getByRole("region", {
            name: "Navigation en cours",
            exact: true,
          });
          assert.equal(
            await card.count(),
            1,
            "ordinary itinerary content has no named card region",
          );
          assert.equal(await card.getByText("Continue to the gate").count(), 1);
          const close = card.getByRole("button", { name: "Masquer le trajet" });
          assert.equal(
            await close.count(),
            1,
            "the card excludes its close control",
          );
          const landmarks = await new AxeBuilder({ page })
            .include(".kozmos-manoeuvre-card")
            .withRules(["region"])
            .analyze();
          assert.deepEqual(
            landmarks.violations,
            [],
            "ordinary itinerary content is outside a landmark",
          );
          await close.focus();
          await page.keyboard.press("Enter");
          await page
            .locator(".kozmos-manoeuvre-itinerary")
            .waitFor({ state: "hidden" });
          assert.equal(await card.getByText("Continue to the gate").count(), 0);
          assert.equal(
            (await focusState(page)).name,
            "Take Elevator down to First Floor, 58 m · Second Floor",
          );
        },
      );

      // 3. The rail: the disc's centre at the track's middle at 0.5.
      await finish(
        await open("map-routeprogressrail--midway"),
        "rail-midway",
        async (page) => {
          const rail = page.getByRole("progressbar", { name: "Step 2 of 4" });
          await rail.waitFor({ timeout: 60000 });
          assert.equal(await rail.getAttribute("aria-valuenow"), "50");
          const railBox = await box(rail);
          const disc = await box(
            rail.locator('[data-testid="route-progress-disc"]'),
          );
          assert.equal(Math.round(disc.width), 34, "the disc is not 34 wide");
          const expected = railBox.x + 10 + (railBox.width - 54) * 0.5;
          assert.ok(
            Math.abs(disc.x - expected) <= 1,
            `the disc is at ${disc.x}, not ${expected}`,
          );
          assert.ok(
            Math.abs(
              disc.y + disc.height / 2 - (railBox.y + railBox.height / 2),
            ) <= 1,
            "the disc is not centred on the rail",
          );
        },
      );

      for (const variant of ["unknown", "right-to-left"]) {
        await finish(
          await open(`map-routeprogressrail--${variant}`),
          `rail-${variant}`,
          async (page) => {
            const rail = page.getByRole("progressbar");
            await rail.waitFor();
            if (variant === "unknown") {
              assert.equal(await rail.getAttribute("aria-valuenow"), null);
              assert.equal(
                await rail.getAttribute("aria-valuetext"),
                "Position unavailable",
              );
              assert.equal(
                await rail
                  .locator('[data-testid="route-progress-disc"]')
                  .count(),
                0,
              );
            } else {
              for (const width of [300, 54, 20, 4]) {
                await rail.evaluate((node, width) => {
                  node.style.width = `${width}px`;
                }, width);
                const r = await box(rail);
                const d = await box(
                  rail.locator('[data-testid="route-progress-disc"]'),
                );
                const dot = Math.min(10, width * 0.2),
                  disc = Math.min(34, width * 0.6);
                const leading =
                  dot + Math.max(width - dot * 2 - disc, 0) * 0.25;
                assert.ok(
                  Math.abs(d.x - (r.right - leading - disc)) < 1,
                  `RTL disc misplaced at width ${width}`,
                );
                assert.ok(
                  d.x >= r.x - 1 && d.right <= r.right + 1,
                  "disc escapes a narrow rail",
                );
                assert.ok(
                  Math.abs(d.width - d.height) < 1,
                  "responsive disc must remain round",
                );
              }
              await rail.evaluate((node) => {
                node.style.width = "";
              });
            }
          },
        );
      }

      await finish(
        await open("map-routeprogressrail--waypoints"),
        "rail-waypoints",
        async (page) => {
          const rail = page.getByRole("progressbar");
          await rail.waitFor();
          const description = await rail.getAttribute("aria-describedby");
          assert.equal(
            await page.locator(`[id="${description}"]`).textContent(),
            "Entrance; Gallery entrance; Turn right into gallery; Destination",
          );
          for (const direction of ["ltr", "rtl"]) {
            for (const width of [300, 120, 20]) {
              await rail.evaluate(
                (node, { direction, width }) => {
                  node.dir = direction;
                  node.style.width = `${width}px`;
                },
                { direction, width },
              );
              await page.waitForFunction(
                ({ width }) => {
                  const node = document.querySelector('[role="progressbar"]');
                  return width < 54
                    ? node.querySelectorAll("[data-waypoint-id]").length === 0
                    : node.querySelectorAll("[data-waypoint-id]").length > 0;
                },
                { width },
              );
              // Two frames deliver ResizeObserver and the React layout update.
              await page.evaluate(
                () =>
                  new Promise((resolve) =>
                    requestAnimationFrame(() => requestAnimationFrame(resolve)),
                  ),
              );
              const r = await box(rail);
              const disc = await box(
                rail.locator('[data-testid="route-progress-disc"]'),
              );
              const marks = await rail.locator("[data-waypoint-id]").all();
              let previous;
              for (const mark of marks) {
                const m = await box(mark);
                assert.ok(
                  m.x >= r.x && m.right <= r.right,
                  "waypoint escapes rail",
                );
                assert.ok(
                  Math.abs(m.x + m.width / 2 - disc.x - disc.width / 2) >= 32,
                  "waypoint overlaps current position",
                );
                if (previous)
                  assert.ok(
                    Math.abs(m.x - previous.x) >= 27,
                    "waypoints overlap",
                  );
                previous = m;
              }
              const track = await box(
                rail.locator('[data-testid="route-completed-track"]'),
              );
              assert.ok(
                track.x >= r.x - 1 && track.right <= r.right + 1,
                "completion escapes rail",
              );
              if (direction === "ltr")
                assert.ok(Math.abs(track.right - disc.x - disc.width / 2) < 1);
              else assert.ok(Math.abs(track.x - disc.x - disc.width / 2) < 1);
            }
          }
          await rail.evaluate((node) => {
            node.dir = "ltr";
            node.style.width = "";
          });
        },
      );

      // 4. The summary's navigation layout: End on the heading's row, the
      //    stats on one row under it, the rail under those.
      await finish(
        await open("map-routesummary--navigation"),
        "summary-navigation",
        async (page) => {
          const heading = page.getByRole("heading", {
            name: "Airport Shuttles",
          });
          await heading.waitFor({ timeout: 60000 });
          const end = page.getByRole("button", { name: "End" });
          const h = await box(heading);
          const e = await box(end);
          assert.ok(
            e.y + e.height / 2 > h.y && e.y + e.height / 2 < h.bottom,
            "End is not on the heading's row",
          );
          assert.ok(e.x >= h.right, "End is not beside the heading");
          const duration = await box(page.getByText("4 min"));
          const arrival = await box(page.getByText("Arrive 12:58"));
          assert.ok(
            Math.abs(duration.y - arrival.y) <= 1,
            "the stats are not on one row",
          );
          assert.ok(
            duration.y >= h.bottom,
            "the stats are not under the heading",
          );
          assert.ok(
            arrival.right > duration.right + 100,
            "the arrival is not at the row's far end",
          );
          const rail = await box(page.getByRole("progressbar"));
          assert.ok(
            rail.y >= duration.bottom,
            "the rail is not under the stats",
          );
        },
      );

      // 5. The composition on the shell: the card in the top slot, the sheet
      //    with the summary; stepping moves the rail and the current step.
      await finish(
        await open("examples-navigation--directions"),
        "directions",
        async (page) => {
          await page
            .getByRole("region", { name: "Current manoeuvre" })
            .waitFor({ timeout: 60000 });
          const card = page.locator(".kozmos-manoeuvre-card");
          const rail = page.getByRole("progressbar");
          const before = await rail.getAttribute("aria-valuenow");
          await page.getByRole("button", { name: "Next step" }).click();
          const after = await rail.getAttribute("aria-valuenow");
          assert.ok(
            Number(after) > Number(before),
            `the rail did not advance: ${before} → ${after}`,
          );
          await card.getByRole("button").first().click();
          const current = page
            .getByRole("region", { name: "Itinerary" })
            .locator('[aria-current="step"]');
          assert.equal(await current.count(), 1);
          assert.equal(
            await current.textContent(),
            "Take Corridor to Garage B",
            "the second step is not current after Next",
          );
          // The sheet is fitted to its content — the summary and the buttons —
          // and on the glass surface; the map has the rest.
          const sheet = page.getByRole("complementary", { name: "Directions" });
          const sheetBox = await box(sheet);
          const contentHeight = await sheet
            .locator("> div")
            .first()
            .evaluate((node) => node.scrollHeight);
          assert.ok(
            Math.abs(sheetBox.height - contentHeight) <= 2,
            `the sheet (${sheetBox.height}) is not fitted to its content (${contentHeight})`,
          );
          assert.ok(
            sheetBox.height < viewport.height * 0.5,
            `the fitted sheet takes ${sheetBox.height} of ${viewport.height}`,
          );
          assert.ok(
            await sheet.evaluate((node) =>
              node.classList.contains("kozmos-surface-glass"),
            ),
            "the sheet is not on the glass surface",
          );
        },
      );

      // 6. The whole instruction on a 390 phone (GAP-094), in English, German
      //    and Japanese: each takes three lines or more, and the card shows
      //    every one — the words two lines lost are drawn inside the card.
      for (const [story, card, instruction, words] of [
        [
          "examples-navigation--phone-english",
          "Current manoeuvre",
          englishInstruction,
          "keep to the right",
        ],
        [
          "examples-navigation--phone-german",
          "Aktuelles Manöver",
          germanInstruction,
          "rechts ab",
        ],
        [
          "examples-navigation--phone-japanese",
          "現在の案内",
          japaneseInstruction,
          "進んでください",
        ],
      ]) {
        await finish(
          await open(story),
          `whole-instruction-${story.split("--phone-")[1]}`,
          async (page) => {
            const region = page.getByRole("region", { name: card });
            await region.waitFor({ timeout: 60000 });
            const text = region.getByText(instruction, { exact: true });
            const drawn = await text.evaluate((node, words) => {
              const lineHeight = parseFloat(getComputedStyle(node).lineHeight);
              const at = node.textContent.lastIndexOf(words);
              const range = document.createRange();
              range.setStart(node.firstChild, at);
              range.setEnd(node.firstChild, at + words.length);
              const rects = [...range.getClientRects()];
              const shown = node.getBoundingClientRect();
              return {
                lines: Math.round(node.scrollHeight / lineHeight),
                cut: node.scrollHeight > node.clientHeight + 1,
                wordsBottom: Math.max(...rects.map((r) => r.bottom)),
                shownBottom: shown.bottom,
              };
            }, words);
            assert.ok(
              drawn.lines >= 3,
              `the instruction takes ${drawn.lines} lines here: two would not cut it, so this proves nothing`,
            );
            assert.equal(drawn.cut, false, "the instruction is cut short");
            assert.ok(
              drawn.wordsBottom <= drawn.shownBottom + 1,
              `"${words}" is laid out below what the card shows (${drawn.wordsBottom} > ${drawn.shownBottom})`,
            );
            const regionBox = await box(region);
            assert.ok(
              drawn.shownBottom <= regionBox.bottom,
              "the instruction runs out of the card",
            );
          },
        );
      }

      // 7. A product that asks for a limit gets it: two lines and an
      //    ellipsis, the name still the whole instruction.
      await finish(
        await open("map-manoeuvrecard--instruction-lines"),
        "instruction-lines",
        async (page) => {
          const instruction =
            "Take the escalator up to the Departures level and continue past the security checkpoint";
          const button = page.getByRole("button", {
            name: `${instruction}, 120 m · First Floor`,
          });
          await button.waitFor({ timeout: 60000 });
          const clamped = await button
            .getByText(instruction, { exact: true })
            .evaluate((node) => {
              const lineHeight = parseFloat(getComputedStyle(node).lineHeight);
              return {
                lines: Math.round(node.clientHeight / lineHeight),
                cut: node.scrollHeight > node.clientHeight + 1,
              };
            });
          assert.deepEqual(
            clamped,
            { lines: 2, cut: true },
            "instructionLines={2} does not cut the instruction at two lines",
          );
        },
      );

      // 8. The German itinerary on a 390 phone (GAP-100): taller than the
      //    open card's cap, it scrolls in a group named after it, which Tab
      //    reaches and the keyboard scrolls.
      await finish(
        await open("examples-navigation--phone-german-itinerary"),
        "itinerary-scrolls",
        async (page) => {
          const scroller = page.locator(".kozmos-manoeuvre-itinerary");
          await scroller.waitFor({ timeout: 60000 });
          const overflow = await scroller.evaluate(
            (n) => n.scrollHeight - n.clientHeight,
          );
          assert.ok(
            overflow > 20,
            `the German itinerary overflows the cap by ${overflow}px: the story tests nothing`,
          );
          const reachable = await new AxeBuilder({ page })
            .withRules(["scrollable-region-focusable"])
            .analyze();
          assert.deepEqual(
            reachable.violations.map(
              (v) =>
                `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
            ),
            [],
            "axe: the keyboard cannot reach the scrolling itinerary",
          );
          const named = await scroller.evaluate((n) => ({
            role: n.getAttribute("role"),
            name: n.getAttribute("aria-label"),
            tabIndex: n.tabIndex,
          }));
          assert.deepEqual(
            named,
            { role: "group", name: "Wegbeschreibung", tabIndex: 0 },
            "the scrolling itinerary is not a focusable group named after it",
          );
          let reached = false;
          for (let press = 0; press < 12 && !reached; press++) {
            await page.keyboard.press("Tab");
            reached = await scroller.evaluate(
              (n) => n === document.activeElement,
            );
          }
          assert.ok(reached, "Tab never reaches the scrolling itinerary");
          assert.equal(
            (await focusState(page)).ring,
            true,
            "the focused itinerary draws no ring",
          );
          // The browsers scroll a focused box themselves, smoothly, so wait
          // for it. Page Down, Space and End in all three engines; WebKit's
          // arrows do not (the note in utils/keyboard-scroll.ts).
          const scrolledBy = (key, reached) =>
            page.keyboard.press(key).then(() =>
              page.waitForFunction(reached, null, { timeout: 5000 }).then(
                () => true,
                () => false,
              ),
            );
          assert.ok(
            await scrolledBy(
              "PageDown",
              () =>
                document.querySelector(".kozmos-manoeuvre-itinerary")
                  .scrollTop > 0,
            ),
            "Page Down does not scroll the focused itinerary",
          );
          assert.ok(
            await scrolledBy("End", () => {
              const n = document.querySelector(".kozmos-manoeuvre-itinerary");
              return n.scrollTop + n.clientHeight >= n.scrollHeight - 1;
            }),
            "End does not scroll the focused itinerary to its destination",
          );
          const destination = await box(
            scroller.getByText("Flughafen-Shuttles", { exact: true }),
          );
          const shown = await box(scroller);
          assert.ok(
            destination.bottom <= shown.bottom + 1 && destination.y >= shown.y,
            `the destination is not in view at the itinerary's end: ${JSON.stringify({ destination, shown })}`,
          );
        },
      );

      // 9. Focus through the disclosure from the keyboard (review T4), three
      //    times over: opening puts focus on the itinerary, Tab on Hide,
      //    closing back on the instruction — never on the page, never on
      //    anything hidden from assistive technology.
      await finish(
        await open("examples-navigation--phone-english"),
        "disclosure-keyboard",
        async (page) => {
          const instructionName = `${englishInstruction}, 40 m · Ground Floor`;
          const instruction = page.getByRole("button", {
            name: instructionName,
          });
          await instruction.waitFor({ timeout: 60000 });
          await instruction.focus();
          for (const key of ["Enter", "Space", "Enter"]) {
            await page.keyboard.press(key);
            // Input dispatch can return before React commits its disclosure.
            // Wait for that state, not a timeout or a synthetic focus change.
            await page
              .getByRole("group", { name: "Itinerary", exact: true })
              .waitFor();
            const opened = await focusState(page);
            assert.deepEqual(
              {
                role: opened.role,
                name: opened.name,
                hidden: opened.hidden,
                tabbable: opened.tabbable,
              },
              {
                role: "group",
                name: "Itinerary",
                hidden: false,
                tabbable: true,
              },
              `after opening with ${key}, focus is on ${opened.tag} "${opened.name}"`,
            );
            assert.equal(
              opened.ring,
              true,
              `after opening with ${key}, the itinerary draws no ring`,
            );
            await page.keyboard.press("Tab");
            assert.equal(
              (await focusState(page)).name,
              "Hide itinerary",
              "Tab from the itinerary does not reach Hide",
            );
            await page.keyboard.press(key);
            await instruction.waitFor();
            const closed = await focusState(page);
            assert.deepEqual(
              {
                name: closed.name,
                hidden: closed.hidden,
                tabbable: closed.tabbable,
              },
              { name: instructionName, hidden: false, tabbable: true },
              `after closing with ${key}, focus is on ${closed.tag} "${closed.name}"${closed.hidden ? ", hidden" : ""}`,
            );
          }
          // Closed, the silent bar is never a stop: Tab goes from the
          // instruction out of the card.
          await page.keyboard.press("Tab");
          const next = await focusState(page);
          assert.notEqual(
            next.name,
            "Show itinerary",
            "Tab lands on the closed, silent grab bar",
          );
        },
      );

      // 10. From a pointer: focus moves only where the press left it in the
      //     part that changed. A press that focuses its button (Chromium,
      //     and Firefox outside macOS) is followed into the itinerary and
      //     back; one that does not (WebKit) leaves focus where it was.
      //     Never on something gone, and never on the hidden bar.
      await finish(
        await open("examples-navigation--phone-english"),
        "disclosure-pointer",
        async (page) => {
          const instructionName = `${englishInstruction}, 40 m · Ground Floor`;
          const instruction = page.getByRole("button", {
            name: instructionName,
          });
          await instruction.waitFor({ timeout: 60000 });
          await recordFocusAtClick(page);
          await instruction.click();
          await page
            .getByRole("group", { name: "Itinerary", exact: true })
            .waitFor();
          const [atOpen] = await page.evaluate(() => window.__focusAtClick);
          const opened = await focusState(page);
          if (atOpen.name === instructionName) {
            assert.equal(
              opened.name,
              "Itinerary",
              `the press took focus to the instruction; opening left it on ${opened.tag} "${opened.name}"`,
            );
            assert.equal(
              opened.ring,
              false,
              "a pointer's focus draws the keyboard's ring",
            );
          } else {
            assert.deepEqual(
              { tag: opened.tag, name: opened.name },
              { tag: atOpen.tag, name: atOpen.name },
              "opening moved focus a pointer had not put in the card",
            );
          }
          await page.getByRole("button", { name: "Hide itinerary" }).click();
          await instruction.waitFor();
          const [, atClose] = await page.evaluate(() => window.__focusAtClick);
          const closed = await focusState(page);
          assert.equal(
            closed.hidden,
            false,
            "focus rests on the hidden grab bar",
          );
          if (atClose.name === "Hide itinerary" || atClose.inItinerary) {
            assert.equal(
              closed.name,
              instructionName,
              `focus was in the part that closed; it went to ${closed.tag} "${closed.name}"`,
            );
          } else {
            assert.deepEqual(
              { tag: closed.tag, name: closed.name },
              { tag: atClose.tag, name: atClose.name },
              "closing moved focus a pointer had not put in the card",
            );
          }
        },
      );

      // 11. The product closing the card from its own control leaves focus
      //     on that control: End in the sheet closes the itinerary.
      await finish(
        await open("examples-navigation--phone-german-itinerary"),
        "disclosure-outside",
        async (page) => {
          const end = page.getByRole("button", { name: "Beenden" });
          await end.waitFor({ timeout: 60000 });
          await end.focus();
          await page.keyboard.press("Enter");
          await page
            .locator(".kozmos-manoeuvre-itinerary")
            .waitFor({ state: "hidden" });
          assert.equal(
            await end.evaluate((n) => n === document.activeElement),
            true,
            "closing the card from the product's own control took focus from it",
          );
        },
      );
    } finally {
      await browser.close();
    }
  }
}
fs.writeFileSync(
  path.join(output, "results.json"),
  JSON.stringify(results, null, 2),
);
const failed = results.filter((r) => r.status !== "ok");
console.log(
  `${results.length - failed.length} of ${results.length} navigation checks passed on ${engine}`,
);
if (failed.length) process.exit(1);
