import type { ReactNode } from "react";
import { Box, Surface, Text } from "@kozmos/react";
import { places } from "./sample-data";

/**
 * A screen for the parts that pin themselves to the browser window:
 * `DynamicIsland` (GAPS.md, GAP-24), `BottomNavigation` (GAP-29), `Backdrop`
 * (GAP-34), `ToastViewport` (GAP-36) and a `FloatingActionButton` asked for
 * `placement="fixed"`. None of the first four takes a placement from its
 * host, so on a page they leave whatever holds them: the island draws over
 * this site's header, the bar stretches across the whole window.
 *
 * A page cannot ask them to stay in the flow. What it can do is give them a
 * smaller window: a box with paint containment is the containing block for
 * its fixed children, so inside this one the screen is the whole viewport —
 * the island sits at the screen's top edge, a bar on its bottom, a scrim over
 * its page. The class does it (`site.css`, "A screen, for the parts that pin
 * themselves"); this component adds what the part covers, so an overlay reads
 * as one.
 *
 * The screen itself is a `Surface`, whose edge and fill are Kozmos's own
 * (site CSS cannot draw a border inside the provider — GAP-52). The page
 * behind is decoration: the demo's subject is the part over it, and assistive
 * technology is told to skip it.
 */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <Surface className="site-screen">
      <Box className="site-screen-page" aria-hidden="true">
        <Text size="sm" weight="medium">
          Riverside Centre
        </Text>
        {places.map((place) => (
          <Box key={place.id} className="site-screen-line">
            <Text size="sm">{place.name}</Text>
            <Text size="xs" color="muted">
              {place.floorLabel} · {place.availabilityLabel}
            </Text>
          </Box>
        ))}
      </Box>
      {children}
    </Surface>
  );
}
