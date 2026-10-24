import figma from "@figma/code-connect";
import { DateRangePicker } from "./DateRangePicker";

const MONTH_INDEX_BY_NAME: Record<string, number> = {
  apr: 4,
  april: 4,
  aug: 8,
  august: 8,
  dec: 12,
  december: 12,
  feb: 2,
  february: 2,
  jan: 1,
  january: 1,
  jul: 7,
  july: 7,
  jun: 6,
  june: 6,
  mar: 3,
  march: 3,
  may: 5,
  nov: 11,
  november: 11,
  oct: 10,
  october: 10,
  sep: 9,
  sept: 9,
  september: 9,
};

function formatIsoDate(year: number, month: number, day: number) {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function isValidDateParts(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function dateTextToIso(value: string, fallback: string) {
  const normalizedValue = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  const namedDate = normalizedValue.match(
    /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/,
  );
  if (namedDate) {
    const month = MONTH_INDEX_BY_NAME[namedDate[1].toLowerCase()];
    const day = Number(namedDate[2]);
    const year = Number(namedDate[3]);
    if (month && isValidDateParts(year, month, day)) {
      return formatIsoDate(year, month, day);
    }
  }

  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime())
    ? fallback
    : formatIsoDate(
        parsed.getFullYear(),
        parsed.getMonth() + 1,
        parsed.getDate(),
      );
}

figma.connect(
  DateRangePicker,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=443-10939",
  {
    props: {
      disabled: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: true,
        Readonly: false,
      }),
      readOnly: figma.enum("State", {
        Default: false,
        Focus: false,
        Disabled: false,
        Readonly: true,
      }),
      autoFocus: figma.enum("State", {
        Default: false,
        Focus: true,
        Disabled: false,
        Readonly: false,
      }),
      status: figma.enum("Status", {
        Default: "default",
        Error: "error",
        Warning: "warning",
        Success: "success",
      }),
      // The open range calendar, where the browser's own button gives way
      // (decision 105); Firefox keeps the browser's.
      defaultOpen: figma.enum("Content", {
        Closed: false,
        Open: true,
      }),
      label: figma.string("Label Text"),
      startLabel: figma.string("Start Label Text"),
      endLabel: figma.string("End Label Text"),
      startValue: figma.string("Start Value Text"),
      endValue: figma.string("End Value Text"),
      helperText: figma.boolean("Show Helper Text", {
        true: figma.string("Helper Text"),
        false: undefined,
      }),
    },
    example: ({
      autoFocus,
      defaultOpen,
      disabled,
      endLabel,
      endValue,
      helperText,
      label,
      readOnly,
      startLabel,
      startValue,
      status,
    }) => (
      <DateRangePicker
        autoFocus={autoFocus}
        defaultOpen={defaultOpen}
        defaultValue={{
          end: dateTextToIso(endValue, "2026-05-25"),
          start: dateTextToIso(startValue, "2026-05-21"),
        }}
        disabled={disabled}
        endLabel={endLabel}
        helperText={helperText}
        label={label}
        readOnly={readOnly}
        startLabel={startLabel}
        status={status}
      />
    ),
  },
);
