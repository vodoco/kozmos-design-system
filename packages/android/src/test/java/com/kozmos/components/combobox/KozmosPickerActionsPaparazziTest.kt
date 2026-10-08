package com.kozmos.components.combobox

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.listbox.KozmosPickerAction
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/** Review commands inside the Core popup, including empty results and large RTL text. */
class KozmosPickerActionsPaparazziTest {
    @get:Rule val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    @Test fun commandsWithNoMatchingLocations() = draw(false)
    @Test fun commandsInDarkRtlWithLargeText() = draw(true)

    private fun draw(largeDarkRtl: Boolean) {
        paparazzi.snapshot {
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides largeDarkRtl,
                LocalLayoutDirection provides if (largeDarkRtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalDensity provides Density(LocalDensity.current.density, if (largeDarkRtl) 2f else 1f)
            ) {
                KozmosMaterialTheme(typography = KozmosTypography.typography()) {
                    Box(Modifier.width(352.dp).background(KozmosThemeTokens.primitivesColorsBackground0).padding(16.dp)) {
                        KozmosCombobox("", { _, _ -> }, "", {}, emptyList(),
                            KozmosComboboxLabels(), true, listOf(
                                KozmosPickerAction("position", "Current position") {},
                                KozmosPickerAction("map", "Select from the map") {}
                            ), label = "From", placeholder = "Search places", expanded = true)
                    }
                }
            }
        }
    }
}
