/**
 * Waits for motion in a page by its condition, never by a fixed time.
 *
 * Linux WebKit 26.0, as CI runs it, can render nothing for over a second on a
 * loaded runner while timers keep running (#394). Whatever moves only when the
 * page renders holds still meanwhile: a smooth scroll, a transition or an
 * animation that starts in the stall, and a running animation of a property
 * WebKit does not composite. A measurement after a fixed wait reads whatever
 * the last frame left. These waits watch for the state itself, on frames and
 * on a timer both, since a WebKit that stops rendering stops calling the
 * frames too. Each has an upper bound, and reports what it saw when it runs
 * out, for the caller to fail on: none ends quietly. Behind it, a Node timer
 * gives up on a page that has stopped answering altogether.
 */

/**
 * `answer`, unless the page gives none within `limit` ms and 5 s more: a page
 * whose main thread hangs runs none of its own timers either, and would hold
 * the check until the job's timeout.
 */
async function withinLimit(answer, limit) {
  let timer;
  const silence = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `${limit + 5000} ms on, the page had not answered: its main thread may be hung`,
          ),
        ),
      limit + 5000,
    );
  });
  try {
    return await Promise.race([answer, silence]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Waits for a scroll box's glide to end once `act` has set it off. The box is
 * watched from before `act`, so a scroll that ends at once, under reduced
 * motion, is seen too; but nothing settles, and the `limit` ms do not start,
 * until `act` has returned.
 *
 * It has ended when the box has moved from where it started, a scrollend has
 * fired where it now rests, and it has held still, with `card` (a selector
 * inside the box) done animating, for 150 ms and three frames since `act`:
 * - where it rests, not whether a scroll event followed the scrollend: loaded,
 *   Linux WebKit 26.0 fired scroll events after the scrollend at the same
 *   place, fired duplicate scrollends, and fires one for a glide that the
 *   next one cuts short;
 * - `card`, since POIResultList brings a selected card in again as its action
 *   row's animation ends, and Chromium shows that second glide two frames
 *   after it starts.
 * With `moves: false` the box is meant to stay put: it has settled once it
 * has held still for 150 ms and 13 frames since `act` (check-react-interactions
 * waited three frames and then ten still ones), so a scroll that `act` sets
 * off a frame or two late is seen; a box that moved all the same is waited
 * out as above, so the caller reads where it came to rest.
 *
 * Resolves `{ settled, why, timeline }`. Not settled within `limit` ms, `why`
 * says what was missing; `timeline` lists the box's scrollTop at every
 * change and every scrollend, when `act` returned, and the frames seen.
 * Rejects if the page has not answered `limit` ms and 5 s after `act`.
 */
export async function glideEnded(
  scroller,
  act,
  { card, moves = true, limit = 10_000 } = {},
) {
  const watch = await scroller.evaluateHandle(
    (node, { card, moves, limit }) => {
      const t0 = performance.now();
      const at = () => Math.round(performance.now() - t0);
      const fires = "onscrollend" in node;
      const from = node.scrollTop;
      const timeline = [`0 ms ${from}`];
      const hold = moves ? 3 : 13;
      let last = from;
      let moved = false;
      let endedAt;
      let ended = !fires;
      let animating = false;
      let armed = false;
      let quietSince = t0;
      let still = 0;
      let frames = 0;
      let done = false;
      let resolve;
      const result = new Promise((settle) => (resolve = settle));
      const onEnd = () => {
        endedAt = node.scrollTop;
        timeline.push(`${at()} ms scrollend at ${endedAt}`);
      };
      const finish = (settled) => {
        if (done) return;
        done = true;
        node.removeEventListener("scrollend", onEnd);
        timeline.push(`${at()} ms ${node.scrollTop}, ${frames} frames`);
        resolve({
          settled,
          why:
            moves && !moved
              ? "never scrolled"
              : moved && !ended
                ? "had no scrollend where it rested"
                : animating
                  ? "held the card still animating"
                  : `had not held still for 150 ms and ${hold} frames`,
          timeline: timeline.join(", "),
        });
      };
      node.addEventListener("scrollend", onEnd);
      const frame = () => {
        if (done) return;
        frames++;
        const now = performance.now();
        const top = node.scrollTop;
        if (top !== last) timeline.push(`${at()} ms ${top}`);
        if (top !== from) moved = true;
        if (fires) ended = top === endedAt;
        animating =
          (card ? node.querySelector(card) : null)
            ?.getAnimations({ subtree: true })
            .some((animation) => animation.playState === "running") ?? false;
        if (top !== last || animating) {
          quietSince = now;
          still = 0;
        } else still++;
        last = top;
        if (
          armed &&
          (moved ? ended : !moves) &&
          still >= hold &&
          now - quietSince >= 150
        )
          finish(true);
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      return {
        // Once `act` has returned: the hold and the limit start here.
        arm() {
          armed = true;
          quietSince = performance.now();
          still = 0;
          timeline.push(`${at()} ms act done`);
          setTimeout(() => finish(false), limit);
          return result;
        },
        stop() {
          done = true;
          node.removeEventListener("scrollend", onEnd);
        },
      };
    },
    { card, moves, limit },
  );
  try {
    await act();
    return await withinLimit(
      watch.evaluate((watching) => watching.arm()),
      limit,
    );
  } finally {
    // Stopped and released without waiting on it: a page that has stopped
    // answering would hold this too, and a closed one has nothing to release.
    watch
      .evaluate((watching) => watching.stop())
      .then(() => watch.dispose())
      .catch(() => {});
  }
}

/**
 * Whether an animation that never ends is moving: reads the node's computed
 * `property` now, then on every frame and every 50 ms, until it reads
 * something else or `limit` ms have passed. A fixed wait asks this of
 * whatever the last frame left. With its frames held (macOS WebKit 26.0, its
 * GPU process stopped), a running `background-position` animation and any
 * animation that had not started yet held still, while a running `transform`
 * one went on turning.
 *
 * A node taken out of the document (a remount swaps it for another) reads ""
 * in every engine: that ends the wait unchanged, with `detached`, rather than
 * passing for movement.
 *
 * Resolves `{ changed, detached, from, to, after, frames }`: the first
 * reading, the one that differed (or the last), the milliseconds and the
 * frames between. Rejects if the page has not answered `limit` ms and 5 s on.
 */
export async function styleChanged(locator, property, { limit = 10_000 } = {}) {
  return withinLimit(
    locator.evaluate(
      (node, { property, limit }) =>
        new Promise((resolve) => {
          const t0 = performance.now();
          const read = () =>
            node.isConnected ? getComputedStyle(node)[property] : "";
          const from = read();
          let frames = 0;
          let done = false;
          let timer;
          const finish = (to) => {
            if (done) return;
            done = true;
            clearInterval(timer);
            const detached = !node.isConnected || to === "" || from === "";
            resolve({
              changed: !detached && to !== from,
              detached,
              from,
              to,
              after: Math.round(performance.now() - t0),
              frames,
            });
          };
          const check = () => {
            const now = read();
            if (now !== from || now === "") finish(now);
          };
          timer = setInterval(check, 50);
          setTimeout(() => finish(read()), limit);
          const frame = () => {
            if (done) return;
            frames++;
            check();
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        }),
      { property, limit },
    ),
    limit,
  );
}
