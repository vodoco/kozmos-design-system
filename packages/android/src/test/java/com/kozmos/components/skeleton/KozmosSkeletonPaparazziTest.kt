package com.kozmos.components.skeleton

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * Row 56 (GAP-057): a loading row built from the three shapes alone — an
 * avatar's circle, two lines of text, a card's block — with no modifier doing
 * a shape's work, on the page surface in each theme. The line ends are round
 * and the block's corners the Control radius, as React and the Figma set draw
 * them. Last, the unset placeholder beside a stadium, which is a circle given a
 * height of its own: the unset one keeps the look it always had.
 */
class KozmosSkeletonPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    @Test
    fun theShapesInLightMode() = snapshotIn(dark = false)

    @Test
    fun theShapesInDarkMode() = snapshotIn(dark = true)

    private fun snapshotIn(dark: Boolean) {
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                KozmosMaterialTheme {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier
                            .width(320.dp)
                            .background(KozmosThemeTokens.semanticsSurface0)
                            .padding(16.dp)
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            KozmosSkeleton(shape = KozmosSkeletonShape.Circle)
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                KozmosSkeleton(shape = KozmosSkeletonShape.Line)
                                KozmosSkeleton(modifier = Modifier.fillMaxWidth(0.6f), shape = KozmosSkeletonShape.Line)
                            }
                        }
                        KozmosSkeleton(shape = KozmosSkeletonShape.Block, height = 80.dp)
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            KozmosSkeleton(shape = KozmosSkeletonShape.Circle, width = 64.dp)
                            KozmosSkeleton(shape = KozmosSkeletonShape.Circle, width = 40.dp, height = 64.dp)
                            KozmosSkeleton(modifier = Modifier.width(96.dp).height(24.dp))
                        }
                    }
                }
            }
        }
    }
}
