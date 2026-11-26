---
"@kozmos-ds/react": patch
---

FieldWrapper's, Input's, Textarea's, PasswordInput's, NumberInput's and OTPInput's classes and framework-free helpers move into the package's shared `recipes` module (`fieldMessageClass` and the field's classes, `resolveCharacterCount`, `inputVariants` and the field-end action's classes, `textareaVariants`, the password reveal's classes, NumberInput's steppers, unit and stepping, OTPInput's cells and its digit reading), which `@kozmos-ds/vue` builds its own FieldWrapper, Input, Textarea, PasswordInput, NumberInput and OTPInput from, so the two draw the same element (wave V2). Nothing changes for a product: every export is as before, `dist/index.d.ts`, `index.d.mts`, `index.d.cts` and `style.css` are byte-identical to main's, and the parts' tests pass unchanged. The published files gain `dist/esm/recipes/character-count.mjs`, `field.mjs`, `input.mjs`, `number-input.mjs`, `otp-input.mjs`, `password-input.mjs` and `textarea.mjs`.
