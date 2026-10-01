type InertEntry = {
  target: HTMLElement;
  /** The box the target covers; the document's body for a document-modal. */
  within?: Element;
  /** Boxes in it that stay in reach too, as a selector. */
  keep?: string;
};

type InertState = {
  targets: InertEntry[];
  owned: Map<Element, string | null>;
  observer: MutationObserver;
  update: () => void;
};

// Independent from aria-hidden's counters: ARIA visibility and HTML interaction
// suppression are distinct lifecycles. Never change a host's aria-hidden state.
const documents = new WeakMap<Document, InertState>();

/** What stays in reach to speak: live regions by attribute or by role. */
const LIVE =
  '[aria-live], [role~="status"], [role~="alert"], [role~="log"], [role~="marquee"], [role~="timer"], output, script';

/** Make the background of a document-modal popup non-interactive. The newest
 * connected popup wins; release restores the preceding popup and host attributes.
 * Native inert complements, rather than replaces, the primitive's focus trap.
 *
 * With `within`, only that box's content is made inert, apart from the target:
 * a surface laid over one frame of the page, as AICompanionPanel is over the
 * frame it covers, leaves the rest of the page alone. Such surfaces in
 * different frames hold at once; a document-modal popup opened after them
 * takes the whole page until it is released. `keep` names boxes in it that
 * stay in reach as well, such as the portals a surface's own popups open in. */
export function inertOutside(
  target: HTMLElement,
  { within, keep }: { within?: Element; keep?: string } = {},
): () => void {
  const doc = target.ownerDocument;
  let state = documents.get(doc);
  if (!state) {
    const update = () => {
      const current = documents.get(doc);
      if (!current) return;
      const wanted = new Set<Element>();
      // Newest first. Each connected target keeps itself, and every newer
      // one, out of what it makes inert; a document-modal one is the last
      // that counts, as it already takes everything older.
      const active: Element[] = [];
      for (const entry of [...current.targets].reverse()) {
        if (!entry.target.isConnected) continue;
        const scope =
          entry.within?.isConnected && entry.within !== doc.body
            ? entry.within
            : doc.body;
        active.push(entry.target);
        // Preserve live announcements: those marked with aria-live, as the
        // ARIA visibility primitive keeps them, and those whose role makes
        // them live, as Kozmos's own status parts do with a role alone
        // (MapStatusPill, Alert, Notice, Spinner). Never make a container
        // inert if it contains an active popup.
        const reachable = [
          ...active,
          ...scope.querySelectorAll(LIVE),
          ...(entry.keep ? scope.querySelectorAll(entry.keep) : []),
        ];
        const visit = (parent: Element) => {
          for (const child of parent.children) {
            if (reachable.includes(child)) continue;
            if (reachable.some((node) => child.contains(node))) visit(child);
            else wanted.add(child);
          }
        };
        visit(scope);
        if (scope === doc.body) break;
      }
      for (const [node, previous] of current.owned) {
        if (wanted.has(node)) continue;
        current.owned.delete(node);
        // Changed by someone else while it was held — a product that makes
        // the same box inert itself, and takes it off as its surface closes:
        // theirs stands. Put back, the box would stay out of reach.
        if (node.getAttribute("inert") !== "") continue;
        if (previous === null) node.removeAttribute("inert");
        else node.setAttribute("inert", previous);
      }
      for (const node of wanted) {
        if (current.owned.has(node)) continue;
        current.owned.set(node, node.getAttribute("inert"));
        node.setAttribute("inert", "");
      }
    };
    state = {
      targets: [],
      owned: new Map(),
      observer: new doc.defaultView!.MutationObserver(update),
      update,
    };
    documents.set(doc, state);
    state.observer.observe(doc.body, { childList: true, subtree: true });
  }
  const current = state;
  const entry: InertEntry = { target, within, keep };
  current.targets.push(entry);
  current.update();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    current.targets.splice(current.targets.lastIndexOf(entry), 1);
    current.update();
    if (!current.targets.length) {
      current.observer.disconnect();
      documents.delete(doc);
    }
  };
}
