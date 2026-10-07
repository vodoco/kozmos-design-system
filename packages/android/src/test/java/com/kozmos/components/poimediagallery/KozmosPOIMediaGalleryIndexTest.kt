package com.kozmos.components.poimediagallery

import android.view.MotionEvent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.LiveSemantics
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIMediaPresentation
import kotlin.math.abs
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Review finding N2: the gallery's counter, its arrows and its strip agree on
 * one index, as iOS's and the web's do. The strip started at the first photo
 * whatever the index said, never followed a controlled index, moved on Next
 * even when the parent kept the index, and a swipe left the counter behind.
 *
 * The contract, iOS's and the web's: the tile whose leading edge is nearest
 * the strip's leading edge is the photo shown. A swipe moves the index; a
 * button, a new controlled index or fewer photos move the strip, at once and
 * without animation. A controlled parent that refuses a change keeps the
 * strip where the index is. `onActiveIndexChange` is called once for each
 * change the visitor asks for, and never for the gallery lining its strip up.
 *
 * Swiped with a finger: down, 16 moves a frame apart, held still so it does
 * not fling, and lifted. The strip is 328dp, a phone's panel less its padding.
 */
class KozmosPOIMediaGalleryIndexTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val photos = (1..3).map { KozmosPOIMediaPresentation(id = "photo-$it", src = "file:///photo-$it.jpg", alt = "Photo $it") }

    @Test
    fun aShortDragSettlesAtTheLeadingEdgeInBothDirections() {
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            val reported = mutableListOf<Int>()
            paparazzi.live(content = { Gallery(direction = direction, onActiveIndexChange = { reported += it }) }) {
                frames(5)
                swipe(100f, direction)
                frames(40)
                val tree = read()
                val strip = tree.merged.single { it.horizontalScroll != null }.bounds
                val first = tree.named("Photo 1").frame
                val offset = if (direction == LayoutDirection.Ltr) first.left - strip.left else strip.right - first.right
                assertEquals("a short drag leaves a tile between snap positions ($direction)", 0f, offset, 1f)
                assertEquals("Image 1 of 3", counter())
                assertEquals(emptyList<Int>(), reported)
            }
        }
    }

    @Composable
    private fun Gallery(
        media: List<KozmosPOIMediaPresentation> = photos,
        activeIndex: Int? = null,
        defaultActiveIndex: Int = 0,
        direction: LayoutDirection = LayoutDirection.Ltr,
        onActiveIndexChange: ((Int) -> Unit)? = null
    ) {
        KozmosMaterialTheme {
            CompositionLocalProvider(LocalLayoutDirection provides direction) {
                Box(Modifier.padding(16.dp).width(328.dp)) {
                    KozmosPOIMediaGallery(
                        media = media,
                        label = "Photos",
                        positionLabel = { current, total -> "Image $current of $total" },
                        activeIndex = activeIndex,
                        defaultActiveIndex = defaultActiveIndex,
                        onActiveIndexChange = onActiveIndexChange
                    )
                }
            }
        }
    }

    /** What the counter says. */
    private fun LiveSemantics.counter(): String = read().unmerged.flatMap { it.texts }.single { it.startsWith("Image ") }

    /**
     * The photo the strip shows: of the tiles placed in it, the one whose
     * leading edge is nearest the strip's. A tile LazyRow keeps composed but
     * does not place — prefetched, or scrolled away — is not one, wherever
     * its stale frame says it is.
     */
    private fun LiveSemantics.shown(direction: LayoutDirection = LayoutDirection.Ltr): String {
        val tree = read()
        val strip = tree.merged.single { it.horizontalScroll != null }.bounds
        val tiles = tree.merged.filter { it.description?.startsWith("Photo ") == true && it.placed }
        check(tiles.isNotEmpty()) { "no photos in the strip" }
        return tiles.minByOrNull { tile ->
            if (direction == LayoutDirection.Ltr) abs(tile.frame.left - strip.left) else abs(strip.right - tile.frame.right)
        }!!.description!!
    }

    private fun LiveSemantics.enabled(button: String): Boolean = read().named(button).enabled

    private fun LiveSemantics.press(button: String) {
        read().named(button).click!!.invoke()
    }

    /** A finger drags the strip [byDp] towards the next photo, stops, and lifts. */
    private suspend fun LiveSemantics.swipe(byDp: Float, direction: LayoutDirection = LayoutDirection.Ltr) {
        val strip = read().merged.single { it.horizontalScroll != null }.bounds
        val density = view.resources.displayMetrics.density
        // Towards the next photo the content moves to the leading side: a
        // finger moving left in left-to-right, right in right-to-left.
        val step = byDp * density / 16 * if (direction == LayoutDirection.Ltr) -1 else 1
        val y = strip.center.y
        var x = strip.center.x
        val down = 1_000L
        var time = down
        fun send(action: Int) = view.dispatchTouchEvent(MotionEvent.obtain(down, time, action, x, y, 0))
        send(MotionEvent.ACTION_DOWN)
        repeat(16) {
            frames(1)
            time += 16
            x += step
            send(MotionEvent.ACTION_MOVE)
        }
        // Still for a tenth of a second, so the lift carries no fling.
        repeat(7) {
            frames(1)
            time += 16
            send(MotionEvent.ACTION_MOVE)
        }
        send(MotionEvent.ACTION_UP)
        frames(10)
    }

    /** Review case 1, and the bounds: opened on the last photo, everything says the last photo. */
    @Test
    fun openingOnTheLastPhotoShowsItAndReportsNothing() {
        val reported = mutableListOf<Int>()
        paparazzi.live(content = { Gallery(defaultActiveIndex = 2, onActiveIndexChange = { reported += it }) }) {
            frames(5)
            assertEquals("Image 3 of 3", counter())
            assertFalse("Next is offered on the last photo", enabled("Next image"))
            assertTrue(enabled("Previous image"))
            assertEquals("the strip does not show the photo the counter names", "Photo 3", shown())
            assertEquals("opening on the last photo reported changes nobody asked for", emptyList<Int>(), reported)
        }
    }

    /** An index past either end is brought in, and the buttons stop at the ends, one change each. */
    @Test
    fun anIndexOutOfRangeIsBroughtInAndTheButtonsStopAtTheEnds() {
        val reported = mutableListOf<Int>()
        paparazzi.live(content = { Gallery(defaultActiveIndex = 9, onActiveIndexChange = { reported += it }) }) {
            frames(5)
            assertEquals("Image 3 of 3", counter())
            assertEquals("Photo 3", shown())
            press("Previous image")
            frames(5)
            press("Previous image")
            frames(5)
            assertEquals("Image 1 of 3", counter())
            assertEquals("Photo 1", shown())
            assertFalse("Previous is offered on the first photo", enabled("Previous image"))
            assertEquals("each press was not one change", listOf(1, 0), reported)
        }
    }

    /** Review case 2: a swipe moves the counter and the arrows with the photo, reported once. */
    @Test
    fun aSwipeMovesTheIndex() {
        val reported = mutableListOf<Int>()
        paparazzi.live(content = { Gallery(onActiveIndexChange = { reported += it }) }) {
            frames(5)
            assertEquals("Image 1 of 3", counter())
            swipe(240f)
            assertEquals("the swipe did not reach the second photo", "Photo 2", shown())
            assertEquals("the counter was left behind by the swipe", "Image 2 of 3", counter())
            assertTrue(enabled("Previous image"))
            assertEquals("the swipe was not one change", listOf(1), reported)
        }
    }

    /** Review case 3: a new controlled index moves the strip to it, and is not reported back. */
    @Test
    fun aNewControlledIndexMovesTheStrip() {
        var index by mutableStateOf(0)
        val reported = mutableListOf<Int>()
        paparazzi.live(content = { Gallery(activeIndex = index, onActiveIndexChange = { reported += it; index = it }) }) {
            frames(5)
            index = 2
            frames(5)
            assertEquals("Image 3 of 3", counter())
            assertEquals("the strip did not follow the controlled index", "Photo 3", shown())
            index = 1
            frames(5)
            assertEquals("Image 2 of 3", counter())
            assertEquals("Photo 2", shown())
            assertEquals("the parent's own change was reported back to it", emptyList<Int>(), reported)
        }
    }

    /**
     * Review case 4: a parent that keeps its index keeps the strip there —
     * after Next, which is asked once and not drawn, and after a swipe, which
     * is asked once and put back.
     */
    @Test
    fun aRefusedChangeLeavesTheStripOnTheIndex() {
        val reported = mutableListOf<Int>()
        paparazzi.live(content = { Gallery(activeIndex = 0, onActiveIndexChange = { reported += it }) }) {
            frames(5)
            press("Next image")
            frames(10)
            assertEquals(listOf(1), reported)
            assertEquals("Image 1 of 3", counter())
            assertEquals("Next moved the strip the parent kept", "Photo 1", shown())

            swipe(240f)
            // A released drag now settles with the native snap fling. Wait
            // for the refused strip to return, with a bounded frame budget.
            var remainingFrames = 120
            while (shown() != "Photo 1" && remainingFrames-- > 0) frames(1)
            assertEquals(listOf(1, 1), reported)
            assertEquals("Image 1 of 3", counter())
            assertEquals("a refused swipe was left where the parent did not put it", "Photo 1", shown())
        }
    }

    /**
     * Fewer photos bring the index in to the last one there is, and the strip
     * with it, without reporting a change nobody asked for — as the web and
     * iOS do. New photos keep the index where it can stay.
     */
    @Test
    fun fewerOrNewPhotosKeepTheIndexAndTheStripTogether() {
        var media by mutableStateOf(photos)
        val reported = mutableListOf<Int>()
        paparazzi.live(content = { Gallery(media = media, defaultActiveIndex = 2, onActiveIndexChange = { reported += it }) }) {
            frames(5)
            assertEquals("Photo 3", shown())
            media = photos.take(2)
            frames(5)
            assertEquals("Image 2 of 2", counter())
            assertEquals("the strip did not come in with the index", "Photo 2", shown())
            assertFalse(enabled("Next image"))

            media = listOf(
                KozmosPOIMediaPresentation(id = "front", src = "file:///front.jpg", alt = "Photo of the front"),
                KozmosPOIMediaPresentation(id = "counter", src = "file:///counter.jpg", alt = "Photo of the counter")
            )
            frames(5)
            assertEquals("Image 2 of 2", counter())
            assertEquals("Photo of the counter", shown())
            assertEquals("new photos reported changes nobody asked for", emptyList<Int>(), reported)
        }
    }

    /** Right to left, the next photo is to the left and a swipe to the right brings it. */
    @Test
    fun rightToLeftTheSwipeAndTheButtonsGoTheOtherWay() {
        val reported = mutableListOf<Int>()
        val rtl = LayoutDirection.Rtl
        paparazzi.live(durationMillis = 5000, content = { Gallery(direction = rtl, onActiveIndexChange = { reported += it }) }) {
            frames(5)
            assertEquals("Photo 1", shown(rtl))
            swipe(240f, rtl)
            assertEquals("Photo 2", shown(rtl))
            assertEquals("Image 2 of 3", counter())
            press("Next image")
            frames(5)
            assertEquals("Photo 3", shown(rtl))
            assertEquals("Image 3 of 3", counter())
            assertEquals(listOf(1, 2), reported)
            frames(60)
            assertEquals("the cancelled snap overwrote Next", "Photo 3", shown(rtl))
            assertEquals(listOf(1, 2), reported)
        }
    }

    @Test
    fun aControlledChangeDuringSnapWinsWithoutAStaleReport() {
        var index by mutableStateOf(0)
        val reported = mutableListOf<Int>()
        paparazzi.live(durationMillis = 5000, content = { Gallery(activeIndex = index, onActiveIndexChange = { reported += it; index = it }) }) {
            frames(5)
            swipe(240f)
            assertEquals(listOf(1), reported)
            index = 0
            frames(5)
            assertEquals("the parent's change did not interrupt settling", "Photo 1", shown())
            frames(60)
            assertEquals("Image 1 of 3", counter())
            assertEquals(listOf(1), reported)
        }
    }
}
