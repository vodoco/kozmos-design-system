---
"@kozmos-ds/react": patch
---

FileUpload empties its file input once it has read a pick, so choosing the same file again (after the host removed it, for one) calls `onFilesChange` and `onFileSelect` again; a browser fires no `change` for an unchanged selection.
