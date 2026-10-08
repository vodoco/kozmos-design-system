import { createRoot } from "react-dom/client";
import {
  Badge,
  Button,
  CategoryField,
  Checkbox,
  Chip,
  DesignConfigProvider,
  FloatingActionButton,
  FloorSelector,
  IconButton,
  LocationPin,
  MapControlButton,
  POIResultCard,
  SplitButton,
  Tag,
  ThemeProvider,
  ToggleButton,
  type ThemeTokens,
} from "@kozmos-ds/react";
import { Bookmark, Plus } from "@kozmos-ds/icons";

/* GAP-23: the component layer is written as references to the ramp, so one
   override of theme 500 through ThemeProvider's `tokens` re-brands every
   prominent fill, and overrides of the steps the Button's hover, focus and
   pressed tokens name move those too. scripts/check-token-references.mjs
   reads every token on the plain and the DesignConfigProvider roots below,
   the fills and the Button's state tokens on the branded ones, and, with the
   whole ramp re-pointed, every token on it and the outline, ghost and link
   Buttons' ink. */

/** The re-brand: theme 500, the client's base colour (decision 59). */
const BRAND_FILL = "#AA1155";
/** Decision 68: a product's own accent, in place of the default amber. */
const ACCENT_FILL = "#2266AA";
/** Distinct stand-ins for the steps the Button's states name. */
const BRAND_HOVER = "#118855";
const BRAND_PRESSED = "#553311";
/** A set per theme's two 700s, for the nested provider below. */
const NESTED_LIGHT_700 = "#225511";
const NESTED_DARK_700 = "#55BB99";

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

/** The Buttons whose ink is the theme on a surface, not a fill. */
function Inks({ id }: { id: (part: string) => string }) {
  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <Button data-testid={id("outline")} variant="outline">
        Details
      </Button>
      <Button data-testid={id("ghost")} variant="ghost">
        Later
      </Button>
      <Button data-testid={id("link")} variant="link">
        Terms
      </Button>
    </div>
  );
}

/** The fills whose hover is the filled Button's hover token. */
function Hovers({ id }: { id: (part: string) => string }) {
  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <div data-testid={id("hover-chip")}>
        <Chip selected>Open now</Chip>
      </div>
      <Tag data-testid={id("hover-tag")}>New</Tag>
      <Badge data-testid={id("hover-badge")}>Live</Badge>
      <ToggleButton data-testid={id("hover-toggle")} pressed>
        Step-free
      </ToggleButton>
    </div>
  );
}

/* Decision 68: the Featured tag, its card's edge and a featured pin draw the
   accent fill, a reference to accent 500, so one override of accent 500
   re-colours them all. */
function Accents({ id }: { id: (part: string) => string }) {
  return (
    <div>
      <div data-testid={id("featured-pin")}>
        <LocationPin featured label="Burger King" number={2} />
      </div>
      <POIResultCard
        data-testid={id("featured-card")}
        numbered
        onSelect={() => undefined}
        poi={{
          id: id("poi"),
          name: "Burger King",
          floorLabel: "Level 1",
          media: [],
          actions: [],
        }}
        presentationStyle="legacy"
        result={{
          poiId: id("poi"),
          resultIndex: 2,
          selected: false,
          featured: true,
        }}
      />
    </div>
  );
}

/** Every step of the theme ramp, each a colour of its own. */
const STEPS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const WHOLE_RAMP = Object.fromEntries(
  STEPS.map((step, index) => {
    const digit = index.toString(16);
    return [
      `--primitives-colors-theme-${step}`,
      `#9${digit}0${digit}f${digit}`,
    ];
  }),
) as ThemeTokens;

function Root({
  name,
  theme,
  tokens,
  fills = false,
  inks = false,
  hovers = false,
  accents = false,
}: {
  name: string;
  theme: "light" | "dark";
  tokens?: ThemeTokens;
  fills?: boolean;
  inks?: boolean;
  hovers?: boolean;
  accents?: boolean;
}) {
  const id = (part: string) => `${name}-${part}`;
  return (
    <ThemeProvider theme={theme} tokens={tokens}>
      {/* The provider's root is this probe's parent: tokens are read there. */}
      <span data-testid={id("probe")} />
      {fills && <Fills id={id} />}
      {inks && <Inks id={id} />}
      {hovers && <Hovers id={id} />}
      {accents && <Accents id={id} />}
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
      <Root
        accents
        name="light-accent"
        theme="light"
        tokens={{ "--primitives-colors-accent-500": ACCENT_FILL }}
      />
      <Root
        accents
        name="dark-accent"
        theme="dark"
        tokens={{ "--primitives-colors-accent-500": ACCENT_FILL }}
      />
      {/* The filled Button's states name 600 and 700 in the light theme and
          400 and 300 in the dark, where the ramp turns over. */}
      <Root
        hovers
        name="light-states"
        theme="light"
        tokens={{
          "--primitives-colors-theme-600": BRAND_HOVER,
          "--primitives-colors-theme-700": BRAND_PRESSED,
        }}
      />
      <Root
        hovers
        name="dark-states"
        theme="dark"
        tokens={{
          "--primitives-colors-theme-400": BRAND_HOVER,
          "--primitives-colors-theme-300": BRAND_PRESSED,
        }}
      />
      {/* The whole ramp re-pointed: every token on it follows its step. */}
      <Root inks name="light-ramp" theme="light" tokens={WHOLE_RAMP} />
      <Root inks name="dark-ramp" theme="dark" tokens={WHOLE_RAMP} />
      {/* A set per theme, and a provider inside that forces dark, as
          DynamicIsland's island does: it applies the dark set, so its outline
          ink is the dark set's 700, not the light set's. */}
      <ThemeProvider
        theme="light"
        tokens={{
          light: { "--primitives-colors-theme-700": NESTED_LIGHT_700 },
          dark: { "--primitives-colors-theme-700": NESTED_DARK_700 },
        }}
      >
        <Button data-testid="nested-light-outline" variant="outline">
          Details
        </Button>
        <ThemeProvider theme="dark">
          <Button data-testid="nested-dark-outline" variant="outline">
            Details
          </Button>
        </ThemeProvider>
      </ThemeProvider>
    </div>
  );
}

createRoot(document.getElementById("fixture")!).render(<Fixture />);
