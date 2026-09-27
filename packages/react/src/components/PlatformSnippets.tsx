import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs/Tabs";
import { DesignConfigProvider } from "../context/DesignConfigContext";
import { SyntaxHighlighter } from "storybook/internal/components";
import { convert, ThemeProvider, themes } from "storybook/internal/theming";

export interface PlatformSnippetsProps {
  react?: string;
  vue?: string;
  swift?: string;
  kotlin?: string;
}

const codeTheme = convert(themes.dark);

const platforms = [
  {
    value: "react",
    label: "React",
    language: "tsx",
    note: "The live preview uses React. Docs recipes are type-checked against installed package tarballs under React 18 and 19 by docs:snippets:compile. This is not runtime or accessibility certification. Follow the package README for CSS and provider setup.",
  },
  {
    value: "vue",
    label: "Vue 3 · Internal",
    language: "html",
    note: "Internal only: @kozmos-ds/vue is a private React-wrapper package, not a native Vue library or a published npm package. It requires React and React DOM and does not support server rendering. This reference snippet is not independently compiled.",
  },
  {
    value: "swift",
    label: "Swift (iOS)",
    language: "text",
    note: "Native reference only; not rendered or compiled here. Some examples are implementation excerpts, not complete copy-and-paste applications. Verify against the iOS package before use.",
  },
  {
    value: "kotlin",
    label: "Kotlin (Android)",
    language: "text",
    note: "Native reference only; not rendered or compiled here. Some examples are implementation excerpts, not complete copy-and-paste applications. Verify against the Android package before use.",
  },
] as const;

export const PlatformSnippets = (props: PlatformSnippetsProps) => {
  const first = platforms.find(({ value }) => props[value]?.trim());
  if (!first) return null;

  return (
    // Only Kozmos controls belong inside its style boundary. Storybook's viewer
    // must remain outside so the component reset cannot change its copy/scroll UI.
    <section
      className="kozmos-platform-snippets"
      aria-label="Platform implementation references"
    >
      <p className="kozmos-platform-note">
        One design system, platform-specific APIs. A snippet is not a claim of
        feature parity or release readiness.{" "}
        <a href="./?path=/docs/guides-platform-support--docs" target="_top">
          Platform support and validation
        </a>
      </p>
      <Tabs defaultValue={first.value}>
        <DesignConfigProvider theme="light">
          <TabsList
            className="kozmos-platform-tabs flex h-auto justify-start"
            aria-label="Implementation language"
          >
            {platforms.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="kozmos-platform-tab whitespace-normal"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </DesignConfigProvider>
        {platforms.map(({ value, note, language }) => (
          <TabsContent
            key={value}
            value={value}
            className="kozmos-platform-panel"
          >
            <p className="kozmos-platform-note">{note}</p>
            {props[value]?.trim() ? (
              <div className="kozmos-platform-code">
                <ThemeProvider theme={codeTheme}>
                  <SyntaxHighlighter
                    language={language}
                    copyable
                    bordered
                    padded
                    wrapLongLines
                    format={false}
                  >
                    {props[value]}
                  </SyntaxHighlighter>
                </ThemeProvider>
              </div>
            ) : (
              <p className="kozmos-platform-note">
                No example is documented for this platform. This does not
                establish whether the component is implemented or supported.
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
};
