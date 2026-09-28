package com.kozmos.components.poidetailpanel

import android.graphics.drawable.ColorDrawable
import android.os.Handler
import android.os.Looper
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import coil.Coil
import coil.ImageLoader
import coil.decode.DataSource
import coil.intercept.Interceptor
import coil.request.ErrorResult
import coil.request.ImageRequest
import coil.request.ImageResult
import coil.request.SuccessResult
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.ReadSemantics
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOILogoPresentation
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.tokens.KozmosColors
import java.io.IOException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.android.asCoroutineDispatcher
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/**
 * The details card's logo, read off what is drawn.
 *
 * iOS draws a supplied logo's artwork once it has loaded, and the name's
 * initial on the inset surface while it loads or if it cannot; with no logo
 * it draws nothing, as the web does. Android drew the initial only when there
 * was no logo, and nothing at all while a supplied one loaded or after it
 * failed. Every request here is answered at once by a stand-in image loader,
 * so no case waits on the network.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class KozmosPOIDetailPanelLogoTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    @After
    fun restore() {
        Coil.reset()
        Dispatchers.resetMain()
    }

    /**
     * Paparazzi starts a new main looper for every test, but Dispatchers.Main
     * keeps the first it was given: from the second test in a run on, Coil's
     * work on Main.immediate was posted to a looper nothing turns, and no
     * result landed. Bound to this test's own looper, before the stand-in
     * loader takes its interceptor dispatcher from it, a result that is ready
     * at once lands before the frame is drawn, whichever test runs first. The
     * rule has made the looper by now.
     */
    @Before
    fun bindTheMainDispatcherToThisTest() {
        Dispatchers.setMain(Handler(Looper.getMainLooper()).asCoroutineDispatcher("paparazzi-main"))
    }

    private val logo = KozmosPOILogoPresentation(
        src = "https://cdn.example.com/harbour-coffee.png",
        alt = "Harbour Coffee Co. logo"
    )

    private val poi = KozmosPOIPresentation(
        id = "harbour-coffee",
        name = "Harbour Coffee Co.",
        floorId = "2",
        floorLabel = "Level 2",
        logo = logo,
        actions = listOf(KozmosPOIAction.Favourite, KozmosPOIAction.Bookmark)
    )

    /** The inline card's inset surface, `background/100`, in the light theme these tests draw. */
    private val insetSurface = KozmosColors.primitivesColorsBackground100.toArgb()

    /** The stand-in artwork: a red that no token draws. */
    private val artwork = android.graphics.Color.rgb(0xD0, 0x21, 0x2E)

    /** Coil answers every request with [answer]'s result; null leaves it loading. */
    private fun imagesAnswer(answer: (ImageRequest) -> ImageResult?) {
        Coil.setImageLoader(
            ImageLoader.Builder(paparazzi.context)
                // Coil's default options are made once, when its classes
                // load, with the Main.immediate of that moment: the first
                // test's looper. The interceptors run on this test's.
                .interceptorDispatcher(Dispatchers.Main.immediate)
                .components {
                    add(object : Interceptor {
                        override suspend fun intercept(chain: Interceptor.Chain): ImageResult =
                            answer(chain.request) ?: awaitCancellation()
                    })
                }
                .build()
        )
    }

    /** The card as TalkBack is given it, and as it was drawn, from one frame. */
    private class Drawn(val tree: ReadSemantics, val pixels: DrawnPixels) {
        /**
         * The colour drawn at a point of the tree, in the tree's pixels.
         * Paparazzi scales its frames down, so the point is found from the
         * frame's own size, never from dp and density.
         */
        fun at(x: Float, y: Float): Int {
            val root = tree.merged.first().bounds
            return pixels.argb(
                (x / root.width * pixels.width).toInt(),
                (y / root.height * pixels.height).toInt()
            )
        }

        /** How many of the frame's pixels inside [area] pass [test]. */
        fun count(area: Rect, test: (Int) -> Boolean): Int {
            val root = tree.merged.first().bounds
            val left = (area.left / root.width * pixels.width).toInt()
            val right = (area.right / root.width * pixels.width).toInt()
            val top = (area.top / root.height * pixels.height).toInt()
            val bottom = (area.bottom / root.height * pixels.height).toInt()
            return (left until right).sumOf { x -> (top until bottom).count { y -> test(pixels.argb(x, y)) } }
        }
    }

    private fun draw(): Drawn {
        frames.last = null
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                Box(modifier = Modifier.width(360.dp)) {
                    KozmosPOIDetailPanel(
                        poi = poi,
                        actionLabels = mapOf(
                            KozmosPOIAction.Favourite to "Favourite",
                            KozmosPOIAction.Bookmark to "Save"
                        ),
                        onAction = { _, _ -> },
                        onClose = {}
                    )
                }
            }
        }
        return Drawn(tree, DrawnPixels(checkNotNull(frames.last) { "nothing was drawn" }))
    }

    /** The logo as TalkBack hears it, in whatever state it is: one image, named by its alt text. */
    private fun Drawn.logo(): Rect {
        val node = tree.named(logo.alt)
        assertEquals("the logo's role", Role.Image, node.role)
        return node.bounds
    }

    /**
     * The initial on the inset surface fills the logo's place: the surface
     * beside the letter, and the letter, darker, in the middle.
     */
    private fun Drawn.assertTheInitialIn(box: Rect) {
        val beside = at(box.left + box.width * 0.15f, box.center.y)
        assertTrue(
            "beside the initial the logo drew ${DrawnPixels.hex(beside)}, not the inset surface ${DrawnPixels.hex(insetSurface)}",
            DrawnPixels.matches(beside, insetSurface)
        )
        val middle = Rect(
            box.left + box.width * 0.3f,
            box.top + box.height * 0.3f,
            box.right - box.width * 0.3f,
            box.bottom - box.height * 0.3f
        )
        val letter = count(middle) { DrawnPixels.lightness(it) < DrawnPixels.lightness(insetSurface) - 150 }
        assertTrue("no initial drawn in the logo's middle: $letter dark pixels", letter >= 5)
    }

    /** While the artwork loads, the initial holds its place, as iOS's AsyncImage draws its empty phase. */
    @Test
    fun whileTheLogoLoadsTheInitialShows() {
        imagesAnswer { null }
        val drawn = draw()
        drawn.assertTheInitialIn(drawn.logo())
    }

    /** Artwork that cannot load leaves the initial, as iOS's failure phase does, not an empty box. */
    @Test
    fun whenTheLogoFailsTheInitialShows() {
        imagesAnswer { ErrorResult(drawable = null, request = it, throwable = IOException("offline")) }
        val drawn = draw()
        drawn.assertTheInitialIn(drawn.logo())
    }

    /**
     * Loaded, the artwork fills the logo's place and no initial shows — the
     * case the two above must not swallow: a card that always drew the
     * initial would pass them.
     */
    @Test
    fun aLoadedLogoShowsItsArtworkAndNoInitial() {
        imagesAnswer { SuccessResult(drawable = ColorDrawable(artwork), request = it, dataSource = DataSource.MEMORY) }
        val drawn = draw()
        val box = drawn.logo()
        for ((where, x) in listOf("middle" to box.center.x, "beside the middle" to box.left + box.width * 0.15f)) {
            val colour = drawn.at(x, box.center.y)
            assertTrue(
                "the loaded logo drew ${DrawnPixels.hex(colour)} at its $where, not its artwork ${DrawnPixels.hex(artwork)}",
                DrawnPixels.matches(colour, artwork)
            )
        }
    }
}
