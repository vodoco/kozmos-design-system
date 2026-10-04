import React from "react";
import { MarkerPin01 as MapPin } from "@kozmos-ds/icons";

/** Decorative destination context. The adjacent destination name carries its identity. */
export function DestinationImage({ src }: { src: string }) {
  const [failed, setFailed] = React.useState(false);
  return (
    <span
      aria-hidden="true"
      data-destination-media={failed ? "fallback" : "image"}
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-control border border-border bg-muted text-foreground"
    >
      {failed ? (
        <MapPin className="h-5 w-5" />
      ) : (
        <img
          // An image that failed before React hydrated fired an error nothing
          // heard: it mounts complete, with no width.
          ref={(image) => {
            if (image?.complete && image.naturalWidth === 0) setFailed(true);
          }}
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
