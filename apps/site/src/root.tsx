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

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* The logo's K on a tile (scripts/generate-brand.mjs): the .ico for
            anything that cannot draw an SVG icon, the SVG for the rest, and
            a square for a phone's home screen. */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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

/**
 * Mirrors the provider's resolved theme onto <html>, before paint, so the
 * document canvas and native scrollbars match the components. The provider
 * itself never touches <html> by design.
 */
function DocumentTheme() {
  const { resolvedTheme } = useTheme();
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
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
