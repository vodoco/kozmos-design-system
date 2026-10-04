---
"@kozmos-ds/react": patch
---

**MapAttribution links no credit that carries credentials, whitespace or control characters.**
A credit's destination now passes the same rule as MapInfoPanel's links, shared by both and
matched on iOS and Android: an absolute HTTP(S) URL with a host, with no user name or password
(`https://maps.example@evil.example` reads as one host and goes to another) and no whitespace or
control characters. Such a credit used to be a live link; it now shows as plain text, as any
other unsafe destination does. Credits with ordinary HTTP(S) links are unchanged.
