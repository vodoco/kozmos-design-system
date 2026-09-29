package com.kozmos.components.mapstatuspill

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.components.icon.KozmosIcon
import com.kozmos.components.icon.KozmosIconSize
import com.kozmos.components.spinner.KozmosSpinner
import com.kozmos.components.spinner.KozmosSpinnerSize
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosShadows
import com.kozmos.tokens.KozmosThemeTokens

/**
 * How a map status reads (decision 39). Mirrors React's `MapStatusPill.tone`.
 *
 * [Neutral] is the words alone, for a status with nothing to mark. [Progress]
 * is the system's arc, turning in the theme's blue — "Calculating Precise
 * Position", "Calculating step-free route"; "Walking improves accuracy" puts a
 * walking figure in its place. [Success] is a check, and the
 * words, in the success colour — "Established". [Danger] is a warning
 * triangle in the danger colour, the words staying ink — "Failed to Calculate
 * Precise Position". [Warning] fills the surface with Emotion/alert/fill, the
 * SDK's bright amber, under its ink, Emotion/alert/onFill — "Turn Back".
 *
 * The product chooses the tone and when the pill shows; Kozmos draws it. The
 * doc sits above the declaration: the variant-parity check reads the body.
 */
enum class KozmosMapStatusPillTone { Neutral, Progress, Success, Danger, Warning }

/**
 * How loudly a change of words is announced. Mirrors React's
 * `MapStatusPill.live`, Alert's and Notice's three values: [Polite], the
 * default and right for every tone, waits for TalkBack to finish what it is
 * saying; [Assertive] interrupts, for a state that cannot wait; [Off] is no
 * live region, for words said somewhere else.
 */
enum class KozmosMapStatusPillLive { Off, Polite, Assertive }

/**
 * What a tone resolves to, before any colour is chosen: kept apart from the
 * composable so the ruling — decision 39's board — can be tested without
 * drawing, as SwiftUI's `KozmosMapStatusPillAppearance` is.
 */
internal data class KozmosMapStatusPillAppearance(
    val surface: Surface,
    val words: Ink,
    val mark: Ink,
    val ownMark: Mark
) {
    enum class Surface { Page, Warning }

    /**
     * [Ink] is the SDK's words, foreground/300; the others are Kozmos's
     * emotion roles for text and glyphs on the page, and [OnWarning] the alert
     * fill's own ink, Emotion/alert/onFill.
     */
    enum class Ink { Ink, Themed, Success, Danger, OnWarning }

    enum class Mark { None, Spinner, Check, Triangle }

    companion object {
        fun of(tone: KozmosMapStatusPillTone): KozmosMapStatusPillAppearance = when (tone) {
            KozmosMapStatusPillTone.Neutral -> KozmosMapStatusPillAppearance(Surface.Page, Ink.Ink, Ink.Ink, Mark.None)
            KozmosMapStatusPillTone.Progress -> KozmosMapStatusPillAppearance(Surface.Page, Ink.Ink, Ink.Themed, Mark.Spinner)
            KozmosMapStatusPillTone.Success -> KozmosMapStatusPillAppearance(Surface.Page, Ink.Success, Ink.Success, Mark.Check)
            KozmosMapStatusPillTone.Danger -> KozmosMapStatusPillAppearance(Surface.Page, Ink.Ink, Ink.Danger, Mark.Triangle)
            KozmosMapStatusPillTone.Warning ->
                KozmosMapStatusPillAppearance(Surface.Warning, Ink.OnWarning, Ink.OnWarning, Mark.Triangle)
        }
    }
}

@Composable
@ReadOnlyComposable
private fun KozmosMapStatusPillAppearance.Ink.color() = when (this) {
    KozmosMapStatusPillAppearance.Ink.Ink -> KozmosThemeTokens.primitivesColorsForeground300
    KozmosMapStatusPillAppearance.Ink.Themed -> KozmosThemeTokens.semanticsEmotionThemedText
    KozmosMapStatusPillAppearance.Ink.Success -> KozmosThemeTokens.semanticsEmotionSuccessText
    KozmosMapStatusPillAppearance.Ink.Danger -> KozmosThemeTokens.semanticsEmotionDangerText
    // Black on the amber in both themes: the named pair's ink.
    KozmosMapStatusPillAppearance.Ink.OnWarning -> KozmosThemeTokens.semanticsEmotionAlertOnfill
}

/**
 * The tone's own mark, or none for a neutral pill: the system's arc for
 * progress, and the icons Kozmos names `check` and `alert-triangle`. Each
 * draws in the content colour the pill provides, the tone's.
 */
internal fun toneIcon(tone: KozmosMapStatusPillTone): (@Composable () -> Unit)? =
    when (KozmosMapStatusPillAppearance.of(tone).ownMark) {
        KozmosMapStatusPillAppearance.Mark.None -> null
        KozmosMapStatusPillAppearance.Mark.Spinner -> {
            { KozmosSpinner(size = KozmosSpinnerSize.Md, color = LocalContentColor.current) }
        }
        KozmosMapStatusPillAppearance.Mark.Check -> {
            { KozmosIcon(name = "check", size = KozmosIconSize.Lg) }
        }
        KozmosMapStatusPillAppearance.Mark.Triangle -> {
            { KozmosIcon(name = "alert-triangle", size = KozmosIconSize.Lg) }
        }
    }

/** A map control's longest, as a labelled `KozmosMapControlButton`'s. */
private val MapStatusPillMaxWidth = 256.dp

/**
 * One status on the map: a compact pill in one of five tones (decision 39).
 *
 * Mirrors React's `MapStatusPill`. The SDK draws three parts for this —
 * PositionStatus, Downloading Content and the Turn Back indicator — and the
 * step-free route being calculated is a fourth (GAP-102); this draws them
 * all. The words, the tone and when it shows are the product's.
 *
 * It wears the map controls' surface (decision 40): the page's own, opaque,
 * the Control corner, no edge in either theme (decision 47) and the map
 * controls' elevation, at least 48 tall, 12 at the sides and 8 above and
 * below, a 24 mark 8 from the words. Compose draws the elevation with
 * Material's light, not the SDK's three layers: see [KozmosShadows]. The words
 * are the type scale's 13 on a 16 line, in foreground/300, and wrap at a map
 * control's longest, 256, rather than being cut.
 *
 * [icon] replaces the tone's own mark — "No Bluetooth" passes
 * `KozmosIcon(name = "bluetooth-off")`, and "Walking improves accuracy"
 * Material's `DirectionsWalk` — drawn at 24 in the tone's colour and never
 * announced: the words say it. `null` draws no mark.
 *
 * It is a live region: TalkBack says its words when they change, politely
 * unless [live] says otherwise, and the turning arc says no "Loading" of its
 * own. With no words it draws nothing and keeps its region, so a product that
 * keeps it composed where it shows has its first words announced too.
 */
@Composable
fun KozmosMapStatusPill(
    text: String,
    modifier: Modifier = Modifier,
    tone: KozmosMapStatusPillTone = KozmosMapStatusPillTone.Neutral,
    icon: (@Composable () -> Unit)? = toneIcon(tone),
    live: KozmosMapStatusPillLive = KozmosMapStatusPillLive.Polite
) {
    val appearance = KozmosMapStatusPillAppearance.of(tone)
    Box(
        modifier.semantics(mergeDescendants = true) {
            when (live) {
                KozmosMapStatusPillLive.Polite -> liveRegion = LiveRegionMode.Polite
                KozmosMapStatusPillLive.Assertive -> liveRegion = LiveRegionMode.Assertive
                KozmosMapStatusPillLive.Off -> Unit
            }
        }
    ) {
        if (text.isNotEmpty()) {
            val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
            // The page's own surface, as the map controls'; Turn Back's is the
            // named pair's fill, the SDK's bright amber in both themes.
            val surface = if (appearance.surface == KozmosMapStatusPillAppearance.Surface.Warning) {
                KozmosThemeTokens.semanticsEmotionAlertFill
            } else {
                KozmosThemeTokens.primitivesColorsBackground0
            }
            Row(
                modifier = Modifier
                    .widthIn(max = MapStatusPillMaxWidth)
                    .heightIn(min = KozmosDimensions.primitivesLayoutSizing600)
                    // No edge, and the map controls' one lift.
                    .shadow(KozmosShadows.semanticsElevationMapControl, shape)
                    .background(surface, shape)
                    .padding(
                        horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                        vertical = KozmosDimensions.primitivesLayoutSpacing100
                    ),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
            ) {
                if (icon != null) {
                    CompositionLocalProvider(LocalContentColor provides appearance.mark.color()) {
                        // Cleared from semantics: the words say it, and the
                        // arc would say "Loading" over them.
                        Box(
                            Modifier
                                .size(KozmosDimensions.primitivesLayoutSizing300)
                                .clearAndSetSemantics {},
                            contentAlignment = Alignment.Center
                        ) { icon() }
                    }
                }
                // The SDK's 13 on its 16: set as CSS sets a line, the leading
                // split evenly above and below, as the rail's labels are.
                Text(
                    text = text,
                    color = appearance.words.color(),
                    fontSize = 13.sp,
                    lineHeight = 16.sp,
                    style = MaterialTheme.typography.bodySmall.copy(
                        platformStyle = PlatformTextStyle(includeFontPadding = false),
                        lineHeightStyle = LineHeightStyle(
                            alignment = LineHeightStyle.Alignment.Center,
                            trim = LineHeightStyle.Trim.None
                        )
                    )
                )
            }
        }
    }
}
