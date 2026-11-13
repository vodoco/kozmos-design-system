// The overflow's arithmetic, apart from the component so the tests can reach
// it without it joining the entry's exports.

/**
 * How many items fit in `available`: all of them, or as many from the start
 * as leave room for the More button after them. A divider counts as an
 * item; the toolbar drops one left at the end.
 */
export function fitMapEditToolbarItems(
  widths: number[],
  available: number,
  moreWidth: number,
  gap: number,
): number {
  const total = (count: number) =>
    widths.slice(0, count).reduce((sum, width) => sum + width, 0) +
    Math.max(0, count - 1) * gap;
  if (total(widths.length) <= available) return widths.length;
  let count = widths.length - 1;
  while (count > 0 && total(count) + gap + moreWidth > available) count--;
  return count;
}
