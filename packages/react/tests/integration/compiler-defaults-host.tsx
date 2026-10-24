import type { CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@kozmos-ds/react";

// Kozmos's utilities that read Tailwind's compiler variables, each beside a
// reference that writes the same result out by hand
// (scripts/check-compiler-defaults.mjs).
const box: CSSProperties = { width: 100, height: 100 };
const samples: [string, string, CSSProperties][] = [
  [
    "translate",
    "-translate-x-1/2 -translate-y-1/2",
    { transform: "translate(-50%, -50%)" },
  ],
  ["rotate", "rotate-180", { transform: "rotate(180deg)" }],
  [
    "ring",
    "ring-2 ring-offset-2",
    {
      boxShadow: "0 0 0 2px #fff, 0 0 0 4px rgb(59 130 246 / .5), 0 0 #0000",
    },
  ],
  [
    "ring-inset",
    "ring-2 ring-inset",
    {
      boxShadow:
        "inset 0 0 0 0px #fff, inset 0 0 0 2px rgb(59 130 246 / .5), 0 0 #0000",
    },
  ],
  [
    "shadow",
    "shadow-lg",
    {
      boxShadow: "0 0 #0000, 0 0 #0000, var(--shadow-lg)",
    },
  ],
  ["backdrop", "backdrop-blur-sm", { backdropFilter: "blur(4px)" }],
  ["numeric", "tabular-nums", { fontVariantNumeric: "tabular-nums" }],
  ["snap", "snap-x snap-mandatory", { scrollSnapType: "x mandatory" }],
];

function Samples() {
  return (
    <>
      {samples.map(([id, className, reference]) => (
        <div key={id} style={{ display: "flex", gap: 8, margin: 40 }}>
          <div data-testid={id} className={className} style={box} />
          <div
            data-testid={`${id}-reference`}
            style={{ ...box, ...reference }}
          />
        </div>
      ))}
      {/* A parent's value does not reach its child: the child's transform is
          its own rotation alone. */}
      <div className="-translate-y-1/2" style={{ ...box, margin: 40 }}>
        <div
          data-testid="child"
          className="rotate-180"
          style={{ width: 40, height: 40 }}
        />
      </div>
      <div
        data-testid="child-reference"
        style={{ width: 40, height: 40, transform: "rotate(180deg)" }}
      />
    </>
  );
}

createRoot(document.getElementById("fixture")!).render(
  <>
    <ThemeProvider theme="light">
      <section data-testid="light">
        <Samples />
      </section>
    </ThemeProvider>
    <ThemeProvider theme="dark">
      <section data-testid="dark">
        <Samples />
      </section>
    </ThemeProvider>
  </>,
);
