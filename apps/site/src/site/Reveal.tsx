import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "@kozmos-ds/react";

/**
 * Reveals its content when it scrolls into view, with the motion tokens
 * (site.css, `.site-reveal`). The pre-rendered page shows everything; the
 * effect only starts once the page has hydrated, and never under a reduced
 * motion preference.
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      className={className ? `site-reveal ${className}` : "site-reveal"}
      data-shown={shown ? "true" : undefined}
    >
      {children}
    </Box>
  );
}
