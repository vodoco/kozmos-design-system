import { Alert, AlertDescription, Text } from "@kozmos-ds/react";
import { DocsPage, foundationMeta } from "../../foundations/DocsPage";
import { MotionRace } from "../../foundations/MotionRace";
import { TokenTable } from "../../foundations/parts";
import { foundationPage } from "../../foundations/nav";
import { tokensWithPrefix } from "../../lib/tokens";
import { Section } from "../../site/Section";

const page = foundationPage("motion");

export function meta() {
  return foundationMeta(page);
}

export default function Motion() {
  return (
    <DocsPage page={page}>
      <Section
        title="Durations and easings"
        lead="Three durations and two curves: quick for state changes, standard for most movement, deliberate for entrances; emphasised overshoots, standard settles. Kozmos’s own stylesheet times its sheet, pop, reveal and cross-fade with them; many components still use Tailwind’s own durations."
      >
        <MotionRace />
      </Section>

      <Section
        title="The tokens"
        lead="Durations in milliseconds, entry and exit as a scale, slide distances in unitless pixels."
      >
        <TokenTable
          entries={tokensWithPrefix("--semantics-motion-")}
          caption="Motion tokens"
          labelPrefix="--semantics-motion"
        />
      </Section>

      <Section title="Reduced motion">
        <Alert variant="info" role="note">
          <AlertDescription>
            Under the system’s reduced-motion preference the location marker’s
            pulse stops, the sheet, pops, reveals and cross-fades become cuts,
            and the spinner, the skeleton’s pulse, the button’s loader and the
            assistant’s ring rest too (GAP-50, fixed on 2026-09-23). The design
            config’s{" "}
            <Text as="span" className="site-mono">
              motion: reduced
            </Text>{" "}
            reaches the same four, and shortens the Tailwind transitions most
            components use. This page’s race still runs under reduced motion,
            because it is the thing being demonstrated.
          </AlertDescription>
        </Alert>
      </Section>
    </DocsPage>
  );
}
