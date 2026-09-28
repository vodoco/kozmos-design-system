import { useState, type ReactNode } from "react";
import {
  AdaptiveMapShell,
  Box,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  MapView,
  Slider,
  Stack,
  Surface,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tag,
  Text,
  ThemeProvider,
} from "@kozmos-ds/react";
import button from "../generated/components/button.json";
import contract from "../generated/contrast-contract.json";
import { contrastRatio, formatRatio, parseColour } from "../lib/contrast";
import { ramp, token } from "../lib/tokens";
import { CodeBlock } from "../site/CodeBlock";
import { SiteLink } from "../site/links";

function Tile({
  span,
  title,
  description,
  children,
}: {
  span: 4 | 6 | 8;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className={`site-tile site-tile-${span}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <Box className="site-tile-body">{children}</Box>
    </Card>
  );
}

function SwatchRow({ prefix, label }: { prefix: string; label: string }) {
  return (
    <Stack gap={1}>
      <Text as="span" size="xs" color="muted" className="site-mono">
        {label}
      </Text>
      <Box className="site-swatch-row" aria-hidden="true">
        {ramp(prefix).map((entry) => (
          <Box
            key={entry.name}
            className="site-swatch-cell"
            style={{ "--swatch": `var(${entry.name})` }}
          />
        ))}
      </Box>
    </Stack>
  );
}

export function TokensTile() {
  const [dark, setDark] = useState(false);
  return (
    <Tile
      span={4}
      title="One set of tokens"
      description="Colour, type, spacing, radius, elevation and motion, from one source: CSS variables for both themes and a JavaScript module on the web; the colours, spacing, radii, shadows and motion in Swift and Kotlin. Flip this tile’s theme and watch the ramps."
    >
      <Switch label="Dark" checked={dark} onCheckedChange={setDark} />
      {/* A provider paints nothing itself (display: contents), so the nested
          theme gets a Surface of its own to sit on. */}
      <ThemeProvider theme={dark ? "dark" : "light"}>
        <Surface className="site-theme-sample">
          <SwatchRow
            prefix="--primitives-colors-background"
            label="background"
          />
          <SwatchRow prefix="--primitives-colors-theme" label="theme" />
          <SwatchRow
            prefix="--primitives-colors-emotional-success"
            label="success"
          />
          <SwatchRow
            prefix="--primitives-colors-emotional-danger"
            label="danger"
          />
        </Surface>
      </ThemeProvider>
      <Text size="sm">
        <SiteLink to="/foundations/colour">Every ramp and role</SiteLink>
      </Text>
    </Tile>
  );
}

const emotions = [
  "themed",
  "neutral",
  "success",
  "danger",
  "informative",
  "alert",
] as const;

export function EmotionsTile() {
  return (
    <Tile
      span={4}
      title="Six meanings"
      description="A button says what it does: themed, neutral, success, danger, informative or alert, filled or outlined, from the same tokens on every platform."
    >
      <Box className="site-emotions">
        {emotions.map((emotion) => (
          <Button key={emotion} emotion={emotion} className="site-fill">
            {emotion}
          </Button>
        ))}
        {emotions.map((emotion) => (
          <Button
            key={`${emotion}-outline`}
            emotion={emotion}
            variant="outline"
            className="site-fill"
          >
            {emotion}
          </Button>
        ))}
      </Box>
    </Tile>
  );
}

export function AdaptiveTile() {
  const [width, setWidth] = useState(720);
  const [presentation, setPresentation] = useState<string>("side");
  return (
    <Tile
      span={8}
      title="A map layout that fits its container"
      description="AdaptiveMapShell puts its panel beside the map or below it from the space it has, not the viewport, and tells the map engine what it can use. Resize the host."
    >
      <Slider
        label="Host width"
        min={320}
        max={960}
        step={10}
        value={[width]}
        onValueChange={([value]) => {
          if (value !== undefined) setWidth(value);
        }}
        formatValue={(value) => `${value}px`}
      />
      <Box className="site-adaptive-host" style={{ "--host-width": width }}>
        <AdaptiveMapShell
          mapLabel="Map area"
          panelLabel="Selected place"
          map={
            <MapView mapLabel="Map engine slot">
              <Box className="site-adaptive-map">
                <Text size="sm" color="muted">
                  Map engine
                </Text>
              </Box>
            </MapView>
          }
          panel={
            <Box className="site-adaptive-panel">
              <Text weight="semibold">Bookshop</Text>
              <Text size="sm" color="muted">
                First floor · 3 min on foot
              </Text>
              <Button size="sm">Directions</Button>
            </Box>
          }
          onLayoutChange={(layout) => setPresentation(layout.presentation)}
        />
      </Box>
      <Stack direction="row" align="center" gap={2}>
        <Text as="span" size="sm" color="muted">
          Panel presentation
        </Text>
        <Tag variant="secondary">{presentation}</Tag>
      </Stack>
    </Tile>
  );
}

const platforms = [
  { value: "react", label: "React", file: "Button.tsx" },
  { value: "swift", label: "SwiftUI", file: "Button.swift" },
  { value: "kotlin", label: "Compose", file: "Button.kt" },
] as const;

export function PlatformsTile() {
  const snippets = button.snippets as Partial<
    Record<(typeof platforms)[number]["value"], string>
  >;
  return (
    <Tile
      span={4}
      title="Three platforms, one part"
      description="The same Button in React, SwiftUI and Jetpack Compose, from the component’s own documentation."
    >
      <Tabs defaultValue="react">
        <TabsList aria-label="Platform">
          {platforms.map((platform) => (
            <TabsTrigger key={platform.value} value={platform.value}>
              {platform.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {platforms.map((platform) => (
          <TabsContent key={platform.value} value={platform.value}>
            {snippets[platform.value] ? (
              <CodeBlock
                label={platform.file}
                code={snippets[platform.value] ?? ""}
              />
            ) : (
              <Text size="sm" color="muted">
                No {platform.label} snippet in the docs.
              </Text>
            )}
          </TabsContent>
        ))}
      </Tabs>
      <Text size="sm">
        <SiteLink to="/components/button">The Button, in full</SiteLink>
      </Text>
    </Tile>
  );
}

const featuredPairs = [
  "primary action",
  "muted foreground on app background",
  "selected navigation item",
  "button outline border idle",
];

export function ContrastTile() {
  const pairs = (
    contract.pairs as {
      name: string;
      background: string;
      foreground: string;
      minimum: number;
    }[]
  ).filter((pair) => featuredPairs.includes(pair.name));
  return (
    <Tile
      span={4}
      title="Contrast, under contract"
      description={`The contract’s ${contract.pairs.length} colour pairs, and every button’s and category’s besides, are measured in both themes on every pull request. Four of them, measured here from the same token values.`}
    >
      <Stack gap={3}>
        {pairs.map((pair) => {
          const bg = token(`--${pair.background}`);
          const fg = token(`--${pair.foreground}`);
          const ratios = (["light", "dark"] as const).map((theme) => {
            const b = bg && parseColour(bg[theme]);
            const f = fg && parseColour(fg[theme]);
            return b && f ? contrastRatio(f, b) : undefined;
          });
          const ok = ratios.every(
            (ratio) => ratio !== undefined && ratio >= pair.minimum,
          );
          return (
            <Box key={pair.name} className="site-pair">
              <Surface
                className="site-pair-sample"
                aria-hidden="true"
                style={{
                  "--pair-bg": `var(--${pair.background})`,
                  "--pair-fg": `var(--${pair.foreground})`,
                }}
              >
                <Box className="site-pair-fill">
                  <Text as="span" weight="semibold" className="site-pair-text">
                    Aa
                  </Text>
                </Box>
              </Surface>
              <Stack gap={0}>
                <Text as="span" size="sm" weight="medium">
                  {pair.name}
                </Text>
                <Text as="span" size="xs" color="muted" className="site-mono">
                  {ratios
                    .map((ratio) =>
                      ratio === undefined ? "?" : formatRatio(ratio),
                    )
                    .join(" · ")}{" "}
                  · min {pair.minimum}:1
                </Text>
              </Stack>
              <Tag emotion={ok ? "success" : "danger"} variant="outline">
                {ok ? "Pass" : "Fail"}
              </Tag>
            </Box>
          );
        })}
      </Stack>
      <Text size="sm">
        <SiteLink to="/foundations/colour">
          All {contract.pairs.length} pairs
        </SiteLink>
      </Text>
    </Tile>
  );
}
