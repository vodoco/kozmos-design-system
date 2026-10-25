/**
 * The calendar's arithmetic and the locale's names, for Calendar (and the
 * pickers that open it). A day is a whole number: days since 1970-01-01, so
 * a step is +1 and an order is <. Every date is read and written as UTC, so
 * no time zone or daylight-saving change moves a day; the reader's own today
 * is the one local read (`localToday`).
 */

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MONTH = /^(\d{4})-(\d{2})$/;

/** `YYYY-MM-DD` as a day, or null for anything that is not a real date. */
export function toDay(value: string | null | undefined): number | null {
  const match = value ? ISO_DATE.exec(value) : null;
  if (!match) return null;
  const day = Date.UTC(+match[1], +match[2] - 1, +match[3]) / DAY_MS;
  // Date.UTC rolls 2026-02-31 into March and month 13 into the next year;
  // a date that rolled is not one.
  return toIso(day) === value ? day : null;
}

/** A day as `YYYY-MM-DD`. */
export const toIso = (day: number) =>
  new Date(day * DAY_MS).toISOString().slice(0, 10);

/** A month as one number, year × 12 + its index, so a step is ±1. */
export const monthOf = (day: number) => {
  const date = new Date(day * DAY_MS);
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
};

/** `YYYY-MM` as a month, or null. */
export function toMonth(value: string | null | undefined): number | null {
  const match = value ? ISO_MONTH.exec(value) : null;
  if (!match || +match[2] < 1 || +match[2] > 12) return null;
  return +match[1] * 12 + +match[2] - 1;
}

/** A month as `YYYY-MM`. */
export const toMonthIso = (month: number) =>
  toIso(firstOfMonth(month)).slice(0, 7);

export const firstOfMonth = (month: number) =>
  Date.UTC(Math.floor(month / 12), month % 12, 1) / DAY_MS;

export const weekdayOf = (day: number) => new Date(day * DAY_MS).getUTCDay();

/** The same date `months` later, on the month's last day where it has fewer. */
export function addMonths(day: number, months: number) {
  const target = monthOf(day) + months;
  const length = firstOfMonth(target + 1) - firstOfMonth(target);
  return (
    firstOfMonth(target) +
    Math.min(new Date(day * DAY_MS).getUTCDate(), length) -
    1
  );
}

/** The 42 days a month's grid shows: six weeks from its first week's start. */
export function monthGrid(month: number, firstDay: number) {
  const first = firstOfMonth(month);
  const start = first - ((weekdayOf(first) - firstDay + 7) % 7);
  return Array.from({ length: 42 }, (_, index) => start + index);
}

/** The reader's today, from their own clock and time zone. */
export function localToday(now = new Date()) {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS;
}

// CLDR's first day of the week, for an engine without Intl.Locale's week
// information (Firefox 146 has none). Regions that start on Sunday or on
// Saturday; the Maldives start on Friday, and the rest of the world on
// Monday. Read from Chromium 145's getWeekInfo() on 21 Oct 2026, region by
// region; WebKit 26.0 ships older data (AE, DZ and JO on Saturday, CN and IS
// on Sunday).
const SUNDAY_FIRST =
  "AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW";
const SATURDAY_FIRST = "AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY";

/** The first day of the week in a region, 0 for Sunday to 6 for Saturday. */
export function regionFirstDay(region: string | undefined) {
  if (!region) return 1;
  if (SUNDAY_FIRST.includes(region)) return 0;
  if (SATURDAY_FIRST.includes(region)) return 6;
  return region === "MV" ? 5 : 1;
}

type WeekInfoLocale = Intl.Locale & {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
};

/** The locale's first day of the week, 0 for Sunday to 6 for Saturday. */
export function firstDayOfWeek(locale: string) {
  try {
    const tag = new Intl.Locale(locale) as WeekInfoLocale;
    // Intl counts Monday 1 to Sunday 7; Date counts Sunday 0.
    const info = tag.getWeekInfo?.() ?? tag.weekInfo;
    if (info?.firstDay) return info.firstDay % 7;
    return regionFirstDay(tag.maximize().region);
  } catch {
    return 1;
  }
}

/**
 * The locale to name dates in: the caller's, else the document's language,
 * else the browser's, else English. A tag no engine knows falls back too.
 */
export function resolveLocale(locale?: string) {
  const document = globalThis.document;
  for (const tag of [
    locale,
    document?.documentElement.lang,
    globalThis.navigator?.language,
  ]) {
    if (!tag) continue;
    try {
      if (Intl.DateTimeFormat.supportedLocalesOf(tag).length) return tag;
    } catch {
      // An invalid tag throws; try the next.
    }
  }
  return "en-US";
}
