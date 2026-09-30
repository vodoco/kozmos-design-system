package com.kozmos.components.mapattribution

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import org.junit.Rule
import org.junit.Test

class KozmosMapAttributionPaparazziTest {
    @get:Rule val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    @Test fun mapAndSurfaceRendering() {
        val credits = listOf(
            KozmosMapAttributionCredit("owner", "© Example indoor data"),
            KozmosMapAttributionCredit("outdoor", "Outdoor contributors", "https://example.com")
        )
        paparazzi.snapshot {
            MaterialTheme {
                Column {
                    for (background in listOf(Color.White, Color.Gray, Color.Black)) {
                        KozmosMapAttribution(credits, modifier = Modifier.fillMaxWidth().background(background))
                    }
                    KozmosMapAttribution(credits, appearance = KozmosMapAttributionAppearance.Surface)
                    CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, 2f)) {
                        KozmosMapAttribution(credits, modifier = Modifier.width(200.dp).background(Color.Gray), showBrand = false)
                    }
                }
            }
        }
    }
}
