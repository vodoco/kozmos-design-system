import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { POIResultCard } from "../src/components/POIResultCard/POIResultCard";

// A phone's card in a wide face: CI's Linux draws the system stack in DejaVu
// Sans, which Verdana matches in width.
const card: React.CSSProperties = {
  width: 340,
  fontFamily: "Verdana, 'DejaVu Sans', sans-serif",
};

/** An English card whose name is Arabic and whose summary is Hebrew. */
export function RightToLeftWordsInALeftToRightCard() {
  return (
    <ThemeProvider theme="light" dir="ltr">
      <div style={card}>
        <POIResultCard
          poi={{
            id: "pharmacy",
            name: "صيدلية.",
            categoryLabel: "Pharmacy",
            floorLabel: "Level 2",
            media: [],
            actions: [],
          }}
          result={{
            poiId: "pharmacy",
            resultIndex: 1,
            selected: false,
            featured: false,
            nameLanguage: "ar",
            summary: "פתוחה עד חצות.",
            summaryLanguage: "he",
          }}
          onSelect={() => {}}
        />
      </div>
    </ThemeProvider>
  );
}

/** An Arabic card whose name is a Latin brand's. */
export function ALatinNameInARightToLeftCard() {
  return (
    <ThemeProvider theme="light" dir="rtl">
      <div style={card}>
        <POIResultCard
          poi={{
            id: "costa",
            name: "Costa Coffee (B)",
            categoryLabel: "مقهى",
            floorLabel: "الطابق الثاني",
            media: [],
            actions: [],
          }}
          result={{
            poiId: "costa",
            resultIndex: 1,
            selected: false,
            featured: false,
            nameLanguage: "en",
          }}
          onSelect={() => {}}
        />
      </div>
    </ThemeProvider>
  );
}
