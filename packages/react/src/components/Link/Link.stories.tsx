import type { Meta, StoryObj } from "@storybook/react";
import { Link } from "./Link";
import { Text } from "../Text/Text";
import { Stack } from "../Stack/Stack";
import { ThemeProvider } from "../ThemeProvider/ThemeProvider";
import { DensityScope } from "../../theme/DensityScope";

const meta: Meta<typeof Link> = {
  id: "navigation-link",
  title: "Core/Actions/Link",
  component: Link,
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: {
    children: "Default Link",
    href: "#",
    variant: "default",
  },
};

export const Subtle: Story = {
  args: {
    children: "Subtle Link",
    href: "#",
    variant: "subtle",
  },
};

/**
 * A link that opens in a new tab (GAP-202): the new-tab icon at its end, in
 * its colour and size, and "opens in a new tab" read after its name.
 */
export const External: Story = {
  args: {
    children: "Privacy Policy",
    href: "https://example.com/privacy",
    external: true,
  },
};

/**
 * In running text, in a column narrow enough to wrap: the icon stays with
 * the link's last word, in touch density and compact, default and subtle.
 */
export const ExternalInText: Story = {
  render: function ExternalInTextStory() {
    const paragraph = (
      <Text size="sm" style={{ width: 208 }}>
        Read our{" "}
        <Link href="https://example.com/privacy" external>
          Privacy Policy
        </Link>{" "}
        and the{" "}
        <Link href="https://example.com/terms" external variant="subtle">
          Terms of Service
        </Link>{" "}
        before you continue.
      </Text>
    );
    return (
      <Stack direction="row" gap={6}>
        {paragraph}
        <DensityScope density="compact">{paragraph}</DensityScope>
      </Stack>
    );
  },
};

/** Right to left, the icon sits at the link's end and points to it. */
export const ExternalRightToLeft: Story = {
  render: function ExternalRightToLeftStory(_args, { globals }) {
    return (
      <ThemeProvider
        dir="rtl"
        theme={globals.theme === "dark" ? "dark" : "light"}
      >
        <Text size="sm" style={{ width: 208 }}>
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
    );
  },
};
