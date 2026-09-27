import { useState } from "react";
import { Box, Button, POICard, Tag, Text } from "@kozmos-ds/react";
import { asset } from "../../lib/asset";
import type { DemoModule } from "../types";

function Selectable() {
  const [opened, setOpened] = useState(0);
  return (
    <Box className="site-demo-column">
      <POICard
        title="Bookshop"
        subtitle="First floor · Riverside Centre"
        description="New and second-hand books, with a reading corner by the window."
        badges={
          <>
            <Tag emotion="success" variant="outline">
              Open until 20:00
            </Tag>
            <Tag variant="secondary">3 min</Tag>
          </>
        }
        actions={
          <>
            <Button size="sm">Directions</Button>
            <Button size="sm" variant="outline">
              Save
            </Button>
          </>
        }
        selectionLabel="Open the bookshop"
        onClick={() => setOpened((count) => count + 1)}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {opened === 0
          ? "The card is a button when onClick is given; its actions stay separate buttons."
          : `Opened ${opened} time${opened === 1 ? "" : "s"}.`}
      </Text>
    </Box>
  );
}

function WithAnImage() {
  return (
    <Box className="site-demo-column">
      <POICard
        title="Bookshop"
        subtitle="First floor"
        imageUrl={asset("/media/bookshop-window.svg")}
        imageAlt="The reading corner by the window"
        description="An image above the text when imageUrl is given; imageAlt names it, and defaults to the title."
      />
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  { title: "Title, badges, actions", Component: Selectable },
  { title: "With an image", Component: WithAnImage },
];
