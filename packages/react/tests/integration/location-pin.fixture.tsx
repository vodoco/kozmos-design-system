import React from "react";
import { createRoot } from "react-dom/client";
import { LocationPin, ThemeProvider } from "@kozmos-ds/react";

// The SDK's map result markers (decision 71), each stood on a known point:
// scripts/check-location-pin.mjs measures their shapes, colours and anchors
// against the point, in a light and a dark root, left to right and right to
// left.
const logo = (
  <img
    alt=""
    height={40}
    src={`data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#C8102E"/></svg>',
    )}`}
    width={40}
  />
);

const markers: [string, React.ComponentProps<typeof LocationPin>][] = [
  ["result-1", { label: "Result 1", number: 1, onOpen: () => {} }],
  [
    "result-128",
    {
      label: "Result 128",
      number: 128,
      externalLabel: "Gate B12",
      labelPlacement: "right",
    },
  ],
  ["result-selected", { label: "Result 2", number: 2, selected: true }],
  ["dot", { label: "Gate B12" }],
  ["dot-selected", { label: "Gate B12", selected: true }],
  [
    "featured",
    {
      featured: true,
      label: "Harbour Coffee",
      markerContent: logo,
      onClick: () => {},
    },
  ],
  [
    "featured-selected",
    {
      featured: true,
      label: "Harbour Coffee",
      markerContent: logo,
      selected: true,
      externalLabel: "Harbour Coffee",
      labelPlacement: "left",
    },
  ],
  [
    "place",
    {
      label: "Harbour Coffee",
      place: true,
      featured: true,
      number: 3,
      onClick: () => {},
    },
  ],
  // Disabled with an action: a disabled button to assistive technology, but
  // pointers reach the map under it, as on SwiftUI.
  [
    "result-disabled",
    { label: "Result 9", number: 9, disabled: true, onOpen: () => {} },
  ],
];

function Board({
  theme,
  dir,
}: {
  theme: "light" | "dark";
  dir: "ltr" | "rtl";
}) {
  return (
    <ThemeProvider dir={dir} theme={theme}>
      <div
        data-board={`${theme}-${dir}`}
        style={{ display: "flex", gap: 24, padding: "80px 24px 24px" }}
      >
        {markers.map(([id, props]) => (
          <div
            data-point={`${theme}-${dir}-${id}`}
            key={id}
            style={{ position: "relative", width: 72, height: 1 }}
          >
            <div style={{ position: "absolute", left: 36, top: 0 }}>
              <LocationPin data-pin={`${theme}-${dir}-${id}`} {...props} />
            </div>
          </div>
        ))}
      </div>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("fixture")!).render(
  <>
    <Board dir="ltr" theme="light" />
    <Board dir="ltr" theme="dark" />
    <Board dir="rtl" theme="light" />
  </>,
);
