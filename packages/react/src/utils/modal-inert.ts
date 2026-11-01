type InertEntry = {
  target: HTMLElement;
  /** The box the target covers; the document's body for a document-modal. */
  within?: Element;
  /** Boxes in it that stay in reach too, as a selector. */
  keep?: string;
  /** Keep in reach only what aria-hidden's `hideOthers` keeps visible. */
  mirrorAriaHidden?: boolean;
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

/** What aria-hidden's `hideOthers` leaves visible as it hides the rest of the
 * page (aria-hidden 1.2.6), which Radix's Select, Dialog and Menu call as they
 * open: boxes marked `aria-live`, and scripts. Nothing by role. */
const ARIA_HIDDEN_KEEPS = "[aria-live], script";

/** Make the background of a document-modal popup non-interactive. The newest
 * connected popup wins; release restores the preceding popup and host attributes.
 * Native inert complements, rather than replaces, the primitive's focus trap.
 *
 * With `within`, only that box's content is made inert, apart from the target:
 * a surface laid over one frame of the page, as AICompanionPanel is over the
 * frame it covers, leaves the rest of the page alone. Such surfaces in
 * different frames hold at once; a document-modal popup opened after them
 * takes the whole page until it is released. `keep` names boxes in it that
 * stay in reach as well, such as the portals a surface's own popups open in.
 *
 * `mirrorAriaHidden` is for a primitive that also hides the rest of the page
 * from assistive technology with aria-hidden's `hideOthers`, as Radix's Select
 * does: what stays in reach is then exactly what that leaves visible — boxes
 * marked `aria-live` that it found, not those named by a role alone, and not
 * one that arrives later inside a box it hid. A box hidden but in reach is
 * focusable while a screen reader is told it is not there (axe
 * `aria-hidden-focus`); one shown but inert is silenced (GAP-193). */
export function inertOutside(
  target: HTMLElement,
  {
    within,
    keep,
    mirrorAriaHidden = false,
  }: { within?: Element; keep?: string; mirrorAriaHidden?: boolean } = {},
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
        // ARIA visibility primitive keeps them, and, unless the popup hides
        // the page with that primitive too, those whose role alone makes them
        // live. Kozmos's own live parts say both (GAP-193). Never make a
        // container inert if it contains an active popup.
        const live = entry.mirrorAriaHidden
          ? [...scope.querySelectorAll(ARIA_HIDDEN_KEEPS)].filter(
              // hideOthers keeps what it found as it opened; one inside a box
              // it hid, or that was hidden already, is hidden with it.
              (node) => !node.closest('[aria-hidden="true"]'),
            )
          : [...scope.querySelectorAll(LIVE)];
        const reachable = [
          ...active,
          ...live,
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
  const entry: InertEntry = { target, within, keep, mirrorAriaHidden };
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
