package com.kozmos.components.sidebar

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.ui.unit.Density
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
 * GAP-199, decision 134: `inset = Flush` drops the 24 above the sidebar's first
 * slot, so a rail's first item sits flush under a fixed header, as React's
 * `inset="flush"` does; the bottom keeps its 24. React drops its navigation's
 * own 16 on a flush rail too; Compose's navigation has none, so its first item
 * goes from 24 to 0. Read from the laid-out bounds, in dp, in a 300 tall
 * sidebar.
 */
class KozmosSidebarInsetTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private class Laid(val sidebar: Rect, val header: Rect, val item: Rect, val footer: Rect)

    private fun laidOut(
        variant: KozmosSidebarVariant,
        inset: KozmosSidebarInset?,
        slots: Boolean
    ): Laid {
        var sidebar = Rect.Zero
        var header = Rect.Zero
        var item = Rect.Zero
        var footer = Rect.Zero
        var px = 1f
        paparazzi.snapshot {
            px = LocalDensity.current.density
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                KozmosMaterialTheme(typography = KozmosTypography.typography()) {
                    Box(Modifier.fillMaxSize()) {
                        val modifier = Modifier.height(300.dp).onGloballyPositioned { sidebar = it.boundsInRoot() }
                        val navigation: @androidx.compose.runtime.Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit =
                            { Box(Modifier.size(24.dp).onGloballyPositioned { item = it.boundsInRoot() }) }
                        when {
                            slots -> KozmosSidebar(
                                modifier = modifier,
                                variant = variant,
                                inset = inset ?: KozmosSidebarInset.Default,
                                header = { Box(Modifier.size(24.dp).onGloballyPositioned { header = it.boundsInRoot() }) },
                                navigation = navigation,
                                footer = { Box(Modifier.size(24.dp).onGloballyPositioned { footer = it.boundsInRoot() }) }
                            )
                            inset == null -> KozmosSidebar(modifier = modifier, variant = variant, navigation = navigation)
                            else -> KozmosSidebar(modifier = modifier, variant = variant, inset = inset, navigation = navigation)
                        }
                    }
                }
            }
        }
        fun Rect.scaled() = Rect(left / px, top / px, right / px, bottom / px)
        return Laid(sidebar.scaled(), header.scaled(), item.scaled(), footer.scaled())
    }

    @Test
    fun aFlushRailsFirstItemIsAtTheTopEdge() {
        val laid = laidOut(KozmosSidebarVariant.Rail, KozmosSidebarInset.Flush, slots = false)
        assertEquals(0f, laid.item.top - laid.sidebar.top, 0.5f)
    }

    @Test
    fun byDefaultTheTopIsPaddedAsBefore() {
        val plain = laidOut(KozmosSidebarVariant.Rail, null, slots = false)
        assertEquals("with no inset given", 24f, plain.item.top - plain.sidebar.top, 0.5f)
        val explicit = laidOut(KozmosSidebarVariant.Rail, KozmosSidebarInset.Default, slots = false)
        assertEquals(24f, explicit.item.top - explicit.sidebar.top, 0.5f)
    }

    /**
     * With a header, flush starts the header at the edge, keeps the 16 between
     * it and the navigation, and the footer keeps the 24 below it.
     */
    @Test
    fun flushMovesTheTopAloneInAnExpandedSidebarWithSlots() {
        for ((inset, top) in listOf(KozmosSidebarInset.Flush to 0f, KozmosSidebarInset.Default to 24f)) {
            val laid = laidOut(KozmosSidebarVariant.Expanded, inset, slots = true)
            assertEquals("$inset: the header's top", top, laid.header.top - laid.sidebar.top, 0.5f)
            assertEquals("$inset: header to navigation", 16f, laid.item.top - laid.header.bottom, 0.5f)
            assertEquals("$inset: the bottom keeps its room", 24f, laid.sidebar.bottom - laid.footer.bottom, 0.5f)
        }
    }

    /** The short form takes it too. */
    @Test
    fun theShortFormTakesIt() {
        fun top(inset: KozmosSidebarInset): Float {
            var sidebar = Rect.Zero
            var item = Rect.Zero
            var px = 1f
            paparazzi.snapshot {
                px = LocalDensity.current.density
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                    KozmosMaterialTheme(typography = KozmosTypography.typography()) {
                        Box(Modifier.fillMaxSize()) {
                            KozmosSidebar(
                                modifier = Modifier.height(300.dp).onGloballyPositioned { sidebar = it.boundsInRoot() },
                                inset = inset
                            ) {
                                Box(Modifier.size(24.dp).onGloballyPositioned { item = it.boundsInRoot() })
                            }
                        }
                    }
                }
            }
            return (item.top - sidebar.top) / px
        }
        assertEquals(0f, top(KozmosSidebarInset.Flush), 0.5f)
        assertEquals(24f, top(KozmosSidebarInset.Default), 0.5f)
    }

    /**
     * Flush, the sheet takes no window insets: Material's drawer pads the top by
     * the status bar, which would push the first item down under a header that
     * has already taken it. By default it keeps Material's insets, as before.
     * Paparazzi's window has no status bar, so this reads the insets the sheet
     * is given rather than a layout.
     */
    @Test
    fun aFlushSheetTakesNoWindowInsets() {
        val density = Density(1f)
        val statusBar = WindowInsets(left = 4.dp, top = 24.dp, right = 8.dp, bottom = 16.dp)
        val flush = kozmosSidebarWindowInsets(KozmosSidebarInset.Flush, statusBar)
        val default = kozmosSidebarWindowInsets(KozmosSidebarInset.Default, statusBar)
        assertEquals(
            listOf(0, 0, 0, 0),
            listOf(flush.getTop(density), flush.getBottom(density), flush.getLeft(density, LayoutDirection.Ltr), flush.getRight(density, LayoutDirection.Ltr))
        )
        assertEquals("by default, Material's", 24, default.getTop(density))
    }

    /** Decision 157: an expanded sidebar is 256, as React's w-64 and SwiftUI's; a rail 96. */
    @Test
    fun anExpandedSidebarIs256() {
        assertEquals(256f, laidOut(KozmosSidebarVariant.Expanded, null, slots = false).sidebar.width, 0.5f)
        assertEquals(96f, laidOut(KozmosSidebarVariant.Rail, null, slots = false).sidebar.width, 0.5f)
    }
}
