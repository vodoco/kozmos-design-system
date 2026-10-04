---
"@kozmos-ds/react": patch
---

Compose POI result actions, category clear/count, assistant close/send and wayfinding
inputs from Core Button, IconButton, Counter and Input. Preserve domain callbacks
and explicit form behavior while using shared focus, disabled and theme treatments.
Core Button analytics accompany the existing domain events. Custom selection,
voice/input and native counterparts remain tracked migration work.
The category group names its count once; its visual Counter is decorative rather
than carrying an unsupported accessible label on a generic span.

Allow translated POI action labels to wrap within their card at enlarged text
sizes. Keep a Combobox's keyboard-highlighted choice by identity across host
rerenders, and respect composition/caller-handled Escape when dismissing its popup.

Native source mirrors also reuse Core for Swift saved-location Save/Remove and
Guide actions and legacy route End, and Compose saved-location Remove. Preserve
domain callbacks and telemetry while inheriting the Core target sizes and styles.
Compose Guide now uses Core success styling and the canonical navigation pointer.
Native neutral note-edit icon actions remain tracked work, not completed migration.
