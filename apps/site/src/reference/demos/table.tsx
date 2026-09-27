import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Text,
} from "@kozmos-ds/react";
import { tableRows } from "../sample-data";
import type { DemoModule } from "../types";

function Venues() {
  const places = tableRows.reduce((sum, row) => sum + row.places, 0);
  return (
    <Table>
      <TableCaption>Four venues and their places.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Venue</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Floors</TableHead>
          <TableHead>Places</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableRows.map((row) => (
          <TableRow key={row.venue}>
            <TableCell>
              <Text as="span" weight="medium">
                {row.venue}
              </Text>
            </TableCell>
            <TableCell>{row.city}</TableCell>
            <TableCell>{row.floors}</TableCell>
            <TableCell>{row.places}</TableCell>
            <TableCell>
              <Tag
                variant="outline"
                emotion={
                  row.status === "Live"
                    ? "success"
                    : row.status === "Draft"
                      ? "neutral"
                      : "informative"
                }
              >
                {row.status}
              </Tag>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell />
          <TableCell />
          <TableCell>{places}</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Venues",
    description:
      "Caption, header, body and footer; the parts are the table elements with the system’s spacing and lines.",
    Component: Venues,
  },
];
