import { createRoot } from "react-dom/client";
import {
  ThemeProvider,
  DatePicker,
  DateRangePicker,
  TimePicker,
} from "@kozmos-ds/react";

function Fields({ id }: { id: string }) {
  return (
    <section data-testid={id} style={{ width: 420 }}>
      <DatePicker label={`${id} date`} defaultValue="2026-09-18" />
      <TimePicker label={`${id} time`} defaultValue="14:30" />
      <DateRangePicker
        label={`${id} stay`}
        startLabel={`${id} arrival`}
        endLabel={`${id} departure`}
        defaultValue={{ start: "2026-09-18", end: "2026-09-20" }}
      />
      <DatePicker label={`${id} disabled`} disabled />
      <TimePicker label={`${id} readonly`} readOnly defaultValue="14:30" />
      <DatePicker label={`${id} error`} error="Invalid date" />
    </section>
  );
}
createRoot(document.getElementById("fixture")!).render(
  <ThemeProvider theme="dark" dir="rtl">
    <Fields id="outer" />
    <ThemeProvider theme="light" dir="ltr">
      <Fields id="nested" />
    </ThemeProvider>
  </ThemeProvider>,
);
