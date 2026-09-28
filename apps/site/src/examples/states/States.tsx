import "./States.css";
import { useEffect, useState } from "react";
import {
  Alert,
  AlertDescription,
  Box,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  EmptyState,
  Heading,
  Icon,
  POIResultList,
  Progress,
  SegmentedControl,
  Skeleton,
  Spinner,
  Stack,
  Tag,
  Text,
} from "@kozmos-ds/react";
import { useFocusOnChange } from "../focus";
import { places } from "../venue-explorer/data";

type State = "loading" | "ready" | "empty" | "error" | "offline";

const states: { value: State; label: string }[] = [
  { value: "loading", label: "Loading" },
  { value: "ready", label: "Ready" },
  { value: "empty", label: "Empty" },
  { value: "error", label: "Error" },
  { value: "offline", label: "Offline" },
];

function isState(value: string | undefined): value is State {
  return states.some((state) => state.value === value);
}

const shops = places.filter((place) => place.poi.categoryId === "shops");

function items(list: typeof shops) {
  return list.map((place, index) => ({
    poi: place.poi,
    result: {
      poiId: place.poi.id,
      resultIndex: index + 1,
      selected: false,
      featured: false,
      floorId: place.poi.floorId,
      travelEstimate: place.details.travelEstimate,
    },
  }));
}

export default function States() {
  const [state, setState] = useState<State>("loading");
  const [retrying, setRetrying] = useState(false);
  const [syncing, setSyncing] = useState(0);
  const [chosen, setChosen] = useState<string>();
  // "Show every shop" and a finished retry replace the view their button is
  // in; the card's heading then takes focus (../focus.ts).
  const [replaced, setReplaced] = useState(0);
  const shopsHeading = useFocusOnChange(replaced);

  // Loading resolves on its own after a moment, as a fetch would.
  useEffect(() => {
    if (state !== "loading") return;
    const timer = window.setTimeout(() => setState("ready"), 1800);
    return () => window.clearTimeout(timer);
  }, [state]);

  // Offline: what was saved is shown while a sync creeps along.
  useEffect(() => {
    if (state !== "offline") {
      setSyncing(0);
      return;
    }
    if (syncing >= 100) return;
    const timer = window.setTimeout(() => setSyncing(syncing + 10), 400);
    return () => window.clearTimeout(timer);
  }, [state, syncing]);

  // A retry takes a moment before it loads again; choosing another state in
  // that moment cancels it.
  useEffect(() => {
    if (!retrying) return;
    const timer = window.setTimeout(() => {
      setRetrying(false);
      setState("loading");
      setReplaced((count) => count + 1);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [retrying]);

  function retry() {
    setRetrying(true);
  }

  return (
    <Box className="ex-states">
      <Stack gap={6}>
        <Stack gap={2}>
          <Heading level={2}>Shops, in every state</Heading>
          <Text color="muted">
            The same panel while it loads, once it has loaded, with nothing to
            show, after a failure, and without a connection. Loading finishes on
            its own; error can be retried.
          </Text>
          <SegmentedControl
            label="State"
            items={states}
            value={state}
            onValueChange={(next) => {
              if (isState(next)) {
                setState(next);
                setChosen(undefined);
                setRetrying(false);
              }
            }}
          />
        </Stack>

        <Card>
          <CardHeader>
            <Heading
              level={3}
              ref={shopsHeading}
              tabIndex={-1}
              className="ex-states-title"
            >
              Shops
            </Heading>
            <CardDescription>
              {state === "loading"
                ? "Finding shops near you…"
                : state === "ready"
                  ? `${shops.length} shops, nearest first`
                  : state === "empty"
                    ? "Nothing matched"
                    : state === "error"
                      ? "Something went wrong"
                      : "Showing what was saved on Tuesday"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state === "loading" ? (
              <Stack gap={4} aria-busy="true" aria-live="polite">
                <Stack direction="row" align="center" gap={2}>
                  <Spinner size="sm" />
                  <Text size="sm" color="muted">
                    Loading shops
                  </Text>
                </Stack>
                {/* One skeleton per expected row: the shape of a result card. */}
                {[0, 1, 2].map((row) => (
                  <Box key={row} className="ex-states-row">
                    <Skeleton
                      shape="circle"
                      width="calc(var(--primitives-layout-sizing-600) * 1px)"
                    />
                    <Stack gap={2}>
                      <Skeleton shape="line" />
                      <Skeleton shape="line" width="55%" />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : state === "ready" ? (
              <Stack gap={3}>
                <POIResultList
                  label="Shops"
                  resultCountLabel={`${shops.length} shops`}
                  items={items(shops)}
                  currentFloorId="g"
                  selectedPoiId={chosen}
                  onSelect={setChosen}
                />
                <Text size="sm" color="muted" aria-live="polite">
                  {chosen
                    ? `Selected ${shops.find((place) => place.poi.id === chosen)?.poi.name}.`
                    : "Pick a shop."}
                </Text>
              </Stack>
            ) : state === "empty" ? (
              <EmptyState
                icon={<Icon name="search-md" size="xl" />}
                title="No shops match"
                description="Try another word, or browse by category."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setState("ready");
                      setReplaced((count) => count + 1);
                    }}
                  >
                    Show every shop
                  </Button>
                }
              />
            ) : state === "error" ? (
              <Stack gap={4}>
                <Alert variant="destructive">
                  <AlertDescription>
                    The shops could not be loaded. Check your connection and try
                    again; if it keeps happening, the venue’s map may be
                    updating.
                  </AlertDescription>
                </Alert>
                <Stack direction="row" gap={2}>
                  <Button onClick={retry} isLoading={retrying}>
                    Try again
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setState("ready");
                      setReplaced((count) => count + 1);
                    }}
                  >
                    Skip
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack gap={4}>
                <Alert variant="warning" role="status">
                  <AlertDescription>
                    You are offline. Opening hours may have changed since
                    Tuesday.
                  </AlertDescription>
                </Alert>
                <Stack gap={1}>
                  <Progress
                    value={syncing}
                    aria-label="Waiting for a connection"
                  />
                  <Text size="xs" color="muted" aria-live="polite">
                    {syncing >= 100
                      ? "Still no connection; will keep trying."
                      : `Trying again… ${syncing}%`}
                  </Text>
                </Stack>
                <Stack direction="row" align="center" gap={2}>
                  <Tag variant="outline" emotion="neutral">
                    Saved copy
                  </Tag>
                  <Text size="sm" color="muted">
                    Tuesday 16:20
                  </Text>
                </Stack>
                <POIResultList
                  label="Shops, saved copy"
                  resultCountLabel={`${shops.length} shops, saved`}
                  items={items(shops)}
                  currentFloorId="g"
                  onSelect={setChosen}
                />
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
