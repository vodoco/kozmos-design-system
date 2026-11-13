import React from "react";
import { ThemeProvider } from "../src/components/ThemeProvider/ThemeProvider";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/Table/Table";

export function TableFramedFixture({ framed }: { framed?: boolean }) {
  return (
    <ThemeProvider theme="light">
      <div style={{ width: 360 }}>
        <Table framed={framed}>
          <TableCaption>Places in this venue</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Floor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>Reception</TableCell>
              <TableCell>Ground</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </ThemeProvider>
  );
}
