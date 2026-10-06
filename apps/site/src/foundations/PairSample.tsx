import { Box, Surface, Text } from "@kozmos-ds/react";

/** A contract pair, as the colour page and the home tile show it. */
export type ContrastPair = {
  name: string;
  background: string;
  foreground: string;
  minimum: number;
};

/**
 * The pair's own colours: letters for a text pair, a dot for a non-text one.
 * The contract holds text to 4.5:1, so a pair held lower is a shape or an
 * edge (WCAG 1.4.11); drawn as letters, axe would hold it to the text rule.
 */
export function PairSample({ pair }: { pair: ContrastPair }) {
  return (
    <Surface
      className="site-pair-sample"
      aria-hidden="true"
      style={{
        "--pair-bg": `var(--${pair.background})`,
        "--pair-fg": `var(--${pair.foreground})`,
      }}
    >
      <Box className="site-pair-fill">
        {pair.minimum < 4.5 ? (
          <Box className="site-pair-dot" />
        ) : (
          <Text as="span" weight="semibold" className="site-pair-text">
            Aa
          </Text>
        )}
      </Box>
    </Surface>
  );
}
