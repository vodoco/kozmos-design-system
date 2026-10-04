---
"@kozmos-ds/react": minor
---

Add host-confirmed ArrivalPanel with optional actual journey metrics, localized labels, destination media and a full-width Done action. Extend navigation RouteSummary with hosted presentation, optional estimates and destination media, preserving its estimate layout. Left unset, its presentation is hosted in AdaptiveMapShell's panel (decision 43) and stays standalone anywhere else; pass `presentation="standalone"` to keep its card in the shell. Hosts continue to own routing, arrival confirmation, announcements and dismissal.
