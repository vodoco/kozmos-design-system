import {
  Box,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Stack,
  Tag,
  Text,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Anatomy() {
  return (
    <Box className="site-demo-column">
      <Card>
        <CardHeader>
          <Stack direction="row" align="center" justify="between" gap={2}>
            <CardTitle>Bookshop</CardTitle>
            <Tag emotion="success" variant="outline">
              Open
            </Tag>
          </Stack>
          <CardDescription>First floor · 3 min on foot</CardDescription>
        </CardHeader>
        <CardContent>
          <Text size="sm">
            New and second-hand books, with a reading corner by the window.
          </Text>
        </CardContent>
        <CardFooter>
          <Stack direction="row" gap={2}>
            <Button size="sm">Directions</Button>
            <Button size="sm" variant="outline">
              Save
            </Button>
          </Stack>
        </CardFooter>
      </Card>
    </Box>
  );
}

function AGrid() {
  const venues = ["Riverside Centre", "Harbour Terminal", "North Campus"];
  return (
    <Box className="site-grid site-grid-auto">
      {venues.map((venue, index) => (
        <Card key={venue} className="site-card-fill">
          <CardHeader>
            <CardTitle>{venue}</CardTitle>
            <CardDescription>
              {[3, 2, 5][index]} floors · {[148, 96, 312][index]} places
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Anatomy",
    description:
      "Header with a title and description, content, footer. The title is always an h3 (GAP-14).",
    Component: Anatomy,
  },
  {
    title: "In a grid",
    description: "Cards fill their cells when given a full height.",
    Component: AGrid,
  },
];
