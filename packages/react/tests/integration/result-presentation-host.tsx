import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, POIResultCard, POIResultGroup } from "@kozmos-ds/react";
import type {
  POIPresentation,
  POIResultPresentation,
} from "@kozmos-ds/product-contracts";

function App() {
  const [selected, setSelected] = useState("single-featured");
  const [action, setAction] = useState("");
  const [dark, setDark] = useState(false);
  const [rtl, setRtl] = useState(false);
  const item = (
    id: string,
    index: number,
    featured = false,
    badge?: string,
  ) => ({
    poi: {
      id,
      name: "Northfield Artisan Bakery & Coffee Roastery",
      categoryLabel: "Bakery",
      floorLabel: "Level 2",
      buildingLabel: "Terminal 3",
      availabilityLabel: "Open",
      availability: "open",
      media: [],
      actions: ["navigate"],
      logo: {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' rx='16' fill='%23963816'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='white' font-family='serif' font-size='20'%3ENB%3C/text%3E%3C/svg%3E",
        alt: "",
      },
    } satisfies POIPresentation,
    result: {
      poiId: id,
      resultIndex: index,
      selected: selected === id,
      featured,
      badge: badge ? { label: badge } : undefined,
      travelEstimate: { durationSeconds: 180, durationLabel: "2–5 min" },
      actions: [
        { action: "navigate", label: "Go", primary: true },
        { action: "details", label: "Details" },
      ],
    } satisfies POIResultPresentation,
  });
  const props = {
    numbered: true,
    presentationStyle: "sdk" as const,
    onSelect: setSelected,
    onAction: (value: string) => setAction(value),
  };
  return (
    <ThemeProvider theme={dark ? "dark" : "light"} dir={rtl ? "rtl" : "ltr"}>
      <button onClick={() => setDark(!dark)}>Theme</button>
      <button onClick={() => setRtl(!rtl)}>Direction</button>
      {/* The host page's own box: without the stylesheet's @scope rules it
          gets no border-box from Kozmos, and its padding would overflow. */}
      <main
        style={{
          width: "100%",
          maxWidth: 390,
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        <POIResultGroup
          {...props}
          label="Grouped results"
          defaultExpanded
          items={[
            item("group-featured", 1234, true),
            item("group-alternative", 2345, false, "Alternative"),
            item("group-standard", 3456),
          ]}
        />
        <POIResultCard {...props} {...item("single-featured", 4567, true)} />
        <POIResultCard
          {...props}
          {...item("single-alternative", 5678, false, "Alternative")}
        />
        <POIResultCard {...props} {...item("single-standard", 6789)} />
      </main>
      <output>{action}</output>
    </ThemeProvider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
