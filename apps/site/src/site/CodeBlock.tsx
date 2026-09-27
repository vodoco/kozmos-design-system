import { ScrollArea, Separator, Stack, Surface, Text } from "@kozmos-ds/react";
import { CopyButton } from "./CopyButton";

/**
 * GAP-05: Kozmos has no code block. This composes one from Surface,
 * ScrollArea, Text and Button around a <pre>. The <pre> deliberately carries
 * no Kozmos class: the provider's scoped preflight gives an unclassed <pre>
 * the monospace family, and `kozmos-reset` would take it away again.
 */
export function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <Surface className="site-code">
      <Stack
        direction="row"
        align="center"
        justify="between"
        gap={2}
        className="site-code-bar"
      >
        <Text as="span" size="sm" color="muted">
          {label}
        </Text>
        <CopyButton text={code} label={`Copy ${label}`} />
      </Stack>
      <Separator />
      <ScrollArea
        orientation="both"
        hideScrollbar={false}
        viewportProps={{
          role: "region",
          "aria-label": label,
          className: "site-code-body",
        }}
      >
        <Text as="div" size="sm">
          <pre className="site-code-pre">
            <code>{code.trimEnd()}</code>
          </pre>
        </Text>
      </ScrollArea>
    </Surface>
  );
}
