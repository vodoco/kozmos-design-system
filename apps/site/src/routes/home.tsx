import {
  Box,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Stack,
  Tag,
  Text,
} from "@kozmos-ds/react";
import { examples, exampleKindLabel } from "../examples/manifest";
import { exampleComponents } from "../examples/registry";
import { Cosmos } from "../home/Cosmos";
import { MakeItYours } from "../home/MakeItYours";
import { Checklist } from "../home/Pipeline";
import {
  AdaptiveTile,
  ContrastTile,
  EmotionsTile,
  PlatformsTile,
  TokensTile,
} from "../home/tiles";
import { PACKAGES_PUBLISHED, pageTitle } from "../lib/site";
import { Band } from "../site/Band";
import { ExampleMiniature } from "../site/ExampleMiniature";
import { SiteLink } from "../site/links";
import { Reveal } from "../site/Reveal";
import { Section } from "../site/Section";

export function meta() {
  return [
    { title: pageTitle() },
    {
      name: "description",
      content:
        "Kozmos is the design system for the Pointr SDK: core controls and map, POI and wayfinding components, from one set of tokens on the web, iOS and Android. Every part on this page is live.",
    },
  ];
}

const platforms = [
  {
    title: "Web",
    technology: "React 18.2 and later, and 19",
    status: PACKAGES_PUBLISHED ? "On npm" : "npm soon",
    description: PACKAGES_PUBLISHED
      ? "@kozmos-ds/react, with its tokens, icons and contracts."
      : "@kozmos-ds/react is packaged for npm and not yet published: release waits on an approved browser support matrix. Apps inside the repository use it today.",
  },
  {
    title: "iOS",
    technology: "SwiftUI · iOS 16 and later",
    status: "In the repository",
    description:
      "The Kozmos Swift package in packages/ios. It is not distributed through a registry yet.",
  },
  {
    title: "Android",
    technology: "Jetpack Compose",
    status: "In the repository",
    description:
      "The Compose library module in packages/android. It is not published to a Maven repository yet.",
  },
  {
    title: "Figma",
    technology: "The Core Library",
    status: "Code Connect",
    description:
      "Painted from the same tokens by an importer plugin, whose painters CI measures. Code Connect links most component sets to their React, SwiftUI and Compose code, which Dev Mode shows beside the design.",
  },
];

/** Three examples that look nothing alike: a map app, a phone, a console. */
const featured = examples.filter((example) => example.featured);

/**
 * The home page, in the order a visitor asks: what is it (the hero, the
 * Figma file's cover drawn with Kozmos), what has been built with it (the
 * examples), what can it do (five live tiles), can it be ours (a brand
 * module), where does it run, and how is it kept honest. Bands alternate
 * plain and muted, each with the same padding.
 */
export default function Home() {
  return (
    <>
      <Cosmos />

      <Band muted>
        <Container>
          <Reveal>
            <Section
              title="Built from it"
              lead={
                <>
                  Pages and apps made of Kozmos components and nothing else,
                  shown here live and small. Where they found Kozmos short is on
                  the <SiteLink to="/roadmap">roadmap</SiteLink>.
                </>
              }
              actions={
                <Text size="sm">
                  <SiteLink to="/examples">
                    All {examples.length} examples
                  </SiteLink>
                </Text>
              }
            >
              <Box className="site-grid site-grid-3">
                {featured.map((example) => {
                  const Example = exampleComponents[example.slug];
                  return (
                    <Card key={example.slug} className="site-example-card">
                      {Example ? (
                        <ExampleMiniature
                          label={`${example.title} example, shown small`}
                        >
                          <Example />
                        </ExampleMiniature>
                      ) : null}
                      <CardHeader>
                        <Stack
                          direction="row"
                          align="center"
                          justify="between"
                          gap={2}
                        >
                          <CardTitle>{example.title}</CardTitle>
                          <Tag variant="secondary">
                            {exampleKindLabel[example.kind]}
                          </Tag>
                        </Stack>
                        <CardDescription>
                          {example.tagline ?? example.summary}
                        </CardDescription>
                        <Text size="sm">
                          <SiteLink to={`/examples/${example.slug}`}>
                            Open {example.title}
                          </SiteLink>
                        </Text>
                      </CardHeader>
                    </Card>
                  );
                })}
              </Box>
            </Section>
          </Reveal>
        </Container>
      </Band>

      <Band>
        <Container>
          <Reveal>
            <Section
              title="See it work"
              lead="Not screenshots. Each tile is Kozmos rendering itself, with something to press."
            >
              <Box className="site-bento">
                <AdaptiveTile />
                <PlatformsTile />
                <TokensTile />
                <EmotionsTile />
                <ContrastTile />
              </Box>
              <Text size="sm" color="muted">
                More in Foundations:{" "}
                <SiteLink to="/foundations/typography">type</SiteLink>,{" "}
                <SiteLink to="/foundations/motion">motion</SiteLink>,{" "}
                <SiteLink to="/foundations/elevation">
                  elevation and glass
                </SiteLink>
                , <SiteLink to="/foundations/icons">icons</SiteLink> and{" "}
                <SiteLink to="/foundations/theming">theming</SiteLink>.
              </Text>
            </Section>
          </Reveal>
        </Container>
      </Band>

      <Band muted>
        <Container>
          <Reveal>
            <Section
              title="Make it yours"
              lead="A product re-points tokens through the provider, per module, without a rebuild. The tokens carry two variant brand ramps — the cover at the top of this page is painted from the second; try them, dark, and right to left."
            >
              <MakeItYours />
            </Section>
          </Reveal>
        </Container>
      </Band>

      <Band>
        <Container>
          <Reveal>
            <Section
              title="Web, iOS, Android and Figma"
              lead="React, SwiftUI and Jetpack Compose read the same tokens and are held to shared contracts that CI compares on every pull request; the Figma library is painted from the same tokens and linked to all three."
            >
              <Box className="site-grid site-grid-4">
                {platforms.map((platform) => (
                  <Card key={platform.title} className="site-card-fill">
                    <CardHeader>
                      <Stack
                        direction="row"
                        align="center"
                        justify="between"
                        gap={2}
                      >
                        <CardTitle>{platform.title}</CardTitle>
                        <Tag variant="outline">{platform.status}</Tag>
                      </Stack>
                      <Text size="sm" weight="medium">
                        {platform.technology}
                      </Text>
                      <CardDescription>{platform.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </Box>
            </Section>
          </Reveal>
        </Container>
      </Band>

      <Band muted last>
        <Container>
          <Reveal>
            <Section
              title="Checked on every pull request"
              lead="The main checks the workflow runs on every pull request."
              actions={
                <Text size="sm">
                  <SiteLink to="/get-started#checks">
                    What each check does
                  </SiteLink>
                </Text>
              }
            >
              <Checklist />
            </Section>
          </Reveal>
        </Container>
      </Band>
    </>
  );
}
