---
"@kozmos-ds/react": patch
---

The opt-in host reset, `@kozmos-ds/react/reset.css`, sets the page's font. It was Tailwind's preflight copied as written, with eight `theme('…')` calls that only Tailwind resolves, so browsers dropped those declarations and a page with the reset kept the browser's serif. Each now takes the default it names: the system sans stack on `html`, the system monospace stack for code, `currentColor` borders and `#9ca3af` placeholders.
