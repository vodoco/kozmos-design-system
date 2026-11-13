---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

ImageField, a Dashboard module from `@kozmos-ds/react/dashboard` (CLOUD-UI-004's image part): up to `max` images, added by upload (the picker limited to `accept`, every pick and drop checked again, with `maxSize`) or by URL, each a thumbnail with editable alt text, Preview in a full-screen Dialog, Remove, and with `aspectRatio` a keyboard- and pointer-operable cropper that hands back the frame as fractions of the image. It never uploads: `onChange` gives the product the File, the URL and the crop. Its rules are in `dashboard.css`.
