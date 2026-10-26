import * as React from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Popover,
  PopoverAnchor,
  PopoverContent,
  ThemeProvider,
} from "@kozmos-ds/react";

// GAP-190: popovers the product opens, beside a control they do not own
// (scripts/check-popover-anchor.mjs).
type Side = "top" | "right" | "bottom" | "left";

declare global {
  interface Window {
    openStep?: (side: Side) => void;
    moveFeature?: (x: number, y: number) => void;
    openFeature?: () => void;
  }
}

function TourStep() {
  const target = React.useRef<HTMLButtonElement>(null);
  const [side, setSide] = React.useState<Side | null>(null);
  window.openStep = (next) => setSide(next);
  return (
    <Popover
      open={side !== null}
      onOpenChange={(open) => {
        if (!open) setSide(null);
      }}
    >
      <div
        id="scroller"
        style={{ height: 360, overflowY: "auto", position: "relative" }}
      >
        <div style={{ height: 600, paddingTop: 160 }}>
          {/* Half the window in from the start, so a resize moves it. */}
          <div id="row" style={{ paddingInlineStart: "45%" }}>
            <PopoverAnchor asChild>
              <Button ref={target} variant="outline" id="target">
                Add desk
              </Button>
            </PopoverAnchor>
          </div>
        </div>
      </div>
      <PopoverContent
        id="step"
        side={side ?? "bottom"}
        sideOffset={8}
        avoidCollisions={false}
        aria-label="Step 1 of 3"
        style={{ width: 192 }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          target.current?.focus();
        }}
      >
        <Button size="sm">Next</Button>
      </PopoverContent>
    </Popover>
  );
}

function MapFeature() {
  const map = React.useRef<HTMLDivElement>(null);
  const point = React.useRef({ x: 120, y: 60 });
  const [open, setOpen] = React.useState(false);
  window.openFeature = () => setOpen(true);
  window.moveFeature = (x, y) => {
    point.current = { x, y };
  };
  const feature = React.useRef({
    getBoundingClientRect: () => {
      const box = map.current!.getBoundingClientRect();
      return DOMRect.fromRect({
        x: box.left + point.current.x,
        y: box.top + point.current.y,
        width: 0,
        height: 0,
      });
    },
  });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        ref={map}
        id="map"
        style={{ height: 240, position: "relative" }}
        className="bg-muted"
      />
      <PopoverAnchor virtualRef={feature} />
      <PopoverContent
        id="feature"
        side="top"
        sideOffset={12}
        avoidCollisions={false}
        updatePositionStrategy="always"
        aria-label="Reception desk"
        style={{ width: 192 }}
      >
        Reception desk
      </PopoverContent>
    </Popover>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme="light">
    <main>
      <TourStep />
      <MapFeature />
    </main>
  </ThemeProvider>,
);
