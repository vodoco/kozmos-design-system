---
"@kozmos-ds/react": patch
---

ManoeuvreCard's drag indicator sits 4px above the card's bottom edge, at the foot of its 44px target, which still grows upwards (decision 74, GAP-140). It sat about 23 above the edge. On the theme fill it is the guidance foreground at 62%, quieter than the instruction and still 3.09:1 on `#135BEC`; the background card's grey bar is unchanged.
