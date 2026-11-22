import figma from "@figma/code-connect";
import { ClientAppBanner, type ClientAppBannerProps } from "./ClientAppBanner";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const appIcon: ClientAppBannerProps["appIconSrc"];
declare const openApp: ClientAppBannerProps["onAction"];
declare const dismissBanner: NonNullable<ClientAppBannerProps["onDismiss"]>;

/**
 * Figma Code Connect: ClientAppBanner (GAP-206, GAP-127)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-19192
 *
 * Promotion Text, App Name Text and Description Text are promotionText,
 * appName and description, the first and last shown by their Show
 * properties; the Action's Label Text is actionLabel, and Show Dismiss is
 * onDismiss. Layout is how the width falls (Wide puts the action beside the
 * words, Narrow under them), not a prop. Initial Text stands in for the
 * app's icon until appIconSrc loads, and is drawn from appName.
 */
figma.connect(
  ClientAppBanner,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-19192",
  {
    props: {
      promotionText: figma.boolean("Show Promotion", {
        true: figma.string("Promotion Text"),
        false: undefined,
      }),
      appName: figma.string("App Name Text"),
      description: figma.boolean("Show Description", {
        true: figma.string("Description Text"),
        false: undefined,
      }),
      action: figma.nestedProps("Action", {
        label: figma.string("Label Text"),
      }),
      onDismiss: figma.boolean("Show Dismiss", {
        true: () => dismissBanner(),
        false: undefined,
      }),
    },
    example: ({ promotionText, appName, description, action, onDismiss }) => (
      <ClientAppBanner
        promotionText={promotionText}
        appName={appName}
        description={description}
        appIconSrc={appIcon}
        actionLabel={action.label}
        onAction={() => openApp()}
        onDismiss={onDismiss}
      />
    ),
  },
);
