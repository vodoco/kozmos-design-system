import React, { useEffect, useRef, useState } from "react";
import { useKozmosAnalytics } from "../../utils/analytics";
import { DensityScope } from "../../theme/DensityScope";

export interface NavigationAnnouncerProps {
  message: string;
  isActive?: boolean;
}

/**
 * A structurally invisible primitive that pipes active wayfinding updates directly
 * into accessibility channels (VoiceOver, TalkBack) without altering layout DOM hierarchies.
 */
const NavigationAnnouncer: React.FC<NavigationAnnouncerProps> = ({
  message,
  isActive = true,
}) => {
  const [announcement, setAnnouncement] = useState("");
  const lastAnnouncementRef = useRef("");
  const { trackEvent } = useKozmosAnalytics();

  useEffect(() => {
    if (!isActive || !message) {
      lastAnnouncementRef.current = "";
      setAnnouncement("");
      return;
    }

    if (lastAnnouncementRef.current === message) {
      return;
    }

    lastAnnouncementRef.current = message;
    setAnnouncement(message);
    trackEvent("A11y", "navigation_announced", { message });
  }, [message, isActive, trackEvent]);

  return (
    // The SDK's touch geometry under any density (decision 82).
    <DensityScope density="touch" asChild>
      <div
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
      >
        {announcement}
      </div>
    </DensityScope>
  );
};

NavigationAnnouncer.displayName = "NavigationAnnouncer";

export { NavigationAnnouncer };
