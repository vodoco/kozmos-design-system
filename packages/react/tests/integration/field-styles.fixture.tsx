import { createRoot } from "react-dom/client";
import {
  AIInputBar,
  ColorPicker,
  Combobox,
  DatePicker,
  DateRangePicker,
  FeedbackCard,
  Input,
  MultiSelect,
  NumberInput,
  OTPInput,
  PasswordInput,
  RouteLocationField,
  RoutingInputGroup,
  Search,
  SearchBar,
  Textarea,
  ThemeProvider,
  TimePicker,
  WayfindingInputRow,
  type ThemeDensity,
} from "@kozmos-ds/react";

// GAP-174: every Kozmos part that draws an <input> or a <textarea>, each in an
// element marked data-part. scripts/check-field-styles.mjs reads every field
// inside one, in light and dark, left to right and right to left, touch and
// compact, enabled and disabled, and compares what each engine computes.
// WebKit applies no @scope rule to a text field, so in Safari a field holds
// only what owned CSS gives it. The caller boards put a caller's emitted
// padding class on every field that takes a className: it must still win
// where @scope applies, and cannot land in WebKit.
//
// Out of scope: FileUpload's <input type="file"> is `hidden` (a button opens
// it), and Radix's Checkbox, Radio, Switch and Select draw buttons, with only
// a hidden native control for forms. A <select> takes scoped rules in WebKit.
const options = [
  { value: "one", label: "One" },
  { value: "two", label: "Two" },
];
const noop = () => undefined;

function Parts({
  board,
  caller,
  disabled,
}: {
  board: string;
  caller?: string;
  disabled?: boolean;
}) {
  return (
    <div
      data-board={board}
      style={{ display: "grid", gap: 12, width: 360, flex: "none" }}
    >
      <div data-part="input">
        <Input
          aria-label="Name"
          placeholder="Name"
          className={caller}
          disabled={disabled}
        />
      </div>
      <div data-part="input-error">
        <Input
          aria-label="Code"
          placeholder="Code"
          status="error"
          className={caller}
          disabled={disabled}
        />
      </div>
      <div data-part="textarea">
        <Textarea
          aria-label="Notes"
          placeholder="Notes"
          className={caller}
          disabled={disabled}
        />
      </div>
      <div data-part="search">
        <Search
          aria-label="Find"
          placeholder="Find"
          className={caller}
          disabled={disabled}
        />
      </div>
      <div data-part="combobox">
        <Combobox
          label="View"
          options={options}
          defaultValue="one"
          clearable
          className={caller}
          disabled={disabled}
        />
      </div>
      <div data-part="combobox-plain">
        <Combobox
          label="Plan"
          options={options}
          placeholder="Plan"
          clearable={false}
          className={caller}
          disabled={disabled}
        />
      </div>
      <div data-part="multi-select">
        <MultiSelect
          label="Tools"
          options={options}
          placeholder="Tools"
          disabled={disabled}
        />
      </div>
      <div data-part="password-input">
        <PasswordInput
          label="Password"
          placeholder="Password"
          className={caller}
          disabled={disabled}
        />
      </div>
      <div data-part="number-input">
        <NumberInput
          label="Capacity"
          defaultValue={2}
          showSteppers
          className={caller}
          disabled={disabled}
        />
      </div>
      <div data-part="number-input-plain">
        <NumberInput
          label="Floors"
          placeholder="Floors"
          showSteppers={false}
          className={caller}
          disabled={disabled}
        />
      </div>
      {/* OTPInput's className is its row's: a caller cannot reach a cell. */}
      <div data-part="otp-input">
        <OTPInput
          label="Code"
          length={6}
          value="12"
          onChange={noop}
          disabled={disabled}
        />
      </div>
      {/* Open, so its panel's fields are read too: HSL's numbers, and HEX's
          text in the second. */}
      <div data-part="color-picker">
        <ColorPicker
          label="Colour"
          defaultValue="#4135F1"
          defaultOpen
          className={caller}
          disabled={disabled}
        />
      </div>
      <div data-part="color-picker-hex">
        <ColorPicker
          label="Accent"
          defaultValue="#197F4C"
          defaultFormat="hex"
          defaultOpen
          showPresets={false}
          disabled={disabled}
        />
      </div>
      <div data-part="date-picker">
        <DatePicker label="Day" className={caller} disabled={disabled} />
      </div>
      <div data-part="date-range-picker">
        <DateRangePicker label="Stay" disabled={disabled} />
      </div>
      <div data-part="time-picker">
        <TimePicker label="Time" className={caller} disabled={disabled} />
      </div>
      <div data-part="search-bar">
        <SearchBar
          value="Station"
          onChange={noop}
          placeholder="Search"
          disabled={disabled}
        />
      </div>
      <div data-part="search-bar-empty">
        <SearchBar
          value=""
          onChange={noop}
          placeholder="Search"
          disabled={disabled}
        />
      </div>
      <div data-part="route-location-field">
        <RouteLocationField
          label="From"
          location={null}
          query=""
          options={options}
          placeholder="Choose a start"
          onQueryChange={noop}
          onSelect={noop}
          onClear={noop}
          disabled={disabled}
        />
      </div>
      <div data-part="ai-input-bar">
        <AIInputBar
          value=""
          placeholder="Ask anything"
          onSubmit={noop}
          onValueChange={noop}
          disabled={disabled}
        />
      </div>
      <div data-part="routing-input-group">
        <RoutingInputGroup
          points={[
            { id: "a", value: "Gate 4" },
            { id: "b", value: "", placeholder: "Choose Destination" },
          ]}
          onPointChange={noop}
        />
      </div>
      <div data-part="wayfinding-input-row">
        <WayfindingInputRow
          originValue="Gate 4"
          destinationValue=""
          destinationPlaceholder="Where to?"
          onOriginChange={noop}
          onDestinationChange={noop}
        />
      </div>
      <div data-part="feedback-card">
        <FeedbackCard />
      </div>
    </div>
  );
}

interface BoardProps {
  board: string;
  theme: "light" | "dark";
  dir: "ltr" | "rtl";
  density: ThemeDensity;
  caller?: string;
  disabled?: boolean;
}

function Board({ board, theme, dir, density, caller, disabled }: BoardProps) {
  return (
    <ThemeProvider theme={theme} dir={dir} density={density}>
      <Parts board={board} caller={caller} disabled={disabled} />
    </ThemeProvider>
  );
}

const boards: BoardProps[] = [];
for (const theme of ["light", "dark"] as const)
  for (const dir of ["ltr", "rtl"] as const)
    for (const density of ["touch", "compact"] as const)
      boards.push({ board: `${theme} ${dir} ${density}`, theme, dir, density });
for (const theme of ["light", "dark"] as const)
  boards.push({
    board: `${theme} ltr touch disabled`,
    theme,
    dir: "ltr",
    density: "touch",
    disabled: true,
  });
// A caller's emitted classes: px-4 on both sides, and a physical pl-12.
for (const caller of ["px-4", "pl-12"])
  for (const dir of ["ltr", "rtl"] as const)
    boards.push({
      board: `caller ${caller} ${dir}`,
      theme: "light",
      dir,
      density: "touch",
      caller,
    });

createRoot(document.getElementById("fixture")!).render(
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 24,
      alignItems: "flex-start",
    }}
  >
    {boards.map((props) => (
      <Board key={props.board} {...props} />
    ))}
  </div>,
);
