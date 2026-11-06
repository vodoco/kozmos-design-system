/**
 * Where a Vue part says something differently from its React part on
 * purpose, by the finding's id (`KozmosButton.size:type`), with the reason.
 * An exception that no longer matches a finding fails the contract, so the
 * list never outlives what it excuses. Empty while the ports say everything
 * React's say.
 */
export const EXCEPTIONS: Record<string, string> = {};
