package com.kozmos.components.alert

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React's alert colours its icon, title and description by its variant: they
 * inherit the root's `text-destructive-text` and the like. Figma binds all
 * three to the variant's foreground (`alertConfig` in the Core Library's
 * importer), and Compose's own Code Connect passes it to each. Compose's
 * status reached none of them: the icon drew the default's info glyph in
 * foreground/0 unless given the status again, the title foreground/100 and
 * the description foreground/500. Each now takes the alert's status, and a
 * status or colour given to it still wins.
 *
 * Each part is drawn alone in its alert, light, and read where its ink is
 * darkest, clear of the alert's edge: on the plain surface that is the
 * colour the part is drawn in.
 */
class KozmosAlertStatusTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    /** The darkest opaque colour the [part] draws inside an alert of [status]. */
    private fun ink(status: AlertStatus, part: @Composable () -> Unit): Int {
        var alert = Rect.Zero
        var rootWidth = 0f
        val drawn = paparazzi.drawn(frames) {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color.White).onGloballyPositioned { rootWidth = it.size.width.toFloat() }) {
                        KozmosAlert(
                            status = status,
                            modifier = Modifier.padding(20.dp).width(320.dp).onGloballyPositioned { alert = it.boundsInRoot() }
                        ) { Box(Modifier.fillMaxWidth()) { part() } }
                    }
                }
            }
        }
        val scale = drawn.width / rootWidth
        // Clear of the edge, which is the status's colour too: past the
        // corners at the sides, 4dp in at the top and bottom.
        val density = alert.width / 320f
        val inside = Rect(alert.left + 14 * density, alert.top + 4 * density, alert.right - 14 * density, alert.bottom - 4 * density)
        var darkest = 0
        var lightest = Int.MAX_VALUE
        for (y in (inside.top * scale).toInt() until (inside.bottom * scale).toInt()) {
            for (x in (inside.left * scale).toInt() until (inside.right * scale).toInt()) {
                val argb = drawn.argb(x, y)
                if (argb ushr 24 > 240 && DrawnPixels.lightness(argb) < lightest) {
                    lightest = DrawnPixels.lightness(argb)
                    darkest = argb
                }
            }
        }
        return darkest
    }

    private val statuses = AlertStatus.values().toList()

    @Composable
    private fun colourOf(status: AlertStatus): Color = alertForegroundColor(status)

    @Test fun theIconTitleAndDescriptionTakeTheAlertsStatus() {
        val wrong = mutableListOf<String>()
        for (status in statuses) {
            var expected = 0
            val parts: List<Pair<String, @Composable () -> Unit>> = listOf(
                "icon" to { expected = colourOf(status).toArgb(); KozmosAlertIcon() },
                "title" to { expected = colourOf(status).toArgb(); KozmosAlertTitle(title = "Level 2 is closed") },
                "description" to { expected = colourOf(status).toArgb(); KozmosAlertDescription(description = "Lifts at both ends") }
            )
            for ((name, part) in parts) {
                val drawn = ink(status, part)
                if (!DrawnPixels.matches(drawn, expected, 12)) {
                    wrong += "$status $name: ${DrawnPixels.hex(drawn)}, not ${DrawnPixels.hex(expected)}"
                }
            }
        }
        assertEquals("parts not drawn in their alert's status", emptyList<String>(), wrong)
    }

    /** A status or a colour given to a part still wins over its alert's. */
    @Test fun aPartsOwnStatusOrColourWins() {
        var theme = 0
        var success = 0
        val title = ink(AlertStatus.Error) {
            theme = KozmosThemeTokens.primitivesColorsTheme600.toArgb()
            KozmosAlertTitle(title = "Level 2 is closed", color = KozmosThemeTokens.primitivesColorsTheme600)
        }
        val description = ink(AlertStatus.Error) {
            KozmosAlertDescription(description = "Lifts at both ends", color = KozmosThemeTokens.primitivesColorsTheme600)
        }
        val icon = ink(AlertStatus.Error) { success = colourOf(AlertStatus.Success).toArgb(); KozmosAlertIcon(status = AlertStatus.Success) }
        assertEquals(
            "the title, description and icon given their own",
            listOf(DrawnPixels.hex(theme), DrawnPixels.hex(theme), DrawnPixels.hex(success)),
            listOf(title, description, icon).zip(listOf(theme, theme, success)) { drawn, wanted ->
                if (DrawnPixels.matches(drawn, wanted, 12)) DrawnPixels.hex(wanted) else DrawnPixels.hex(drawn)
            }
        )
    }
}
