import { createRoot } from "react-dom/client";
import {
  Button,
  ThemeProvider,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetDescription,
} from "@kozmos-ds/react";

declare global {
  interface Window {
    overlayUseDefault?: boolean;
    overlayUseProvider?: boolean;
  }
}
const portalContainer = window.overlayUseDefault
  ? undefined
  : document.getElementById("owned-portal")!;
const examples = (
  <>
    <Popover>
      <PopoverTrigger asChild>
        <Button>Open popover</Button>
      </PopoverTrigger>
      <PopoverContent portalContainer={portalContainer} data-testid="popover">
        Popover content
      </PopoverContent>
    </Popover>
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent portalContainer={portalContainer} data-testid="dialog">
        <DialogTitle>Dialog title</DialogTitle>
        <DialogDescription>Dialog description</DialogDescription>
      </DialogContent>
    </Dialog>
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent portalContainer={portalContainer} data-testid="drawer">
        <DrawerTitle>Drawer title</DrawerTitle>
        <DrawerDescription>Drawer description</DrawerDescription>
      </DrawerContent>
    </Drawer>
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button>Open bottomsheet</Button>
      </BottomSheetTrigger>
      <BottomSheetContent
        portalContainer={portalContainer}
        title="Sheet title"
        data-testid="bottomsheet"
      >
        <BottomSheetDescription>Sheet description</BottomSheetDescription>
      </BottomSheetContent>
    </BottomSheet>
    <Menu>
      <MenuTrigger asChild>
        <Button>Open menu</Button>
      </MenuTrigger>
      <MenuContent portalContainer={portalContainer} data-testid="menu">
        <MenuItem>Menu item</MenuItem>
      </MenuContent>
    </Menu>
    <Select>
      <SelectTrigger aria-label="Open select">
        <SelectValue placeholder="Choose one" />
      </SelectTrigger>
      <SelectContent portalContainer={portalContainer} data-testid="select">
        <SelectItem value="one">One</SelectItem>
      </SelectContent>
    </Select>
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Open tooltip</Button>
        </TooltipTrigger>
        <TooltipContent portalContainer={portalContainer} data-testid="tooltip">
          Tooltip content
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </>
);
createRoot(document.getElementById("fixture")!).render(
  window.overlayUseProvider ? (
    <ThemeProvider
      defaultTheme="dark"
      dir="rtl"
      tokens={{ "--primitives-colors-background-0": "rgb(12, 34, 56)" }}
    >
      {examples}
    </ThemeProvider>
  ) : (
    examples
  ),
);
