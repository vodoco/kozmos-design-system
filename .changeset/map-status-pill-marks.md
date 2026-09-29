---
"@kozmos-ds/icons": minor
"@kozmos-ds/react": patch
---

`@kozmos-ds/icons` gains `Walking`, the walking figure the SDK's position status draws beside "Walking improves accuracy", sourced from Pointr's Figma. It is a solid mark squared on the icon grid, 20 of 24 tall, in `currentColor`. `bluetooth-off`, the pill's No Bluetooth mark, joins the icon name list, so `getIconComponent("bluetooth-off")` and `<Icon name="bluetooth-off" />` reach Pointr's outline. React 0.6.0 requires icons 0.5.0; they are released together.

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

Dedicated Turn Back and Wayfinding Unavailable marks are not included. Their examples explicitly pass `icon={null}` to omit a mark. A `warning` or `danger` pill without an `icon` prop still draws its default warning triangle; pass `icon={null}` when no fallback mark is appropriate.
