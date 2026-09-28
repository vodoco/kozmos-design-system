import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  travelTimeBand,
  travelTimeTone,
  type TravelTimeBand,
} from "../src/index";

/**
 * Decision 50 (Olcay, 2026-09-28): the product passes the walking time it
 * already has, and Kozmos owns the rule that turns it into a band. The rule
 * is written three times, once per platform, so the cases are written once:
 * `travel-time-bands.txt`, which the SwiftUI and Compose suites read too.
 */

/** Every band, nearest first. */
const bands: readonly TravelTimeBand[] = [
  "nearby",
  "oneToTwoMinutes",
  "twoToFiveMinutes",
  "fiveToTenMinutes",
  "moreThanTenMinutes",
];

interface Case {
  line: number;
  text: string;
  seconds: number;
  band: TravelTimeBand | undefined;
}

/** The shared table, one case per line; `#` starts a comment. */
function readCases(): Case[] {
  const source = readFileSync(
    new URL("./travel-time-bands.txt", import.meta.url),
    "utf8",
  );
  const cases: Case[] = [];
  source.split("\n").forEach((raw, index) => {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) return;
    const [text, band, extra] = line.split(/\s+/);
    const seconds = Number(text);
    if (
      extra !== undefined ||
      (Number.isNaN(seconds) && text !== "NaN") ||
      (band !== "none" && !bands.includes(band as TravelTimeBand))
    )
      throw new Error(`travel-time-bands.txt:${index + 1} reads "${raw}"`);
    cases.push({
      line: index + 1,
      text,
      seconds,
      band: band === "none" ? undefined : (band as TravelTimeBand),
    });
  });
  return cases;
}

describe("travelTimeBand", () => {
  const cases = readCases();

  it("reads a table that names every band and a walk with none", () => {
    const named = new Set(cases.map((entry) => entry.band));
    expect([...bands, undefined].filter((band) => !named.has(band))).toEqual(
      [],
    );
  });

  it("puts every walk in the table in the table's band", () => {
    const wrong = cases
      .map((entry) => ({ ...entry, got: travelTimeBand(entry.seconds) }))
      .filter((entry) => entry.got !== entry.band)
      .map(
        (entry) =>
          `line ${entry.line}: ${entry.text} s read ${entry.got ?? "none"}, not ${entry.band ?? "none"}`,
      );
    expect(wrong).toEqual([]);
  });

  it("keeps each band's upper edge, and gives the next second to the next band", () => {
    // The question for Olcay, as behaviour: a place 2 minutes away reads
    // "1–2 min"; 2 min 1 s reads "2–5 min".
    expect(travelTimeBand(59)).toBe("nearby");
    expect(travelTimeBand(60)).toBe("oneToTwoMinutes");
    expect(travelTimeBand(120)).toBe("oneToTwoMinutes");
    expect(travelTimeBand(121)).toBe("twoToFiveMinutes");
    expect(travelTimeBand(300)).toBe("twoToFiveMinutes");
    expect(travelTimeBand(301)).toBe("fiveToTenMinutes");
    expect(travelTimeBand(600)).toBe("fiveToTenMinutes");
    expect(travelTimeBand(601)).toBe("moreThanTenMinutes");
  });

  it("puts every walk up to 20 minutes in exactly one band, nearest first", () => {
    // A quarter of a second at a time: no walk falls in none, and the bands
    // never come back, so each is one unbroken stretch in order.
    const gaps: number[] = [];
    const backwards: string[] = [];
    let previous = 0;
    for (let quarter = 0; quarter <= 20 * 60 * 4; quarter += 1) {
      const band = travelTimeBand(quarter / 4);
      if (band === undefined) {
        gaps.push(quarter / 4);
        continue;
      }
      const at = bands.indexOf(band);
      if (at < previous)
        backwards.push(
          `${quarter / 4} s reads ${band} after ${bands[previous]}`,
        );
      previous = Math.max(previous, at);
    }
    expect(gaps.slice(0, 5)).toEqual([]);
    expect(backwards.slice(0, 5)).toEqual([]);
    expect(previous).toBe(bands.length - 1);
  });
});

describe("travelTimeTone", () => {
  it("draws Nearby in the success tone and every other band neutral", () => {
    expect(
      Object.fromEntries(bands.map((band) => [band, travelTimeTone(band)])),
    ).toEqual({
      nearby: "success",
      oneToTwoMinutes: "neutral",
      twoToFiveMinutes: "neutral",
      fiveToTenMinutes: "neutral",
      moreThanTenMinutes: "neutral",
    });
  });
});
