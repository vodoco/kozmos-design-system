import React from "react";
import { createRoot } from "react-dom/client";
import {
  AdaptiveMapShell,
  BottomNavigation,
  Button,
  buttonVariants,
  Listbox,
  MapOverlay,
  MapView,
  Navbar,
  Pagination,
  PaginationContent,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
  PaginationItem,
  PaginationLink,
  SplitButton,
  Surface,
  Text,
  ThemeProvider,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kozmos-ds/react";
import { Home01, SearchMd, Settings01 } from "@kozmos-ds/icons";

/* The core defects the website found and recorded in apps/site/GAPS.md, in
   the site's own numbering: GAP-09, 40, 55, 68, 73, 74 and 94.
   scripts/check-site-gaps.mjs reads each one here, in every engine. */

type Theme = "light" | "dark";
type View = "parts" | "stacking" | "shell";

declare global {
  interface Window {
    renderSiteGaps: (view: View) => void;
  }
}

const CATEGORY_FILLS = [
  "blue",
  "green",
  "navy",
  "orange",
  "pink",
  "red",
  "turquoise",
  "yellow",
];

const LONG =
  "Terminal 2, departures level, beside the security lanes and opposite the pharmacy, open from five in the morning until the last flight leaves";

function Parts({ theme }: { theme: Theme }) {
  const id = (part: string) => `${theme}-${part}`;
  return (
    <div style={{ display: "grid", gap: 24, padding: 16 }}>
      {/* GAP-09: a Button drawn on a link, as the README's navigation
          pattern draws one: buttonVariants on the product's own anchor. */}
      <div data-testid={id("gap09")} style={{ display: "flex", gap: 8 }}>
        <a
          className={buttonVariants()}
          data-testid={id("gap09-default")}
          href="#default"
        >
          Get started
        </a>
        <a
          className={buttonVariants({ variant: "outline" })}
          data-testid={id("gap09-variants")}
          href="#variants"
        >
          Read the docs
        </a>
        <a
          className={buttonVariants({ variant: "link" })}
          data-testid={id("gap09-link")}
          href="#link"
        >
          More
        </a>
        <a
          className={`${buttonVariants({ variant: "ghost" })} underline`}
          data-testid={id("gap09-caller")}
          href="#caller"
        >
          Underlined on purpose
        </a>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink data-testid={id("gap09-page")} href="#1">
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#2" isActive>
                2
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* GAP-55: a Listbox whose options are wider than it is. */}
      <div style={{ width: 280 }}>
        <Listbox
          aria-label="Results"
          data-testid={id("gap55")}
          options={[
            { value: "short", label: "Gate 12" },
            { value: "long", label: LONG, description: LONG },
            { value: "described", label: "Pharmacy", description: LONG },
          ]}
        />
      </div>

      {/* GAP-68: BottomNavigation at both densities, as its story holds it. */}
      {(["compact", "default"] as const).map((density) => (
        <div
          key={density}
          style={{ position: "relative", height: 120, width: 375 }}
        >
          <BottomNavigation
            className="absolute"
            data-testid={id(`gap68-${density}`)}
            density={density}
            items={[
              { icon: <Home01 />, label: "Home", active: true },
              { icon: <SearchMd />, label: "Search" },
              { icon: <Settings01 />, label: "Settings" },
            ]}
          />
        </div>
      ))}

      {/* GAP-73: SplitButton's seam, in both directions. */}
      {(["ltr", "rtl"] as const).map((dir) => (
        <ThemeProvider key={dir} dir={dir} theme={theme}>
          <div style={{ display: "flex", gap: 16 }}>
            {(["outline", "default"] as const).map((variant) => (
              <SplitButton
                key={variant}
                data-testid={id(`gap73-${variant}-${dir}`)}
                menuItems={[{ label: "Save as draft", onClick: () => {} }]}
                variant={variant}
              >
                Save
              </SplitButton>
            ))}
          </div>
        </ThemeProvider>
      ))}

      {/* GAP-74: an open Tooltip on each side, far enough apart that none
          covers another. */}
      <TooltipProvider>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            padding: "56px 64px",
          }}
        >
          {(["top", "bottom", "left", "right"] as const).map((side) => (
            <Tooltip key={side} open>
              <TooltipTrigger asChild>
                <Button variant="outline">{side}</Button>
              </TooltipTrigger>
              <TooltipContent
                data-testid={id(`gap74-${side}`)}
                side={side}
                // The trigger's own room on each side; the check reads the
                // join where the tail meets the body.
                avoidCollisions={false}
              >
                Add to library
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      {/* PopoverArrow, whose defaults match Tooltip's tip. */}
      <div style={{ display: "flex", gap: 240, padding: "120px 64px 0" }}>
        {(["top", "bottom"] as const).map((side) => (
          <Popover key={side} open modal={false}>
            <PopoverTrigger asChild>
              <Button variant="outline">{`popover ${side}`}</Button>
            </PopoverTrigger>
            <PopoverContent
              avoidCollisions={false}
              data-testid={id(`gap74-popover-${side}`)}
              onOpenAutoFocus={(event) => event.preventDefault()}
              side={side}
              style={{ width: 160, padding: 8 }}
            >
              Level 2
              <PopoverArrow />
            </PopoverContent>
          </Popover>
        ))}
      </div>

      {/* GAP-94: muted words on the glass, over each category's fill, beside
          an owned muted line; on a solid card inside the glass; off it. */}
      <div style={{ display: "grid", gap: 8 }}>
        {CATEGORY_FILLS.map((fill) => (
          <div
            key={fill}
            data-testid={id(`gap94-${fill}`)}
            style={{
              background: `var(--semantics-category-fill-${fill})`,
              padding: 24,
            }}
          >
            <Surface
              variant="glass"
              data-testid={id(`gap94-${fill}-glass`)}
              style={{ padding: 16, borderRadius: 16 }}
            >
              <Text color="muted" data-testid={id(`gap94-${fill}-text`)}>
                Level 2, 40 m
              </Text>
              <p
                className="kozmos-reset kozmos-muted-text"
                data-testid={id(`gap94-${fill}-owned`)}
              >
                Level 2, 40 m
              </p>
              <Surface style={{ padding: 8, marginTop: 8 }}>
                <Text color="muted" data-testid={id(`gap94-${fill}-solid`)}>
                  On a card of its own
                </Text>
              </Surface>
              {/* An empty patch of the glass, to read the glass as drawn. */}
              <div
                data-testid={id(`gap94-${fill}-patch`)}
                style={{ height: 12, marginTop: 8 }}
              />
            </Surface>
          </div>
        ))}
        <Text color="muted" data-testid={id("gap94-page")}>
          Off the glass
        </Text>
      </div>
    </div>
  );
}

const overlayBox: React.CSSProperties = {
  width: 160,
  height: 48,
  background: "var(--primitives-colors-background-0)",
  pointerEvents: "auto",
};

/* GAP-40: a sticky Navbar over a page that scrolls maps under it. */
function Stacking() {
  return (
    <ThemeProvider theme="light">
      <Navbar data-testid="gap40-navbar" logo={<strong>Kozmos</strong>} />
      <div style={{ height: 600 }} />
      <MapView data-testid="gap40-framed" mapLabel="Framed map">
        <MapOverlay position="top-start">
          <div data-testid="gap40-framed-overlay" style={overlayBox}>
            Floor list
          </div>
        </MapOverlay>
      </MapView>
      <div style={{ height: 600 }} />
      <div style={{ height: 400 }}>
        <MapView data-testid="gap40-fill" mapLabel="Filling map" variant="fill">
          <MapOverlay position="top-start">
            <div data-testid="gap40-fill-overlay" style={overlayBox}>
              Floor list
            </div>
          </MapOverlay>
        </MapView>
      </div>
      <div style={{ height: 1200 }} />
    </ThemeProvider>
  );
}

/* GAP-40 inside the shell: what the map draws, at any z-index, stays under
   the shell's own top bar, controls and panel. A map engine's layers take
   z-indexes of their own (the Pointr SDK's 9999 and 10000). */
function Shell() {
  return (
    <ThemeProvider theme="light">
      <AdaptiveMapShell
        style={{ width: 900, height: 640 }}
        map={
          <MapView data-testid="gap40-shell-map" mapLabel="Map" variant="fill">
            <div
              data-testid="gap40-shell-layer"
              style={{ position: "absolute", inset: 0, zIndex: 9999 }}
            />
            <MapOverlay position="top-start" width="full">
              <div
                data-testid="gap40-shell-overlay"
                style={{ ...overlayBox, width: "100%", height: 600 }}
              />
            </MapOverlay>
          </MapView>
        }
        topBar={
          <Button data-testid="gap40-shell-top-bar" style={{ width: "100%" }}>
            Search
          </Button>
        }
        controls={<Button data-testid="gap40-shell-controls">Locate</Button>}
        panel={
          <div data-testid="gap40-shell-panel" style={{ height: 240 }}>
            Details
          </div>
        }
        panelPlacement="start"
      />
    </ThemeProvider>
  );
}

function Fixture({ view }: { view: View }) {
  if (view === "stacking") return <Stacking />;
  if (view === "shell") return <Shell />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {(["light", "dark"] as const).map((theme) => (
        <ThemeProvider key={theme} theme={theme}>
          <Parts theme={theme} />
        </ThemeProvider>
      ))}
    </div>
  );
}

const root = createRoot(document.getElementById("fixture")!);
window.renderSiteGaps = (view) => root.render(<Fixture view={view} />);
