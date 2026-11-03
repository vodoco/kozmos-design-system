package com.kozmos.components.progress

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.components.KozmosEmotion
import com.kozmos.components.motion.LocalKozmosAnimatorScale
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * Decision 131 (GAP-038): Progress's ring, drawn. The three sizes at a
 * quarter, half and three quarters; the six tones, Tag's emotions, each its
 * emotion's text colour (themed, theme 600, the bar's fill); and MAP-64's
 * Level Manager, 11 of 15 at the large size with its label beside the ring,
 * on the page surface in each theme, on background 100. Paparazzi's window
 * is dark, so the page is drawn under them.
 */
class KozmosProgressRingPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    @Test
    fun theRingsInLightMode() = snapshotIn(dark = false)

    @Test
    fun theRingsInDarkMode() = snapshotIn(dark = true)

    private fun snapshotIn(dark: Boolean) {
        paparazzi.snapshot {
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalKozmosAnimatorScale provides 0f
            ) {
                KozmosMaterialTheme {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier
                            .background(KozmosThemeTokens.semanticsSurface0)
                            .padding(16.dp)
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            KozmosProgress(0.25f, shape = KozmosProgressShape.Circular, size = KozmosProgressSize.Sm)
                            KozmosProgress(0.5f, shape = KozmosProgressShape.Circular) { Text("50%") }
                            KozmosProgress(0.75f, shape = KozmosProgressShape.Circular, size = KozmosProgressSize.Lg) {
                                Text("75%")
                            }
                        }
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            for (tone in KozmosEmotion.values()) {
                                KozmosProgress(
                                    0.75f,
                                    shape = KozmosProgressShape.Circular,
                                    size = KozmosProgressSize.Sm,
                                    tone = tone
                                )
                            }
                        }
                        KozmosProgress(
                            11f / 15f,
                            shape = KozmosProgressShape.Circular,
                            size = KozmosProgressSize.Lg,
                            labelPlacement = KozmosProgressLabelPlacement.End
                        ) {
                            Column {
                                Text("11 Levels", fontSize = 20.sp, fontWeight = FontWeight.Bold)
                                Text(
                                    "Added in total",
                                    fontSize = 12.sp,
                                    color = KozmosThemeTokens.primitivesColorsForeground400
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
