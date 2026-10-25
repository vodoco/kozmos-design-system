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
 * Waits for a reading of the page to stop changing once `act` has run: a
 * layout the page is still measuring, or a sheet coming to rest.
 *
 * `read(node, arg)` runs in the page on `locator`'s node, and returns what
 * JSON can hold; numbers in it change when they move by 0.05 or more. It uses
 * nothing from outside itself but `arg`, since it is sent to the page as its
 * source. It is read before `act`, then on every frame and every 50 ms.
 *
 * It has settled once the reading has held for `frames` frames (3) and
 * `quiet` ms (150), counted from its last change or from when `act` returned,
 * whichever is later. Frames as well as time: with its frames held (WebKit
 * rendering nothing, #394), a layout that changes only as the page renders
 * holds still on a timer, and a wait on time alone settles in the stall.
 *
 * - `moves: true`: it must have changed from what it read before `act` (at
 *   any time since, so a sheet that springs back counts) before it settles.
 * - `moves: false`: it should not change. It holds for 13 frames, as
 *   glideEnded does, so a change set off a frame or two late is seen; one that
 *   came all the same is waited out, and resolves with `moved`.
 * - Left out, either will do.
 *
 * `animations: true`: the node's own animations and transitions must also
 * have ended. A slow ease can move less than 0.05 a frame as it starts or
 * ends, and read as still while it runs.
 *
 * Resolves `{ settled, why, moved, from, to, frames, timeline }`: `to` is the
 * last reading, `timeline` lists each change with when and on which frame,
 * and when `act` returned. Not settled within `limit` ms of `act` returning,
 * `why` says what was missing, and says so when the page drew too few frames
 * to tell. Rejects if the page has not answered `limit` ms and 5 s after `act`.
 */
export async function readingSettled(
  locator,
  read,
  {
    act = async () => {},
    arg,
    moves,
    animations = false,
    frames,
    quiet = 150,
    limit = 10_000,
  } = {},
) {
  const reader = await locator.page().evaluateHandle(`(${read})`);
  const hold = frames ?? (moves === false ? 13 : 3);
  let watch;
  try {
    watch = await locator.evaluateHandle(
      (node, { read, arg, moves, animations, hold, quiet, limit }) => {
        const t0 = performance.now();
        const at = () => Math.round(performance.now() - t0);
        const same = (a, b) => {
          if (typeof a === "number" && typeof b === "number")
            return (
              Math.abs(a - b) < 0.05 || (Number.isNaN(a) && Number.isNaN(b))
            );
          if (a && b && typeof a === "object" && typeof b === "object") {
            const keys = Object.keys(a);
            return (
              keys.length === Object.keys(b).length &&
              keys.every((key) => same(a[key], b[key]))
            );
          }
          return a === b;
        };
        const show = (value) =>
          JSON.stringify(value, (_, v) =>
            typeof v === "number" ? Math.round(v * 100) / 100 : v,
          );
        const from = read(node, arg);
        const timeline = [`0 ms ${show(from)}`];
        let last = from;
        let moved = false;
        let animating = false;
        let armed = false;
        let armedFrames = 0;
        let changedAt = t0;
        let changedFrames = 0;
        let quietSince = t0;
        let still = 0;
        let frames = 0;
        let done = false;
        let timer;
        let limitTimer;
        let resolve;
        let reject;
        const result = new Promise((settle, fail) => {
          resolve = settle;
          reject = fail;
        });
        const end = () => {
          done = true;
          clearInterval(timer);
          clearTimeout(limitTimer);
        };
        const finish = (settled, why) => {
          if (done) return;
          end();
          timeline.push(`${at()} ms, ${frames} frames`);
          const lines =
            timeline.length <= 16
              ? timeline
              : [
                  ...timeline.slice(0, 8),
                  `… ${timeline.length - 16} more`,
                  ...timeline.slice(-8),
                ];
          resolve({
            settled,
            why,
            moved,
            from,
            to: last,
            frames,
            timeline: lines.join(", "),
          });
        };
        const sample = (onFrame) => {
          if (done) return;
          let value;
          try {
            value = read(node, arg);
          } catch (error) {
            end();
            reject(error);
            return;
          }
          const now = performance.now();
          const running =
            animations &&
            node
              .getAnimations()
              .some((animation) => animation.playState === "running");
          if (running !== animating)
            timeline.push(
              `${at()} ms f${frames} ${running ? "animating" : "animations ended"}`,
            );
          animating = running;
          const changed = !same(value, last);
          if (changed) {
            timeline.push(`${at()} ms f${frames} ${show(value)}`);
            last = value;
            changedAt = now;
            changedFrames = frames;
          }
          if (changed || running) {
            quietSince = Math.max(quietSince, now);
            still = 0;
          } else if (onFrame) still++;
          if (!same(value, from)) moved = true;
          if (
            armed &&
            (moves !== true || moved) &&
            still >= hold &&
            now - quietSince >= quiet
          )
            finish(true, "");
        };
        const frame = () => {
          if (done) return;
          frames++;
          sample(true);
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
        timer = setInterval(() => sample(false), 50);
        return {
          // Once `act` has returned: the hold and the limit start here.
          arm() {
            armed = true;
            armedFrames = frames;
            quietSince = performance.now();
            still = 0;
            timeline.push(`${at()} ms act done`);
            limitTimer = setTimeout(() => {
              // Frames drawn since `act` returned, and since the reading
              // last changed: a page that drew too few has not shown whether
              // it has come to rest, and the reading is not to blame.
              const drawn = frames - armedFrames;
              const heldMs = Math.round(performance.now() - quietSince);
              const heldFrames = frames - Math.max(changedFrames, armedFrames);
              const stalled =
                drawn < hold || (heldMs >= quiet && heldFrames < hold)
                  ? `: the page drew too few frames to tell`
                  : "";
              finish(
                false,
                moves === true && !moved
                  ? `never changed in ${limit} ms and ${drawn} frames${stalled}`
                  : animating
                    ? `was still animating ${limit} ms on, its reading last changed ${Math.round(performance.now() - changedAt)} ms ago`
                    : heldMs >= quiet
                      ? `held still for ${heldMs} ms but only ${heldFrames} frames${stalled}`
                      : `was still changing ${limit} ms on, its last change ${Math.round(performance.now() - changedAt)} ms ago${stalled}`,
              );
            }, limit);
            return result;
          },
          stop() {
            end();
          },
        };
      },
      { read: reader, arg, moves, animations, hold, quiet, limit },
    );
    await act();
    return await withinLimit(
      watch.evaluate((watching) => watching.arm()),
      limit,
    );
  } finally {
    // As in glideEnded: stopped and released without waiting on the page.
    watch
      ?.evaluate((watching) => watching.stop())
      .then(() => watch.dispose())
      .catch(() => {});
    reader.dispose().catch(() => {});
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
