package com.kozmos.tokens

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/**
 * One place that decides what the design system renders text in.
 *
 * Nothing here set a font family before, so every component inherited whatever
 * Material handed it - Roboto on most devices. That was the right answer by
 * accident rather than by decision, and the same decision was being made three
 * times over: web asked for `"Readex Pro", sans-serif` and, because nothing has
 * ever loaded Readex Pro, rendered generic sans-serif; iOS rendered SF Pro;
 * this package rendered Roboto. Three platforms, three fonts, nothing recording
 * the choice.
 *
 * System-first is now deliberate. [family] is the platform's own UI font, so
 * this changes nothing today - which is the point. It gives the decision an
 * address.
 *
 * To render a brand font instead, this is the only file that changes:
 *
 * ```kotlin
 * val family: FontFamily = FontFamily(Font(R.font.readex_pro))
 * ```
 *
 * A brand font also needs its metrics measured against the system font, or the
 * same sp value renders visibly different: run
 * `node scripts/measure-font-metrics.mjs <brand> <fallback>` and apply the scale
 * it reports. Guessing that ratio is how text ends up subtly wrong on every
 * screen at once.
 */
object KozmosTypography {
    /** The platform's own UI font. */
    val family: FontFamily = FontFamily.Default

    /** Code, coordinates, IDs - anything that should align in columns. */
    val mono: FontFamily = FontFamily.Monospace

    /**
     * Material's type scale carrying [family].
     *
     * Applying it at the theme covers both ways components ask for type: the
     * ones reading `MaterialTheme.typography` directly, and the ones that set
     * only a size and inherit the rest from the ambient text style.
     */
    /**
     * The one display size (decision 203, GAP-272): 48sp bold on 54sp lines,
     * with no added tracking, from the display type tokens, for a
     * marketing-style headline such as a sign-in hero. In sp, so it grows
     * with the reader's font size. `KozmosText(style = KozmosTextStyle.Display)`
     * and `KozmosHeading(size = KozmosHeadingSize.Display)` draw it.
     */
    val display: TextStyle = TextStyle(
        fontFamily = family,
        fontWeight = FontWeight.Bold,
        fontSize = KozmosDimensions.semanticsTypographyDisplaySize.value.sp,
        lineHeight = KozmosDimensions.semanticsTypographyDisplayLineheight.value.sp,
        letterSpacing = KozmosDimensions.semanticsTypographyDisplayLetterspacing.value.sp
    )

    fun typography(base: Typography = Typography()): Typography = Typography(
        displayLarge = base.displayLarge.copy(fontFamily = family),
        displayMedium = base.displayMedium.copy(fontFamily = family),
        displaySmall = base.displaySmall.copy(fontFamily = family),
        headlineLarge = base.headlineLarge.copy(fontFamily = family),
        headlineMedium = base.headlineMedium.copy(fontFamily = family),
        headlineSmall = base.headlineSmall.copy(fontFamily = family),
        titleLarge = base.titleLarge.copy(fontFamily = family),
        titleMedium = base.titleMedium.copy(fontFamily = family),
        titleSmall = base.titleSmall.copy(fontFamily = family),
        bodyLarge = base.bodyLarge.copy(fontFamily = family),
        bodyMedium = base.bodyMedium.copy(fontFamily = family),
        bodySmall = base.bodySmall.copy(fontFamily = family),
        labelLarge = base.labelLarge.copy(fontFamily = family),
        labelMedium = base.labelMedium.copy(fontFamily = family),
        labelSmall = base.labelSmall.copy(fontFamily = family),
    )
}
