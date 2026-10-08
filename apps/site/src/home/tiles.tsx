import { Fragment, useState, type ReactNode } from "react";
import {
  AdaptiveMapShell,
  Box,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  MapView,
  SegmentedControl,
  Slider,
  Stack,
  Surface,
  Switch,
  Tag,
  Text,
  ThemeProvider,
} from "@kozmos-ds/react";
import contract from "../generated/contrast-contract.json";
import { PairSample, type ContrastPair } from "../foundations/PairSample";
import { contrastRatio, formatRatio, parseColour } from "../lib/contrast";
import { ramp, token } from "../lib/tokens";
import {
  componentIndex,
  countOn,
  platformLabel,
  platformOrder,
} from "../reference/nav";
import type { Platform } from "../reference/types";
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

/**
 * How far each platform has come, from the same data as the components page:
 * the repository's status script, which finds each component's files. A
 * platform's count is of the components it could have (Figma is not
 * expected to have a provider or a typography primitive), and the names are
 * the ones it does not have yet.
 */
export function PlatformsTile() {
  const [platform, setPlatform] = useState<Platform>("swiftui");
  const { present, expected } = countOn(platform);
  const missing = componentIndex.components.filter(
    (component) => component.platforms[platform] === "not-yet",
  );
  const where =
    platform === "figma" ? "linked in Figma" : `in ${platformLabel[platform]}`;
  return (
    <Tile
      span={4}
      title="Every part, on every platform"
      description="Which components exist in React, SwiftUI and Compose, and which Code Connect links in Figma, counted from the repository. Pick one."
    >
      <SegmentedControl
        aria-label="Platform"
        size="sm"
        fullWidth
        value={platform}
        onValueChange={(value) => {
          if (value) setPlatform(value as Platform);
        }}
        items={platformOrder.map((entry) => ({
          value: entry,
          label: platformLabel[entry],
        }))}
      />
      <Stack gap={1} aria-live="polite">
        <Text weight="semibold">
          {present} of {expected} components {where}
        </Text>
        <Text size="sm" color="muted">
          {missing.length === 0 ? (
            "Every one of them."
          ) : (
            <>
              Not yet:{" "}
              {missing.map((component, index) => (
                <Fragment key={component.slug}>
                  {index > 0 ? ", " : null}
                  <SiteLink to={`/components/${component.slug}`}>
                    {component.name}
                  </SiteLink>
                </Fragment>
              ))}
              .
            </>
          )}
        </Text>
      </Stack>
      <Text size="sm">
        <SiteLink to="/components">Every component, by platform</SiteLink>
      </Text>
    </Tile>
  );
}

const featuredPairs = [
  "theme fill / theme foreground (decision 59)",
  "muted foreground on app background",
  "selected navigation item",
  "button outline border idle",
];

export function ContrastTile() {
  const pairs = (contract.pairs as ContrastPair[]).filter((pair) =>
    featuredPairs.includes(pair.name),
  );
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
              <PairSample pair={pair} />
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
