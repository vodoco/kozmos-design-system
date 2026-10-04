import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AdaptiveMapShell } from "../AdaptiveMapShell";
import { ThemeProvider } from "../ThemeProvider";

const languages = [
  { id: "en", label: "English" },
  { id: "de", label: "Deutsch" },
  { id: "fr", label: "Français" },
  { id: "ar", label: "العربية", direction: "rtl" as const },
];
const meta: Meta<typeof LanguageSwitcher> = {
  id: "product-sdk-languageswitcher",
  title: "SDK/Map controls/LanguageSwitcher",
  component: LanguageSwitcher,
  args: { languages, selectedLocale: "en", onLocaleRequest: fn() },
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Pending: Story = { args: { pending: true } };
export const Failed: Story = {
  args: { error: "Language could not be changed.", onRetry: fn() },
};
export const SingleLanguage: Story = { args: { languages: [languages[0]] } };
export const NoLanguages: Story = {
  args: { languages: [], selectedLocale: "" },
};
export const RightToLeft: Story = {
  args: { dir: "rtl", selectedLocale: "ar", label: "اللغة" },
};
export const EmbeddedMap: Story = {
  render: function Demo(args) {
    // This synchronous fixture models an accepted change only. Production hosts
    // await app/SDK application before committing selectedLocale and direction.
    const [locale, setLocale] = useState("en");
    return (
      <ThemeProvider dir={locale === "ar" ? "rtl" : "ltr"}>
        <AdaptiveMapShell
          style={{ width: 360, maxWidth: "100%", height: 400 }}
          map={<div />}
          controlsBottomStart={
            <LanguageSwitcher
              {...args}
              selectedLocale={locale}
              onLocaleRequest={setLocale}
            />
          }
        />
      </ThemeProvider>
    );
  },
};
