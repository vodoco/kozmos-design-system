import { describe, expect, it } from "vitest";
import {
  addMonths,
  firstDayOfWeek,
  monthGrid,
  regionFirstDay,
  resolveLocale,
  toDay,
  toIso,
  toMonth,
  toMonthIso,
} from "./calendar-dates";

describe("calendar dates", () => {
  it("reads only real ISO dates", () => {
    expect(toIso(toDay("2026-05-25")!)).toBe("2026-05-25");
    expect(toIso(toDay("2028-02-29")!)).toBe("2028-02-29");
    for (const value of [
      "2026-02-29",
      "2026-02-31",
      "2026-13-01",
      "2026-5-25",
      "25/05/2026",
      "",
      null,
      undefined,
    ])
      expect(toDay(value), String(value)).toBeNull();
    expect(toMonthIso(toMonth("2026-05")!)).toBe("2026-05");
    expect(toMonth("2026-13")).toBeNull();
  });

  it("steps a month to the same date, or the month's last", () => {
    const step = (iso: string, by: number) => toIso(addMonths(toDay(iso)!, by));
    expect(step("2026-01-31", 1)).toBe("2026-02-28");
    expect(step("2026-03-31", -1)).toBe("2026-02-28");
    expect(step("2028-02-29", 12)).toBe("2029-02-28");
    expect(step("2026-12-15", 1)).toBe("2027-01-15");
  });

  it("starts a month's six weeks on the week's first day", () => {
    const may = toMonth("2026-05")!;
    expect(toIso(monthGrid(may, 0)[0])).toBe("2026-04-26");
    expect(toIso(monthGrid(may, 1)[0])).toBe("2026-04-27");
    expect(toIso(monthGrid(may, 6)[0])).toBe("2026-04-25");
    // A month that starts on the first day still shows a whole first week.
    expect(toIso(monthGrid(toMonth("2026-02")!, 0)[0])).toBe("2026-02-01");
    expect(monthGrid(may, 0)).toHaveLength(42);
  });

  it("knows the first day of the week where Intl does not (Firefox 146)", () => {
    // Intl.Locale's week information, as Chromium and WebKit have it.
    expect(firstDayOfWeek("en-US")).toBe(0);
    expect(firstDayOfWeek("de-DE")).toBe(1);
    expect(firstDayOfWeek("ar-EG")).toBe(6);
    // Without it, the region's, from CLDR.
    const proto = Intl.Locale.prototype;
    const saved = (["getWeekInfo", "weekInfo"] as const).map(
      (key) => [key, Object.getOwnPropertyDescriptor(proto, key)] as const,
    );
    for (const [key] of saved)
      Object.defineProperty(proto, key, {
        value: undefined,
        configurable: true,
      });
    try {
      expect(firstDayOfWeek("en-US")).toBe(0);
      expect(firstDayOfWeek("en")).toBe(0);
      expect(firstDayOfWeek("en-GB")).toBe(1);
      expect(firstDayOfWeek("de")).toBe(1);
      expect(firstDayOfWeek("ar-EG")).toBe(6);
      expect(firstDayOfWeek("he")).toBe(0);
      expect(firstDayOfWeek("dv-MV")).toBe(5);
    } finally {
      for (const [key, descriptor] of saved)
        if (descriptor) Object.defineProperty(proto, key, descriptor);
        else delete (proto as unknown as Record<string, unknown>)[key];
    }
    expect(regionFirstDay(undefined)).toBe(1);
    expect(regionFirstDay("AE")).toBe(1);
  });

  it("names dates in the caller's locale, the document's, the browser's, or English", () => {
    expect(resolveLocale("de-DE")).toBe("de-DE");
    document.documentElement.lang = "fr";
    expect(resolveLocale()).toBe("fr");
    expect(resolveLocale("not a tag")).toBe("fr");
    document.documentElement.lang = "";
    expect(resolveLocale()).toBe(navigator.language);
  });
});
