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
 * out, for the caller to fail on: none ends quietly.
 */

/**
 * Waits for a scroll box's glide to end once `act` has set it off. Watched
 * from before `act`, so a scroll that ends at once, under reduced motion, is
 * seen too.
 *
 * It has ended when the box has moved from where it started, a scrollend has
 * fired where it now rests, and it has held still, with `card` (a selector
 * inside the box) done animating, for 150 ms and three frames:
 * - where it rests, not whether a scroll event followed the scrollend: loaded,
 *   Linux WebKit 26.0 fired scroll events after the scrollend at the same
 *   place, fired duplicate scrollends, and fires one for a glide that the
 *   next one cuts short;
 * - `card`, since POIResultList brings a selected card in again as its action
 *   row's animation ends, and Chromium shows that second glide two frames
 *   after it starts.
 * With `moves: false` the box is meant to stay put: it has settled once it
 * has held still, and a box that moved all the same is waited out as above,
 * so the caller reads where it came to rest.
 *
 * Resolves `{ settled, why, timeline }`. Not settled within `limit` ms, `why`
 * says what was missing; `timeline` lists the box's scrollTop at every
 * change and every scrollend, and the frames seen.
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
      let last = from;
      let moved = false;
      let endedAt;
      let ended = !fires;
      let animating = false;
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
                  : "had not held still for 150 ms",
          timeline: timeline.join(", "),
        });
      };
      node.addEventListener("scrollend", onEnd);
      setTimeout(() => finish(false), limit);
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
        if ((moved ? ended : !moves) && still >= 3 && now - quietSince >= 150)
          finish(true);
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      return { result };
    },
    { card, moves, limit },
  );
  try {
    await act();
    return await watch.evaluate((watching) => watching.result);
  } finally {
    await watch.dispose();
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
 * Resolves `{ changed, from, to, after, frames }`: the first reading, the
 * one that differed (or the last), the milliseconds and the frames between.
 */
export async function styleChanged(locator, property, { limit = 10_000 } = {}) {
  return locator.evaluate(
    (node, { property, limit }) =>
      new Promise((resolve) => {
        const t0 = performance.now();
        const read = () => getComputedStyle(node)[property];
        const from = read();
        let frames = 0;
        let done = false;
        let timer;
        const finish = (to) => {
          if (done) return;
          done = true;
          clearInterval(timer);
          resolve({
            changed: to !== from,
            from,
            to,
            after: Math.round(performance.now() - t0),
            frames,
          });
        };
        const check = () => {
          const now = read();
          if (now !== from) finish(now);
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
  );
}
