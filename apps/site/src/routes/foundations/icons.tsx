import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  ChipGroup,
  EmptyState,
  Icon,
  SearchBar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  type IconProps,
} from "@kozmos-ds/react";
import { kozmosIconAliases, kozmosIconDefinitions } from "@kozmos-ds/icons";
import { DocsPage, foundationMeta } from "../../foundations/DocsPage";
import { foundationPage } from "../../foundations/nav";
import { Section } from "../../site/Section";

const page = foundationPage("icons");

export function meta() {
  return foundationMeta(page);
}

type IconName = NonNullable<IconProps["name"]>;

const definitions = Object.values(kozmosIconDefinitions) as {
  name: IconName;
  category: string;
  description: string;
}[];

const categories = [
  ...new Set(definitions.map((entry) => entry.category)),
].sort();

export default function Icons() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>();
  const [copied, setCopied] = useState<{ name: IconName; ok: boolean }>();

  // The copy's result is said for a moment, then the count returns.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(undefined), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const shown = useMemo(() => {
    const words = query.trim().toLowerCase();
    return definitions.filter(
      (entry) =>
        (!category || entry.category === category) &&
        (!words ||
          entry.name.includes(words) ||
          entry.description.toLowerCase().includes(words) ||
          entry.category.toLowerCase().includes(words)),
    );
  }, [query, category]);

  async function copy(name: IconName) {
    try {
      await navigator.clipboard.writeText(`<Icon name="${name}" />`);
      setCopied({ name, ok: true });
    } catch {
      setCopied({ name, ok: false });
    }
  }

  return (
    <DocsPage page={page}>
      <Section
        title={`${definitions.length} icons`}
        lead="Named by stable keys. Most come from Lucide; the rest carry the Pointr icon library’s own outlines, matched to the Figma component by key. Press one to copy its JSX."
        actions={
          <Stack gap={3}>
            <SearchBar
              variant="inline"
              aria-label="Search icons"
              placeholder="Search icons"
              value={query}
              onChange={setQuery}
              onClear={() => setQuery("")}
            />
            {/* GAP-32: ChipGroup is a plain div; the role makes the label count. */}
            <ChipGroup role="group" aria-label="Categories">
              <Chip
                size="sm"
                selected={!category}
                onClick={() => setCategory(undefined)}
              >
                All
              </Chip>
              {categories.map((entry) => (
                <Chip
                  key={entry}
                  size="sm"
                  selected={category === entry}
                  onClick={() =>
                    setCategory(category === entry ? undefined : entry)
                  }
                >
                  {entry}
                </Chip>
              ))}
            </ChipGroup>
          </Stack>
        }
      >
        <Text size="sm" color="muted" aria-live="polite">
          {copied
            ? copied.ok
              ? `Copied <Icon name="${copied.name}" />`
              : `Could not copy <Icon name="${copied.name}" />: the browser did not allow it`
            : `${shown.length} of ${definitions.length} shown`}
        </Text>
        {shown.length === 0 ? (
          <EmptyState
            title="No icon matches"
            description="Try another word, or clear the category."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setCategory(undefined);
                }}
              >
                Show all
              </Button>
            }
          />
        ) : (
          <Box className="site-grid site-grid-auto">
            {shown.map((entry) => (
              <Button
                key={entry.name}
                variant="outline"
                size="lg"
                aria-label={`Copy ${entry.name}`}
                onClick={() => copy(entry.name)}
              >
                <Icon name={entry.name} size="lg" />
                <Stack gap={0} align="start">
                  <Text
                    as="span"
                    size="sm"
                    weight="medium"
                    className="site-mono site-icon-name"
                  >
                    {entry.name}
                  </Text>
                  <Text as="span" size="xs" color="muted">
                    {entry.category}
                  </Text>
                </Stack>
              </Button>
            ))}
          </Box>
        )}
      </Section>

      <Section
        title="Aliases"
        lead="Plain words that resolve to a key, so a product can ask for back, close or search and get the right glyph."
      >
        <Table aria-label="Icon aliases">
          <TableHeader>
            <TableRow>
              <TableHead>Alias</TableHead>
              <TableHead>Resolves to</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(kozmosIconAliases as Record<string, IconName>).map(
              ([alias, name]) => (
                <TableRow key={alias}>
                  <TableCell>
                    <Text as="span" size="sm" className="site-mono">
                      {alias}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" align="center" gap={2}>
                      <Icon name={name} size="sm" />
                      <Text as="span" size="sm" className="site-mono">
                        {name}
                      </Text>
                    </Stack>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </Section>
    </DocsPage>
  );
}
