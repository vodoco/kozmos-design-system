import { useMemo, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  Box,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
  ChipGroup,
  FloorSelector,
  Icon,
  Progress,
  Rating,
  SearchBar,
  SegmentedControl,
  Stack,
  Surface,
  Switch,
  Tag,
  Text,
  ThemeProvider,
} from "@kozmos-ds/react";
import { brandOverrides, brands, type Brand } from "../lib/brand";
import { tokens } from "../lib/tokens";
import { CodeBlock } from "../site/CodeBlock";

const floors = [
  { id: "2", label: "Second floor", shortLabel: "2" },
  { id: "1", label: "First floor", shortLabel: "1" },
  { id: "g", label: "Ground floor", shortLabel: "G" },
];

function isBrand(value: string | undefined): value is Brand {
  return brands.some((brand) => brand.value === value);
}

/** The override as a consumer would write it, shortened. */
function overrideSnippet(entries: [string, string][]) {
  if (entries.length === 0) {
    return [
      "// Kozmos’s own ramp: nothing to re-point.",
      "<ThemeProvider>",
      "  {app}",
      "</ThemeProvider>",
    ].join("\n");
  }
  const shown = entries.slice(0, 4);
  const rest = entries.length - shown.length;
  return [
    "<ThemeProvider",
    "  tokens={{",
    ...shown.map(([name, value]) => `    "${name}": "${value}",`),
    ...(rest > 0 ? [`    // … ${rest} more`] : []),
    "  }}",
    ">",
    "  {app}",
    "</ThemeProvider>",
  ].join("\n");
}

/**
 * The brand, the theme and the direction of one module, changed live. The
 * tokens carry two variant ramps beside the theme's; `brandOverrides` points
 * the theme at one of them through ThemeProvider's `tokens`, and reports
 * what it could and could not reach (GAPS.md, GAP-23).
 */
export function MakeItYours() {
  const [brand, setBrand] = useState<Brand>("theme");
  const [dark, setDark] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [floor, setFloor] = useState("1");
  const [stepFree, setStepFree] = useState(true);
  const overrides = useMemo(
    () => brandOverrides(tokens, brand, dark ? "dark" : "light"),
    [brand, dark],
  );
  const entries = Object.entries(overrides.tokens);
  const themedCount =
    overrides.followed.length +
    overrides.repointed.length +
    overrides.unmatched.length;

  return (
    <Box className="site-brand">
      <Box className="site-brand-controls">
        <SegmentedControl
          label="Brand ramp"
          items={brands.map((entry) => ({
            value: entry.value,
            label: entry.label,
          }))}
          value={brand}
          onValueChange={(next) => {
            if (isBrand(next)) setBrand(next);
          }}
        />
        <Stack direction="row" wrap="wrap" gap={6}>
          <Switch label="Dark theme" checked={dark} onCheckedChange={setDark} />
          <Switch
            label="Right to left"
            checked={rtl}
            onCheckedChange={setRtl}
          />
        </Stack>
        {brand === "theme" ? (
          <Text size="sm" color="muted">
            Kozmos’s own blue: nothing to override. Choose a variant to see what
            one{" "}
            <Text as="span" size="sm" className="site-mono">
              tokens
            </Text>{" "}
            prop changes.
          </Text>
        ) : (
          <Text size="sm" color="muted">
            {entries.length} variables re-pointed: the theme ramp’s{" "}
            {entries.length - overrides.repointed.length} steps
            {overrides.repointed.length > 0
              ? `, and ${overrides.repointed.length} themed component tokens that hold values copied from the ramp, matched by value`
              : ""}
            . {overrides.followed.length} of the {themedCount} themed component
            tokens are references to the ramp and follow it with no override of
            their own (GAP-23). The other {overrides.unmatched.length}, the ink
            on filled buttons and the disabled greys, are not on the theme ramp,
            so they keep their values.
          </Text>
        )}
        <CodeBlock label="The override" code={overrideSnippet(entries)} />
      </Box>

      <ThemeProvider
        theme={dark ? "dark" : "light"}
        dir={rtl ? "rtl" : "ltr"}
        tokens={overrides.tokens}
      >
        <Surface className="site-brand-app">
          <Stack direction="row" align="center" justify="between" gap={3}>
            <Stack gap={0}>
              <Text as="span" weight="semibold">
                Riverside Centre
              </Text>
              <Text as="span" size="sm" color="muted">
                Open until 20:00
              </Text>
            </Stack>
            <Avatar role="img" aria-label="Sam Rivera">
              <AvatarFallback aria-hidden="true">SR</AvatarFallback>
            </Avatar>
          </Stack>
          <SearchBar
            variant="inline"
            aria-label="Search places"
            placeholder="Search places"
          />
          <FloorSelector
            label="Floor"
            variant="horizontal-list"
            floors={floors}
            selectedFloor={floor}
            onFloorSelect={setFloor}
          />
          {/* GAP-32: ChipGroup is a plain div; the role makes the label count. */}
          <ChipGroup role="group" aria-label="Filters">
            <Chip size="sm" selected>
              Open now
            </Chip>
            <Chip size="sm">Step-free</Chip>
            <Chip size="sm">Shops</Chip>
          </ChipGroup>
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
              <Stack gap={3}>
                <Rating value={4} readOnly aria-label="Rated 4 of 5" />
                <Progress value={64} aria-label="Route progress" />
                <Switch
                  label="Step-free route"
                  checked={stepFree}
                  onCheckedChange={setStepFree}
                />
                <Stack direction="row" wrap="wrap" gap={2}>
                  <Button emotion="themed">
                    <Icon name="navigation-pointer-01" size="sm" />
                    Directions
                  </Button>
                  <Button variant="outline">Save</Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Surface>
      </ThemeProvider>
    </Box>
  );
}
