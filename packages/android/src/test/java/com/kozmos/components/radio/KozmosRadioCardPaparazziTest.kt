package com.kozmos.components.radio

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Map
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.components.checkbox.KozmosCheckbox
import com.kozmos.components.switch.KozmosSwitch
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * GAP-158 and GAP-162 drawn: two radio cards, the second chosen (its edge
 * theme 600 and 2dp, its dot); three tiles filling a row, the middle one
 * chosen (its check badge), the last in error; a checkbox with a description
 * and a switch with a description and its state in words. In each theme, and
 * right to left at twice the text size, where the badge and the words mirror.
 */
class KozmosRadioCardPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(
        maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE,
        // Tall enough for the right-to-left frame at twice the text size,
        // which ran off a phone's height and cut the switch's description.
        deviceConfig = DeviceConfig.PIXEL_5.copy(screenHeight = 3000)
    )

    @Test
    fun cardsTilesAndDescriptionsInLightMode() = snapshotIn(dark = false) { Everything() }

    @Test
    fun cardsTilesAndDescriptionsInDarkMode() = snapshotIn(dark = true) { Everything() }

    @Test
    fun cardsTilesAndDescriptionsRightToLeftAtTwiceTheTextSize() =
        snapshotIn(dark = false, rtl = true, fontScale = 2f) { Everything() }

    @Composable
    private fun Everything() {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            KozmosRadioGroup {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    KozmosRadioGroupItem(
                        value = "vector",
                        selectedValue = "satellite",
                        onOptionSelected = {},
                        label = "Vector",
                        description = "Drawn from the building's plans",
                        variant = KozmosRadioGroupItemVariant.Card,
                        media = { Icon(Icons.Default.Map, contentDescription = null) },
                        modifier = Modifier.weight(1f)
                    )
                    KozmosRadioGroupItem(
                        value = "satellite",
                        selectedValue = "satellite",
                        onOptionSelected = {},
                        label = "Satellite",
                        description = "Aerial imagery under the plans",
                        variant = KozmosRadioGroupItemVariant.Card,
                        media = { Icon(Icons.Default.Layers, contentDescription = null) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            KozmosRadioGroup {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    for ((value, error) in listOf("Fade" to false, "Slide" to false, "Zoom" to true)) {
                        KozmosRadioGroupItem(
                            value = value,
                            selectedValue = "Slide",
                            onOptionSelected = {},
                            label = value,
                            error = error,
                            variant = KozmosRadioGroupItemVariant.Tile,
                            media = { Icon(Icons.Default.Map, contentDescription = null) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
            KozmosCheckbox(
                checked = true,
                onCheckedChange = {},
                label = "Route updates",
                description = "Tell me when a faster route opens"
            )
            KozmosSwitch(
                checked = true,
                onCheckedChange = {},
                label = "Gate alerts",
                description = "Sends a push when your gate changes",
                showStateLabel = true
            )
        }
    }

    private fun snapshotIn(
        dark: Boolean,
        rtl: Boolean = false,
        fontScale: Float = 1f,
        content: @Composable () -> Unit
    ) {
        paparazzi.snapshot {
            val device = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalDensity provides Density(device.density, fontScale)
            ) {
                KozmosMaterialTheme {
                    Column(
                        modifier = Modifier
                            .width(380.dp)
                            .background(KozmosThemeTokens.semanticsSurface0)
                            .padding(16.dp)
                    ) {
                        content()
                    }
                }
            }
        }
    }
}
