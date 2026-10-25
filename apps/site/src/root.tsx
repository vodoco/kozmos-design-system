import "@kozmos-ds/react/style.css";
// The tokens' own stylesheet puts the same variables on :root and switches
// them with <html data-theme>, which is how the page outside every
// ThemeProvider — the canvas behind overscroll, the scrollbars — follows the
// theme too. The package's README keeps this out of embedded modules; this
// site is the whole document, so it is the host.
import "@kozmos-ds/tokens/css/light.css";
import "@kozmos-ds/tokens/css/dark.css";
import "./styles/site.css";

import { useLayoutEffect, type ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { Spinner, ThemeProvider, useTheme } from "@kozmos-ds/react";
import type { Route } from "./+types/root";
import { SiteShell } from "./site/SiteShell";
import { StatusPage } from "./site/StatusPage";
import { SITE_INDEXABLE, THEME_STORAGE_KEY } from "./lib/site";

// Vite's base, always with its trailing slash: "/" in development, the
// project's path on Pages.
const base = import.meta.env.BASE_URL;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* The logo's K on a tile (scripts/generate-brand.mjs): the .ico for
            anything that cannot draw an SVG icon, the SVG for the rest, and
            a square for a phone's home screen. Through BASE_URL, so they are
            still found when the site is served from a subpath: on Pages the
            document lives under /kozmos-design-system/ and a root-absolute
            href would ask the domain's root for a file that is not there. */}
        <link rel="icon" href={`${base}favicon.ico`} sizes="32x32" />
        <link rel="icon" href={`${base}favicon.svg`} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={`${base}apple-touch-icon.png`} />
        {SITE_INDEXABLE ? null : <meta name="robots" content="noindex" />}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/** A transition of a colour: what a theme switch starts in every part. */
const COLOUR = /color|shadow|^fill$|^stroke$/;

/**
 * Mirrors the provider's resolved theme onto <html>, before paint, so the
 * document canvas and native scrollbars match the components. The provider
 * itself never touches <html> by design.
 *
 * A change of theme then snaps (GAPS.md, GAP-96). Every Kozmos part with a
 * colour transition would fade into the new theme, hundreds of them at once
 * on the home page, a frame of restyling and repainting for each step of the
 * fade. So the new theme's styles are settled here, before paint, and every
 * colour fade that started ends at once; so does every colour fade that
 * starts in the frames after, until a frame starts none (a style an engine
 * settles later, as WebKit does after the device's scheme changes).
 * Anything else moving, a band fading in or a lap, is left alone. The first
 * theme, set as the page hydrates, is no change.
 */
function DocumentTheme() {
  const { resolvedTheme } = useTheme();
  useLayoutEffect(() => {
    const html = document.documentElement;
    const switching =
      html.dataset.theme !== undefined && html.dataset.theme !== resolvedTheme;
    html.dataset.theme = resolvedTheme;
    if (!switching) return;
    // getAnimations() settles pending styles first, so the fades exist:
    // here, and again once the commit's other effects have run.
    const finishFades = () => {
      for (const animation of document.getAnimations()) {
        if (
          animation instanceof CSSTransition &&
          COLOUR.test(animation.transitionProperty)
        )
          animation.finish();
      }
    };
    finishFades();
    queueMicrotask(finishFades);
    // A fade's transitionrun is sent as the next frame starts, before it
    // draws: ended there, it is never drawn part-way.
    let ended = 0;
    const end = (event: TransitionEvent) => {
      if (!COLOUR.test(event.propertyName)) return;
      for (const animation of (event.target as Element).getAnimations())
        if (
          animation instanceof CSSTransition &&
          animation.transitionProperty === event.propertyName
        ) {
          animation.finish();
          ended++;
        }
    };
    document.addEventListener("transitionrun", end, true);
    let frame = 0;
    let frames = 0;
    // Four frames at least, then until a frame ends none, twenty at most.
    const watch = () => {
      frames++;
      if (frames > 20 || (frames > 4 && ended === 0)) {
        document.removeEventListener("transitionrun", end, true);
        return;
      }
      ended = 0;
      frame = requestAnimationFrame(watch);
    };
    frame = requestAnimationFrame(watch);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("transitionrun", end, true);
    };
  }, [resolvedTheme]);
  return null;
}

function SiteProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey={THEME_STORAGE_KEY}>
      <DocumentTheme />
      {children}
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <SiteProviders>
      <Outlet />
    </SiteProviders>
  );
}

/** What a URL the build did not pre-render shows while the app boots. */
export function HydrateFallback() {
  return (
    <SiteProviders>
      <SiteShell>
        <StatusPage title="Loading">
          <Spinner aria-label="Loading the page" />
        </StatusPage>
      </SiteShell>
    </SiteProviders>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <SiteProviders>
      <SiteShell>
        <StatusPage
          title={notFound ? "Page not found" : "Something went wrong"}
          description={
            notFound
              ? "There is no page at this address."
              : "The page failed to render. Reloading may help."
          }
        />
      </SiteShell>
    </SiteProviders>
  );
}
