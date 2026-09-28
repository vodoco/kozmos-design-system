import type { ReactNode } from "react";
import {
  Box,
  Heading,
  Stack,
  Surface,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@kozmos-ds/react";
import { ramp, shortName, type TokenEntry } from "../lib/tokens";
import { CopyButton } from "../site/CopyButton";

/** One colour token as a swatch, in the current theme, with both values. */
export function Swatch({
  entry,
  label,
  large = false,
}: {
  entry: TokenEntry;
  label?: string;
  large?: boolean;
}) {
  return (
    <Box className={large ? "site-swatch site-swatch-large" : "site-swatch"}>
      <Surface
        className="site-swatch-colour"
        style={{ "--swatch": `var(${entry.name})` }}
      >
        <Box className="site-swatch-fill" />
      </Surface>
      <Stack gap={0}>
        <Text as="span" size="sm" weight="medium">
          {label ?? entry.name}
        </Text>
        <Text as="span" size="xs" color="muted" className="site-mono">
          {entry.light === entry.dark
            ? entry.light
            : `${entry.light} · ${entry.dark}`}
        </Text>
        {large && entry.description ? (
          <Text as="span" size="sm" color="muted">
            {entry.description}
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
}

/** A primitive ramp — `<prefix>-<step>` — as a row of swatches. */
export function Ramp({
  prefix,
  title,
  lead,
}: {
  prefix: string;
  title: string;
  lead?: ReactNode;
}) {
  const steps = ramp(prefix);
  return (
    <Stack gap={3}>
      <Stack gap={1}>
        <Heading level={3}>{title}</Heading>
        <Text size="sm" color="muted">
          {lead ?? `${steps.length} steps · ${prefix}-<step>`}
        </Text>
      </Stack>
      <Box className="site-ramp">
        {steps.map((entry) => (
          <Swatch
            key={entry.name}
            entry={entry}
            label={String(shortName(entry.name, prefix))}
          />
        ))}
      </Box>
    </Stack>
  );
}

/** Semantic tokens of one group, large swatches with their descriptions. */
export function SwatchList({
  entries,
  prefix,
}: {
  entries: readonly TokenEntry[];
  prefix: string;
}) {
  return (
    <Box className="site-grid site-grid-wide">
      {entries.map((entry) => (
        <Swatch
          key={entry.name}
          entry={entry}
          label={shortName(entry.name, prefix)}
          large
        />
      ))}
    </Box>
  );
}

/** Tokens as a table: name, light, dark, and the description where one exists. */
export function TokenTable({
  entries,
  caption,
  labelPrefix,
}: {
  entries: readonly TokenEntry[];
  caption: string;
  /** Stripped from the name column, to keep it readable. */
  labelPrefix?: string;
}) {
  const themed = entries.some((entry) => entry.light !== entry.dark);
  const described = entries.some((entry) => entry.description);
  return (
    <Table aria-label={caption}>
      <TableHeader>
        <TableRow>
          <TableHead>Token</TableHead>
          <TableHead>{themed ? "Light" : "Value"}</TableHead>
          {themed ? <TableHead>Dark</TableHead> : null}
          {described ? <TableHead>Description</TableHead> : null}
          <TableHead>Copy</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.name}>
            <TableCell>
              <Text as="span" size="sm" className="site-mono">
                {labelPrefix ? shortName(entry.name, labelPrefix) : entry.name}
              </Text>
            </TableCell>
            <TableCell>
              <Text as="span" size="sm" className="site-mono">
                {entry.light}
              </Text>
            </TableCell>
            {themed ? (
              <TableCell>
                <Text as="span" size="sm" className="site-mono">
                  {entry.dark}
                </Text>
              </TableCell>
            ) : null}
            {described ? (
              <TableCell>
                <Text as="span" size="sm" color="muted">
                  {entry.description ?? ""}
                </Text>
              </TableCell>
            ) : null}
            <TableCell>
              <CopyButton
                text={`var(${entry.name})`}
                label={`Copy var(${entry.name})`}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Text at a token's size and line height. */
export function Specimen({
  size,
  lineHeight,
  children,
  weight = "bold",
}: {
  size: string;
  lineHeight: string;
  children: ReactNode;
  weight?: "normal" | "medium" | "semibold" | "bold";
}) {
  return (
    <Text
      as="div"
      weight={weight}
      className="site-specimen"
      style={{ "--size": `var(${size})`, "--lh": `var(${lineHeight})` }}
    >
      {children}
    </Text>
  );
}
