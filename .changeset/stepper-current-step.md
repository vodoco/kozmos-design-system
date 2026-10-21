---
"@kozmos-ds/react": patch
---

Stepper marks its current step `aria-current="step"`, so a screen reader hears which step the visitor is on; it set none, and the steps were heard in order with nothing of the progress. No other step carries it, and once `currentStep` is past the last step none does. The look, the props and the markup are otherwise unchanged.
