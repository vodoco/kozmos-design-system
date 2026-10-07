import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ClientAppBanner } from "./ClientAppBanner";
import { AdaptiveMapShell } from "../AdaptiveMapShell";

/**
 * A customer's app icon, as Pointr Cloud would serve it: a fixture, drawn
 * here so the stories need nothing from outside Storybook.
 */
const APP_ICON = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>" +
    "<rect width='96' height='96' fill='#1d4ed8'/>" +
    "<path d='M48 18c-12.2 0-22 9.8-22 22 0 16.5 22 38 22 38s22-21.5 22-38c0-12.2-9.8-22-22-22zm0 30a8 8 0 1 1 0-16 8 8 0 0 1 0 16z' fill='#ffffff'/>" +
    "</svg>",
)}`;

/** As wide as a story says: the top bar's own width is the shell's to set. */
const atWidth: Decorator = (Story, context) =>
  context.parameters.ownWidth ? (
    <Story />
  ) : (
    <div
      style={{
        inlineSize: context.parameters.width ?? 560,
        maxInlineSize: "100%",
      }}
    >
      <Story />
    </div>
  );

const meta = {
  id: "product-sdk-clientappbanner",
  title: "Core/Feedback/ClientAppBanner",
  component: ClientAppBanner,
  parameters: { layout: "centered" },
  decorators: [atWidth],
  args: {
    promotionText: "Get the app",
    appName: "Northfield Airport",
    description:
      "Live gate changes, step-free routes and your boarding pass, on your phone.",
    appIconSrc: APP_ICON,
    actionLabel: "Open",
    onAction: fn(),
    onDismiss: fn(),
  },
} satisfies Meta<typeof ClientAppBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The five fields a customer sets in Pointr Cloud, and a way to dismiss it.
 * Wide enough, the action sits beside the words.
 */
export const Default: Story = {};

/** No icon, or one that has not loaded: the app's initial stands in for it. */
export const NoIcon: Story = {
  args: { appIconSrc: undefined },
};

/**
 * Where it goes: AdaptiveMapShell's `topBar`, on a phone, as Express's web
 * fallback shows it. The top bar draws no surface of its own; the banner
 * brings its own. Dismissing it is the product's: it removes the banner.
 */
export const InShellTopBar: Story = {
  parameters: { layout: "fullscreen", ownWidth: true },
  render: (args) => (
    <AdaptiveMapShell
      map={
        <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
          Map SDK renderer slot
        </div>
      }
      style={{ width: 390, height: 640, maxWidth: "100%" }}
      topBar={<ClientAppBanner {...args} />}
    />
  ),
};

/**
 * At 320, the action goes under the icon and the words and spans them both,
 * so the words keep the width beside the icon.
 */
export const Narrow: Story = {
  parameters: { width: 320 },
};
