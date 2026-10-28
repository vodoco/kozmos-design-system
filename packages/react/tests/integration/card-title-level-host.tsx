import { createRoot } from "react-dom/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ThemeProvider,
} from "@kozmos-ds/react";

/**
 * CardTitle's heading level in the built package, for
 * scripts/check-card-title-level.mjs (GAP-205).
 *
 * - `outline`: the Settings Metadata board's shape, a page titled with an
 *   `h1` and a card whose title is the next level down, `as="h2"`. axe's
 *   heading-order reads the whole outline.
 * - `levels`: a title at each level `as` takes, and one with none, each in a
 *   card of its own, to read the element, its role and level, and its look.
 */
const LEVELS = ["h2", "h3", "h4", "h5", "h6"] as const;

function Host() {
  return (
    <ThemeProvider defaultTheme="light">
      <main data-case="outline" style={{ width: 360 }}>
        <h1>Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Client details</CardTitle>
            <CardDescription>The client this site belongs to.</CardDescription>
          </CardHeader>
          <CardContent>Pointr</CardContent>
        </Card>
      </main>
      <div data-case="levels" style={{ display: "grid", gap: 8, width: 360 }}>
        <Card>
          <CardHeader>
            <CardTitle data-title="default">Title default</CardTitle>
          </CardHeader>
        </Card>
        {LEVELS.map((level) => (
          <Card key={level}>
            <CardHeader>
              <CardTitle as={level} data-title={level}>
                Title {level}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("fixture")!).render(<Host />);
