import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Navbar,
  NavigationItem,
  Sidebar,
  ThemeProvider,
  Tree,
  type TreeItem,
} from "@kozmos-ds/react";

/**
 * The 0.15.0 layout props in the built package, for
 * scripts/check-layout-props.mjs: Navbar's navigationAlign (GAP-196),
 * Sidebar's flush inset (GAP-199), Drawer's inline placement (GAP-198) and
 * Tree's divided rows (GAP-201), each in a provider of the given theme,
 * density and direction.
 */
interface Mount {
  part: "navbar" | "sidebar" | "drawer" | "tree";
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

const counts = { help: 0 };
/** Opens or closes the drawer from the page's code, as a product does. */
const drawer = { setOpen: (_open: boolean) => {} };

/** A fixed header over a positioned region, the drawer in it, controlled. */
function DrawerPage(props: Mount) {
  const [open, setOpen] = React.useState(false);
  drawer.setOpen = setOpen;
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
        <input id="search" aria-label="Search" />
      </header>
      <div id="region" style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <Drawer
          placement={props.placement}
          modal={props.modal}
          open={open}
          onOpenChange={setOpen}
        >
          <DrawerTrigger asChild>
            <Button id="trigger">Get started</Button>
          </DrawerTrigger>
          <DrawerContent id="drawer">
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
        <button id="after" type="button">
          After
        </button>
      </div>
    </div>
  );
}

function Part(props: Mount) {
  if (props.part === "navbar")
    return (
      <Navbar
        id="navbar"
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
