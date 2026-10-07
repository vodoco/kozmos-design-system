import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  ALatinNameInARightToLeftCard,
  RightToLeftWordsInALeftToRightCard,
} from "./POIResultDirection.fixture";

type Mounted = Awaited<
  ReturnType<Parameters<Parameters<typeof test>[1]>[0]["mount"]>
>;

/**
 * Where a text's words are drawn: the direction its element computes, the
 * line's two edges, and the boxes of its first and last characters.
 */
const read = (component: Mounted, text: string) =>
  component.evaluate((host, text) => {
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let node: Text | null = null;
    while (walker.nextNode()) {
      if (walker.currentNode.textContent === text) {
        node = walker.currentNode as Text;
        break;
      }
    }
    if (!node) throw new Error(`no text "${text}"`);
    const box = (start: number, end: number) => {
      const range = document.createRange();
      range.setStart(node!, start);
      range.setEnd(node!, end);
      return range.getBoundingClientRect();
    };
    const all = box(0, text.length);
    const first = box(0, 1);
    const last = box(text.length - 1, text.length);
    return {
      direction: getComputedStyle(node.parentElement!).direction,
      left: all.left,
      right: all.right,
      first: { left: first.left, right: first.right },
      last: { left: last.left, right: last.right },
    };
  }, text);

// GAP-125. A right-to-left language's name or summary in a left-to-right card
// took the card's direction, so its full stop was drawn at the words' right,
// after their start, and a clamped summary's ellipsis on the wrong side. Each
// takes its direction from its own words, and stays aligned with the card:
// the line starts where the card's other lines start.
test("Arabic and Hebrew words in a left-to-right card run right to left, from the card's start", async ({
  mount,
}) => {
  const component = await mount(<RightToLeftWordsInALeftToRightCard />);
  const category = await read(component, "Pharmacy");
  for (const words of ["صيدلية.", "פתוחה עד חצות."]) {
    const drawn = await read(component, words);
    expect(drawn.direction, words).toBe("rtl");
    // The full stop ends the words, so it is drawn to the left of their first letter.
    expect(drawn.last.right, words).toBeLessThanOrEqual(drawn.first.left + 0.5);
    expect(Math.abs(drawn.left - category.left), words).toBeLessThan(1);
  }
});

// The other way round, the common case in an Arabic interface: a Latin brand
// name keeps a left-to-right direction, so its closing bracket closes it, and
// it stays at the card's start, the right.
test("a Latin name in a right-to-left card runs left to right, from the card's start", async ({
  mount,
}) => {
  const component = await mount(<ALatinNameInARightToLeftCard />);
  const category = await read(component, "مقهى");
  const name = await read(component, "Costa Coffee (B)");
  expect(name.direction).toBe("ltr");
  expect(name.last.left).toBeGreaterThanOrEqual(name.first.right - 0.5);
  expect(Math.abs(name.right - category.right)).toBeLessThan(1);
});
