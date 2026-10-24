import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium, firefox, webkit } from "playwright";
import { glideEnded, readingSettled, styleChanged } from "./motion-waits.mjs";

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

const SIZED = `<!doctype html><div id="box" style="width:100px;height:100px"><div id="inner" style="height:10px"></div></div>`;
const height = (node) => node.getBoundingClientRect().height;
// Grows the box by `by` px every `every` ms, `steps` times, on a timer.
const grow = (page, { steps, every, by = 10 }) =>
  page.evaluate(
    ({ steps, every, by }) => {
      const box = document.getElementById("box");
      let left = steps;
      const step = () => {
        box.style.height = `${box.getBoundingClientRect().height + by}px`;
        if (--left > 0) setTimeout(step, every);
      };
      setTimeout(step, every);
    },
    { steps, every, by },
  );
// Holds the page's frames, as a WebKit that renders nothing does (#394): its
// timers run, its requestAnimationFrame callbacks wait. They run `for` ms on.
const holdFrames = (page, ms) =>
  page.evaluate((ms) => {
    const original = window.requestAnimationFrame.bind(window);
    const held = [];
    window.requestAnimationFrame = (callback) => held.push(callback);
    setTimeout(() => {
      window.requestAnimationFrame = original;
      for (const callback of held) original(callback);
    }, ms);
  }, ms);

// The hold counts from the reading's last change, not from the call: a box
// that steps every 80 ms, with frames still between the steps, is waited out
// to its last step. check-map-sheet's settle() counted its 120 ms from the
// call, so three still frames between two steps ended it (issue #399).
test("a reading is waited out from its last change", async () => {
  await inEachEngine(SIZED, async (page, engine) => {
    const box = page.locator("#box");
    const rest = await readingSettled(box, height, {
      act: () => grow(page, { steps: 6, every: 80 }),
      moves: true,
    });
    assert.ok(rest.settled, `${engine}: ${rest.why}: ${rest.timeline}`);
    assert.equal(rest.to, 160, `${engine}: ${rest.timeline}`);
    assert.equal(await box.evaluate(height), 160, engine);
  });
});

test("a reading that must change and never does is reported, with its frames", async () => {
  await inEachEngine(SIZED, async (page, engine) => {
    const rest = await readingSettled(page.locator("#box"), height, {
      moves: true,
      limit: 500,
    });
    assert.equal(rest.settled, false, engine);
    assert.match(rest.why, /^never changed in 500 ms and \d+ frames$/, engine);
    assert.equal(rest.to, 100, engine);
  });
});

test("a reading meant to stay put that changes late is waited out", async () => {
  await inEachEngine(SIZED, async (page, engine) => {
    const rest = await readingSettled(page.locator("#box"), height, {
      act: () =>
        page.evaluate(() =>
          setTimeout(() => {
            document.getElementById("box").style.height = "150px";
          }, 100),
        ),
      moves: false,
    });
    assert.ok(rest.settled, `${engine}: ${rest.why}`);
    assert.equal(rest.moved, true, `${engine}: ${rest.timeline}`);
    assert.equal(rest.to, 150, `${engine}: ${rest.timeline}`);
  });
});

test("a reading meant to stay put settles where it stayed", async () => {
  await inEachEngine(SIZED, async (page, engine) => {
    const rest = await readingSettled(page.locator("#box"), height, {
      moves: false,
    });
    assert.ok(rest.settled, `${engine}: ${rest.why}: ${rest.timeline}`);
    assert.equal(rest.moved, false, engine);
    assert.equal(rest.to, 100, engine);
  });
});

// The hold and the limit start once `act` has returned: an act whose round
// trip is slow, and whose change comes 30 ms after it, is still seen.
test("a reading is held from after a slow act", async () => {
  await inEachEngine(SIZED, async (page, engine) => {
    const rest = await readingSettled(page.locator("#box"), height, {
      act: async () => {
        await sleep(300);
        await grow(page, { steps: 1, every: 30, by: 40 });
      },
    });
    assert.ok(rest.settled, `${engine}: ${rest.why}`);
    assert.equal(rest.to, 140, `${engine}: ${rest.timeline}`);
  });
});

// While the page draws no frames, a still reading has not settled: a motion
// that runs only on frames (a transition, a smooth scroll, a measurement on a
// resize) has not had them yet. On a timer alone this settled at 100.
test("a reading does not settle while the page draws no frames", async () => {
  await inEachEngine(SIZED, async (page, engine) => {
    const rest = await readingSettled(page.locator("#box"), height, {
      act: async () => {
        await holdFrames(page, 800);
        // A box that grows on the frames, when they come.
        await page.evaluate(() => {
          const box = document.getElementById("box");
          let left = 5;
          const frame = () => {
            box.style.height = `${box.getBoundingClientRect().height + 10}px`;
            if (--left > 0) requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
      },
    });
    assert.ok(rest.settled, `${engine}: ${rest.why}: ${rest.timeline}`);
    assert.equal(rest.to, 150, `${engine}: ${rest.timeline}`);
  });
});

// Its limit is kept on a timer, and a page that drew no frames is named as
// such, rather than blaming what was read (issue #399).
test("a page that draws no frames runs out its limit, and says so", async () => {
  await inEachEngine(SIZED, async (page, engine) => {
    await holdFrames(page, 5000);
    const started = Date.now();
    const rest = await readingSettled(page.locator("#box"), height, {
      limit: 600,
    });
    const waited = Date.now() - started;
    assert.equal(rest.settled, false, engine);
    assert.match(
      rest.why,
      /^held still for \d+ ms but only 0 frames: the page drew too few frames to tell$/,
      engine,
    );
    assert.equal(rest.frames, 0, engine);
    assert.ok(waited < 2000, `${engine}: gave up after ${waited} ms`);
  });
});

test("a reading still changing at its limit fails with its last value", async () => {
  await inEachEngine(SIZED, async (page, engine) => {
    const rest = await readingSettled(page.locator("#box"), height, {
      act: () => grow(page, { steps: 100, every: 40, by: 1 }),
      limit: 600,
    });
    assert.equal(rest.settled, false, engine);
    assert.match(
      rest.why,
      /^was still changing 600 ms on, its last change \d+ ms ago$/,
      engine,
    );
    assert.ok(rest.to > 100 && rest.to < 200, `${engine}: ${rest.to}`);
    assert.match(rest.timeline, /act done/, engine);
  });
});

test("a reading that throws rejects the wait", async () => {
  await inEachEngine(SIZED, async (page, engine) => {
    await assert.rejects(
      readingSettled(
        page.locator("#box"),
        (node) => node.querySelector("#inner").offsetHeight,
        {
          act: () =>
            page.evaluate(() =>
              setTimeout(() => document.getElementById("inner").remove(), 50),
            ),
        },
      ),
      /null/,
      engine,
    );
  });
});

test("a reading wait gives up on a page that has stopped answering", async () => {
  await inEachEngine(
    SIZED,
    async (page, engine) => {
      const started = Date.now();
      await assert.rejects(
        readingSettled(page.locator("#box"), height, {
          act: () => hang(page),
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

// An ease that starts flat reads as still while it runs: over a minute,
// ease-in moves 100px about 0.02px in its first 600 ms. With `animations`,
// the node's own transition must have ended too.
const EASED = `<!doctype html><div id="box" style="width:100px;height:100px;transition:height 60s ease-in"></div>`;
const ease = (page, ms) =>
  page.evaluate((ms) => {
    const box = document.getElementById("box");
    box.style.transitionDuration = `${ms}ms`;
    box.style.height = "200px";
  }, ms);

test("a transition that reads as still is waited out with animations", async () => {
  await inEachEngine(EASED, async (page, engine) => {
    const rest = await readingSettled(page.locator("#box"), height, {
      act: () => ease(page, 60_000),
      animations: true,
      limit: 600,
    });
    assert.equal(rest.settled, false, `${engine}: ${rest.timeline}`);
    assert.match(
      rest.why,
      /^was still animating 600 ms on, its reading last changed \d+ ms ago$/,
      engine,
    );
  });
});

test("a transition is waited out to its end with animations", async () => {
  await inEachEngine(EASED, async (page, engine) => {
    const rest = await readingSettled(page.locator("#box"), height, {
      act: () => ease(page, 300),
      animations: true,
      moves: true,
    });
    assert.ok(rest.settled, `${engine}: ${rest.why}: ${rest.timeline}`);
    assert.equal(rest.to, 200, `${engine}: ${rest.timeline}`);
    assert.match(rest.timeline, /animations ended/, engine);
  });
});
