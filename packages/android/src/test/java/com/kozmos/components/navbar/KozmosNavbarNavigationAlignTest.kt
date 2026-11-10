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
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosTypography
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * GAP-196, decision 134: `navigationAlign` places the navigation in the room
 * between the leading slots and the trailing ones, as React's does. In
 * Paparazzi's 360 wide bar, with a 24 logo and a 40 account, that room runs
 * from 56 (16 of padding, the logo, 16) to 288 (16 before the account, which
 * ends 16 from the edge), and a 100 navigation sits at its start, its middle
 * or its end. Read from the laid-out bounds, in dp, so nothing here is a golden.
 */
class KozmosNavbarNavigationAlignTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private class Laid(val logo: Rect, val navigation: Rect, val bar: Rect)

    @Composable
    private fun Stage(direction: LayoutDirection, content: @Composable () -> Unit) {
        CompositionLocalProvider(
            LocalLayoutDirection provides direction,
            LocalKozmosUseDarkTokens provides false
        ) {
            KozmosMaterialTheme(typography = KozmosTypography.typography()) {
                Box(Modifier.fillMaxSize()) { content() }
            }
        }
    }

    /** Null is the call every product makes today, with no alignment. */
    private fun laidOut(align: KozmosNavbarNavigationAlign?, direction: LayoutDirection = LayoutDirection.Ltr): Laid {
        var logo = Rect.Zero
        var navigation = Rect.Zero
        var bar = Rect.Zero
        var px = 1f
        paparazzi.snapshot {
            px = LocalDensity.current.density
            Stage(direction) {
                val barModifier = Modifier.onGloballyPositioned { bar = it.boundsInRoot() }
                val logoSlot: @Composable androidx.compose.foundation.layout.RowScope.() -> Unit =
                    { Box(Modifier.size(24.dp).onGloballyPositioned { logo = it.boundsInRoot() }) }
                val navigationSlot: @Composable androidx.compose.foundation.layout.RowScope.() -> Unit =
                    { Box(Modifier.size(100.dp, 24.dp).onGloballyPositioned { navigation = it.boundsInRoot() }) }
                val accountSlot: @Composable androidx.compose.foundation.layout.RowScope.() -> Unit =
                    { Box(Modifier.size(40.dp, 24.dp)) }
                if (align == null) {
                    KozmosNavbar(modifier = barModifier, logo = logoSlot, navigation = navigationSlot, account = accountSlot)
                } else {
                    KozmosNavbar(
                        modifier = barModifier,
                        navigationAlign = align,
                        logo = logoSlot,
                        navigation = navigationSlot,
                        account = accountSlot
                    )
                }
            }
        }
        return Laid(logo.scale(px), navigation.scale(px), bar.scale(px))
    }

    private fun Rect.scale(px: Float) = Rect(left / px, top / px, right / px, bottom / px)

    @Test
    fun startSetsTheNavigationRightAfterTheLeadingSlots() {
        assertEquals("16 after the logo", 56f, laidOut(KozmosNavbarNavigationAlign.Start).navigation.left, 0.5f)
    }

    @Test
    fun centerCentresItInTheRoomAndIsTheDefault() {
        assertEquals("the middle of 56 to 288", 172f, laidOut(KozmosNavbarNavigationAlign.Center).navigation.center.x, 0.5f)
        assertEquals("with no alignment given", 172f, laidOut(null).navigation.center.x, 0.5f)
    }

    @Test
    fun endSetsItBesideTheTrailingSlots() {
        assertEquals("16 before the account", 288f, laidOut(KozmosNavbarNavigationAlign.End).navigation.right, 0.5f)
    }

    @Test
    fun rightToLeftStartAndEndMirror() {
        val start = laidOut(KozmosNavbarNavigationAlign.Start, LayoutDirection.Rtl)
        assertEquals("start, from the bar's right", 56f, start.bar.right - start.navigation.right, 0.5f)
        val end = laidOut(KozmosNavbarNavigationAlign.End, LayoutDirection.Rtl)
        assertEquals("end, from the bar's right", 288f, end.bar.right - end.navigation.left, 0.5f)
        assertEquals("the logo stays at the start", 16f, end.bar.right - end.logo.right, 0.5f)
    }
}
