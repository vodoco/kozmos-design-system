import { test, expect } from "@playwright/experimental-ct-react";
import type { Locator } from "@playwright/test";
import React from "react";
import { SegmentedColumn } from "./SegmentedShrink.fixture";

// GAP-267 (decision 201): SegmentedControl's options keep their width, 97,
// 117 or 137 by size, when there is room, and shrink to their words when the
// space is short; never narrower than their words, so the words are never
// clipped and never run into the next option's. Three small options took
// 301 and scrolled inside OpeningHoursEditor's 296 column.

type Drawn = {
  track: { width: number; clientWidth: number; scrollWidth: number };
  options: {
    width: number;
    words: number;
    clipped: boolean;
    left: number;
    right: number;
  }[];
};

/** The track and each option: its width, and its words' with its padding. */
const measure = (column: Locator): Promise<Drawn> =>
  column.evaluate((root) => {
    const track = root.querySelector('[role="group"]') as HTMLElement;
    const options = [
      ...track.querySelectorAll<HTMLElement>('[role="radio"]'),
    ].map((option) => {
      const range = document.createRange();
      range.selectNodeContents(option);
      const style = getComputedStyle(option);
      const box = option.getBoundingClientRect();
      return {
        width: box.width,
        words:
          range.getBoundingClientRect().width +
          parseFloat(style.paddingLeft) +
          parseFloat(style.paddingRight),
        clipped: option.scrollWidth > option.clientWidth,
        left: box.left,
        right: box.right,
      };
    });
    return {
      track: {
        width: track.getBoundingClientRect().width,
        clientWidth: track.clientWidth,
        scrollWidth: track.scrollWidth,
      },
      options,
    };
  });

const minimum = { sm: 97, default: 117, lg: 137 } as const;

/** Each option at least its words, none clipped, none over the next. */
function expectWordsWhole(drawn: Drawn) {
  for (const [i, option] of drawn.options.entries()) {
    expect(option.width, `option ${i + 1} width`).toBeGreaterThanOrEqual(
      option.words - 0.5,
    );
    expect(option.clipped, `option ${i + 1} clipped`).toBe(false);
    const next = drawn.options[i + 1];
    if (next)
      expect(option.right, `option ${i + 1} over the next`).toBeLessThanOrEqual(
        next.left + 0.5,
      );
  }
}

for (const face of [undefined, "wide"] as const) {
  const faceName = face ? "a wide face" : "the system face";

  for (const size of ["sm", "default", "lg"] as const)
    for (const words of ["en", "de"] as const)
      test(`with room (640), ${size} options keep ${minimum[size]} or their words, in ${words}, ${faceName}`, async ({
        mount,
      }) => {
        const component = await mount(
          <SegmentedColumn width={640} size={size} words={words} face={face} />,
        );
        const drawn = await measure(component.getByTestId("column"));
        test.info().annotations.push({
          type: "measured",
          description: JSON.stringify(drawn),
        });
        for (const [i, option] of drawn.options.entries())
          expect(option.width, `option ${i + 1}`).toBeCloseTo(
            Math.max(minimum[size], option.words),
            0,
          );
        expect(drawn.track.scrollWidth).toBeLessThanOrEqual(
          drawn.track.clientWidth,
        );
        expectWordsWhole(drawn);
      });

  test(`in a 296 column, three small English options fit without scrolling, ${faceName}`, async ({
    mount,
  }) => {
    const component = await mount(
      <SegmentedColumn width={296} words="en" face={face} />,
    );
    const drawn = await measure(component.getByTestId("column"));
    test.info().annotations.push({
      type: "measured",
      description: JSON.stringify(drawn),
    });
    expect(drawn.track.width).toBeLessThanOrEqual(296);
    expect(drawn.track.scrollWidth).toBeLessThanOrEqual(
      drawn.track.clientWidth,
    );
    // Short of room, an option gave some of its 97 up.
    expect(Math.min(...drawn.options.map((o) => o.width))).toBeLessThan(97);
    expectWordsWhole(drawn);
  });

  test(`in a 296 column, three small German options shrink to their words, and scroll only when the words alone are wider, ${faceName}`, async ({
    mount,
  }) => {
    const component = await mount(
      <SegmentedColumn width={296} words="de" face={face} />,
    );
    const drawn = await measure(component.getByTestId("column"));
    test.info().annotations.push({
      type: "measured",
      description: JSON.stringify(drawn),
    });
    expect(drawn.track.width).toBeLessThanOrEqual(296);
    expectWordsWhole(drawn);
    const words = drawn.options.reduce((sum, o) => sum + o.words, 0);
    // The track's 4 of padding and 1 of edge each side.
    if (words + 10 <= 296)
      expect(drawn.track.scrollWidth).toBeLessThanOrEqual(
        drawn.track.clientWidth,
      );
    else
      for (const option of drawn.options)
        expect(option.width).toBeCloseTo(option.words, 0);
  });

  test(`full width in a narrow column, no option is narrower than its words, ${faceName}`, async ({
    mount,
  }) => {
    const component = await mount(
      <SegmentedColumn width={240} words="de" fullWidth face={face} />,
    );
    const drawn = await measure(component.getByTestId("column"));
    test.info().annotations.push({
      type: "measured",
      description: JSON.stringify(drawn),
    });
    expectWordsWhole(drawn);
  });
}
