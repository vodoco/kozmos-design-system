import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import {
  Button,
  DesignConfigProvider,
  Drawer,
  DrawerContent,
  DrawerTitle,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ThemeProvider,
  Toaster,
  toast,
  type ToasterProps,
} from "@kozmos-ds/react";

/**
 * A page for scripts/check-toaster.mjs: a field, a Select and a modal Menu
 * to keep focus in, a Toaster, and the call that fills it. `layout` puts the Toaster
 * somewhere a fixed part can be trapped (`trapped`: inside a box that isolates
 * its stacking, as a map does, under a bar fixed over it), or mounts two
 * providers (`providers`: a light page and a dark, right-to-left module with
 * a Toaster each, and a second Toaster of the page's id), or keeps a panel
 * open at the window's inline end (`panel`: a non-modal Drawer floating 16
 * from the edge, 420 wide, as Pointr Cloud's Get started panel is), or reads
 * right to left (`rtl`).
 */
interface Mount {
  toaster?: ToasterProps;
  /** The design config's reduced motion around the page. */
  configReduced?: boolean;
  layout?: "page" | "trapped" | "providers" | "panel" | "rtl";
}

function Field() {
  return (
    <>
      <label htmlFor="name">Name</label>
      <input id="name" />
      <Select>
        <SelectTrigger id="select" aria-label="Floor">
          <SelectValue placeholder="Choose a floor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Floor 1</SelectItem>
          <SelectItem value="2">Floor 2</SelectItem>
        </SelectContent>
      </Select>
      <Menu>
        <MenuTrigger asChild>
          <Button id="menu">Place actions</Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem>Rename</MenuItem>
          <MenuItem>Delete</MenuItem>
        </MenuContent>
      </Menu>
    </>
  );
}

function Page({ toaster, layout = "page" }: Mount) {
  if (layout === "providers")
    return (
      <>
        <ThemeProvider theme="light">
          <Field />
          <Toaster {...toaster} />
          <Toaster {...toaster} />
        </ThemeProvider>
        <ThemeProvider
          theme="dark"
          dir="rtl"
          tokens={{ dark: { "--primitives-colors-background-0": "#202a44" } }}
        >
          <Toaster {...toaster} id="module" />
        </ThemeProvider>
      </>
    );
  if (layout === "panel")
    return (
      <ThemeProvider theme="light">
        <Field />
        <Drawer open modal={false}>
          <DrawerContent
            id="panel"
            showClose={false}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
            style={{
              width: 420,
              top: 16,
              right: 16,
              bottom: 16,
              height: "auto",
            }}
          >
            <DrawerTitle>Get started</DrawerTitle>
          </DrawerContent>
        </Drawer>
        <Toaster {...toaster} />
      </ThemeProvider>
    );
  if (layout === "rtl")
    return (
      <ThemeProvider theme="light" dir="rtl">
        <Field />
        <Toaster {...toaster} />
      </ThemeProvider>
    );
  if (layout === "trapped")
    return (
      <ThemeProvider theme="light">
        <div
          id="map"
          style={{ isolation: "isolate", height: 600, position: "relative" }}
        >
          <Field />
          <Toaster {...toaster} />
        </div>
        {/* A bar fixed at the bottom, over the map, as a shell's panel is. */}
        <div
          id="bar"
          className="bg-muted"
          style={{
            position: "fixed",
            insetInline: 0,
            bottom: 0,
            height: 200,
            zIndex: 50,
          }}
        />
      </ThemeProvider>
    );
  return (
    <ThemeProvider theme="light">
      <Field />
      <Toaster {...toaster} />
    </ThemeProvider>
  );
}

const pressed: string[] = [];
const dismissed: string[] = [];
let root: Root | null = null;
function mount(options: Mount) {
  toast.dismiss();
  root?.unmount();
  pressed.length = 0;
  dismissed.length = 0;
  root = createRoot(document.getElementById("fixture")!);
  const page = <Page {...options} />;
  flushSync(() =>
    root!.render(
      options.configReduced ? (
        <DesignConfigProvider persistKey={null} config={{ motion: "reduced" }}>
          {page}
        </DesignConfigProvider>
      ) : (
        page
      ),
    ),
  );
}

declare global {
  interface Window {
    toaster: {
      mount: typeof mount;
      show: (
        title: string,
        options?: Parameters<typeof toast>[1] & { withAction?: boolean },
      ) => string;
      dismiss: typeof toast.dismiss;
      pressed: string[];
      dismissed: string[];
    };
  }
}

window.toaster = {
  mount,
  show: (title, { withAction, ...options } = {}) =>
    toast(title, {
      ...options,
      onDismiss: () => dismissed.push(title),
      action: withAction
        ? {
            label: "Undo",
            altText: "Undo from the history",
            onClick: () => pressed.push(title),
          }
        : options.action,
    }),
  dismiss: toast.dismiss,
  pressed,
  dismissed,
};
