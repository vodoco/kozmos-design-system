import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { Backdrop, Button, Navbar, ThemeProvider } from "@kozmos-ds/react";

/**
 * A page with a sticky Navbar and a map under it, for
 * scripts/check-backdrop-portal.mjs: the map isolates its stacking as
 * MapView does since site GAP-40 (`isolate`), and holds "Add desk", which a
 * Backdrop rendered inside the map lights, with a step card as its child.
 */
interface Mount {
  isolate: boolean;
  placement?: "fixed" | "inline";
}

const counts = { target: 0, card: 0 };

function Page({ isolate, placement }: Mount) {
  const target = React.useRef<HTMLButtonElement>(null);
  return (
    <>
      <Navbar id="navbar" logo={<span>Pointr Cloud</span>} />
      <div
        id="map"
        className="bg-muted"
        style={{
          position: "relative",
          height: 520,
          isolation: isolate ? "isolate" : undefined,
        }}
      >
        <div style={{ position: "absolute", top: 120, left: 80 }}>
          <Button
            ref={target}
            id="target"
            variant="outline"
            onClick={() => {
              counts.target += 1;
            }}
          >
            Add desk
          </Button>
        </div>
        <Backdrop id="backdrop" target={target} placement={placement}>
          <section
            id="card"
            role="dialog"
            aria-label="Step 1 of 3"
            className="bg-background"
            style={{ position: "absolute", top: 220, left: 80, padding: 16 }}
          >
            <Button
              id="next"
              onClick={() => {
                counts.card += 1;
              }}
            >
              Next
            </Button>
          </section>
        </Backdrop>
      </div>
    </>
  );
}

let root: Root | null = null;
function mount(options: Mount) {
  root?.unmount();
  counts.target = 0;
  counts.card = 0;
  root = createRoot(document.getElementById("fixture")!);
  flushSync(() =>
    root!.render(
      <ThemeProvider theme="light">
        <Page {...options} />
      </ThemeProvider>,
    ),
  );
}

declare global {
  interface Window {
    backdropPortal: { mount: typeof mount; counts: typeof counts };
  }
}
window.backdropPortal = { mount, counts };
