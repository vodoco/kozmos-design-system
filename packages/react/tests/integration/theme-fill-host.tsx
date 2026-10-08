import { createRoot } from "react-dom/client";
import {
  Badge,
  Button,
  CategoryField,
  Checkbox,
  Chip,
  Counter,
  FloatingActionButton,
  FloorSelector,
  IconButton,
  Link,
  LocationPin,
  ManoeuvreCard,
  MapControlButton,
  POIResultCard,
  RadioGroup,
  RadioGroupItem,
  Rating,
  SaveLocationCard,
  SplitButton,
  Stepper,
  Switch,
  Tag,
  Text,
  ThemeProvider,
  ToggleButton,
  UserMessage,
} from "@kozmos-ds/react";
import { Bookmark, Plus } from "@kozmos-ds/icons";

/* Decision 59 (Olcay, 2026-10-07): every prominent fill is theme 500 with
   the theme foreground, white, on it in both themes; text, borders and rings
   on a surface stay theme 600. scripts/check-theme-fill.mjs reads what each
   part below computes, in a light and a dark root, at rest and hovered,
   pressed and focused from the keyboard. */
function Parts({ theme }: { theme: "light" | "dark" }) {
  const id = (part: string) => `${theme}-${part}`;
  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <Button data-testid={id("button")}>Go</Button>
      <Button
        data-testid={id("button-themed")}
        emotion="themed"
        variant="secondary"
      >
        Go
      </Button>
      <Button data-testid={id("button-danger")} emotion="danger">
        Stop
      </Button>
      <Button data-testid={id("button-destructive")} variant="destructive">
        Delete
      </Button>
      {/* Unavailable, as RouteSummary's Previous and Next: it keeps focus
          but must not look as if it acts under the pointer or a press. */}
      <Button aria-disabled="true" data-testid={id("button-unavailable")}>
        Next
      </Button>
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
      <Checkbox checked data-testid={id("checkbox")} label="Step-free" />
      <Checkbox
        checked="indeterminate"
        data-testid={id("checkbox-mixed")}
        label="Some"
      />
      <Switch checked data-testid={id("switch")} label="Avoid stairs" />
      <RadioGroup value="lift">
        <RadioGroupItem data-testid={id("radio")} label="Lift" value="lift" />
      </RadioGroup>
      <MapControlButton
        data-testid={id("map-control")}
        emphasis="filled"
        icon={<Plus />}
        label="Follow"
        pressed
      />
      <div data-testid={id("chip")}>
        <Chip selected>Open now</Chip>
      </div>
      <div data-testid={id("chip-remove")}>
        <Chip onRemove={() => undefined} selected>
          Open now
        </Chip>
      </div>
      <div data-testid={id("chip-danger-remove")}>
        <Chip onRemove={() => undefined} selected variant="destructive">
          Closed
        </Chip>
      </div>
      <Tag data-testid={id("tag")}>New</Tag>
      <Tag data-testid={id("tag-remove")} onRemove={() => undefined}>
        New
      </Tag>
      <Counter data-testid={id("counter")} tone="brand">
        4
      </Counter>
      <Badge data-testid={id("badge")}>Live</Badge>
      <Badge counter={3} data-testid={id("badge-counter")} showCounter>
        Live
      </Badge>
      <Badge
        counter={3}
        data-testid={id("badge-destructive-counter")}
        showCounter
        variant="destructive"
      >
        Closed
      </Badge>
      <div data-testid={id("floors")}>
        <FloorSelector
          floors={[
            { id: "2", label: "Level 2", shortLabel: "2", resultCount: 3 },
            { id: "1", label: "Level 1", shortLabel: "1", resultCount: 2 },
          ]}
          label="Floors"
          onFloorSelect={() => undefined}
          selectedFloor="2"
          showResultCounts
        />
      </div>
      <div data-testid={id("pin")}>
        <LocationPin label="Result 1" number={1} selected variant="primary" />
      </div>
      {/* Decision 62: the accent pin and a featured pin, as the natives
          draw them. */}
      <div data-testid={id("pin-accent")}>
        <LocationPin label="Gate 4" number={4} selected variant="accent" />
      </div>
      <div data-testid={id("pin-accent-quiet")}>
        <LocationPin label="Gate 5" number={5} variant="accent" />
      </div>
      <div data-testid={id("pin-featured")}>
        <LocationPin featured label="Burger King" number={2} />
      </div>
      <div data-testid={id("save")}>
        <SaveLocationCard isSaved title="Gate 12" />
      </div>
      <div data-testid={id("category")}>
        <CategoryField
          count={2}
          icon={<Bookmark />}
          label="Bookmarks"
          onClear={() => undefined}
        />
      </div>
      <div data-testid={id("stepper")}>
        <Stepper currentStep={1} steps={["Where", "When", "Go"]} />
      </div>
      <ToggleButton aria-label="Bold" data-testid={id("toggle")} pressed>
        B
      </ToggleButton>
      <div data-testid={id("manoeuvre")}>
        <ManoeuvreCard
          appearance="theme"
          expanded={false}
          instruction="Turn left at the café"
          onToggle={() => undefined}
          type="left"
        />
      </div>
      <div data-testid={id("user-message")}>
        <UserMessage>Where is gate 12?</UserMessage>
      </div>
      <div data-testid={id("result")}>
        <POIResultCard
          numbered
          onSelect={() => undefined}
          poi={{
            id: `${theme}-gate`,
            name: "Gate 12",
            floorLabel: "Level 1",
            media: [],
            actions: [],
          }}
          presentationStyle="legacy"
          result={{
            poiId: `${theme}-gate`,
            resultIndex: 0,
            selected: true,
            featured: false,
          }}
        />
      </div>
      <Link data-testid={id("link")} href="#gate">
        Gate 12
      </Link>
      <Text color="primary" data-testid={id("text")}>
        Kozmos
      </Text>
      <div data-testid={id("rating")}>
        <Rating onChange={() => undefined} value={2} variant="thumbs" />
      </div>
    </div>
  );
}

function Fixture() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <ThemeProvider theme="light">
        <Parts theme="light" />
      </ThemeProvider>
      <ThemeProvider theme="dark">
        <Parts theme="dark" />
      </ThemeProvider>
    </div>
  );
}

createRoot(document.getElementById("fixture")!).render(<Fixture />);
