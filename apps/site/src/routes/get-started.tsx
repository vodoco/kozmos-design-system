import type { ReactNode } from "react";
import {
  Alert,
  AlertDescription,
  Container,
  Link,
  List,
  ListItem,
  Text,
} from "@kozmos-ds/react";
import { Pipeline } from "../home/Pipeline";
import { PACKAGES_PUBLISHED, PUBLIC_PACKAGES, pageTitle } from "../lib/site";
import { storybookHref } from "../lib/storybook";
import { CodeBlock } from "../site/CodeBlock";
import { PageHeader, Section } from "../site/Section";
import analyticsSnippet from "../snippets/analytics.tsx?raw";
import buttonLinkSnippet from "../snippets/button-link.tsx?raw";
import darkModeSnippet from "../snippets/dark-mode.tsx?raw";
import firstComponentSnippet from "../snippets/first-component.tsx?raw";
import rightToLeftSnippet from "../snippets/right-to-left.tsx?raw";
import setupSnippet from "../snippets/setup.tsx?raw";
import tokensSnippet from "../snippets/tokens.css?raw";

export function meta() {
  return [
    { title: pageTitle("Get started") },
    {
      name: "description",
      content:
        "Install the Kozmos React package, add its stylesheet and a ThemeProvider, and use your first component.",
    },
  ];
}

const repositorySteps = `pnpm install
pnpm --filter "@kozmos-ds/react..." build`;

/**
 * A static note. Alert is always role="alert" and its title is always an h5
 * (GAPS.md, GAP-12), so the note overrides the role and has no title.
 */
function Note({
  variant,
  children,
}: {
  variant: "info" | "warning";
  children: ReactNode;
}) {
  return (
    <Alert variant={variant} role="note">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export default function GetStarted() {
  return (
    <Container className="site-page">
      <PageHeader
        title="Get started"
        lead="Kozmos for React: install the package, add its stylesheet and a ThemeProvider, and use a component."
      >
        {PACKAGES_PUBLISHED ? null : (
          <Note variant="info">
            The packages are built for npm and not yet published, so the install
            command below does not work yet: release waits on an approved
            browser support matrix (below). Until then, use them from inside the
            repository, as its apps do.
          </Note>
        )}
      </PageHeader>

      <Section
        title="Install"
        lead="React 18.2 and later, and React 19, are supported. The tokens, icons and product contracts come with it."
      >
        <CodeBlock
          label="Install command"
          code="npm install @kozmos-ds/react react react-dom"
        />
        <List aria-label="The public packages">
          {PUBLIC_PACKAGES.map((pkg) => (
            <ListItem key={pkg.name}>
              <Text as="span" weight="medium">
                {pkg.name}
              </Text>
              <Text as="span" color="muted">
                {" "}
                · {pkg.summary}
              </Text>
            </ListItem>
          ))}
        </List>
      </Section>

      <Section
        title="Set up"
        lead="Import the stylesheet once, and put a ThemeProvider around your app or around each module. The stylesheet holds the tokens for both themes and the styles of every component, so there is no Tailwind configuration to add."
      >
        <CodeBlock label="App.tsx" code={setupSnippet} />
      </Section>

      <Section
        title="Use a component"
        lead="Emotion says what an action means: themed, neutral, success, danger, informative or alert."
      >
        <CodeBlock label="SaveButton.tsx" code={firstComponentSnippet} />
        {/* Storybook is published beside the site, and no route of it: a
            plain link (src/lib/storybook.ts). */}
        <Text size="sm">
          Every component’s props, stories and controls, and its code on each
          platform, are in <Link href={storybookHref()}>Storybook</Link>.
        </Text>
      </Section>

      <Section
        title="Dark mode"
        lead="A ThemeProvider follows the system and its live changes by default. Keeping a choice is opt-in: give the provider a storage key your product owns. useTheme() returns theme, resolvedTheme and setTheme."
      >
        <CodeBlock label="Theme.tsx" code={darkModeSnippet} />
        <Note variant="info">
          A server, or a pre-rendered page like this one, draws the default
          theme first. Someone whose system is dark sees the light theme until
          the page hydrates, unless the server already knows their choice and
          passes it as a controlled theme.
        </Note>
      </Section>

      <Section
        title="Right to left"
        lead="Set dir on a provider. Layout and keyboard navigation follow, and nested providers inherit it."
      >
        <CodeBlock label="ArabicModule.tsx" code={rightToLeftSnippet} />
      </Section>

      <Section
        title="Links that look like buttons"
        lead="Button always renders a button. For navigation, use Link, or give your router’s link the button’s classes."
      >
        <CodeBlock label="BrowseLocations.tsx" code={buttonLinkSnippet} />
      </Section>

      <Section
        title="Tokens in your own CSS"
        lead="Every token is a CSS variable inside a ThemeProvider, and changes with its theme. The JavaScript exports carry the light theme’s values only."
      >
        <CodeBlock label="panel.css" code={tokensSnippet} />
      </Section>

      <Section
        title="Analytics"
        lead="Components report interactions, such as a switch being toggled. Without a provider the events are dropped, with one warning in a development build."
      >
        <CodeBlock label="Analytics.tsx" code={analyticsSnippet} />
      </Section>

      <Section title="Browser support">
        <Note variant="warning">
          Some components still depend on native CSS @scope, and the browser and
          WebView support matrix has not been approved yet. Engines without
          @scope draw those parts incorrectly. Treat this as a pre-release.
        </Note>
      </Section>

      <Section
        title="iOS and Android"
        lead="The native libraries live in the same repository and read the same tokens."
      >
        <List aria-label="Native libraries">
          <ListItem>
            <Text as="span" weight="medium">
              SwiftUI
            </Text>
            <Text as="span" color="muted">
              {" "}
              · the Kozmos Swift package in packages/ios, for iOS 16, macOS 13
              and Mac Catalyst 16 or later. Add it as a local package.
            </Text>
          </ListItem>
          <ListItem>
            <Text as="span" weight="medium">
              Jetpack Compose
            </Text>
            <Text as="span" color="muted">
              {" "}
              · the library module in packages/android, built against compileSdk
              34. Include it as a Gradle module.
            </Text>
          </ListItem>
        </List>
        <Text color="muted">Neither is published to a registry yet.</Text>
      </Section>

      <Section
        title="Inside the repository"
        lead={
          PACKAGES_PUBLISHED
            ? 'An app in the repository depends on the packages as "workspace:*" and uses what the build leaves in each package’s dist folder. Build them first:'
            : 'Until the packages are published, an app in the repository depends on them as "workspace:*" and uses what the build leaves in each package’s dist folder. Build them first:'
        }
      >
        <CodeBlock label="Build commands" code={repositorySteps} />
      </Section>

      <Section
        id="checks"
        title="What every pull request runs"
        lead="The main checks the workflow runs on every pull request, grouped as its steps are, and what each one holds the design system to. The iOS and Android jobs run beside the web one."
      >
        <Pipeline />
      </Section>
    </Container>
  );
}
