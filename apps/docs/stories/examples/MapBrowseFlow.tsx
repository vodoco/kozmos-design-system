import { useLayoutEffect, useRef, useState } from "react";
import {
  AdaptiveMapShell,
  BrowseCategoriesPanel,
  Button,
  FloorSelector,
  LanguageSwitcher,
  MapAttribution,
  MapInfo,
  MapControlsGroup,
  POIDetailPanel,
  POIResultList,
  SearchBar,
  ThemeProvider,
} from "@kozmos-ds/react";
import type {
  AdaptiveMapLayoutSnapshot,
  POIResultListItem,
} from "@kozmos-ds/react";
import {
  Utensils,
  ShoppingBag01,
  InfoCircle,
  Accessibility,
} from "@kozmos-ds/icons";

const categories = [
  { id: "dining", label: "Food & drink", selected: false },
  { id: "shopping", label: "Shopping", selected: false },
  { id: "information", label: "Information", selected: false },
  { id: "accessibility", label: "Accessibility", selected: false },
];
const icons = [Utensils, ShoppingBag01, InfoCircle, Accessibility];
const places = [
  {
    id: "cafe",
    name: "Harbour Coffee Co.",
    categoryId: "dining",
    categoryLabel: "Food & drink",
  },
  {
    id: "shop",
    name: "Travel Essentials",
    categoryId: "shopping",
    categoryLabel: "Shopping",
  },
  {
    id: "desk",
    name: "Information desk",
    categoryId: "information",
    categoryLabel: "Information",
  },
  {
    id: "assistance",
    name: "Assistance point",
    categoryId: "accessibility",
    categoryLabel: "Accessibility",
  },
].map((place) => ({
  ...place,
  floorId: "G",
  floorLabel: "Ground floor",
  buildingLabel: "Terminal 2",
  media: [],
  actions: [] as const,
}));

/** Host-owned state, composed from public DS components. No live SDK or routing. */
export function MapBrowseFlow({
  width = 1200,
  height = 720,
  dir = "ltr",
  selected = false,
  infoOpen = false,
  mapImage,
  onLayoutChange,
}: {
  width?: number;
  height?: number;
  dir?: "ltr" | "rtl";
  selected?: boolean;
  infoOpen?: boolean;
  mapImage?: string;
  onLayoutChange?: (layout: AdaptiveMapLayoutSnapshot) => void;
}) {
  const [query, setQuery] = useState("");
  const [informationOpen, setInformationOpen] = useState(infoOpen);
  const [categoryId, setCategoryId] = useState<string>();
  const [poiId, setPoiId] = useState<string | undefined>(
    selected ? "cafe" : undefined,
  );
  const [floor, setFloor] = useState("G");
  const [locale, setLocale] = useState("en");
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const previousPoi = useRef(poiId);
  const poi = places.find((place) => place.id === poiId);
  const matches = places.filter(
    (place) =>
      (!categoryId || place.categoryId === categoryId) &&
      place.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const results: POIResultListItem[] = matches.map((place, index) => ({
    poi: place,
    result: {
      poiId: place.id,
      floorId: place.floorId,
      resultIndex: index + 1,
      selected: false,
      featured: false,
    },
  }));
  useLayoutEffect(() => {
    if (poiId !== previousPoi.current) {
      if (poiId)
        panelRef.current
          ?.querySelector<HTMLButtonElement>('[aria-label="Close details"]')
          ?.focus();
      else searchRef.current?.focus();
      previousPoi.current = poiId;
    }
  }, [poiId]);
  const browsingResults = Boolean(query.trim() || categoryId);
  return (
    <ThemeProvider dir={dir}>
      <MapInfo
        style={{ width, height, maxWidth: "100%" }}
        open={informationOpen}
        onOpenChange={setInformationOpen}
        content={{
          title: "About this map",
          introduction:
            "Explore Terminal 2 and find the places and services you need.",
          faqs: [
            {
              id: "search",
              question: "How do I find a place?",
              answer:
                "Search by name or choose a category. Select a result to view its details.",
            },
            {
              id: "floors",
              question: "How do I change floors?",
              answer: "Open the floor selector and choose a level.",
            },
            {
              id: "help",
              question: "Where can I get help?",
              answer: "Visit the information desk for assistance.",
            },
          ],
          credits: [
            { id: "indoor", label: "Indoor map data © Example venue" },
            {
              id: "outdoor",
              label: "© OpenStreetMap contributors",
              href: "https://www.openstreetmap.org/copyright",
            },
          ],
          links: [
            {
              id: "support",
              label: "Contact support",
              href: "mailto:support@example.com",
            },
          ],
          versions: [
            { id: "demo", label: "Example content", value: "Not a live SDK" },
          ],
        }}
      >
        <AdaptiveMapShell
          style={{ width: "100%", height: "100%" }}
          data-testid="shell"
          onLayoutChange={onLayoutChange}
          map={
            mapImage ? (
              <img
                src={mapImage}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                className="h-full bg-muted"
                role="img"
                aria-label="Illustrative map; no live SDK"
              />
            )
          }
          panelPlacement="start"
          panelLabel={poi ? "Place details" : "Browse places"}
          defaultPanelDetent="medium"
          panel={
            <div ref={panelRef}>
              {poi ? (
                <POIDetailPanel
                  presentation="sheet"
                  poi={poi}
                  actionLabels={{
                    favourite: "Favourite",
                    bookmark: "Save",
                    navigate: "Go",
                    share: "Share",
                    order: "Order",
                  }}
                  onAction={() => undefined}
                  onClose={() => setPoiId(undefined)}
                />
              ) : (
                <>
                  <BrowseCategoriesPanel
                    categories={categories.map((category) => ({
                      ...category,
                      selected: category.id === categoryId,
                    }))}
                    onSelect={(id) =>
                      setCategoryId(categoryId === id ? undefined : id)
                    }
                    renderIcon={(category) => {
                      const Icon =
                        icons[
                          categories.findIndex(
                            (item) => item.id === category.id,
                          )
                        ];
                      return <Icon className="h-8 w-8" />;
                    }}
                    search={
                      <SearchBar
                        ref={searchRef}
                        aria-label="Search this building"
                        placeholder="Search this building"
                        value={query}
                        onChange={setQuery}
                        onClear={() => setQuery("")}
                      />
                    }
                  />
                  {browsingResults && (
                    <div className="px-4 pb-4">
                      {categoryId && (
                        <Button
                          variant="ghost"
                          onClick={() => setCategoryId(undefined)}
                        >
                          All categories
                        </Button>
                      )}
                      <POIResultList
                        items={results}
                        onSelect={setPoiId}
                        resultCountLabel={`${results.length} places found`}
                        emptyState="No places found"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          }
          controlsBottomStart={
            <div data-testid="language">
              <LanguageSwitcher
                languages={[
                  { id: "en", label: "English" },
                  { id: "de", label: "Deutsch" },
                ]}
                selectedLocale={locale}
                onLocaleRequest={setLocale}
              />
            </div>
          }
          controlsBottomEnd={
            <div
              data-testid="floor-zoom"
              className="flex flex-col items-end gap-4"
            >
              <FloorSelector
                variant="collapsible"
                floors={[
                  { id: "1", label: "First floor", shortLabel: "1F" },
                  { id: "G", label: "Ground floor", shortLabel: "GF" },
                  { id: "B", label: "Lower ground", shortLabel: "LG" },
                ]}
                selectedFloor={floor}
                onFloorSelect={setFloor}
              />
              <MapControlsGroup
                onZoomIn={() => undefined}
                onZoomOut={() => undefined}
              />
            </div>
          }
          attribution={
            <MapAttribution
              data-testid="attribution"
              credits={[
                { id: "owner", label: "© Pointr 2026" },
                {
                  id: "outdoor",
                  label: "© MapTiler © OpenStreetMap contributors",
                  href: "https://www.openstreetmap.org/copyright",
                },
              ]}
            />
          }
        />
      </MapInfo>
    </ThemeProvider>
  );
}
