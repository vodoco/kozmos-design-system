---
"@kozmos-ds/react": patch
---

Compose SearchBar's clear action from Core IconButton. Disabled and read-only
fields now also disable clearing, so the action cannot mutate a locked value.
The clear label, 44px target, decorative circle, non-submit behavior and domain
callbacks are retained. Enabled clearing also emits Core's normal Button event.

Clearing returns focus to the input before host callbacks run and preserves
forwarded refs. Host keyboard handlers compose with search initiation; prevented
or IME-composing Enter events do not initiate search analytics.
