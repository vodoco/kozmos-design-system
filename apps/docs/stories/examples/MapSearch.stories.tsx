import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  Icon,
  MapView,
  POICard,
  SearchBar,
  Tag,
} from "@kozmos-ds/react";
import "./MapSearch.css";

const places = [
  {
    id: "bean",
    name: "Bean There",
    location: "Level 1 · Near entrance",
    open: true,
    x: 20,
    y: 30,
  },
  {
    id: "daily",
    name: "The Daily Grind",
    location: "Level 2 · Central atrium",
    open: true,
    x: 55,
    y: 45,
  },
  {
    id: "espresso",
    name: "Espresso Lab",
    location: "Level 1 · West wing",
    open: false,
    x: 35,
    y: 65,
  },
];

function MapSearchExample() {
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [selected, setSelected] = useState("daily");
  const [message, setMessage] = useState("");
  const results = places.filter(
    (place) =>
      (!openOnly || place.open) &&
      place.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <section className="kozmos-map-search" aria-label="Map search example">
      <header className="kozmos-map-search-heading">
        <h1>Coffee nearby</h1>
        <p>
          Illustrative indoor map. No live location or routing service is
          connected.
        </p>
      </header>
      <SearchBar
        aria-label="Search coffee shops"
        placeholder="Search coffee shops"
        value={query}
        onChange={setQuery}
      />
      <div className="kozmos-map-search-filters">
        <Button
          variant={openOnly ? "default" : "outline"}
          aria-pressed={openOnly}
          onClick={() => setOpenOnly(!openOnly)}
        >
          Open now
        </Button>
        <span role="status">{results.length} results</span>
      </div>
      <MapView
        mapLabel="Illustrative coffee shop map"
        style={{ height: "16rem", minHeight: "16rem" }}
      >
        {results.map((place) => (
          <Button
            key={place.id}
            size="icon"
            variant={selected === place.id ? "default" : "outline"}
            style={{
              position: "absolute",
              left: `${place.x}%`,
              top: `${place.y}%`,
            }}
            aria-label={`Select ${place.name}`}
            aria-pressed={selected === place.id}
            onClick={() => setSelected(place.id)}
          >
            <Icon name="marker-pin-01" />
          </Button>
        ))}
      </MapView>
      <section aria-label="Search results">
        <h2>Search results</h2>
        <div className="kozmos-map-search-results">
          {results.length === 0 ? (
            <p>No coffee shops match. Try another name or turn off Open now.</p>
          ) : (
            results.map((place) => (
              <POICard
                key={place.id}
                title={place.name}
                subtitle={place.location}
                selectionLabel={`Show ${place.name} on the map`}
                onClick={() => setSelected(place.id)}
                badges={
                  <>
                    <Tag emotion={place.open ? "success" : "neutral"}>
                      {place.open ? "Open now" : "Closed"}
                    </Tag>
                    {selected === place.id && <Tag>Selected</Tag>}
                  </>
                }
                actions={
                  <Button
                    onClick={() =>
                      setMessage(
                        `Demo route requested for ${place.name}. Connect a routing service to calculate directions.`,
                      )
                    }
                  >
                    Navigate
                  </Button>
                }
              />
            ))
          )}
        </div>
      </section>
      <p role="status">{message}</p>
    </section>
  );
}

const meta = {
  title: "Examples/Map Based Search",
  parameters: { layout: "fullscreen" },
  render: () => <MapSearchExample />,
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
