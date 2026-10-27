---
"@kozmos-ds/react": patch
---

Calendar renders on the server without a warning under React 18. 0.13.0's Calendar called `React.useLayoutEffect`, so each server render of it under React 18 printed "useLayoutEffect does nothing on the server"; it now takes the layout effect only in a browser, as every other Kozmos part does. What it draws and how it moves focus are unchanged.
