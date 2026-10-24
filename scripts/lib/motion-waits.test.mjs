import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium, firefox, webkit } from "playwright";
import { glideEnded, styleChanged } from "./motion-waits.mjs";

// The waits on small pages, in all three engines: each test opens one page
// per engine, one engine after another unless it says otherwise.
const browsers = {};
before(async () => {
  for (const [name, type] of Object.entries({ chromium, firefox, webkit }))
    browsers[name] = await type.launch();
});
after(async () => {
  await Promise.all(Object.values(browsers).map((browser) => browser.close()));
});

const BOX = `<!doctype html><div id="box" style="width:200px;height:200px;overflow:auto"><div style="height:2000px"></div></div>`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const scrollBy = (page, top, behavior) =>
  page.evaluate(
    ({ top, behavior }) =>
      document.getElementById("box").scrollBy({ top, behavior }),
    { top, behavior },
  );

async function inEachEngine(html, check, { together = false } = {}) {
  const run = async ([engine, browser]) => {
    const page = await browser.newPage({ reducedMotion: "no-preference" });
    try {
      await page.setContent(html);
      await check(page, engine);
    } finally {
      await page.close();
    }
  };
  const engines = Object.entries(browsers);
  if (together) await Promise.all(engines.map(run));
  else for (const engine of engines) await run(engine);
}

test("a glide is waited out to where it comes to rest", async () => {
  await inEachEngine(BOX, async (page, engine) => {
    const box = page.locator("#box");
    const glide = await glideEnded(box, () => scrollBy(page, 300, "smooth"));
    assert.ok(glide.settled, `${engine}: ${glide.why}: ${glide.timeline}`);
    assert.equal(await box.evaluate((node) => node.scrollTop), 300, engine);
  });
});

test("a box that never scrolls is reported, not measured", async () => {
  await inEachEngine(BOX, async (page, engine) => {
    const glide = await glideEnded(page.locator("#box"), async () => {}, {
      limit: 500,
    });
    assert.equal(glide.settled, false, engine);
    assert.equal(glide.why, "never scrolled", engine);
  });
});

// A box meant to stay put is watched from the moment `act` has run: an act
// whose round trip took 200 ms once settled before it had run, with the box
// still at 0 and a glide about to start.
test("a box meant to stay put is watched from after a slow act", async () => {
  await inEachEngine(BOX, async (page, engine) => {
    const box = page.locator("#box");
    const glide = await glideEnded(
      box,
      async () => {
        await sleep(200);
        await scrollBy(page, 300, "smooth");
      },
      { moves: false },
    );
    const top = await box.evaluate((node) => node.scrollTop);
    assert.equal(
      top,
      300,
      `${engine}: read at ${top}, the glide not waited out: ${glide.timeline}`,
    );
  });
});

// And for a few frames after it, as main's three frames and ten still
// frames did: a scroll the page sets off a little late is still seen.
test("a box meant to stay put is held for frames after the act", async () => {
  await inEachEngine(BOX, async (page, engine) => {
    const box = page.locator("#box");
    const glide = await glideEnded(
      box,
      () =>
        page.evaluate(() =>
          setTimeout(
            () =>
              document
                .getElementById("box")
                .scrollBy({ top: 300, behavior: "smooth" }),
            100,
          ),
        ),
      { moves: false },
    );
    const top = await box.evaluate((node) => node.scrollTop);
    assert.equal(top, 300, `${engine}: read at ${top}: ${glide.timeline}`);
  });
});

test("a box meant to stay put settles where it stayed", async () => {
  await inEachEngine(BOX, async (page, engine) => {
    const glide = await glideEnded(page.locator("#box"), async () => {}, {
      moves: false,
    });
    assert.ok(glide.settled, `${engine}: ${glide.why}: ${glide.timeline}`);
  });
});

const CUE = `<!doctype html><style>@keyframes flow { to { background-position-x: 20px } } .moving { animation: flow 1s linear infinite }</style><div id="host"><span id="cue" style="display:block;width:100px;height:6px;background:red 0 center / 20px 6px repeat-x"></span></div>`;

test("an animation that moves reads as changed", async () => {
  await inEachEngine(CUE, async (page, engine) => {
    await page.locator("#cue").evaluate((node) => node.classList.add("moving"));
    const moved = await styleChanged(
      page.locator("#cue"),
      "backgroundPositionX",
    );
    assert.ok(moved.changed, `${engine}: ${JSON.stringify(moved)}`);
  });
});

test("a style that holds reads as unchanged once the limit has passed", async () => {
  await inEachEngine(CUE, async (page, engine) => {
    const moved = await styleChanged(
      page.locator("#cue"),
      "backgroundPositionX",
      {
        limit: 500,
      },
    );
    assert.equal(moved.changed, false, `${engine}: ${JSON.stringify(moved)}`);
  });
});

// A node swapped for another (a remount) reads "" once detached: that is not
// the node moving.
test("a node replaced while it is read is not a change", async () => {
  await inEachEngine(CUE, async (page, engine) => {
    await page.evaluate(() =>
      setTimeout(() => {
        const cue = document.getElementById("cue");
        cue.replaceWith(cue.cloneNode());
      }, 100),
    );
    const moved = await styleChanged(
      page.locator("#cue"),
      "backgroundPositionX",
      {
        limit: 2000,
      },
    );
    assert.equal(moved.changed, false, `${engine}: ${JSON.stringify(moved)}`);
    assert.equal(moved.detached, true, `${engine}: ${JSON.stringify(moved)}`);
  });
});

// A page whose main thread is busy for 8 s answers nothing: the waits give up
// on a Node timer at their limit and 5 s, instead of waiting for the page.
const hang = (page) =>
  page.evaluate(() =>
    setTimeout(() => {
      const until = Date.now() + 8000;
      while (Date.now() < until);
    }, 0),
  );

test("a glide wait gives up on a page that has stopped answering", async () => {
  await inEachEngine(
    BOX,
    async (page, engine) => {
      const started = Date.now();
      await assert.rejects(
        glideEnded(page.locator("#box"), () => hang(page), { limit: 300 }),
        /had not answered/,
        engine,
      );
      const waited = Date.now() - started;
      assert.ok(waited < 7500, `${engine}: gave up after ${waited} ms`);
    },
    { together: true },
  );
});

test("a style wait gives up on a page that has stopped answering", async () => {
  await inEachEngine(
    CUE,
    async (page, engine) => {
      await hang(page);
      const started = Date.now();
      await assert.rejects(
        styleChanged(page.locator("#cue"), "backgroundPositionX", {
          limit: 300,
        }),
        /had not answered/,
        engine,
      );
      const waited = Date.now() - started;
      assert.ok(waited < 7500, `${engine}: gave up after ${waited} ms`);
    },
    { together: true },
  );
});
