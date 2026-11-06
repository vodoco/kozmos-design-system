---
"@kozmos-ds/react": patch
---

A controlled OTPInput shows its value from its first render, on the server too, and shows each new `value` in the render it arrives with. Until now its cells started empty and took `value` only after the first commit, in an effect: `renderToString(<OTPInput value="12" />)` drew six empty cells, the browser's first frame did too, and a digit typed before the effect ran replaced the code (typing "3" into the third cell of `value="12"` called `onChange("3")`, not `onChange("123")`), while a code pasted then could be drawn over by the value's old digits. Every later change of `value` or `length` also drew the old cells for one render.

An uncontrolled OTPInput, with no `value`, keeps its own digits as before, and a new `length` keeps the digits typed so far. Digits are still sanitized as before, a digit typed into a later cell keeps its place when the code it makes comes back as `value`, and a `value` that does not change after a keystroke still leaves the typed digit drawn. No prop changes.

OTPInput now also reports a completed code to analytics, which it never did: an `AnalyticsProvider` receives `otp_code_completed` (component `OTPInput`, properties `{ length }`) once each time typing or a paste fills the last empty cell, and not again while the full code is edited, nor for a `value` set by the parent.
