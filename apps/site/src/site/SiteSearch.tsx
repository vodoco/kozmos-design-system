import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Icon,
  IconButton,
  Listbox,
  SearchBar,
  Text,
  type ComboboxOption,
} from "@kozmos-ds/react";
import { examples } from "../examples/manifest";
import { foundationPages } from "../foundations/nav";
import { componentIndex, laneTitle } from "../reference/nav";
import { withoutCode } from "./inline-code";

interface Entry {
  to: string;
  label: string;
  description: string;
  group: "Pages" | "Foundations" | "Components" | "Examples";
}

/** Everything the site has a page for, from the same data the pages use. */
const entries: readonly Entry[] = [
  {
    to: "/get-started",
    label: "Get started",
    description:
      "Install, set up, dark mode, right to left, tokens, the platforms.",
    group: "Pages",
  },
  {
    to: "/foundations",
    label: "Foundations",
    description: "What every component is made from.",
    group: "Pages",
  },
  {
    to: "/components",
    label: "Components",
    description: `${componentIndex.components.length} components in four lanes, live.`,
    group: "Pages",
  },
  {
    to: "/examples",
    label: "Examples",
    description: "Pages and apps built from Kozmos and nothing else.",
    group: "Pages",
  },
  {
    to: "/roadmap",
    label: "Roadmap",
    description: "What Kozmos cannot do yet, in the order it should be fixed.",
    group: "Pages",
  },
  ...foundationPages.map(
    (page): Entry => ({
      to: `/foundations/${page.slug}`,
      label: page.title,
      description: page.summary,
      group: "Foundations",
    }),
  ),
  ...componentIndex.components.map(
    (component): Entry => ({
      to: `/components/${component.slug}`,
      label: component.name,
      description:
        withoutCode(component.description) || laneTitle(component.lane),
      group: "Components",
    }),
  ),
  ...examples.map(
    (example): Entry => ({
      to: `/examples/${example.slug}`,
      label: example.title,
      description: example.summary,
      group: "Examples",
    }),
  ),
];

const LIMIT = 12;

function rank(entry: Entry, query: string) {
  const name = entry.label.toLowerCase();
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.includes(query)) return 2;
  return 3;
}

/** What matches, best first: up to LIMIT of them, and how many there were. */
function search(query: string): { shown: Entry[]; total: number } {
  const trimmed = query.trim().toLowerCase();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    // Nothing typed yet: the pages and the foundations, as a table of contents.
    const contents = entries.filter(
      (entry) => entry.group === "Pages" || entry.group === "Foundations",
    );
    return { shown: contents, total: contents.length };
  }
  const found = entries
    .filter((entry) => {
      const haystack = `${entry.label} ${entry.description}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    })
    .sort((a, b) => rank(a, trimmed) - rank(b, trimmed));
  return { shown: found.slice(0, LIMIT), total: found.length };
}

/** The line a screen reader hears as the results change. */
function summary(query: string, shown: number, total: number) {
  if (!query.trim()) return `${total} places to start`;
  if (total === 0)
    return `Nothing has “${query.trim()}” in its name or its summary.`;
  if (shown < total)
    return `The best ${shown} of ${total} results; type more to narrow them.`;
  return total === 1 ? "1 result" : `${total} results`;
}

/**
 * The site's search: a dialog with a field and a list of everything that has
 * a page, opened from the header or with ⌘K / Ctrl+K anywhere. Enter opens
 * the first result; the arrow keys walk the list, as Listbox does.
 */
export function SiteSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useRef<HTMLDivElement>(null);
  // A chosen result closes the dialog first and navigates once it has gone:
  // the navigation's focus on the new page's main (SiteShell) is then the
  // last word, not the dialog's return to the header button. Deferring is
  // what makes it hold in WebKit as well.
  const pending = useRef<string>(undefined);
  const hintId = useId();

  // However the dialog closes — Escape, the ✕, ⌘K again, or a result — the
  // next visit starts from an empty field.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { shown, total } = useMemo(() => search(query), [query]);
  const options: ComboboxOption[] = shown.map((entry) => ({
    value: entry.to,
    label: entry.label,
    description: `${entry.group} · ${entry.description}`,
  }));

  function go(to: string) {
    pending.current = to;
    setOpen(false);
  }

  return (
    <>
      <IconButton
        aria-label="Search the site"
        variant="ghost"
        onClick={() => setOpen(true)}
      >
        <Icon name="search-md" size="sm" />
      </IconButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            const to = pending.current;
            if (!to) return;
            event.preventDefault();
            pending.current = undefined;
            navigate(to);
          }}
        >
          <DialogHeader>
            <DialogTitle>Search the site</DialogTitle>
            <DialogDescription>
              Components, examples, foundations and the pages. ⌘K or Ctrl+K
              opens this anywhere.
            </DialogDescription>
          </DialogHeader>
          <SearchBar
            variant="inline"
            aria-label="Search the site"
            placeholder="A component, an example, a page"
            value={query}
            onChange={setQuery}
            onClear={() => setQuery("")}
            aria-describedby={hintId}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter" && shown[0]) {
                event.preventDefault();
                go(shown[0].to);
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                results.current
                  ?.querySelector<HTMLElement>('[role="listbox"]')
                  ?.focus();
              }
            }}
          />
          {/* Always there, so a screen reader hears each change to it. */}
          <Text size="sm" color="muted" aria-live="polite">
            {summary(query, shown.length, total)}
          </Text>
          <Box ref={results} className="site-search-results">
            {options.length > 0 ? (
              <Listbox
                aria-label="Results"
                className="site-search-list"
                options={options}
                onValueChange={(value) => {
                  if (typeof value === "string") go(value);
                }}
              />
            ) : null}
          </Box>
          <Text id={hintId} size="xs" color="muted">
            Enter opens the first result; the down arrow moves into the list.
          </Text>
        </DialogContent>
      </Dialog>
    </>
  );
}
