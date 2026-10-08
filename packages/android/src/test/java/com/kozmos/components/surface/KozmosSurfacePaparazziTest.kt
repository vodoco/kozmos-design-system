package com.kozmos.components.surface

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosColors
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosEffects
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/** The surface styles over pure red: solid covers it; glass tints it at the token's opacity. */
class KozmosSurfacePaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    @Test
    fun theGlassRoleReadsTheToken() {
        assertEquals(0.7f, KozmosEffects.semanticsEffectGlass.opacity, 0.001f)
        assertEquals(20f, KozmosEffects.semanticsEffectGlass.blur, 0f)
        assertEquals(0.2f, KozmosEffects.semanticsEffectGlass.borderOpacity, 0.001f)
        // A Compose colour keeps eight bits of alpha: 0.7 comes back as 179/255.
        // The fill is the theme's background, read in composition; the rule
        // that makes it is this overload's, whatever the background.
        val background = KozmosColors.primitivesColorsBackground0
        assertEquals(KozmosEffects.semanticsEffectGlass.opacity, KozmosSurfaceDefaults.tint(KozmosSurfaceStyle.Glass, background).alpha, 0.005f)
        assertEquals(1f, KozmosSurfaceDefaults.tint(KozmosSurfaceStyle.Solid, background).alpha, 0f)
    }

    @Test
    fun solidCoversAndGlassTintsWhatIsBehindThem() {
        paparazzi.snapshot {
            KozmosMaterialTheme {
                Box(modifier = Modifier.width(360.dp).height(280.dp).background(Color.Red), contentAlignment = Alignment.Center) {
                    Column(verticalArrangement = Arrangement.spacedBy(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(modifier = Modifier.size(width = 240.dp, height = 80.dp).kozmosSurface(RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer)))
                        Box(modifier = Modifier.size(width = 240.dp, height = 80.dp).kozmosSurface(RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer), KozmosSurfaceStyle.Glass))
                    }
                }
            }
        }
    }
}
