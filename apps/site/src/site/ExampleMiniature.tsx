import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Skeleton } from "@kozmos-ds/react";

/**
 * The canvas an example is drawn on when shown small: wide enough for a
 * page's desktop layout. Pages and apps share it, so miniatures side by side
 * have one shape and the cards under them line up.
 */
const CANVAS = { width: 1200, height: 760 };

/**
 * An example rendered small: the real component on a canvas of its real
 * size, scaled to the frame's width. It is a picture of the example, not
 * the example — inert, hidden from assistive technology, named by its label.
 * Mounted only once it is near the viewport, so a page of miniatures does
 * not render every example at once.
 */
export function ExampleMiniature({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const resize = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / CANVAS.width);
    });
    resize.observe(element);
    const intersection = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          intersection.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    intersection.observe(element);
    return () => {
      resize.disconnect();
      intersection.disconnect();
    };
  }, []);

  return (
    <Box
      ref={frame}
      role="img"
      aria-label={label}
      className="site-miniature"
      style={{ "--w": CANVAS.width, "--h": CANVAS.height, "--scale": scale }}
    >
      <Box className="site-miniature-canvas" aria-hidden="true" inert>
        {near ? (
          <Suspense fallback={<Skeleton className="site-miniature-loading" />}>
            {children}
          </Suspense>
        ) : null}
      </Box>
    </Box>
  );
}
