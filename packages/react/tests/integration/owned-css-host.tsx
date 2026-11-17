import { useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import {
  Surface,
  Button,
  Input,
  Textarea,
  ThemeProvider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  DesignConfigProvider,
  buttonVariants,
  inputVariants,
  PasswordInput,
  NumberInput,
  MapControlButton,
  MapControlsGroup,
  MapOverlay,
  MapStatusPill,
  FloorSelector,
  AIMessage,
  Listbox,
  Text,
  Heading,
  POIDetailPanel,
  Spinner,
  AISearchButton,
  SearchBar,
  RouteProgressRail,
  Skeleton,
  Tag,
  ToggleButton,
  SegmentedControl,
  POIResultCard,
  POIResultGroup,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Switch,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Tabs,
  TabsList,
  TabsTrigger,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Backdrop,
  IconButton,
  FloatingActionButton,
  SplitButton,
  AISearchButton,
} from "@kozmos-ds/react";
import type {
  POIPresentation,
  POIResultPresentation,
  TravelTimeBand,
} from "@kozmos-ds/product-contracts";

/* Decision 50 (GAP-088): a walk shown as a band on the result card's four
   surfaces, a card and a grouped row, each at rest and selected. Nearby is
   the success tone and the other bands the card's text; the check measures
   what each draws in, and on what. */
function TravelTimes({ id }: { id: string }) {
  const poi = (name: string): POIPresentation => ({
    id: `${id}-${name}`,
    name,
    floorLabel: "Level 1",
    media: [],
    actions: [],
  });
  const result = (
    name: string,
    band: TravelTimeBand,
    selected = false,
  ): POIResultPresentation => ({
    poiId: `${id}-${name}`,
    resultIndex: 0,
    selected,
    featured: false,
    travelEstimate: { durationSeconds: 45, durationLabel: "exact", band },
  });
  const card = (name: string, band: TravelTimeBand, selected?: boolean) => (
    <POIResultCard
      data-testid={`${id}-travel-${name}`}
      poi={poi(name)}
      result={result(name, band, selected)}
      onSelect={() => undefined}
    />
  );
  return (
    <div data-testid={`${id}-travel`}>
      {card("card", "nearby")}
      {card("card-selected", "nearby", true)}
      {card("card-neutral", "fiveToTenMinutes")}
      <POIResultGroup
        data-testid={`${id}-travel-group`}
        items={[
          {
            poi: poi("row-selected"),
            result: result("row-selected", "nearby", true),
          },
          { poi: poi("row"), result: result("row", "nearby") },
        ]}
        collapsedCount={2}
        onSelect={() => undefined}
      />
    </div>
  );
}

/* The result card's one tab (GAP-054, and quick access's numbers): Featured,
   a number at rest and selected, and a quiet badge, on cards; and a grouped
   row's number before its name, at rest and selected. The check reads what
   each is painted in, where it hangs, and what the result is called. */
function ResultTabs({ id }: { id: string }) {
  const poi = (name: string): POIPresentation => ({
    id: `${id}-tab-${name}`,
    name: `Burger King ${name}`,
    floorLabel: "Level 1",
    media: [],
    actions: [],
  });
  const result = (
    name: string,
    extra: Partial<POIResultPresentation> = {},
  ): POIResultPresentation => ({
    poiId: `${id}-tab-${name}`,
    resultIndex: 2,
    selected: false,
    featured: false,
    ...extra,
  });
  const card = (name: string, extra?: Partial<POIResultPresentation>) => (
    <POIResultCard
      data-testid={`${id}-tab-${name}`}
      presentationStyle="legacy"
      numbered={name !== "badge"}
      poi={poi(name)}
      result={result(name, extra)}
      onSelect={() => undefined}
    />
  );
  return (
    <div data-testid={`${id}-tabs`}>
      {card("featured", { featured: true })}
      {card("number")}
      {card("number-selected", { selected: true })}
      {card("badge", { badge: { label: "Alternative" } })}
      <POIResultGroup
        data-testid={`${id}-tab-group`}
        presentationStyle="legacy"
        items={[
          {
            poi: poi("row-selected"),
            result: result("row-selected", { selected: true }),
          },
          { poi: poi("row"), result: result("row") },
        ]}
        collapsedCount={2}
        numbered
        onSelect={() => undefined}
      />
    </div>
  );
}

/* GAP-082 (row 81): map chrome floating in MapOverlays, or the same chrome
   placed by hand at the same insets. The two boards must draw alike: the
   overlay's scroll box cut its controls' shadows, and their rings, at its own
   edges. The last board is an overlay whose stack is taller than the room it
   is given, so it scrolls. The group boards hold a MapControlsGroup in an
   overlay, one that fits and one that overflows, for the presses in the gaps
   between its controls (decision 46). */
function MapBoard({
  id,
  layout,
}: {
  id: string;
  layout: "overlay" | "by-hand" | "scrolling" | "group" | "group-scrolling";
}) {
  const control = (name: string) => (
    <MapControlButton
      icon={<span aria-hidden="true">+</span>}
      label={`${id} ${name}, ${layout}`}
    />
  );
  const floors = (
    <FloorSelector
      floors={["3", "2", "1"]}
      selectedFloor="2"
      onFloorSelect={() => undefined}
      label={`${id} floors, ${layout}`}
    />
  );
  return (
    <div
      data-testid={`${id}-map-board-${layout}`}
      style={{
        position: "relative",
        width: 200,
        // A group's four controls and their gaps are 209 tall.
        height: layout.startsWith("group") ? 300 : 220,
        background: "var(--primitives-colors-background-100)",
      }}
    >
      {/* The map itself, as a renderer's canvas is: behind the chrome, a
          sibling of it, and what a press the chrome does not take reaches
          (decision 46). It paints nothing. */}
      <div
        data-testid={`${id}-map-board-${layout}-map`}
        style={{ position: "absolute", inset: 0 }}
      />
      {layout === "by-hand" ? (
        <>
          <div
            style={{ position: "absolute", top: 16, left: 16, display: "flex" }}
          >
            {control("zoom in")}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              display: "flex",
            }}
          >
            {floors}
          </div>
        </>
      ) : layout === "overlay" ? (
        <>
          <MapOverlay position="top-left">{control("zoom in")}</MapOverlay>
          <MapOverlay position="bottom-right">{floors}</MapOverlay>
        </>
      ) : layout.startsWith("group") ? (
        <MapOverlay
          position="top-left"
          data-testid={`${id}-map-overlay-${layout}`}
          style={layout === "group-scrolling" ? { maxHeight: 120 } : undefined}
        >
          <MapControlsGroup
            label={`${id} map controls, ${layout}`}
            zoomInLabel={`${id} zoom in, ${layout}`}
            zoomOutLabel={`${id} zoom out, ${layout}`}
            compassResetLabel={`${id} reset bearing, ${layout}`}
            locationLabel={`${id} locate, ${layout}`}
            onZoomIn={() => undefined}
            onZoomOut={() => undefined}
            onCompassReset={() => undefined}
            onMyLocation={() => undefined}
          />
        </MapOverlay>
      ) : (
        <MapOverlay
          position="top-left"
          data-testid={`${id}-map-overlay-scrolling`}
          style={{ maxHeight: 120 }}
        >
          {control("zoom in")}
          {control("zoom out")}
          {control("locate")}
        </MapOverlay>
      )}
    </div>
  );
}

/* GAP-261: each part whose look is its state, on its own and as a tooltip's
   trigger. Radix's tooltip trigger writes its own data-state (closed,
   delayed-open, instant-open) over the part's, so a look keyed on data-state
   was lost in the trigger; each pair must draw alike. GAP-262: a pressed
   ToggleButton (plain, outline and disabled) and a Backdrop with and without
   a target, which must draw without @scope. */
function StateLooks({ id }: { id: string }) {
  const tip = (testId: string, child: ReactElement) => (
    <Tooltip>
      <TooltipTrigger asChild data-testid={testId}>
        {child}
      </TooltipTrigger>
      <TooltipContent>{testId}</TooltipContent>
    </Tooltip>
  );
  return (
    <TooltipProvider delayDuration={0}>
      <div data-testid={`${id}-state-looks`}>
        <ToggleButton data-testid={`${id}-toggle-off`} aria-label="Off">
          B
        </ToggleButton>
        <ToggleButton
          data-testid={`${id}-toggle-on`}
          aria-label="On"
          defaultPressed
        >
          B
        </ToggleButton>
        {tip(
          `${id}-toggle-on-tip`,
          <ToggleButton aria-label="On, in a tooltip" defaultPressed>
            B
          </ToggleButton>,
        )}
        <ToggleButton
          data-testid={`${id}-toggle-on-outline`}
          aria-label="On, outline"
          variant="outline"
          defaultPressed
        >
          B
        </ToggleButton>
        <ToggleButton
          data-testid={`${id}-toggle-on-disabled`}
          aria-label="On, disabled"
          defaultPressed
          disabled
        >
          B
        </ToggleButton>
        <Switch
          data-testid={`${id}-switch-on`}
          aria-label="On"
          defaultChecked
        />
        {tip(
          `${id}-switch-on-tip`,
          <Switch aria-label="On, in a tooltip" defaultChecked />,
        )}
        <Checkbox data-testid={`${id}-check-on`} aria-label="On" checked />
        {tip(
          `${id}-check-on-tip`,
          <Checkbox aria-label="On, in a tooltip" checked />,
        )}
        <Checkbox
          data-testid={`${id}-check-mixed`}
          aria-label="Mixed"
          checked="indeterminate"
        />
        {tip(
          `${id}-check-mixed-tip`,
          <Checkbox aria-label="Mixed, in a tooltip" checked="indeterminate" />,
        )}
        <RadioGroup aria-label={`${id} radios`} defaultValue="a">
          <RadioGroupItem
            data-testid={`${id}-radio-on`}
            value="a"
            aria-label="A"
          />
          {tip(
            `${id}-radio-on-tip`,
            <RadioGroupItem value="a" aria-label="A, in a tooltip" />,
          )}
        </RadioGroup>
        <RadioGroup aria-label={`${id} cards`} defaultValue="a">
          <RadioGroupItem
            data-testid={`${id}-radio-card-on`}
            value="a"
            variant="card"
            label="Card"
          />
          {tip(
            `${id}-radio-card-on-tip`,
            <RadioGroupItem
              value="a"
              variant="card"
              label="Card, in a tooltip"
            />,
          )}
        </RadioGroup>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger data-testid={`${id}-tab-on`} value="a">
              A
            </TabsTrigger>
            {tip(`${id}-tab-on-tip`, <TabsTrigger value="a">A</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <Accordion type="multiple" variant="boxed" defaultValue={["a", "b"]}>
          <AccordionItem value="a">
            <AccordionTrigger data-testid={`${id}-accordion-on`}>
              A
            </AccordionTrigger>
            <AccordionContent>A</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            {tip(
              `${id}-accordion-on-tip`,
              <AccordionTrigger>B, in a tooltip</AccordionTrigger>,
            )}
            <AccordionContent>B</AccordionContent>
          </AccordionItem>
        </Accordion>
        <div
          data-testid={`${id}-backdrop-box`}
          style={{ position: "relative", width: 120, height: 40 }}
        >
          <Backdrop data-testid={`${id}-backdrop`} placement="inline" />
        </div>
        <div
          data-testid={`${id}-backdrop-target-box`}
          style={{ position: "relative", width: 120, height: 40 }}
        >
          <Backdrop
            data-testid={`${id}-backdrop-targeted`}
            placement="inline"
            target={{ top: 0, left: 0, width: 1, height: 1 }}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

// Decision 197 (GAP-218): every disabled Button, and each part that takes
// its props, drawn from the disabled pair; and decision 192 (GAP-210): the
// tooltip's inverse tone beside the default. The tooltips open only while the
// check holds them open, so they cover nothing another section hovers.
function DisabledLooks({ id }: { id: string }) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const mark = <span aria-hidden="true">+</span>;
  return (
    <div data-testid={`${id}-disabled-looks`}>
      {(
        [
          "default",
          "destructive",
          "outline",
          "secondary",
          "ghost",
          "link",
          "glass",
          "subtle",
        ] as const
      ).map((variant) => (
        <Button
          key={variant}
          data-testid={`${id}-disabled-${variant}`}
          variant={variant}
          disabled
        >
          {variant}
        </Button>
      ))}
      <Button
        data-testid={`${id}-disabled-emotion-filled`}
        emotion="success"
        disabled
      >
        Filled success
      </Button>
      <Button
        data-testid={`${id}-disabled-emotion-outline`}
        variant="outline"
        emotion="danger"
        disabled
      >
        Outline danger
      </Button>
      <Button
        data-testid={`${id}-disabled-emotion-text`}
        variant="ghost"
        emotion="danger"
        disabled
      >
        Ghost danger
      </Button>
      <Button
        data-testid={`${id}-disabled-emotion-subtle`}
        variant="subtle"
        emotion="danger"
        disabled
      >
        Subtle danger
      </Button>
      <Button data-testid={`${id}-loading-default`} isLoading>
        Loading
      </Button>
      <Button data-testid={`${id}-loading-outline`} variant="outline" isLoading>
        Loading outline
      </Button>
      <Button data-testid={`${id}-disabled-loading`} isLoading disabled>
        Disabled and loading
      </Button>
      <Button data-testid={`${id}-disabled-aria-default`} aria-disabled="true">
        Unavailable
      </Button>
      <Button
        data-testid={`${id}-disabled-aria-outline`}
        variant="outline"
        aria-disabled="true"
      >
        Unavailable outline
      </Button>
      <Button
        data-testid={`${id}-disabled-aria-ghost`}
        variant="ghost"
        aria-disabled="true"
      >
        Unavailable ghost
      </Button>
      <IconButton
        data-testid={`${id}-disabled-icon-counter`}
        label="Messages"
        variant="default"
        counter={3}
        disabled
      >
        {mark}
      </IconButton>
      <AISearchButton
        data-testid={`${id}-disabled-ai-search`}
        label="Assistant, disabled"
        disabled
      />
      <IconButton
        data-testid={`${id}-disabled-icon-button`}
        label="Add"
        variant="default"
        disabled
      >
        {mark}
      </IconButton>
      <IconButton
        data-testid={`${id}-disabled-icon-button-ghost`}
        label="Add, ghost"
        disabled
      >
        {mark}
      </IconButton>
      <IconButton
        data-testid={`${id}-disabled-icon-button-outline`}
        label="Add, outline"
        variant="outline"
        disabled
      >
        {mark}
      </IconButton>
      <FloatingActionButton
        data-testid={`${id}-disabled-fab`}
        aria-label="Create"
        disabled
      />
      <SplitButton
        data-testid={`${id}-disabled-split`}
        disabled
        menuItems={[{ label: "Draft", onClick: () => {} }]}
      >
        Publish
      </SplitButton>
      <MapControlButton
        data-testid={`${id}-disabled-map-control-off`}
        icon={mark}
        label="Locate"
        pressed={false}
        disabled
      />
      <MapControlButton
        data-testid={`${id}-disabled-map-control-on`}
        icon={mark}
        label="Locate"
        pressed
        disabled
      />
      <MapControlButton
        data-testid={`${id}-disabled-map-control-aria`}
        icon={mark}
        label="Locate"
        pressed={false}
        aria-disabled="true"
      />
      <MapControlButton
        data-testid={`${id}-disabled-map-control-filled`}
        icon={mark}
        label="Locate"
        pressed
        emphasis="filled"
        disabled
      />
      <button
        type="button"
        data-testid={`${id}-tone-tips-toggle`}
        onClick={() => setTipsOpen(!tipsOpen)}
      >
        Tips
      </button>
      <TooltipProvider delayDuration={0}>
        <Tooltip open={tipsOpen}>
          <TooltipTrigger data-testid={`${id}-tone-tip-default-trigger`}>
            D
          </TooltipTrigger>
          <TooltipContent data-testid={`${id}-tone-tip-default`} side="bottom">
            Default
          </TooltipContent>
        </Tooltip>
        <Tooltip open={tipsOpen}>
          <TooltipTrigger data-testid={`${id}-tone-tip-inverse-trigger`}>
            I
          </TooltipTrigger>
          <TooltipContent
            data-testid={`${id}-tone-tip-inverse`}
            side="bottom"
            tone="inverse"
          >
            Inverse
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function Controls({ id }: { id: string }) {
  return (
    <section data-testid={id} style={{ width: 300 }}>
      <h1 className="consumer-heading" data-testid={`${id}-host-heading`}>
        Host heading
      </h1>
      {/* The route rail's waypoints, in route mode, for the edge each draws. */}
      <RouteProgressRail
        data-testid={`${id}-route-rail`}
        label="Journey progress"
        type="lift-up"
        progress={0.2}
        activeLeg={{ start: 0, end: 0.4 }}
        activeWaypointId="lift"
        waypoints={[
          { id: "start", position: 0, type: "walking", label: "Entrance" },
          {
            id: "lift",
            position: 0.4,
            type: "lift-up",
            label: "Elevator to Level 2",
          },
          { id: "end", position: 1, type: "destination", label: "Gallery" },
        ]}
      />
      <Heading level={2} data-testid={`${id}-heading`}>
        Library heading
      </Heading>
      <Text size="sm" weight="semibold" data-testid={`${id}-text`}>
        Library text
      </Text>
      <Text className="consumer-copy" data-testid={`${id}-host-copy`}>
        Product copy
      </Text>
      <Listbox
        aria-label={`${id} long list`}
        data-testid={`${id}-listbox`}
        options={Array.from({ length: 30 }, (_, index) => ({
          value: String(index),
          label: `Place ${index}`,
          description: `Description ${index}`,
        }))}
      />
      <Input
        label={`${id} name`}
        helperText="Helper text"
        data-testid={`${id}-input`}
      />
      <Input label={`${id} disabled`} disabled data-testid={`${id}-disabled`} />
      <Input
        label={`${id} invalid`}
        error="Invalid value"
        data-testid={`${id}-invalid`}
      />
      <Input
        label={`${id} warning`}
        status="warning"
        data-testid={`${id}-warning`}
      />
      <Input
        label={`${id} success`}
        status="success"
        data-testid={`${id}-success`}
      />
      <Input
        label={`${id} override`}
        className="consumer-control"
        data-testid={`${id}-override`}
      />
      <Input label={`${id} file`} type="file" data-testid={`${id}-file`} />
      <Textarea label={`${id} notes`} data-testid={`${id}-textarea`} />
      <Button data-testid={`${id}-button`}>Save</Button>
      <Button variant="outline" emotion="success" data-testid={`${id}-outline`}>
        Confirm
      </Button>
      <Button disabled data-testid={`${id}-disabled-button`}>
        Disabled
      </Button>
      <Button isLoading data-testid={`${id}-loading`}>
        Loading
      </Button>
      <Spinner data-testid={`${id}-spinner`} />
      <Spinner size="xl" data-testid={`${id}-spinner-xl`} />
      <AISearchButton
        data-testid={`${id}-ai-search`}
        label={`${id} AI search`}
      />
      {/* The search row, in a container narrow enough and willing to wrap. The
          pair composed by hand lands on two lines, because the field is
          `w-full`; the pair composed through `trailing` cannot. */}
      <div
        data-testid={`${id}-row-by-hand`}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          width: 360,
        }}
      >
        <SearchBar aria-label={`${id} by hand`} placeholder="Search places" />
        <AISearchButton label={`${id} assistant, by hand`} />
      </div>
      <div
        data-testid={`${id}-row-by-slot`}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          width: 360,
        }}
      >
        <SearchBar
          aria-label={`${id} by slot`}
          placeholder="Search places"
          trailing={<AISearchButton label={`${id} assistant, by slot`} />}
        />
      </div>
      {/* GAP-75: the same icon-and-label gap as the Button's, in parts that
          share none of its CSS. */}
      <ToggleButton data-testid={`${id}-toggle-icon-label`}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" />
        Step free
      </ToggleButton>
      <SegmentedControl
        aria-label={`${id} route`}
        items={[
          {
            value: "walk",
            label: (
              <>
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                />
                Walk
              </>
            ),
          },
          { value: "step-free", label: "Step free" },
        ]}
        value="walk"
        onValueChange={() => undefined}
        data-testid={`${id}-segmented`}
      />
      <Tag data-testid={`${id}-tag-remove`} onRemove={() => undefined}>
        Open
      </Tag>
      <Tag data-testid={`${id}-tag-icon-label`}>
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" />
        Open
      </Tag>
      <Skeleton data-testid={`${id}-skeleton`} className="h-4 w-24" />
      <Button data-testid={`${id}-icon-label`}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" />
        Navigate
      </Button>
      <Button variant="glass" data-testid={`${id}-glass`}>
        Glass
      </Button>
      <Surface
        variant="glass"
        data-testid={`${id}-glass-surface`}
        className="rounded-container p-2"
      >
        Glass surface
      </Surface>
      <Surface
        data-testid={`${id}-solid-surface`}
        className="rounded-container p-2"
      >
        Solid surface
      </Surface>
      <button
        className={buttonVariants({ size: "icon" })}
        data-testid={`${id}-helper-button`}
        aria-label={`${id} helper button`}
      >
        +
      </button>
      <input
        className={inputVariants({ status: "warning" })}
        data-testid={`${id}-helper-input`}
        aria-label={`${id} helper input`}
      />
      <input
        className={inputVariants({ status: "warning", error: true })}
        data-testid={`${id}-helper-error`}
        aria-label={`${id} helper error`}
      />
      <PasswordInput label={`${id} password`} data-testid={`${id}-password`} />
      <NumberInput label={`${id} number`} data-testid={`${id}-number`} />
      <PasswordInput
        label={`${id} disabled password`}
        disabled
        data-testid={`${id}-password-disabled`}
      />
      <NumberInput
        label={`${id} plain number`}
        showSteppers={false}
        data-testid={`${id}-number-plain`}
      />
      <NumberInput
        label={`${id} readonly number`}
        readOnly
        defaultValue={2}
        data-testid={`${id}-number-readonly`}
      />
      <NumberInput
        label={`${id} disabled number`}
        disabled
        defaultValue={2}
        data-testid={`${id}-number-disabled`}
      />
      {(["error", "warning", "success"] as const).map((status) => (
        <NumberInput
          key={status}
          label={`${id} ${status} number`}
          status={status}
          data-testid={`${id}-number-${status}`}
        />
      ))}
      <MapControlButton
        icon={<span aria-hidden="true">+</span>}
        label={`${id} map control`}
        emphasis="filled"
        pressed
        data-testid={`${id}-map-control`}
      />
      <MapControlButton
        icon={<span aria-hidden="true">+</span>}
        label={`${id} labelled control`}
        presentation="labelled"
        stateLabel="On"
        data-testid={`${id}-map-control-labelled`}
      />
      {/* Decision 40: the map controls take the SDK's surface and labels
          (Figma ce7phRJR1sCkH6zT8EMH8I, Tracking Indicator 434:31572). */}
      <MapControlButton
        icon={<span aria-hidden="true">+</span>}
        label={`${id} surface`}
        data-testid={`${id}-map-surface`}
      />
      {/* Decision 39: the map's status pill wears the map controls' surface,
          and Turn Back fills with the warning role. */}
      <MapStatusPill tone="progress" data-testid={`${id}-map-status`}>
        {`${id} calculating`}
      </MapStatusPill>
      <MapStatusPill
        icon={null}
        tone="warning"
        data-testid={`${id}-map-status-warning`}
      >
        {`${id} turn back`}
      </MapStatusPill>
      <MapControlsGroup
        label={`${id} zoom`}
        zoomInLabel={`${id} zoom in`}
        zoomOutLabel={`${id} zoom out`}
        onZoomIn={() => undefined}
        onZoomOut={() => undefined}
        data-testid={`${id}-map-zoom`}
      />
      {(
        [
          "off",
          "following",
          "heading",
          "heading-paused",
          "unavailable",
        ] as const
      ).map((state) => (
        <MapControlsGroup
          key={state}
          label={`${id} location ${state}`}
          locationLabel="Focus"
          locationLabelPlacement="stacked"
          locationPresentation="labelled"
          locationState={state}
          locationStateLabel={
            state === "off" || state === "heading-paused"
              ? "Off"
              : state === "unavailable"
                ? "No Location"
                : "On"
          }
          onMyLocation={() => undefined}
          data-testid={`${id}-location-${state}`}
        />
      ))}
      <MapBoard id={id} layout="overlay" />
      <MapBoard id={id} layout="by-hand" />
      <MapBoard id={id} layout="scrolling" />
      <MapBoard id={id} layout="group" />
      <MapBoard id={id} layout="group-scrolling" />
      <AIMessage status="streaming" data-testid={`${id}-ai-streaming`}>
        Looking through this building…
      </AIMessage>
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open {id}</Button>
        </PopoverTrigger>
        <PopoverContent data-testid={`${id}-popover`}>
          <Input
            label={`${id} portal input`}
            data-testid={`${id}-portal-input`}
          />
          <PopoverArrow data-testid={`${id}-arrow`} />
        </PopoverContent>
      </Popover>
      <div className="host-slot">
        <button className="host-slot-button">Host slot</button>
      </div>
      <TravelTimes id={id} />
      <ResultTabs id={id} />
      <StateLooks id={id} />
      <POIDetailPanel
        data-testid={`${id}-poi`}
        poi={{
          id,
          name: "Terminal entrance",
          floorId: "1",
          floorLabel: "Floor 1",
          media: [],
          actions: ["navigate"],
        }}
        actionLabels={{
          navigate: "Go",
          share: "Share",
          favourite: "Favourite",
          bookmark: "Bookmark",
          order: "Order",
        }}
        onAction={() => undefined}
        onClose={() => undefined}
        details={{
          summary: [
            {
              id: "rating",
              kind: "rating",
              label: "Rating",
              value: "4.7 / 5",
              detail: "32 reviews",
            },
            {
              id: "access",
              kind: "accessibility",
              label: "Accessibility",
              value: "Step-free",
              tone: "success",
            },
            {
              id: "crowd",
              kind: "crowd",
              label: "Crowd",
              value: "Packed",
              detail: "25 min wait",
              tone: "danger",
            },
          ],
          groups: [
            {
              id: "languages",
              heading: "Languages",
              items: [{ id: "en", label: "English" }],
            },
          ],
          openingHours: {
            label: "Hours",
            summary: "View opening hours",
            rows: [{ id: "mon", day: "Monday", hours: "09:00–17:00" }],
          },
        }}
      />
      <DisabledLooks id={id} />
    </section>
  );
}
function Fixture() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  return (
    <>
      <button
        id="switch-theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        Switch theme
      </button>
      <ThemeProvider theme={theme} dir="rtl">
        <DesignConfigProvider
          initialConfig={{ glass: { enabled: true, frost: 70 } }}
        >
          <Controls id="outer" />
          <ThemeProvider theme="light">
            <Controls id="nested" />
          </ThemeProvider>
          {/* The design config's own reduced motion, with no media query set:
              GAP-50 asked that `motion: reduced` reach the animations, and it
              reached none of them. */}
          <DesignConfigProvider initialConfig={{ motion: "reduced" }}>
            <div data-testid="config-reduced">
              <Spinner data-testid="config-reduced-spinner" />
              <Skeleton
                data-testid="config-reduced-skeleton"
                className="h-4 w-24"
              />
              <AISearchButton label="config reduced assistant" />
            </div>
          </DesignConfigProvider>
        </DesignConfigProvider>
      </ThemeProvider>
    </>
  );
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
