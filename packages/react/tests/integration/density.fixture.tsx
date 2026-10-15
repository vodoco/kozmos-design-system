import { createRoot } from "react-dom/client";
import {
  AIInputBar,
  Button,
  Combobox,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  IconButton,
  Input,
  MultiSelect,
  NumberInput,
  PasswordInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SearchBar,
  Select,
  SelectTrigger,
  SelectValue,
  ThemeProvider,
  type ThemeDensity,
} from "@kozmos-ds/react";
import { Plus } from "@kozmos-ds/icons";

// Decision 82: the controls whose sizes follow ThemeProvider's density, each
// marked with data-measure. scripts/check-density.mjs measures them in a touch
// root, a compact root, a touch root inside a compact one, and a compact
// root's portal.
const options = [
  { value: "one", label: "One" },
  { value: "two", label: "Two" },
];

function Controls({ board }: { board: string }) {
  return (
    <div data-board={board} style={{ display: "grid", gap: 8, width: 360 }}>
      <Button data-measure="button-sm" size="sm">
        Small
      </Button>
      <Button data-measure="button">Default</Button>
      <Button data-measure="button-lg" size="lg">
        Large
      </Button>
      <Button data-measure="button-icon" size="icon" aria-label="Add">
        <Plus />
      </Button>
      <IconButton data-measure="icon-button-sm" size="sm" aria-label="Add">
        <Plus />
      </IconButton>
      <IconButton data-measure="icon-button" aria-label="Add">
        <Plus />
      </IconButton>
      <IconButton data-measure="icon-button-lg" size="lg" aria-label="Add">
        <Plus />
      </IconButton>
      <Input data-measure="input" aria-label="Name" />
      <Select>
        <SelectTrigger data-measure="select" aria-label="Type">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
      </Select>
      <div data-measure-within="combobox">
        <Combobox label="View" options={options} defaultValue="one" clearable />
      </div>
      <div data-measure-within="multi-select">
        <MultiSelect label="Tools" options={options} />
      </div>
      <div data-measure-within="number-input">
        <NumberInput label="Capacity" defaultValue={2} showSteppers />
      </div>
      <div data-measure-within="password-input">
        <PasswordInput label="Password" />
      </div>
    </div>
  );
}

function Board({ density, board }: { density?: ThemeDensity; board: string }) {
  return (
    <ThemeProvider density={density}>
      <Controls board={board} />
      {/* A drawer's close is the icon button's size, its header leaves room. */}
      <Drawer open modal={false}>
        <DrawerContent data-drawer={board}>
          <DrawerHeader>
            <DrawerTitle>Drawer</DrawerTitle>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("fixture")!).render(
  <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
    <Board board="touch" />
    <Board board="compact" density="compact" />
    <ThemeProvider density="compact">
      <Board board="touch-in-compact" density="touch" />
    </ThemeProvider>
    <ThemeProvider density="compact">
      {/* SDK parts keep the SDK's touch geometry under any density. */}
      <div data-board="sdk-in-compact" style={{ width: 360 }}>
        <SearchBar value="Station" onChange={() => undefined} />
        <AIInputBar
          value="ask"
          onSubmit={() => undefined}
          onValueChange={() => undefined}
        />
      </div>
    </ThemeProvider>
    <ThemeProvider density="compact">
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <Controls board="compact-portal" />
        </PopoverContent>
      </Popover>
    </ThemeProvider>
  </div>,
);
