import { createRoot } from "react-dom/client";
import {
  Button,
  CategoryField,
  Checkbox,
  Chip,
  DesignConfigProvider,
  FloatingActionButton,
  FloorSelector,
  IconButton,
  MapControlButton,
  SplitButton,
  Tag,
  ThemeProvider,
  type ThemeTokens,
} from "@kozmos-ds/react";
import { Bookmark, Plus } from "@kozmos-ds/icons";

/* GAP-23: the component layer is written as references to the ramp, so one
   override of theme 500 through ThemeProvider's `tokens` re-brands every
   prominent fill, and overrides of the steps the Button's hover, focus and
   pressed tokens name move those too. scripts/check-token-references.mjs
   reads every token on the plain and the DesignConfigProvider roots below,
   and the fills and the Button's state tokens on the branded ones. */

/** The re-brand: theme 500, the client's base colour (decision 59). */
const BRAND_FILL = "#AA1155";
/** Distinct stand-ins for the steps the Button's states name. */
const BRAND_HOVER = "#118855";
const BRAND_PRESSED = "#553311";

function Fills({ id }: { id: (part: string) => string }) {
  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <Button data-testid={id("button")}>Go</Button>
      <IconButton
        aria-label="Add"
        data-testid={id("icon-button")}
        variant="default"
      >
        <Plus />
      </IconButton>
      <FloatingActionButton aria-label="Add a stop" data-testid={id("fab")}>
        <Plus />
      </FloatingActionButton>
      <div data-testid={id("split-button")}>
        <SplitButton menuItems={[{ label: "Later", onClick: () => undefined }]}>
          Start
        </SplitButton>
      </div>
      <MapControlButton
        data-testid={id("map-control")}
        emphasis="filled"
        icon={<Plus />}
        label="Focus"
        pressed
      />
      <div data-testid={id("floors")}>
        <FloorSelector
          floors={[
            { id: "2", label: "Level 2", shortLabel: "2" },
            { id: "1", label: "Level 1", shortLabel: "1" },
          ]}
          label="Floors"
          onFloorSelect={() => undefined}
          selectedFloor="2"
        />
      </div>
      <div data-testid={id("category")}>
        <CategoryField
          count={2}
          icon={<Bookmark />}
          label="Bookmarks"
          onClear={() => undefined}
        />
      </div>
      <Checkbox checked data-testid={id("checkbox")} label="Step-free" />
      <Tag data-testid={id("tag")}>New</Tag>
      <div data-testid={id("chip")}>
        <Chip selected>Open now</Chip>
      </div>
    </div>
  );
}

function Root({
  name,
  theme,
  tokens,
  fills = false,
}: {
  name: string;
  theme: "light" | "dark";
  tokens?: ThemeTokens;
  fills?: boolean;
}) {
  const id = (part: string) => `${name}-${part}`;
  return (
    <ThemeProvider theme={theme} tokens={tokens}>
      {/* The provider's root is this probe's parent: tokens are read there. */}
      <span data-testid={id("probe")} />
      {fills && <Fills id={id} />}
    </ThemeProvider>
  );
}

function Fixture() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
      <Root name="light" theme="light" />
      <Root name="dark" theme="dark" />
      {/* DesignConfigProvider sets variables of its own on the same root,
          legacy aliases among them (--shadow-sm, -md, -lg): a token that is a
          reference must not pick those up. */}
      <DesignConfigProvider theme="light">
        <span data-testid="config-light-probe" />
      </DesignConfigProvider>
      <DesignConfigProvider theme="dark">
        <span data-testid="config-dark-probe" />
      </DesignConfigProvider>
      <Root
        fills
        name="light-brand"
        theme="light"
        tokens={{ "--primitives-colors-theme-500": BRAND_FILL }}
      />
      <Root
        fills
        name="dark-brand"
        theme="dark"
        tokens={{ "--primitives-colors-theme-500": BRAND_FILL }}
      />
      {/* The filled Button's states name 600 and 700 in the light theme and
          400 and 300 in the dark, where the ramp turns over. */}
      <Root
        name="light-states"
        theme="light"
        tokens={{
          "--primitives-colors-theme-600": BRAND_HOVER,
          "--primitives-colors-theme-700": BRAND_PRESSED,
        }}
      />
      <Root
        name="dark-states"
        theme="dark"
        tokens={{
          "--primitives-colors-theme-400": BRAND_HOVER,
          "--primitives-colors-theme-300": BRAND_PRESSED,
        }}
      />
    </div>
  );
}

createRoot(document.getElementById("fixture")!).render(<Fixture />);
