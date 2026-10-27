import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import {
  Button,
  Combobox,
  DesignConfigProvider,
  type DesignConfigInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Spinner,
  ThemeProvider,
  Toast,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kozmos-ds/react";

/**
 * The parts that draw in the theme's portal, open, under a
 * DesignConfigProvider, for scripts/check-portal-motion.mjs: Popover,
 * Dialog, Drawer (BottomSheet is Drawer), Tooltip, Select, Menu and
 * Combobox's list, each holding a Spinner (a loop) where its content takes
 * one, and Toast, which draws in place, as a control. The provider is dark,
 * compact and right to left, so what reaches the portal can be read.
 */
type Part =
  | "popover"
  | "dialog"
  | "drawer"
  | "tooltip"
  | "select"
  | "menu"
  | "combobox"
  | "toast"
  | "nested";

interface Mount {
  part: Part;
  config: DesignConfigInput;
}

const loops = (
  <>
    <Spinner size="sm" label="Loading places" />
    <Skeleton shape="line" />
  </>
);

function Open({ part }: { part: Part }) {
  switch (part) {
    case "popover":
      return (
        <Popover open>
          <PopoverTrigger asChild>
            <Button>Opening hours</Button>
          </PopoverTrigger>
          <PopoverContent data-probe="content" aria-label="Opening hours">
            {loops}
          </PopoverContent>
        </Popover>
      );
    case "dialog":
      return (
        <Dialog open>
          <DialogContent data-probe="content">
            <DialogTitle>Saving</DialogTitle>
            <DialogDescription>Saving the floor plan.</DialogDescription>
            {loops}
          </DialogContent>
        </Dialog>
      );
    case "drawer":
      return (
        <Drawer open>
          <DrawerContent data-probe="content">
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>Loading the filters.</DrawerDescription>
            {loops}
          </DrawerContent>
        </Drawer>
      );
    case "tooltip":
      return (
        <TooltipProvider>
          <Tooltip open>
            <TooltipTrigger asChild>
              <Button>Help</Button>
            </TooltipTrigger>
            <TooltipContent data-probe="content">
              <Spinner size="sm" label="Loading help" />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case "select":
      return (
        <Select open defaultValue="1">
          <SelectTrigger aria-label="Floor">
            <SelectValue />
          </SelectTrigger>
          <SelectContent data-probe="content">
            <SelectItem value="1">
              Level 1 <Spinner size="sm" label="Counting" />
            </SelectItem>
            <SelectItem value="2">Level 2</SelectItem>
          </SelectContent>
        </Select>
      );
    case "menu":
      return (
        <Menu open>
          <MenuTrigger asChild>
            <Button>Actions</Button>
          </MenuTrigger>
          <MenuContent data-probe="content">
            <MenuItem>
              Sync <Spinner size="sm" label="Syncing" />
            </MenuItem>
          </MenuContent>
        </Menu>
      );
    case "combobox":
      return (
        <Combobox
          label="Building"
          options={[
            { value: "a", label: "Medical Building" },
            { value: "b", label: "Parking Garage" },
          ]}
        />
      );
    case "toast":
      return (
        <ToastProvider>
          <Toast open data-probe="content">
            <ToastTitle>Saving</ToastTitle>
            {loops}
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
    case "nested":
      // A ThemeProvider inside the config's provider has a portal of its
      // own, under the same config.
      return (
        <ThemeProvider theme="light">
          <Open part="popover" />
        </ThemeProvider>
      );
  }
}

let root: Root | null = null;
let current: Mount | null = null;
function render() {
  const { part, config } = current!;
  flushSync(() =>
    root!.render(
      <DesignConfigProvider
        theme="dark"
        density="compact"
        dir="rtl"
        persistKey={null}
        config={config}
      >
        <main>
          <Open part={part} />
        </main>
      </DesignConfigProvider>,
    ),
  );
}

function mount(options: Mount) {
  root?.unmount();
  root = createRoot(document.getElementById("fixture")!);
  current = options;
  render();
}

/** The same mount under another config, as a product changes it. */
function setConfig(config: DesignConfigInput) {
  current = { ...current!, config };
  render();
}

declare global {
  interface Window {
    portalMotion: { mount: typeof mount; setConfig: typeof setConfig };
  }
}
window.portalMotion = { mount, setConfig };
