import { createRoot } from "react-dom/client";
import { DensityScope, Link, Text, ThemeProvider } from "@kozmos-ds/react";

/**
 * Links in the built package, for scripts/check-link-external.mjs
 * (GAP-202): an external link in running text, in each case the check
 * measures. Each paragraph is `data-case`, so the check can narrow it and
 * read where the link's last word and its icon are drawn.
 */
function Paragraph({
  name,
  variant,
  label,
}: {
  name: string;
  variant?: "default" | "subtle";
  label?: string;
}) {
  return (
    <Text size="sm" data-case={name} style={{ width: 320 }}>
      Read our{" "}
      <Link
        href="https://example.com/privacy"
        external
        variant={variant}
        externalLabel={label}
      >
        Privacy Policy
      </Link>{" "}
      before you continue.
    </Text>
  );
}

function Fixture() {
  return (
    <div style={{ display: "grid", gap: 24, padding: 16 }}>
      <ThemeProvider theme="light">
        <Paragraph name="light" />
        <Paragraph name="light-subtle" variant="subtle" />
        <Paragraph name="localised" label="öffnet in einem neuen Tab" />
        <DensityScope density="compact">
          <Paragraph name="compact" />
        </DensityScope>
        <Text size="sm" data-case="caller">
          <Link
            href="https://example.com/docs"
            external
            target="docs"
            rel="noopener"
          >
            Documentation
          </Link>
        </Text>
        <Text size="sm" data-case="same-tab">
          <Link href="/venues">Browse venues</Link>
        </Text>
        <Text size="lg" data-case="large">
          <Link href="https://example.com/terms" external>
            Terms of Service
          </Link>
        </Text>
      </ThemeProvider>
      <ThemeProvider theme="dark">
        <div style={{ padding: 8 }}>
          <Paragraph name="dark" />
          <Paragraph name="dark-subtle" variant="subtle" />
        </div>
      </ThemeProvider>
      <ThemeProvider theme="light" dir="rtl">
        <Text size="sm" data-case="rtl" style={{ width: 320 }}>
          اقرأ{" "}
          <Link
            href="https://example.com/privacy"
            external
            externalLabel="يفتح في علامة تبويب جديدة"
          >
            سياسة الخصوصية
          </Link>{" "}
          قبل المتابعة.
        </Text>
      </ThemeProvider>
    </div>
  );
}

createRoot(document.getElementById("fixture")!).render(<Fixture />);
