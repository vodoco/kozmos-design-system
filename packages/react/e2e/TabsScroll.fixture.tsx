import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../src/components/Tabs/Tabs";

// The Cloud type picker's five families (GAP-152), each an icon over its
// words: wider together than a phone's column (GAP-254, decision 182).
export const families = [
  { value: "everything", label: "Everything" },
  { value: "poi", label: "POI" },
  { value: "interior", label: "Interior asset" },
  { value: "structural", label: "Structural" },
  { value: "virtual", label: "Virtual" },
];

const icon = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export function FamilyTabs({
  dir = "ltr",
  defaultValue = "everything",
  width,
  activationMode,
}: {
  dir?: "ltr" | "rtl";
  defaultValue?: string;
  width?: number;
  activationMode?: "automatic" | "manual";
}) {
  return (
    <ThemeProvider theme="light">
      <div dir={dir} data-testid="column" style={{ width }}>
        <Tabs
          defaultValue={defaultValue}
          dir={dir}
          activationMode={activationMode}
        >
          <TabsList aria-label="Type family" data-testid="list">
            {families.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} icon={icon}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {families.map(({ value, label }) => (
            <TabsContent key={value} value={value}>
              Types in {label}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </ThemeProvider>
  );
}

// The selection moved from outside the list, by a controlled value.
export function ControlledFamilyTabs({ width }: { width: number }) {
  const [value, setValue] = React.useState("everything");
  return (
    <ThemeProvider theme="light">
      <button type="button" onClick={() => setValue("virtual")}>
        Show virtual
      </button>
      <div data-testid="column" style={{ width }}>
        <Tabs value={value} onValueChange={setValue}>
          <TabsList aria-label="Type family" data-testid="list">
            {families.map(({ value: v, label }) => (
              <TabsTrigger key={v} value={v} icon={icon}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </ThemeProvider>
  );
}

// A list laid out at no width first, as in a closed sheet, then shown.
export function HiddenFamilyTabs({ width }: { width: number }) {
  const [shown, setShown] = React.useState(false);
  return (
    <ThemeProvider theme="light">
      <button type="button" onClick={() => setShown(true)}>
        Show
      </button>
      <div
        data-testid="column"
        style={{ width, display: shown ? "block" : "none" }}
      >
        <Tabs defaultValue="virtual">
          <TabsList aria-label="Type family" data-testid="list">
            {families.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} icon={icon}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </ThemeProvider>
  );
}

// Lists that fit: words alone, centred in a list a caller made wide, and the
// Default story's grid.
export function FittingTabs() {
  return (
    <ThemeProvider theme="light">
      <div style={{ width: 400 }}>
        <Tabs defaultValue="b">
          <TabsList data-testid="plain">
            <TabsTrigger value="a">Account</TabsTrigger>
            <TabsTrigger value="b">Password</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs defaultValue="a">
          <TabsList data-testid="wide" className="flex w-full">
            <TabsTrigger value="a">Account</TabsTrigger>
            <TabsTrigger value="b">Password</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs defaultValue="a">
          <TabsList data-testid="grid" className="grid w-full grid-cols-2">
            <TabsTrigger value="a">Account</TabsTrigger>
            <TabsTrigger value="b">Password</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </ThemeProvider>
  );
}
