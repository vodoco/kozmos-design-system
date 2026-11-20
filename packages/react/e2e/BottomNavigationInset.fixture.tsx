import React from "react";
import { Home01, SearchMd } from "@kozmos-ds/icons";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import { BottomNavigation } from "../src/components/BottomNavigation/BottomNavigation";

/** GAP-245: a bar whose selected item sits under its top line. */
export function BottomNavigationInsetFixture({
  inset,
  density,
}: {
  inset?: boolean;
  density?: "default" | "compact";
}) {
  return (
    <ThemeProvider theme="light">
      <BottomNavigation
        inset={inset}
        density={density}
        items={[
          { icon: <Home01 />, label: "Home", active: true },
          { icon: <SearchMd />, label: "Search" },
        ]}
      />
    </ThemeProvider>
  );
}
