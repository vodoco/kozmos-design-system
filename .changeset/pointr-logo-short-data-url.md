---
"@kozmos-ds/react": patch
---

MapAttribution's Pointr logo ships as a shorter data URL: the artwork's own bytes, with only the characters a URL can't carry raw percent-encoded (spaces, `=`, `/`, `:` and `,` stay as they are). It decodes to the official artwork exactly, draws pixel for pixel as before in Chromium, Firefox and WebKit, and costs the bundle 0.2 KB less gzipped.
