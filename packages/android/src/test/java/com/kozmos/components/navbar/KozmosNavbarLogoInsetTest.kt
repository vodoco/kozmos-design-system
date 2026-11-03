package com.kozmos.components.navbar

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.sidebar.KozmosSidebar
import com.kozmos.components.sidebar.KozmosSidebarVariant
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosTypography
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * GAP-208, decisions 147 and 150: `logoInset` sets the logo in a column as wide
 * as KozmosSidebar's rail, from the bar's edge. Over a rail at the screen's
 * start, the logo sits over the rail's items, and what follows starts 16 past
 * the rail, so a 424 block would end where a 440 panel beside the rail does.
 * Read from the laid-out bounds, in dp, so nothing here is a golden. Paparazzi's
 * screen is 360 wide: the block is 120, and ends at 232.
 */
class KozmosNavbarLogoInsetTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private class Laid(val logo: Rect, val site: Rect, val bar: Rect)

    @Composable
    private fun Stage(direction: LayoutDirection, content: @Composable () -> Unit) {
        CompositionLocalProvider(
            LocalLayoutDirection provides direction,
            LocalKozmosUseDarkTokens provides false
        ) {
            KozmosMaterialTheme(typography = KozmosTypography.typography()) {
                // Paparazzi hands its content the whole screen; the outer Box
                // lets the part be as wide as it says.
                Box(Modifier.fillMaxSize()) { content() }
            }
        }
    }

    private fun laidOut(logoInset: Boolean, direction: LayoutDirection = LayoutDirection.Ltr): Laid {
        var logo = Rect.Zero
        var site = Rect.Zero
        var bar = Rect.Zero
        var px = 1f
        paparazzi.snapshot {
            px = LocalDensity.current.density
            Stage(direction) {
                KozmosNavbar(
                    modifier = Modifier.onGloballyPositioned { bar = it.boundsInRoot() },
                    logoInset = logoInset,
                    logo = { Box(Modifier.size(24.dp).onGloballyPositioned { logo = it.boundsInRoot() }) },
                    context = { Box(Modifier.size(120.dp, 24.dp).onGloballyPositioned { site = it.boundsInRoot() }) }
                )
            }
        }
        return Laid(logo.scale(px), site.scale(px), bar.scale(px))
    }

    private fun Rect.scale(px: Float) = Rect(left / px, top / px, right / px, bottom / px)

    /** The rail's own width and its item's centre, from the rail's start. */
    private fun rail(): Pair<Float, Float> {
        var rail = Rect.Zero
        var item = Rect.Zero
        var px = 1f
        paparazzi.snapshot {
            px = LocalDensity.current.density
            Stage(LayoutDirection.Ltr) {
                KozmosSidebar(
                    modifier = Modifier.onGloballyPositioned { rail = it.boundsInRoot() },
                    variant = KozmosSidebarVariant.Rail,
                    navigation = { Box(Modifier.size(24.dp).onGloballyPositioned { item = it.boundsInRoot() }) }
                )
            }
        }
        return (rail.width / px) to ((item.center.x - rail.left) / px)
    }

    @Test
    fun theLogoIsCentredInAColumnFromTheBarsEdgeAndWhatFollowsStartsPastIt() {
        val laid = laidOut(logoInset = true)
        assertEquals("the logo's centre", 48f, laid.logo.center.x, 0.5f)
        assertEquals("what follows starts 16 past the column", 112f, laid.site.left, 0.5f)
        assertEquals("and runs on from there", 232f, laid.site.right, 0.5f)
    }

    @Test
    fun theColumnIsTheRail() {
        val (railWidth, itemCentre) = rail()
        val laid = laidOut(logoInset = true)
        assertEquals("the column, from the block's start less its 16 gap", railWidth, laid.site.left - 16f, 0.5f)
        // The rail's edge is inside its 96, so its items centre on 47.5.
        assertEquals("the logo over the rail's item", itemCentre, laid.logo.center.x, 1f)
    }

    @Test
    fun rightToLeftTheColumnMirrors() {
        val laid = laidOut(logoInset = true, direction = LayoutDirection.Rtl)
        assertEquals("the logo's centre, from the bar's right", 48f, laid.bar.right - laid.logo.center.x, 0.5f)
        assertEquals("the block's end, from the bar's right", 232f, laid.bar.right - laid.site.left, 0.5f)
    }

    @Test
    fun withoutItTheLogoSitsAtTheBarsPadding() {
        val laid = laidOut(logoInset = false)
        assertEquals("the logo's start", 16f, laid.logo.left, 0.5f)
        assertEquals("what follows, 16 after the logo", 56f, laid.site.left, 0.5f)
    }
}
