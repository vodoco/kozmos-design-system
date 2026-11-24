import { describe, expect, it } from "vitest";
import type { ElementType } from "react";
import * as KozmosReact from "@kozmos-ds/react";
import {
  KozmosThemeProvider,
  KozmosTimeline,
  KozmosTimelineDescription,
  KozmosTimelineItem,
  KozmosTimelineTime,
  KozmosTimelineTitle,
} from "../../src/index";
import { renderBoth, type Drawn } from "./render";
import { slotted } from "./slotted";

/**
 * React's Timeline stories draw their events with their own render, so the
 * stories parity check cannot draw them from args: here is each (Default is
 * Detailed, Compact Detailed's render at the compact density), drawn in
 * both, and each part with an app's class over its own.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const events = [
  { time: "09:00", title: "Created", description: "Initial event captured." },
  {
    time: "10:30",
    title: "Reviewed",
    description: "Status changed by the team.",
  },
  { time: "Now", title: "Published", description: "Latest update is ready." },
];
const text = (
  react: ElementType,
  vue: Parameters<typeof slotted>[1],
  words: string,
) => slotted(react, vue, {}, { default: [words] });
const timeline = (density: string, items: Drawn[]) =>
  slotted(
    KozmosReact.Timeline,
    KozmosTimeline,
    { density },
    { default: items },
  );
const detailed = (density: string) =>
  timeline(
    density,
    events.map((event) =>
      slotted(
        KozmosReact.TimelineItem,
        KozmosTimelineItem,
        {},
        {
          default: [
            text(KozmosReact.TimelineTime, KozmosTimelineTime, event.time),
            text(KozmosReact.TimelineTitle, KozmosTimelineTitle, event.title),
            text(
              KozmosReact.TimelineDescription,
              KozmosTimelineDescription,
              event.description,
            ),
          ],
        },
      ),
    ),
  );

const both = (tree: Drawn) => renderBoth(inTheme(tree));

describe("KozmosTimeline draws what React's Timeline draws", () => {
  it.each([
    ["Detailed", "default"],
    ["Default", "default"],
    ["Compact", "compact"],
  ])("%s: draws what React's story draws", async (_story, density) => {
    const { react, vue } = await both(detailed(density));
    expect(react).toContain(`data-density="${density}"`);
    expect(react).toContain("data-timeline-marker");
    expect(react).toContain("<time");
    expect(vue).toBe(react);
  });

  it("Basic: draws what React's story draws", async () => {
    const { react, vue } = await both(
      timeline(
        "default",
        events.map((event) =>
          slotted(
            KozmosReact.TimelineItem,
            KozmosTimelineItem,
            {},
            {
              default: [
                text(
                  KozmosReact.TimelineTitle,
                  KozmosTimelineTitle,
                  event.title,
                ),
              ],
            },
          ),
        ),
      ),
    );
    expect(vue).toBe(react);
  });

  it.each([
    ["Timeline", KozmosReact.Timeline, KozmosTimeline],
    ["TimelineItem", KozmosReact.TimelineItem, KozmosTimelineItem],
    ["TimelineTime", KozmosReact.TimelineTime, KozmosTimelineTime],
    ["TimelineTitle", KozmosReact.TimelineTitle, KozmosTimelineTitle],
    [
      "TimelineDescription",
      KozmosReact.TimelineDescription,
      KozmosTimelineDescription,
    ],
  ] as const)(
    "%s takes an app's class over its own",
    async (_name, react, vue) => {
      const drawn = await both(
        slotted(
          react as ElementType,
          vue,
          { className: "mb-0 kozmos-parity", id: "kozmos-parity" },
          { default: ["Created"] },
          { class: "mb-0 kozmos-parity", id: "kozmos-parity" },
        ),
      );
      expect(drawn.vue).toBe(drawn.react);
    },
  );
});
