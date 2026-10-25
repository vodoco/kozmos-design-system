import { createRoot } from "react-dom/client";
import {
  AIInputBar,
  Button,
  ColorPicker,
  Combobox,
  DatePicker,
  DateRangePicker,
  DensityScope,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  IconButton,
  Input,
  MultiSelect,
  NumberInput,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PasswordInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RouteSetupPanel,
  Search,
  SearchBar,
  Select,
  SelectTrigger,
  SelectValue,
  ThemeProvider,
  TimePicker,
  type ThemeDensity,
} from "@kozmos-ds/react";
import { Plus } from "@kozmos-ds/icons";

// Decision 82: the controls whose sizes follow ThemeProvider's density, each
// marked with data-measure. scripts/check-density.mjs measures them in a touch
// root, a compact root, a touch root inside a compact one, a compact root's
// portal, a compact right-to-left root, outside any provider, a compact
// DensityScope in a touch root and its popover, and inside an SDK part in a
// compact root: in a provider of its own and in its popover.
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
      <div data-measure-within="combobox-plain">
        <Combobox
          label="Plan"
          options={options}
          defaultValue="one"
          clearable={false}
        />
      </div>
      <div data-measure-within="multi-select">
        <MultiSelect label="Tools" options={options} />
      </div>
      {/* With a choice, its clear beside its open; and with a caller's px-4,
          a 2px border and a width narrower than the board, which the buttons
          follow (a percentage, so it leaves the board's own width as it
          was). */}
      <div data-measure-within="multi-select-chosen">
        <MultiSelect label="Kit" options={options} defaultValue={["one"]} />
      </div>
      <div data-measure-within="multi-select-chosen-px">
        <MultiSelect
          label="Gear"
          options={options}
          defaultValue={["one"]}
          className="border-2 px-4"
          style={{ maxWidth: "75%" }}
        />
      </div>
      <div data-measure-within="number-input">
        <NumberInput label="Capacity" defaultValue={2} showSteppers />
      </div>
      <div data-measure-within="password-input">
        <PasswordInput label="Password" />
      </div>
      {/* Every field drawn on Input's recipe takes the field's height. */}
      <div data-measure-within="date-picker">
        <DatePicker label="Day" />
      </div>
      <div data-measure-within="date-range-picker">
        <DateRangePicker label="Stay" />
      </div>
      <div data-measure-within="time-picker">
        <TimePicker label="Time" />
      </div>
      <div data-measure-within="search">
        <Search label="Find" />
      </div>
      <div data-measure-within="color-picker">
        <ColorPicker label="Colour" defaultValue="#4135F1" />
      </div>
      {/* Previous, Next and the page links are one height. */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious data-measure="pagination previous" href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink data-measure="pagination page" href="#" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext data-measure="pagination next" href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      {/* A caller's own horizontal padding sets the start; the room for a
          field's actions still holds at the end. */}
      <Input
        data-measure="input px padding"
        aria-label="Note"
        className="px-4"
      />
      <div data-measure-within="combobox-px">
        <Combobox
          label="Zone"
          className="px-4"
          options={options}
          defaultValue="one"
          clearable
        />
      </div>
      <div data-measure-within="combobox-plain-px">
        <Combobox
          label="Site"
          className="px-4"
          options={options}
          defaultValue="one"
          clearable={false}
        />
      </div>
      <div data-measure-within="password-input-px">
        <PasswordInput label="Passphrase" className="px-4" />
      </div>
    </div>
  );
}

// A dialog's and a drawer's close are the icon button's size, centred on the
// title as touch centres them, and the title leaves room for it; a stacked
// footer's buttons are each their size's height.
function Overlays({
  board,
  drawer = true,
}: {
  board: string;
  drawer?: boolean;
}) {
  return (
    <>
      <Dialog open modal={false}>
        <DialogContent data-dialog={board}>
          <DialogHeader>
            <DialogTitle>Dialog</DialogTitle>
          </DialogHeader>
          <DialogFooter layout="stacked">
            <Button>Continue</Button>
            <Button data-footer="sm" size="sm">
              Later
            </Button>
            <Button data-footer="lg" size="lg">
              Start
            </Button>
            <Button data-footer="icon" size="icon" aria-label="Add">
              <Plus />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {drawer && (
        <Drawer open modal={false}>
          <DrawerContent data-drawer={board}>
            <DrawerHeader>
              <DrawerTitle>Drawer</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

function Board({
  density,
  board,
  dir,
}: {
  density?: ThemeDensity;
  board: string;
  dir?: "rtl";
}) {
  return (
    <ThemeProvider density={density} dir={dir}>
      <Controls board={board} />
      {/* The drawer's sides and its close are physical: not in right-to-left. */}
      <Overlays board={board} drawer={!dir} />
    </ThemeProvider>
  );
}

const noop = () => undefined;

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
    <Board board="compact-rtl" density="compact" dir="rtl" />
    {/* Outside any provider, only the owned rules apply: at touch sizes. */}
    <Controls board="outside" />
    {/* A compact region on a touch page: its controls, its overlays and its
        popover take the region's density. */}
    <ThemeProvider>
      <DensityScope density="compact">
        <Controls board="compact-scope" />
        <Overlays board="compact-scope" />
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <Controls board="compact-scope-portal" />
          </PopoverContent>
        </Popover>
      </DensityScope>
    </ThemeProvider>
    {/* Inside an SDK part, a provider of its own and the part's popovers keep
        the SDK's touch geometry too. */}
    <ThemeProvider density="compact">
      <RouteSetupPanel ready onContinue={noop} onClose={noop}>
        <ThemeProvider>
          <Controls board="provider-in-sdk" />
        </ThemeProvider>
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <Controls board="sdk-portal" />
          </PopoverContent>
        </Popover>
      </RouteSetupPanel>
    </ThemeProvider>
  </div>,
);
