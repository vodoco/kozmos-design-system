import { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Icon,
  Surface,
  Tag,
  Text,
  ThemeProvider,
  ToggleButton,
  type IconProps,
} from "@kozmos/react";
import { LOGO_TEXT, PACKAGES_PUBLISHED } from "../lib/site";
import { ButtonLink } from "../site/links";

/*
 * The Figma file's cover (Kozmos DS — Core Library, node 143:13175), drawn
 * with Kozmos. The cover is a picture; Kozmos draws no picture (GAPS.md,
 * GAP-10), so its parts are rebuilt here: a ring around the logo, orbits,
 * planets, glass panes, amber diamonds, the logo's own stars and a galaxy
 * under the ring. Every colour is a token — the cover's violet is the
 * tokens' second brand ramp, its lavender glow the first ramp's 700, its
 * amber and rose the alert and danger ramps — and the panes are Kozmos's
 * glass Surface. Where each thing sits is data, below, as a share of the
 * ring's square: 0 is its left or top edge, 1 its right or bottom one.
 */

type Tone = "violet" | "lilac" | "amber" | "faint";

type Orbit = {
  size: number;
  tilt: number;
  squash: number;
  /** Where along the circle the line is faded out, and over how much of it. */
  from: number;
  fade: number;
  tone: Tone;
};

/** Orbits, back to front: a circle `size` times the ring, tilted and flattened. */
const orbits: Orbit[] = [
  { size: 2.9, tilt: -14, squash: 0.36, from: 200, fade: 18, tone: "violet" },
  { size: 2.2, tilt: 24, squash: 0.42, from: 20, fade: 30, tone: "amber" },
  { size: 1.7, tilt: -32, squash: 0.62, from: 120, fade: 22, tone: "lilac" },
  // The ring's halo: three close circles, fading out along the left.
  { size: 1.08, tilt: 0, squash: 1, from: 150, fade: 30, tone: "faint" },
  { size: 1.16, tilt: 0, squash: 1, from: 170, fade: 34, tone: "faint" },
  { size: 1.26, tilt: 0, squash: 1, from: 190, fade: 40, tone: "violet" },
];

/**
 * Bodies that travel an orbit, fading where its line fades: which orbit, a
 * diameter, how long a lap takes in beats (the motion scale's slowest step),
 * where on the lap it starts, and which way it goes.
 */
const travellers: {
  orbit: Orbit;
  d: number;
  body: "planet-violet" | "planet-blue" | "diamond";
  lap: number;
  start: number;
  backwards: boolean;
}[] = [
  {
    orbit: orbits[2]!,
    d: 0.05,
    body: "planet-violet",
    lap: 90,
    start: 0.8,
    backwards: false,
  },
  {
    orbit: orbits[1]!,
    d: 0.03,
    body: "diamond",
    lap: 130,
    start: 0.35,
    backwards: true,
  },
  {
    orbit: orbits[0]!,
    d: 0.04,
    body: "planet-blue",
    lap: 200,
    start: 0.6,
    backwards: false,
  },
];

/** Planets, lit from the upper right as the cover's are; `d` is a diameter. */
const planets: { x: number; y: number; d: number; tone: "violet" | "blue" }[] =
  [
    { x: -0.32, y: 0.78, d: 0.42, tone: "violet" },
    { x: -0.12, y: 0.46, d: 0.07, tone: "violet" },
    { x: 1.12, y: 0.06, d: 0.13, tone: "violet" },
    { x: 1.18, y: 0.64, d: 0.14, tone: "blue" },
    { x: 1.04, y: 0.3, d: 0.035, tone: "violet" },
    { x: 1.42, y: 0.84, d: 0.03, tone: "violet" },
  ];

/** The amber diamonds that keep their place. */
const diamonds = [
  { x: -0.44, y: 0.36, d: 0.035 },
  { x: 0.78, y: 1.04, d: 0.03 },
  { x: 1.38, y: 0.26, d: 0.022 },
];

/** Stars in the logo's own shape; `k` counts steps of the sizing scale's 8px. */
const sparks = [
  { x: -0.6, y: 0.12, k: 1.5 },
  { x: 1.5, y: 0.48, k: 1 },
  { x: 0.3, y: -0.06, k: 0.75 },
  { x: 1.7, y: -0.02, k: 2 },
  { x: -0.8, y: 0.92, k: 1 },
];

/**
 * Glass panes where the cover has its glass cubes, each holding a glyph of
 * what the system is for: places, and the way to them.
 */
const panes: {
  x: number;
  y: number;
  d: number;
  turn: [number, number, number];
  tone: "violet" | "blue";
  icon: NonNullable<IconProps["name"]>;
}[] = [
  {
    x: 0.04,
    y: 0.1,
    d: 0.15,
    turn: [18, -28, -12],
    tone: "violet",
    icon: "marker-pin-01",
  },
  {
    x: 0.92,
    y: 0.92,
    d: 0.13,
    turn: [-12, 32, 14],
    tone: "blue",
    icon: "navigation-pointer-01",
  },
];

/** A share of the stage's side, as CSS reads it. */
const share = (value: number) => `${Math.round(value * 1000) / 10}%`;

/** What each traveller is drawn as: a planet, or a diamond. */
const riderClass = {
  "planet-violet": "site-cosmos-planet site-cosmos-planet-violet",
  "planet-blue": "site-cosmos-planet site-cosmos-planet-blue",
  diamond: "site-cosmos-diamond",
} as const;

/**
 * The home page's first screen: the cover, in the dark theme whatever the
 * site's, as the cover is; then the claim and the two next steps. The
 * pictures are hidden from assistive technology; the logo is an image
 * named by its words, as the header's is.
 *
 * Some of it moves, for as long as it is on screen: bodies travel their
 * orbits, the stars twinkle, the panes float, the galaxy turns and the ring
 * breathes. Moving for longer than five seconds beside the page's words, it
 * can be paused (WCAG 2.2.2); under reduced motion it stays still, and the
 * button goes.
 */
export function Cosmos() {
  const band = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const element = band.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry?.isIntersecting ?? true),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={band}
      className="site-cosmos"
      aria-labelledby="home-title"
      data-motion={paused || !inView ? "paused" : "running"}
    >
      {/* A provider paints nothing (display: contents), so the sky inside
          it is what draws the dark theme's page. */}
      <ThemeProvider theme="dark">
        <Box className="site-cosmos-sky">
          <Box aria-hidden="true" className="site-cosmos-stars" />
          <Container>
            <Box className="site-cosmos-layout">
              <Box className="site-cosmos-stage">
                <Box aria-hidden="true" className="site-cosmos-art">
                  {orbits.map((orbit, index) => (
                    <Box
                      key={`orbit-${index}`}
                      className={`site-cosmos-orbit site-cosmos-tone-${orbit.tone}`}
                      style={{
                        "--size": orbit.size,
                        "--tilt": `${orbit.tilt}deg`,
                        "--squash": orbit.squash,
                        "--from": `${orbit.from}deg`,
                        "--fade": `${orbit.fade}%`,
                      }}
                    />
                  ))}
                  <Box className="site-cosmos-halo" />
                  <Box className="site-cosmos-burst" />
                  <Box className="site-cosmos-disc">
                    <Box className="site-cosmos-loop site-cosmos-arms" />
                  </Box>
                  <Box className="site-cosmos-loop site-cosmos-ring site-cosmos-ring-glow" />
                  <Box className="site-cosmos-ring" />
                  <Box className="site-cosmos-loop site-cosmos-flare" />
                  <Box className="site-cosmos-beam" />
                  {planets.map((planet, index) => (
                    <Box
                      key={`planet-${index}`}
                      className={`site-cosmos-body site-cosmos-planet site-cosmos-planet-${planet.tone}`}
                      style={{
                        "--x": share(planet.x),
                        "--y": share(planet.y),
                        "--d": planet.d,
                      }}
                    />
                  ))}
                  {diamonds.map((diamond, index) => (
                    <Box
                      key={`diamond-${index}`}
                      className="site-cosmos-body site-cosmos-diamond"
                      style={{
                        "--x": share(diamond.x),
                        "--y": share(diamond.y),
                        "--d": diamond.d,
                      }}
                    />
                  ))}
                  {travellers.map((traveller, index) => (
                    <Box
                      key={`track-${index}`}
                      className="site-cosmos-track"
                      style={{
                        "--size": traveller.orbit.size,
                        "--tilt": `${traveller.orbit.tilt}deg`,
                        "--squash": traveller.orbit.squash,
                        "--from": `${traveller.orbit.from}deg`,
                        "--fade": `${traveller.orbit.fade}%`,
                        "--lap": traveller.lap,
                        "--start": `${traveller.start}turn`,
                        "--start-share": traveller.start,
                        "--way": traveller.backwards ? "reverse" : "normal",
                      }}
                    >
                      <Box className="site-cosmos-loop site-cosmos-arm">
                        <Box
                          className={`site-cosmos-loop site-cosmos-rider ${riderClass[traveller.body]}`}
                          style={{
                            "--d":
                              Math.round(
                                (traveller.d / traveller.orbit.size) * 10000,
                              ) / 10000,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                  {sparks.map((spark, index) => (
                    <Box
                      key={`spark-${index}`}
                      className="site-cosmos-body site-cosmos-loop site-cosmos-spark"
                      style={{
                        "--x": share(spark.x),
                        "--y": share(spark.y),
                        "--k": spark.k,
                        "--i": index,
                      }}
                    />
                  ))}
                  {panes.map((pane) => (
                    <Box
                      key={pane.icon}
                      className={`site-cosmos-body site-cosmos-pane-glow site-cosmos-pane-${pane.tone}`}
                      style={{
                        "--x": share(pane.x),
                        "--y": share(pane.y),
                        "--d": pane.d,
                      }}
                    />
                  ))}
                  {panes.map((pane, index) => (
                    <Surface
                      key={pane.icon}
                      variant="glass"
                      className={`site-cosmos-body site-cosmos-loop site-cosmos-pane site-cosmos-pane-${pane.tone}`}
                      style={{
                        "--x": share(pane.x),
                        "--y": share(pane.y),
                        "--d": pane.d,
                        "--rx": `${pane.turn[0]}deg`,
                        "--ry": `${pane.turn[1]}deg`,
                        "--rz": `${pane.turn[2]}deg`,
                        "--i": index,
                      }}
                    >
                      <Box className="site-cosmos-pane-tint" />
                      <Icon name={pane.icon} size="lg" />
                    </Surface>
                  ))}
                </Box>
                <Box className="site-cosmos-brand">
                  {PACKAGES_PUBLISHED ? null : (
                    <Tag variant="outline" emotion="informative">
                      Pre-release
                    </Tag>
                  )}
                  {/* Kozmos draws no image (GAPS.md, GAP-10): the logo is a
                      Box painted through its shape, as the header's is, over
                      the same shape blurred in lavender, the cover's glow. */}
                  <Box className="site-cosmos-logo-frame">
                    <Box aria-hidden="true" className="site-cosmos-logo-glow">
                      <Box className="site-cosmos-logo" />
                    </Box>
                    <Box
                      role="img"
                      aria-label={LOGO_TEXT}
                      className="site-cosmos-logo"
                    />
                  </Box>
                </Box>
              </Box>
              <Box className="site-cosmos-copy">
                {/* The dark the cover keeps round its name, here round the
                    words: the orbits and stars fade into it, and no line or
                    star crosses a letter. */}
                <Box aria-hidden="true" className="site-cosmos-scrim" />
                <Box className="site-cosmos-words">
                  <Heading
                    level={1}
                    id="home-title"
                    align="center"
                    className="site-headline"
                  >
                    The design system for the Pointr SDK
                  </Heading>
                  <Text size="lg" color="muted" align="center">
                    Maps, places and wayfinding, from one set of parts: core
                    controls and product components drawn from the same tokens
                    on the web, iOS and Android. Everything on this page is the
                    real thing, running.
                  </Text>
                  <Box className="site-actions site-cosmos-actions">
                    <ButtonLink to="/get-started" size="lg">
                      Get started
                    </ButtonLink>
                    <ButtonLink to="/components" variant="outline" size="lg">
                      Browse components
                    </ButtonLink>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Container>
          <Box aria-hidden="true" className="site-cosmos-nebula" />
          <Box className="site-cosmos-motion">
            <ToggleButton
              variant="outline"
              size="sm"
              pressed={paused}
              onPressedChange={setPaused}
            >
              Pause motion
            </ToggleButton>
          </Box>
        </Box>
      </ThemeProvider>
    </section>
  );
}
