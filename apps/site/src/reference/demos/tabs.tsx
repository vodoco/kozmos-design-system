import {
  Box,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function ThreeTabs() {
  return (
    <Box className="site-demo-column">
      <Tabs defaultValue="details">
        <TabsList aria-label="Bookshop">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <Text size="sm">
            New and second-hand books, with a reading corner by the window.
          </Text>
        </TabsContent>
        <TabsContent value="hours">
          <Text size="sm">
            Monday to Saturday 09:00 to 20:00, Sunday 11:00 to 17:00.
          </Text>
        </TabsContent>
        <TabsContent value="reviews">
          <Text size="sm">4.6 from 312 reviews.</Text>
        </TabsContent>
      </Tabs>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Three tabs",
    description:
      "A tab list on the muted surface with a pill for the active tab; arrow keys move between them. The list neither wraps nor scrolls (GAP-16).",
    Component: ThreeTabs,
  },
];
