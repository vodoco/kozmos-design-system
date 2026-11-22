import figma from "@figma/code-connect";
import {
  RouteLocationField,
  type RouteLocationFieldProps,
} from "./RouteLocationField";

const routeLocationFieldUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17648";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const query: RouteLocationFieldProps["query"];
declare const places: RouteLocationFieldProps["options"];
declare const setQuery: RouteLocationFieldProps["onQueryChange"];
declare const choosePlace: RouteLocationFieldProps["onSelect"];
declare const clearPlace: RouteLocationFieldProps["onClear"];

/**
 * Figma Code Connect: RouteLocationField (GAP-206)
 *
 * State is location and status: Search, Loading, Empty and Error are the
 * search with no place (status idle, loading, empty, error), Resolved the
 * place chosen. Label Text is label; Location Text and Description Text are
 * the place's label and description, the description shown by Show
 * Description. filterMode is behaviour and is not drawn.
 */
figma.connect(RouteLocationField, routeLocationFieldUrl, {
  variant: { State: "Resolved" },
  props: {
    label: figma.string("Label Text"),
    locationLabel: figma.string("Location Text"),
    description: figma.boolean("Show Description", {
      true: figma.string("Description Text"),
      false: undefined,
    }),
  },
  example: ({ label, locationLabel, description }) => (
    <RouteLocationField
      label={label}
      location={{ value: "main-lobby", label: locationLabel, description }}
      query={query}
      options={places}
      onQueryChange={(next) => setQuery(next)}
      onSelect={(place) => choosePlace(place)}
      onClear={() => clearPlace()}
    />
  ),
});

figma.connect(RouteLocationField, routeLocationFieldUrl, {
  variant: { State: "Search" },
  props: { label: figma.string("Label Text") },
  example: ({ label }) => (
    <RouteLocationField
      label={label}
      location={null}
      query={query}
      options={places}
      onQueryChange={(next) => setQuery(next)}
      onSelect={(place) => choosePlace(place)}
      onClear={() => clearPlace()}
    />
  ),
});

figma.connect(RouteLocationField, routeLocationFieldUrl, {
  variant: { State: "Loading" },
  props: { label: figma.string("Label Text") },
  example: ({ label }) => (
    <RouteLocationField
      label={label}
      location={null}
      query={query}
      options={places}
      status="loading"
      onQueryChange={(next) => setQuery(next)}
      onSelect={(place) => choosePlace(place)}
      onClear={() => clearPlace()}
    />
  ),
});

figma.connect(RouteLocationField, routeLocationFieldUrl, {
  variant: { State: "Empty" },
  props: { label: figma.string("Label Text") },
  example: ({ label }) => (
    <RouteLocationField
      label={label}
      location={null}
      query={query}
      options={places}
      status="empty"
      onQueryChange={(next) => setQuery(next)}
      onSelect={(place) => choosePlace(place)}
      onClear={() => clearPlace()}
    />
  ),
});

figma.connect(RouteLocationField, routeLocationFieldUrl, {
  variant: { State: "Error" },
  props: { label: figma.string("Label Text") },
  example: ({ label }) => (
    <RouteLocationField
      label={label}
      location={null}
      query={query}
      options={places}
      status="error"
      onQueryChange={(next) => setQuery(next)}
      onSelect={(place) => choosePlace(place)}
      onClear={() => clearPlace()}
    />
  ),
});
