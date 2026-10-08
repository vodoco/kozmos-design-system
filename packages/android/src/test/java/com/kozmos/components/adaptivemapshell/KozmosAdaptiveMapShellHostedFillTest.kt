package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntSize
import app.cash.paparazzi.DeviceConfig
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.browsecategoriespanel.KozmosBrowseCategoriesPanel
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.routeoptioncard.KozmosRouteOptionCard
import com.kozmos.components.routepreviewpanel.KozmosRoutePreviewPanel
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosCategoryPresentation
import com.kozmos.contracts.KozmosRouteOptionPresentation
import com.kozmos.contracts.KozmosRoutePreference
import com.kozmos.contracts.KozmosRouteReadiness
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 43 (2026-09-28): in the shell's panel, a sheet or a side panel,
 * the panel's surface, solid or glass, is the one surface: a hosted part
 * paints no fill of its own. A part standing alone keeps its fill. The route
 * preview filled its box with the background colour wherever it was, so on a
 * glass sheet it was an opaque block; the category browser paints no fill at
 * all. Each case reads what is drawn at a point inside the part clear of its
 * text, and the same point with the panel hosting nothing: a part that
 * paints no fill leaves the panel's own colour there.
 */
class KozmosAdaptiveMapShellHostedFillTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    /** Where the part was laid out, in root pixels, and the root's size and density. */
    private var part = Rect.Zero
    private var root = IntSize.Zero
    private var density = 1f

    /** Nothing else here is red: a see-through part shows it. */
    private val red = Color(0xFFFF0000)

    private val options = listOf(
        KozmosRouteOptionPresentation(
            id = "quickest", label = "Quickest", durationSeconds = 240.0, durationLabel = "4 min",
            distanceMetres = 150.0, distanceLabel = "150 m", preference = KozmosRoutePreference.Quickest,
            selected = true
        ),
        KozmosRouteOptionPresentation(
            id = "step-free", label = "Step-free", durationSeconds = 360.0, durationLabel = "6 min",
            distanceMetres = 173.0, distanceLabel = "173 m", preference = KozmosRoutePreference.StepFree
        )
    )

    /** Eight tiles, two rows of four, as a venue's quick access has them. */
    private val categories = listOf("Gates", "Check-in", "Security", "Dining", "Shopping", "Toilets", "Parking", "Help")
        .map { KozmosCategoryPresentation(id = it.lowercase(), label = it) }

    @Composable
    private fun Route(modifier: Modifier) {
        KozmosRoutePreviewPanel(
            destinationName = "Harbour Coffee Co.",
            options = options,
            status = KozmosRouteReadiness.Ready,
            backLabel = "Back",
            continueLabel = "Start",
            onOptionSelect = {},
            onBack = {},
            onContinue = {},
            modifier = modifier
        )
    }

    /** The tiles alone: the browser as a product hosts it under a panel header's search. */
    @Composable
    private fun Browser(modifier: Modifier) {
        KozmosBrowseCategoriesPanel(categories = categories, onSelect = {}, modifier = modifier)
    }

    /** Where the part is found: laid out, it reports its bounds. */
    private val located = Modifier.onGloballyPositioned { part = it.boundsInRoot() }

    /** Draws [content] full screen in a theme, measuring the root as it goes. */
    private fun draw(dark: Boolean, content: @Composable () -> Unit): DrawnPixels = paparazzi.drawn(frames) {
        CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
            Box(Modifier.fillMaxSize().onGloballyPositioned { root = it.size }) {
                density = LocalDensity.current.density
                KozmosMaterialTheme { content() }
            }
        }
    }

    /** The shell over a red map with [panel] as its panel's content, resting at medium. */
    private fun shell(surface: KozmosSurfaceStyle, dark: Boolean, panel: @Composable () -> Unit): DrawnPixels =
        draw(dark) {
            KozmosAdaptiveMapShell(
                map = { Box(Modifier.fillMaxSize().background(red)) },
                panel = panel,
                panelSurface = surface,
                panelDetent = KozmosMapPanelDetent.Medium
            )
        }

    /**
     * A point inside the part where it draws nothing of its own but its fill:
     * 6dp in from its end edge, inside its 16dp of end padding, and 40dp down,
     * beside the route preview's destination or the browser's first tiles.
     * In the frame's pixels: Paparazzi scales its frames down, so the point is
     * found from the frame's size against the root's.
     */
    private fun DrawnPixels.insidePart(): Pair<Int, Int> {
        val scale = width.toFloat() / root.width
        return ((part.right - 6 * density) * scale).toInt() to ((part.top + 40 * density) * scale).toInt()
    }

    /** The background colour in a theme, drawn as a swatch and read back. */
    private fun background(dark: Boolean): Int {
        val swatch = draw(dark) { Box(Modifier.fillMaxSize().background(KozmosThemeTokens.primitivesColorsBackground0)) }
        return swatch.argb(swatch.width / 2, swatch.height / 2)
    }

    /**
     * What the part leaves at its point, against the panel's own colour
     * there with nothing hosted. On glass that colour is not the
     * background's, or the case could not tell a fill from none.
     */
    private fun assertNoFillOfItsOwn(
        name: String,
        surface: KozmosSurfaceStyle,
        dark: Boolean,
        hosted: @Composable () -> Unit
    ) {
        val theme = if (dark) "dark" else "light"
        val drawn = shell(surface, dark, hosted)
        val (x, y) = drawn.insidePart()
        val withPart = drawn.argb(x, y)
        val empty = shell(surface, dark) { Box(Modifier.fillMaxSize()) }.argb(x, y)
        println("Decision 43 Android, $name on $surface, $theme: ${DrawnPixels.hex(withPart)} inside it, ${DrawnPixels.hex(empty)} with nothing hosted")
        if (surface == KozmosSurfaceStyle.Glass) {
            assertFalse(
                "$name, $theme: the glass panel draws the background colour there, so it is not seen through",
                DrawnPixels.matches(empty, background(dark))
            )
        }
        assertTrue(
            "$name on $surface, $theme: drew ${DrawnPixels.hex(withPart)} where the panel alone draws ${DrawnPixels.hex(empty)}",
            DrawnPixels.matches(withPart, empty)
        )
    }

    // A sheet

    /** The route preview painted the background colour over the glass: white on the red, not the glass's pink. */
    @Test
    fun onAGlassSheetTheRoutePreviewPaintsNoFillOfItsOwn() {
        for (dark in listOf(false, true)) {
            assertNoFillOfItsOwn("the route preview", KozmosSurfaceStyle.Glass, dark) { Route(located) }
        }
    }

    /** The browser paints no fill anywhere: on a glass sheet the glass shows through it. */
    @Test
    fun onAGlassSheetTheCategoryBrowserPaintsNoFillOfItsOwn() {
        for (dark in listOf(false, true)) {
            assertNoFillOfItsOwn("the category browser", KozmosSurfaceStyle.Glass, dark) { Browser(located) }
        }
    }

    /**
     * On a solid sheet, a part that paints no fill looks as it did: the
     * sheet's fill is the background colour the route preview painted.
     */
    @Test
    fun onASolidSheetTheRoutePreviewLooksAsItDid() {
        for (dark in listOf(false, true)) {
            assertNoFillOfItsOwn("the route preview", KozmosSurfaceStyle.Solid, dark) { Route(located) }
            val drawn = shell(KozmosSurfaceStyle.Solid, dark) { Route(located) }
            val (x, y) = drawn.insidePart()
            assertTrue(
                "the route preview on a solid sheet drew ${DrawnPixels.hex(drawn.argb(x, y))}, not the background colour",
                DrawnPixels.matches(drawn.argb(x, y), background(dark))
            )
        }
    }

    // A side panel

    /** A side panel can be glass too, and the same block stood in it. */
    @Test
    fun inAGlassSidePanelTheRoutePreviewPaintsNoFillOfItsOwn() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        assertNoFillOfItsOwn("the route preview in a side panel", KozmosSurfaceStyle.Glass, dark = false) { Route(located) }
    }

    // A route option

    /**
     * The chosen route option is a card of its own: its 5% tint lay over
     * nothing, so on glass the map showed through it while the other options
     * stood opaque. Read 6dp inside its start edge, halfway down, clear of its
     * text and its edge: on glass it draws what it draws on a solid sheet, the
     * tint on the background colour.
     */
    @Test
    fun onAGlassSheetTheChosenRouteOptionIsAsOpaqueAsOnASolidOne() {
        for (dark in listOf(false, true)) {
            fun sample(surface: KozmosSurfaceStyle): Int {
                val drawn = shell(surface, dark) {
                    KozmosRouteOptionCard(
                        option = options[0],
                        onSelect = {},
                        modifier = located.padding(KozmosDimensions.primitivesLayoutSpacing200)
                    )
                }
                val scale = drawn.width.toFloat() / root.width
                return drawn.argb(
                    ((part.left + (16 + 6) * density) * scale).toInt(),
                    ((part.top + part.height / 2) * scale).toInt()
                )
            }
            val solid = sample(KozmosSurfaceStyle.Solid)
            val glass = sample(KozmosSurfaceStyle.Glass)
            val theme = if (dark) "dark" else "light"
            println("Route option Android, the chosen option, $theme: ${DrawnPixels.hex(glass)} on glass, ${DrawnPixels.hex(solid)} on a solid sheet")
            assertTrue(
                "$theme: the chosen option drew ${DrawnPixels.hex(glass)} on glass, ${DrawnPixels.hex(solid)} on a solid sheet",
                DrawnPixels.matches(glass, solid)
            )
        }
    }

    // Standing alone

    /**
     * Standing alone the browser fills its box with the background colour, as
     * the web's and iOS's do. It painted none, so the red showed through it.
     */
    @Test
    fun standingAloneTheCategoryBrowserKeepsItsFill() {
        for (dark in listOf(false, true)) {
            val drawn = draw(dark) {
                Box(Modifier.fillMaxSize().background(red)) { Browser(located) }
            }
            val (x, y) = drawn.insidePart()
            val theme = if (dark) "dark" else "light"
            println("Decision 43 Android, the category browser standing alone, $theme: ${DrawnPixels.hex(drawn.argb(x, y))}")
            assertTrue(
                "standing alone, $theme: the category browser drew ${DrawnPixels.hex(drawn.argb(x, y))}, not its fill",
                DrawnPixels.matches(drawn.argb(x, y), background(dark))
            )
        }
    }

    /** The guard: outside a shell nothing says a surface is there, and the preview keeps its fill. */
    @Test
    fun standingAloneTheRoutePreviewKeepsItsFill() {
        for (dark in listOf(false, true)) {
            val drawn = draw(dark) {
                Box(Modifier.fillMaxSize().background(red)) { Route(located) }
            }
            val (x, y) = drawn.insidePart()
            val theme = if (dark) "dark" else "light"
            println("Decision 43 Android, the route preview standing alone, $theme: ${DrawnPixels.hex(drawn.argb(x, y))}")
            assertTrue(
                "standing alone, $theme: the route preview drew ${DrawnPixels.hex(drawn.argb(x, y))}, not its fill",
                DrawnPixels.matches(drawn.argb(x, y), background(dark))
            )
        }
    }
}
