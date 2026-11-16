package com.kozmos.components.imagecropper

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.unit.dp
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * `KozmosImageCropper` (GAP-273): an image framed to a ratio, its frame as
 * fractions of the image, moved by a drag, the keyboard or TalkBack's actions,
 * zoomed by a pinch, the zoom row or TalkBack's adjust, each change said. The
 * arithmetic is React's, number for number.
 */
class KozmosImageCropperTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** A 1600 × 1200 image, as React's tests frame. */
    private val size = Size(1600f, 1200f)
    private val near = 1e-5f

    @Test fun aSquareOfALandscapeImageStartsInTheMiddleAtZoom100() {
        val frame = KozmosImageCropFrame(size, 1f, 4f)
        val start = frame.normalise(null)
        assertEquals(0.125f, start.x, near)
        assertEquals(0f, start.y, near)
        assertEquals(0.75f, start.width, near)
        assertEquals(1f, start.height, near)
        assertEquals(KozmosImageCropperStatus(left = 13, top = 0, zoom = 100), frame.status(start))
    }

    /** React's "moves the frame by arrow keys and zooms by plus and minus". */
    @Test fun panAndZoomAsReactDoes() {
        val frame = KozmosImageCropFrame(size, 16f / 9f, 4f)
        var crop = frame.normalise(null)
        crop = frame.pan(crop, 0f, 1f)
        assertEquals(KozmosImageCropperStatus(left = 0, top = 20, zoom = 100), frame.status(crop))
        assertEquals("held at the left edge", crop, frame.pan(crop, -1f, 0f))
        crop = frame.zoom(crop, frame.zoomOf(crop) * 1.25f)
        assertEquals(125, frame.status(crop).zoom)
        crop = frame.pan(crop, 1f, 0f)
        crop = frame.zoom(crop, frame.zoomOf(crop) / 1.25f)
        crop = frame.zoom(crop, frame.zoomOf(crop) * 1.25f)
        assertEquals(0.8f, crop.width, near)
        assertEquals(0.6f, crop.height, near)
        assertEquals(0.1f, crop.x, near)
        assertEquals(0.275f, crop.y, near)
    }

    @Test fun zoomIsHeldBetweenOneAndMaxZoom() {
        val frame = KozmosImageCropFrame(size, 1f, 2f)
        val start = frame.normalise(null)
        assertEquals(2f, frame.zoomOf(frame.zoom(start, 9f)), near)
        assertEquals(1f, frame.zoomOf(frame.zoom(start, 0.2f)), near)
    }

    /** A drag up by a tenth of the box moves the frame down a tenth of itself; a pinch to twice is 200%. */
    @Test fun aDragMovesTheFrameAgainstTheFingerAndAPinchZooms() {
        val wide = KozmosImageCropFrame(size, 16f / 9f, 4f)
        assertEquals(0.2f, wide.drag(wide.normalise(null), 0f, -0.1f, 1f).y, near)
        val square = KozmosImageCropFrame(size, 1f, 4f)
        val pinched = square.drag(square.normalise(null), 0f, 0f, 2f)
        assertEquals(0.375f, pinched.width, near)
        assertEquals(0.5f, pinched.x + pinched.width / 2f, near)
    }

    @Test fun aGivenFrameIsNormalised() {
        val frame = KozmosImageCropFrame(size, 16f / 9f, 4f)
        val given = frame.normalise(KozmosImageCrop(x = 0.9f, y = 0.2f, width = 0.5f, height = 0.9f))
        assertEquals(KozmosImageCrop(x = 0.5f, y = 0.2f, width = 0.5f, height = 0.375f).toString(), given.toString())
    }

    /** Made inside the composition: layoutlib is not loaded before Paparazzi starts. */
    private val photo: BitmapPainter get() = BitmapPainter(ImageBitmap(1600, 1200))

    @Test fun theFrameIsOneNodeNamedDescribedAndSayingWhereItIs() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosImageCropper(
                    painter = photo,
                    contentDescription = "Pointr logo",
                    crop = null,
                    onCropChange = {},
                    modifier = Modifier.width(300.dp)
                )
            }
        }
        val cropper = tree.named(
            "Image frame. Drag the image, or use the arrow keys to move the frame and plus and minus to zoom."
        )
        assertEquals("Frame 13% from the left, 0% from the top, zoom 100%.", cropper.stateDescription)
        assertEquals(LiveRegionMode.Polite, cropper.liveRegion)
        assertEquals(1f, cropper.progressRange!!.current, near)
        assertEquals(1f..4f, cropper.progressRange!!.range)
        assertEquals(
            listOf("Move left", "Move right", "Move up", "Move down", "Zoom in", "Zoom out"),
            cropper.customActions.keys.toList()
        )
        // A square frame, 300 wide.
        val density = paparazzi.context.resources.displayMetrics.density
        assertEquals(300f, cropper.bounds.width / density, 0.5f)
        assertEquals(300f, cropper.bounds.height / density, 0.5f)
        // The zoom row: Zoom out unavailable at the start, Zoom in available.
        assertFalse(tree.named("Zoom out").enabled)
        assertTrue(tree.named("Zoom in").enabled)
    }

    @Test fun theActionsMoveAndZoomTheFrameAndHandItBack() {
        var crop: KozmosImageCrop? by mutableStateOf(null)
        paparazzi.live(content = {
            KozmosMaterialTheme {
                KozmosImageCropper(
                    painter = photo,
                    contentDescription = null,
                    crop = crop,
                    onCropChange = { crop = it },
                    modifier = Modifier.width(300.dp),
                    label = "Logo"
                )
            }
        }) {
            frames(3)
            // The starting frame is handed back once it is drawn.
            assertNotNull("no starting frame", crop)
            assertEquals(0.125f, crop!!.x, near)
            val node = { read().merged.single { it.description?.startsWith("Logo.") == true } }
            node().customActions.getValue("Zoom in").invoke()
            frames(3)
            assertEquals("Frame 20% from the left, 10% from the top, zoom 125%.", node().stateDescription)
            node().customActions.getValue("Move left").invoke()
            frames(3)
            // 0.2 less a tenth of 0.6.
            assertEquals(0.14f, crop!!.x, near)
            assertEquals("Frame 14% from the left, 10% from the top, zoom 125%.", node().stateDescription)
            assertTrue("Zoom out is available once zoomed in", read().named("Zoom out").enabled)
        }
    }

    @Test fun disabledItOffersNoActions() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosImageCropper(
                    painter = photo,
                    contentDescription = null,
                    crop = null,
                    onCropChange = {},
                    enabled = false,
                    label = "Logo"
                )
            }
        }
        val cropper = tree.merged.single { it.description?.startsWith("Logo.") == true }
        assertFalse(cropper.enabled)
        assertEquals(emptyMap<String, () -> Boolean>(), cropper.customActions)
        assertFalse(tree.named("Zoom in").enabled)
    }
}
