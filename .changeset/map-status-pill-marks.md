---
"@kozmos-ds/icons": minor
"@kozmos-ds/react": patch
---

The map status pill's marks (decision 39). `@kozmos-ds/icons` gains `Walking`, the walking figure the SDK's position status draws beside "Walking improves accuracy", taken from Pointr's Figma: the icon library has none. It is a solid mark squared on the icon grid, 20 of 24 tall, in `currentColor`. `bluetooth-off`, the pill's No Bluetooth, joins the icon name list, so `getIconComponent("bluetooth-off")` and `<Icon name="bluetooth-off" />` reach Pointr's outline. This react needs this icons for both.

```tsx
import { MapStatusPill } from "@kozmos-ds/react";
import { BluetoothOff, Walking } from "@kozmos-ds/icons";

<MapStatusPill tone="progress" icon={<Walking />}>
  Walking improves accuracy
</MapStatusPill>;
<MapStatusPill tone="danger" icon={<BluetoothOff />}>
  No Bluetooth
</MapStatusPill>;
```

Turn Back's U-turn arrow and Wayfinding Unavailable's mark are not in either Figma file Kozmos reads for the SDK, so those states still draw no mark.
