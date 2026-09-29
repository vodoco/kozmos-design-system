---
"@kozmos-ds/tokens": minor
---

A loud fill for the alert emotion and its ink, `Semantics.Emotion.alert.fill` and `Semantics.Emotion.alert.onFill` (`--semantics-emotion-alert-fill` and `--semantics-emotion-alert-on-fill`, `semanticsEmotionAlertFill` and `semanticsEmotionAlertOnfill` on iOS and Android). The map status pill's Turn Back reads them: the SDK's bright amber under black words.

The fill is `alert/600` in both themes (#F9A707 light, #FBC459 dark), a mid step of the ramp that stays bright, so it is not a surface that turns over with the theme. Its ink is black in both themes: `foreground/0` in the light file and `foreground/1000` in the dark, because no one primitive is dark in both. The pair reads at 10.56:1 in the light and 13.14:1 in the dark, and the contrast contract holds it at 4.5:1 or more.

Next to `surface` and `onSurface` (the quiet field a label sits on) and `text` (the emotion on the page), `fill` and `onFill` are the loud pair. They take the shape of the taxonomy's `Semantics.Category.Fill` and `OnFill`.
