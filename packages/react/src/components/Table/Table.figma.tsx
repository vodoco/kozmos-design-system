import figma from "@figma/code-connect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

const tableUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=237-2547";

figma.connect(Table, tableUrl, {
  props: {
    density: figma.enum("Density", {
      Default: "default",
      Compact: "compact",
    }),
    header1: figma.string("Header 1 Text"),
    header2: figma.string("Header 2 Text"),
    header3: figma.string("Header 3 Text"),
    row1Cell1: figma.string("Row 1 Cell 1 Text"),
    row1Cell2: figma.string("Row 1 Cell 2 Text"),
    row1Cell3: figma.string("Row 1 Cell 3 Text"),
    row2Cell1: figma.string("Row 2 Cell 1 Text"),
    row2Cell2: figma.string("Row 2 Cell 2 Text"),
    row2Cell3: figma.string("Row 2 Cell 3 Text"),
    row3Cell1: figma.string("Row 3 Cell 1 Text"),
    row3Cell2: figma.string("Row 3 Cell 2 Text"),
    row3Cell3: figma.string("Row 3 Cell 3 Text"),
  },
  example: ({
    density,
    header1,
    header2,
    header3,
    row1Cell1,
    row1Cell2,
    row1Cell3,
    row2Cell1,
    row2Cell2,
    row2Cell3,
    row3Cell1,
    row3Cell2,
    row3Cell3,
  }) => {
    const denseClassName =
      density === "compact" ? "[&_td]:py-2 [&_th]:h-10" : undefined;

    // Figma draws the table framed (decision 159), as React's `framed` does.
    return (
      <Table framed className={denseClassName}>
        <TableHeader>
          <TableRow>
            <TableHead>{header1}</TableHead>
            <TableHead>{header2}</TableHead>
            <TableHead>{header3}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{row1Cell1}</TableCell>
            <TableCell>{row1Cell2}</TableCell>
            <TableCell>{row1Cell3}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{row2Cell1}</TableCell>
            <TableCell>{row2Cell2}</TableCell>
            <TableCell>{row2Cell3}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{row3Cell1}</TableCell>
            <TableCell>{row3Cell2}</TableCell>
            <TableCell>{row3Cell3}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  },
});
