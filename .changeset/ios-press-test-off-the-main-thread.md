---
---

The iOS interaction host's press-feedback fixture reads the screen only while a finger is down, and renders the window once for all its parts rather than once for each, so XCUI's queries no longer wait behind it on a loaded runner. Only `packages/ios/UITestHost`, a test app that is not published, changes: no package ships anything new.
