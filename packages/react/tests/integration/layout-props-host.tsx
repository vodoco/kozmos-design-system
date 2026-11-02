import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import {
  AICompanionPanel,
  BottomSheet,
  BottomSheetContent,
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Navbar,
  NavigationItem,
  Search,
  Sidebar,
  ThemeProvider,
  Tree,
  type TreeItem,
} from "@kozmos-ds/react";

/**
 * The 0.15.0 layout props in the built package, for
 * scripts/check-layout-props.mjs: Navbar's navigationAlign (GAP-196),
 * Sidebar's flush inset (GAP-199), Drawer's inline placement (GAP-198),
 * Tree's divided rows (GAP-201) and Navbar's logo column over a rail
 * (GAP-208), each in a provider of the given theme, density and direction.
 */
interface Mount {
  part: "navbar" | "sidebar" | "drawer" | "tree" | "shell";
  theme: "light" | "dark";
  density: "touch" | "compact";
  dir: "ltr" | "rtl";
  navigationAlign?: "start" | "center" | "end";
  inset?: "default" | "flush";
  variant?: "rail" | "expanded";
  header?: boolean;
  placement?: "fixed" | "inline";
  modal?: boolean;
  /** Content taller than the region, so the drawer reaches its most. */
  tall?: boolean;
  /** An open AICompanionPanel in the page beside the drawer. */
  companion?: boolean;
  side?: "left" | "right" | "top" | "bottom";
  /** The docs' recipe: the drawer closes in onInteractOutside. */
  closeOnOutside?: boolean;
  /** No DrawerTrigger: a panel only the page's code opens. */
  noTrigger?: boolean;
  /** The trigger in a focusable box, as Safari focuses for a pressed button. */
  triggerBox?: boolean;
  /** A second inline panel at the left, which the page's code opens. */
  second?: boolean;
  /** A BottomSheet in the region, not a Drawer. */
  sheet?: boolean;
  /** No exit animation, so the panel goes in the commit that closes it. */
  noExit?: boolean;
  logoInset?: boolean;
  divided?: boolean;
  selectedId?: string;
}

const venue: TreeItem[] = [
  {
    id: "terminal-a",
    name: "Terminal A",
    count: 3,
    children: [
      { id: "terminal-a-1", name: "Level 1", count: 128 },
      { id: "terminal-a-2", name: "Level 2", count: 96 },
    ],
  },
  {
    id: "terminal-b",
    name: "Terminal B",
    children: [{ id: "terminal-b-1", name: "Level 1" }],
  },
  { id: "car-park", name: "Car park" },
];

const counts = {
  help: 0,
  /** AICompanionPanel's onClose. */
  companionClosed: 0,
  /** The keys a product's onKeyDown saw, on DrawerContent and round it. */
  contentKeys: [] as string[],
  regionKeys: [] as string[],
  /** Whether each Escape reached the page's document already prevented. */
  escapes: [] as boolean[],
  /** Each onOpenChange the drawer gave. */
  openChanges: [] as boolean[],
  /** The id of what each onInteractOutside the recipe heard was on. */
  outside: [] as string[],
};
/** Opens or closes the drawers from the page's code, as a product does. */
const drawer = {
  setOpen: (_open: boolean) => {},
  setSecondOpen: (_open: boolean) => {},
};

// In the bubble phase, as a page's own handler: Radix listens in the capture
// phase, so what is prevented there is already prevented here.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") counts.escapes.push(event.defaultPrevented);
});

/** A fixed header over a positioned region, the drawer in it, controlled. */
function DrawerPage(props: Mount) {
  const [open, setOpen] = React.useState(false);
  const [secondOpen, setSecondOpen] = React.useState(false);
  const [companionOpen, setCompanionOpen] = React.useState(true);
  drawer.setOpen = setOpen;
  drawer.setSecondOpen = setSecondOpen;
  const trigger = props.noTrigger ? null : (
    <DrawerTrigger asChild>
      <Button id="trigger">Get started</Button>
    </DrawerTrigger>
  );
  return (
    <div
      id="page"
      style={{ display: "flex", flexDirection: "column", height: 600 }}
    >
      <header
        id="header-bar"
        style={{ height: 64, flexShrink: 0, display: "flex", gap: 8 }}
      >
        <button
          id="help"
          type="button"
          onClick={() => {
            counts.help += 1;
          }}
        >
          Help
        </button>
        <Search id="search" aria-label="Search" />
        {props.companion ? (
          <AICompanionPanel
            id="companion"
            aria-label="Assistant"
            open={companionOpen}
            onClose={() => {
              counts.companionClosed += 1;
              setCompanionOpen(false);
            }}
            style={{ position: "static", width: 240, height: 48 }}
          >
            <button id="ask" type="button">
              Ask
            </button>
          </AICompanionPanel>
        ) : null}
      </header>
      <div
        id="region"
        style={{ position: "relative", flex: 1, minHeight: 0 }}
        onKeyDown={(event) => counts.regionKeys.push(event.key)}
      >
        {props.sheet ? (
          <BottomSheet placement="inline" open={open} onOpenChange={setOpen}>
            <BottomSheetContent id="drawer" title="Gate B12">
              <div id="tall" style={{ height: 1200, flexShrink: 0 }} />
            </BottomSheetContent>
          </BottomSheet>
        ) : (
          <Drawer
            placement={props.placement}
            modal={props.modal}
            open={open}
            onOpenChange={(next) => {
              counts.openChanges.push(next);
              setOpen(next);
            }}
          >
            {props.triggerBox ? (
              <div
                id="trigger-box"
                tabIndex={0}
                style={{ display: "inline-block" }}
              >
                {trigger}
              </div>
            ) : (
              trigger
            )}
            <DrawerContent
              id="drawer"
              side={props.side}
              style={props.noExit ? { animation: "none" } : undefined}
              onKeyDown={(event) => counts.contentKeys.push(event.key)}
              onInteractOutside={
                props.closeOnOutside
                  ? (event) => {
                      counts.outside.push((event.target as HTMLElement).id);
                      setOpen(false);
                    }
                  : undefined
              }
            >
              <DrawerHeader>
                <DrawerTitle>Get started</DrawerTitle>
                <DrawerDescription>Tours for this page</DrawerDescription>
              </DrawerHeader>
              <Button id="tour">Start the tour</Button>
              {props.tall && (
                <div id="tall" style={{ height: 1200, flexShrink: 0 }} />
              )}
            </DrawerContent>
          </Drawer>
        )}
        {props.second ? (
          <Drawer
            placement="inline"
            open={secondOpen}
            onOpenChange={setSecondOpen}
          >
            <DrawerContent id="second" side="left">
              <DrawerHeader>
                <DrawerTitle>Layers</DrawerTitle>
                <DrawerDescription>Map layers</DrawerDescription>
              </DrawerHeader>
              <Button id="second-button">Show all</Button>
            </DrawerContent>
          </Drawer>
        ) : null}
        <button id="after" type="button">
          After
        </button>
      </div>
    </div>
  );
}

/**
 * Pointr Cloud's shell over a site: the bar, and under it the 96 rail and the
 * 440 panel, flush at the page's start. The site block is 424 wide, so with
 * the logo in its column it ends where the panel does.
 */
function ShellPage(props: Mount) {
  return (
    <div id="shell">
      <Navbar
        id="navbar"
        logoInset={props.logoInset}
        logo={
          <NavigationItem
            id="home"
            href="#home"
            aria-label="Home"
            content="icon-only"
            placement="top"
            icon={<span style={{ width: 24, height: 24 }} />}
          />
        }
        context={<div id="site-block" style={{ width: 424, height: 32 }} />}
        navigationAlign="end"
        navigation={
          <NavigationItem href="#maps" placement="top">
            Maps
          </NavigationItem>
        }
      />
      <div style={{ display: "flex", height: 240 }}>
        <Sidebar
          id="sidebar"
          inset="flush"
          variant="rail"
          navigation={
            <NavigationItem
              id="rail-item"
              href="#map"
              content="icon-label"
              placement="rail"
              icon={<span style={{ width: 24, height: 24 }} />}
            >
              Map
            </NavigationItem>
          }
        />
        <div id="side-panel" style={{ width: 440 }} />
      </div>
    </div>
  );
}

function Part(props: Mount) {
  if (props.part === "shell") return <ShellPage {...props} />;
  if (props.part === "navbar")
    return (
      <Navbar
        id="navbar"
        logoInset={props.logoInset}
        navigationAlign={props.navigationAlign}
        logo={<span id="logo">Kozmos</span>}
        navigation={
          <div id="items" style={{ display: "flex", gap: 8 }}>
            <NavigationItem href="#maps" placement="top" selected>
              Maps
            </NavigationItem>
            <NavigationItem href="#analytics" placement="top">
              Analytics
            </NavigationItem>
            <NavigationItem href="#settings" placement="top">
              Settings
            </NavigationItem>
          </div>
        }
        account={
          <Button id="account" variant="outline">
            Account
          </Button>
        }
      />
    );
  if (props.part === "sidebar")
    return (
      <div style={{ display: "flex", flexDirection: "column", height: 480 }}>
        <div id="header-bar" style={{ height: 56, flexShrink: 0 }} />
        <div style={{ display: "flex", minHeight: 0, flex: 1 }}>
          <Sidebar
            id="sidebar"
            inset={props.inset}
            variant={props.variant ?? "rail"}
            header={props.header ? <span id="site">Site</span> : undefined}
            navigation={
              <div style={{ display: "flex", flexDirection: "column" }}>
                {["Home", "Search", "Settings"].map((label) => (
                  <NavigationItem
                    key={label}
                    id={`item-${label}`}
                    href={`#${label}`}
                    content={
                      props.variant === "expanded" ? undefined : "icon-label"
                    }
                    icon={<span style={{ width: 24, height: 24 }} />}
                    placement={props.variant === "expanded" ? "side" : "rail"}
                  >
                    {label}
                  </NavigationItem>
                ))}
              </div>
            }
          />
        </div>
      </div>
    );
  if (props.part === "drawer") return <DrawerPage {...props} />;
  // Pointr Cloud's Map Content panel: 440 wide, its content 20 in (a panel
  // Container's 16 and the tour's 4), scrolling; the tree's strokes and
  // surface reach its edges.
  return (
    <div
      id="panel"
      className="bg-background"
      style={{ width: 440, paddingInline: 20, overflow: "auto" }}
    >
      <Tree
        id="tree"
        ariaLabel="Map content"
        data={venue}
        defaultExpandedIds={["terminal-a"]}
        selectedId={props.selectedId}
        divided={props.divided}
        bleed={20}
      />
    </div>
  );
}

let root: Root | null = null;
function mount(props: Mount) {
  root?.unmount();
  counts.help = 0;
  counts.companionClosed = 0;
  counts.contentKeys.length = 0;
  counts.regionKeys.length = 0;
  counts.escapes.length = 0;
  counts.openChanges.length = 0;
  counts.outside.length = 0;
  root = createRoot(document.getElementById("fixture")!);
  flushSync(() =>
    root!.render(
      <ThemeProvider
        theme={props.theme}
        density={props.density}
        dir={props.dir}
      >
        <div id="surface" className="bg-background" style={{ padding: 0 }}>
          <Part {...props} />
        </div>
      </ThemeProvider>,
    ),
  );
}

declare global {
  interface Window {
    layoutProps: {
      mount: typeof mount;
      counts: typeof counts;
      drawer: typeof drawer;
    };
  }
}
window.layoutProps = { mount, counts, drawer };
