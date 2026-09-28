package com.kozmos.components.adaptivemapshell

import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Test

/** The Pointr prototype's detents and drag rule, as scripts/measure-prototype-sheet.cjs measured them. */
class PanelDetentsTest {
    private val shell = 800.dp

    @Test
    fun theNamedDetentsAreAFifthFiftyFourAndNinetyFourPercent() {
        assertEquals(160f, KozmosMapPanelDetent.Collapsed.height(shell).value, 0.001f)
        assertEquals(432f, KozmosMapPanelDetent.Medium.height(shell).value, 0.001f)
        assertEquals(752f, KozmosMapPanelDetent.Large.height(shell).value, 0.001f)
    }

    @Test
    fun collapsedNeverFallsUnderTheHandleAndHeaderNorOverFortyPercent() {
        assertEquals(112f, KozmosMapPanelDetent.Collapsed.height(500.dp).value, 0.001f)
        assertEquals(80f, KozmosMapPanelDetent.Collapsed.height(200.dp).value, 0.001f)
    }

    @Test
    fun collapsedRestsOnThePeekAnchorWithinAQuarterAndThreeQuarters() {
        assertEquals(266f, KozmosMapPanelDetent.anchoredCollapsedHeight(250.dp, shell).value, 0.001f)
        assertEquals(192f, KozmosMapPanelDetent.anchoredCollapsedHeight(40.dp, shell).value, 0.001f)
        assertEquals(576f, KozmosMapPanelDetent.anchoredCollapsedHeight(700.dp, shell).value, 0.001f)
        assertEquals(266f, KozmosMapPanelDetent.Collapsed.height(shell, KozmosPanelMeasures(peekBottom = 250.dp)).value, 0.001f)
    }

    /**
     * A panel header is not a peek anchor (row 73): collapsed grows only to
     * show the whole header, never under the default nor over three quarters.
     * A search row's 60 leaves the prototype's fifth where it was; an anchor
     * still rules.
     */
    @Test
    fun collapsedGrowsOnlyToShowTheWholePanelHeader() {
        assertEquals(160f, KozmosMapPanelDetent.headerCollapsedHeight(60.dp, shell).value, 0.001f)
        assertEquals(232f, KozmosMapPanelDetent.headerCollapsedHeight(216.dp, shell).value, 0.001f)
        assertEquals(576f, KozmosMapPanelDetent.headerCollapsedHeight(716.dp, shell).value, 0.001f)
        assertEquals(112f, KozmosMapPanelDetent.headerCollapsedHeight(60.dp, 400.dp).value, 0.001f)
        assertEquals(232f, KozmosMapPanelDetent.Collapsed.height(shell, KozmosPanelMeasures(headerBottom = 216.dp)).value, 0.001f)
        assertEquals(266f, KozmosMapPanelDetent.Collapsed.height(shell, KozmosPanelMeasures(peekBottom = 250.dp, headerBottom = 400.dp)).value, 0.001f)
    }

    @Test
    fun contentFitsBetweenCollapsedAndLargeAndReadsAsMediumUntilMeasured() {
        assertEquals(432f, KozmosMapPanelDetent.Content.height(shell).value, 0.001f)
        assertEquals(160f, KozmosMapPanelDetent.Content.height(shell, KozmosPanelMeasures(contentHeight = 120.dp)).value, 0.001f)
        assertEquals(300f, KozmosMapPanelDetent.Content.height(shell, KozmosPanelMeasures(contentHeight = 300.dp)).value, 0.001f)
        assertEquals(752f, KozmosMapPanelDetent.Content.height(shell, KozmosPanelMeasures(contentHeight = 2000.dp)).value, 0.001f)
    }

    @Test
    fun theOfferedDetentsAreOrderedByHeightAndFolded() {
        val ordered = orderPanelDetents(
            listOf(KozmosMapPanelDetent.Large, KozmosMapPanelDetent.Collapsed, KozmosMapPanelDetent.Medium, KozmosMapPanelDetent.Fraction(0.54f)),
            shell
        )
        assertEquals(listOf(KozmosMapPanelDetent.Collapsed, KozmosMapPanelDetent.Medium, KozmosMapPanelDetent.Large), ordered)
    }

    @Test
    fun aDragSnapsToTheNearestDetentByDistance() {
        val detents = listOf(KozmosMapPanelDetent.Collapsed, KozmosMapPanelDetent.Medium, KozmosMapPanelDetent.Large)
        val frame = 874.dp
        // From a fifth (175): +100 stays, +160 reaches half; from half (472): +160 stays, +200 reaches full.
        assertEquals(KozmosMapPanelDetent.Collapsed, nearestPanelDetent(detents, 275.dp, frame))
        assertEquals(KozmosMapPanelDetent.Medium, nearestPanelDetent(detents, 335.dp, frame))
        assertEquals(KozmosMapPanelDetent.Medium, nearestPanelDetent(detents, 632.dp, frame))
        assertEquals(KozmosMapPanelDetent.Large, nearestPanelDetent(detents, 672.dp, frame))
    }

    @Test
    fun aSidewaysMoveIsTheContents() {
        assertEquals(KozmosPanelDragKind.Content, decidePanelDrag(dx = 12f, dy = -8f, atLargestDetent = false, scrollOffset = 0f))
    }

    @Test
    fun belowTheLargestDetentEitherDirectionMovesTheSheet() {
        assertEquals(KozmosPanelDragKind.Sheet, decidePanelDrag(dx = 0f, dy = -40f, atLargestDetent = false, scrollOffset = 0f))
        assertEquals(KozmosPanelDragKind.Sheet, decidePanelDrag(dx = 0f, dy = 40f, atLargestDetent = false, scrollOffset = 100f))
    }

    @Test
    fun atTheLargestDetentTheContentScrollsFirst() {
        assertEquals(KozmosPanelDragKind.Content, decidePanelDrag(dx = 0f, dy = -40f, atLargestDetent = true, scrollOffset = 0f))
        assertEquals(KozmosPanelDragKind.Content, decidePanelDrag(dx = 0f, dy = 40f, atLargestDetent = true, scrollOffset = 40f))
        assertEquals(KozmosPanelDragKind.Sheet, decidePanelDrag(dx = 0f, dy = 40f, atLargestDetent = true, scrollOffset = 0f))
    }
}
