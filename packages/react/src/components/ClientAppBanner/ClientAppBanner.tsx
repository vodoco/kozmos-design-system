import React from "react";
import { X } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { Avatar, AvatarFallback, AvatarImage } from "../Avatar";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { surfaceClass } from "../Surface";
import { Text } from "../Text";

export interface ClientAppBannerProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "children"
> {
  /**
   * The line above the app's name — "Get the app". The customer sets it in
   * Pointr Cloud, in the visitor's language; left out, nothing is drawn.
   */
  promotionText?: string;
  /** The app's name. It names the banner's region too, unless `aria-label` does. */
  appName: string;
  /** What the app is for. Two lines at most are drawn; all of it is read. */
  description?: string;
  /**
   * The app's icon. Without one, or until it loads, the app's initial stands
   * in for it, as an Avatar's fallback does.
   */
  appIconSrc?: string;
  /**
   * Names the icon. Leave it out: beside the app's name the icon is
   * decoration, and naming it says the name twice. Set it only when the
   * icon says something the name does not.
   */
  appIconAlt?: string;
  /** The button's words — "Open", "Get the app" — which are also its name. */
  actionLabel: string;
  /** Pressed: the product opens the store, or the app. */
  onAction: () => void;
  /**
   * Pressed: the product removes the banner, and decides for how long it
   * stays away. Left out, there is no dismiss button.
   */
  onDismiss?: () => void;
  /** Names the dismiss button. Supply translated words. */
  dismissLabel?: string;
}

/** The app's first letter, whole even when it is two code units. */
function initialOf(appName: string) {
  return Array.from(appName.trim())[0]?.toLocaleUpperCase() ?? "";
}

/**
 * Express's Client App Banner (GAP-127): the customer's promotion, the app's
 * icon, name and description, and one action, with a way to dismiss it. Every
 * word is set by the customer in Pointr Cloud; Kozmos draws them.
 *
 * Made for AdaptiveMapShell's `topBar`, which hosts what it is given with no
 * surface of its own, so the banner draws its own, as the manoeuvre card
 * there does: the page's surface with its subtle edge, the Container corner,
 * and the floating elevation of map chrome.
 *
 * A region named by the app. It reads the promotion, the name and the
 * description, then the action, then dismiss. It moves no focus, announces
 * nothing, and never removes itself: `onDismiss` asks the product to.
 *
 * Where the words and the action do not fit side by side, the action goes
 * under the icon and the words and fills their width, so the words keep the
 * width beside the icon. The icon is the 48 square and dismiss the 44 target
 * the natives draw, at every text size. The layout is owned CSS
 * (`styles/owned-client-app-banner.css`), set out in logical sides only, so
 * it holds where a host without `@scope` drops the utility layer.
 */
const ClientAppBanner = React.forwardRef<HTMLElement, ClientAppBannerProps>(
  (
    {
      className,
      promotionText,
      appName,
      description,
      appIconSrc,
      appIconAlt,
      actionLabel,
      onAction,
      onDismiss,
      dismissLabel = "Dismiss",
      ...props
    },
    ref,
  ) => {
    const nameId = React.useId();
    const iconNamed = Boolean(appIconAlt);
    return (
      <section
        ref={ref}
        {...props}
        // Named by the app, unless the product names it.
        aria-labelledby={
          props["aria-label"]
            ? props["aria-labelledby"]
            : (props["aria-labelledby"] ?? nameId)
        }
        className={cn(
          surfaceClass("solid"),
          "kozmos-client-app-banner",
          className,
        )}
      >
        <div className="kozmos-client-app-banner-body">
          <div className="kozmos-client-app-banner-head">
            <Avatar
              // A new icon is a new image: without the key, an icon taken
              // away after it loaded left the square empty, with no initial.
              key={appIconSrc ?? ""}
              // Named, the icon is one image whether it has loaded or not:
              // the initial standing in for it is not read as a letter.
              // Unnamed, it is decoration beside the app's name.
              aria-hidden={iconNamed ? undefined : true}
              aria-label={iconNamed ? appIconAlt : undefined}
              role={iconNamed ? "img" : undefined}
              // The utilities say under @scope what the owned rule says
              // without it, over the Avatar's own 40 circle: 48 at every
              // text size, as on SwiftUI and Compose.
              className="kozmos-client-app-banner-icon h-[48px] w-[48px] rounded-control border border-border"
            >
              {appIconSrc && <AvatarImage alt="" src={appIconSrc} />}
              <AvatarFallback className="kozmos-client-app-banner-initial rounded-control kozmos-text-lg kozmos-text-semibold">
                {initialOf(appName)}
              </AvatarFallback>
            </Avatar>
            <div className="kozmos-client-app-banner-text">
              {promotionText && (
                <Text size="xs" weight="medium" color="muted">
                  {promotionText}
                </Text>
              )}
              <Text id={nameId} weight="semibold">
                {appName}
              </Text>
              {description && (
                <Text
                  size="sm"
                  color="muted"
                  className="kozmos-client-app-banner-description"
                >
                  {description}
                </Text>
              )}
            </div>
          </div>
          <Button
            className="kozmos-client-app-banner-action"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </Button>
        </div>
        {onDismiss && (
          <IconButton
            aria-label={dismissLabel}
            // The 44 target at every text size, as on SwiftUI; the owned
            // rule says the same without @scope.
            className="kozmos-client-app-banner-dismiss h-[44px] w-[44px]"
            onClick={onDismiss}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </IconButton>
        )}
      </section>
    );
  },
);
ClientAppBanner.displayName = "ClientAppBanner";

export { ClientAppBanner };
