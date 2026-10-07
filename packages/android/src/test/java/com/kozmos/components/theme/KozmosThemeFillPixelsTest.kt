package com.kozmos.components.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.aisearchbutton.KozmosAISearchButton
import com.kozmos.components.bottomnavigation.BottomNavigationItem
import com.kozmos.components.bottomnavigation.KozmosBottomNavigation
import com.kozmos.components.categoryfield.KozmosCategoryField
import com.kozmos.components.categorytile.KozmosCategoryTile
import com.kozmos.components.checkbox.KozmosCheckbox
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.KozmosDirectionStep
import com.kozmos.components.drawn
import com.kozmos.components.floatingactionbutton.KozmosFloatingActionButton
import com.kozmos.components.floorselector.KozmosFloorSelector
import com.kozmos.components.icon.KozmosIcon
import com.kozmos.components.icon.KozmosIconColor
import com.kozmos.components.icon.KozmosIconSize
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep
import com.kozmos.components.link.KozmosLink
import com.kozmos.components.listbox.KozmosListbox
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.locationpin.KozmosLocationPin
import com.kozmos.components.locationpin.KozmosLocationPinSize
import com.kozmos.components.manoeuvrecard.KozmosManoeuvreCard
import com.kozmos.components.navigationitem.KozmosNavigationItem
import com.kozmos.components.otpinput.KozmosOTPInput
import com.kozmos.components.pagination.KozmosPaginationLink
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.radio.KozmosRadioGroupItem
import com.kozmos.components.routeoptioncard.KozmosRouteOptionCard
import com.kozmos.components.slider.KozmosSlider
import com.kozmos.components.splitbutton.KozmosSplitButton
import com.kozmos.components.stepper.KozmosStepper
import com.kozmos.components.switch.KozmosSwitch
import com.kozmos.components.tag.KozmosTag
import com.kozmos.components.timeline.KozmosTimeline
import com.kozmos.components.timeline.KozmosTimelineItem
import com.kozmos.components.timeline.KozmosTimelineTitle
import com.kozmos.components.toast.KozmosToast
import com.kozmos.components.togglebutton.KozmosToggleButton
import com.kozmos.contracts.KozmosCategoryPresentation
import com.kozmos.contracts.KozmosFloorPresentation
import com.kozmos.contracts.KozmosInstructionPart
import com.kozmos.contracts.KozmosRouteOptionPresentation
import com.kozmos.contracts.KozmosRoutePreference
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 59 (Olcay, 2026-10-07), read off what is drawn, in the light and
 * in the dark:
 *
 * - a prominent filled item is the theme fill, theme 500, the client's base
 *   colour, #135BEC in both themes, and every text or mark on it is the theme
 *   foreground, white in both. Compose drew most of them in theme 500 with
 *   `background/0` or `foreground/1000` on it, which turn black in the dark:
 *   3.74:1 on the blue, where white reads 5.62:1;
 * - theme-coloured text, icons, borders and focus rings on a surface are
 *   theme 600, #1051E8 in the light and #5887F3 in the dark. Compose drew them
 *   in theme 500, 3.13:1 on the dark page's greys.
 *
 * The colours are written out, not read from the tokens: they are what the
 * decision says, so a token or a component that drifted from them fails here.
 * Paparazzi scales its frames down (paparazzi-frames-are-scaled), so the parts
 * are drawn at twice the density and found by their colour, never by dp.
 */
class KozmosThemeFillPixelsTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val themeFill = 0xFF135BEC.toInt()
    private val white = 0xFFFFFFFF.toInt()
    private fun theme600(dark: Boolean) = if (dark) 0xFF5887F3.toInt() else 0xFF1051E8.toInt()
    private fun mode(dark: Boolean) = if (dark) "dark" else "light"

    /**
     * [content] at twice the density, top-start on [host]: a mid grey for the
     * fills, so a white or a black pixel can only be the part's own, or the
     * page surface for the text uses, whose colour must read on it.
     */
    private fun draw(dark: Boolean, host: Color?, content: @Composable () -> Unit): DrawnPixels =
        paparazzi.drawn(frames) {
            val density = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(density.density * 2f, density.fontScale)
            ) {
                MaterialTheme(colorScheme = if (dark) darkColorScheme() else lightColorScheme()) {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .background(host ?: KozmosThemeTokens.semanticsSurface0)
                            .padding(8.dp)
                    ) { content() }
                }
            }
        }

    /** How many pixels in the box are [colour], give or take [tolerance] on each channel. */
    private fun DrawnPixels.count(colour: Int, tolerance: Int, xs: IntRange = 0 until width, ys: IntRange = 0 until height): Int {
        var found = 0
        for (y in ys) for (x in xs) if (DrawnPixels.matches(argb(x, y), colour, tolerance)) found++
        return found
    }

    /** The box round every pixel drawn in [colour], as x and y ranges; null if there is none. */
    private fun DrawnPixels.boundsOf(colour: Int): Pair<IntRange, IntRange>? {
        var left = Int.MAX_VALUE
        var top = Int.MAX_VALUE
        var right = -1
        var bottom = -1
        for (y in 0 until height) for (x in 0 until width) {
            if (DrawnPixels.matches(argb(x, y), colour)) {
                left = minOf(left, x); right = maxOf(right, x)
                top = minOf(top, y); bottom = maxOf(bottom, y)
            }
        }
        return if (right < 0) null else (left..right) to (top..bottom)
    }

    /** The middle half of a range: inside a fill's curves and ring, where its mark is. */
    private fun IntRange.middleHalf(): IntRange {
        val quarter = (last - first + 1) / 4
        return (first + quarter)..(last - quarter)
    }

    private val filled: List<Pair<String, @Composable () -> Unit>> = listOf(
        "a checked Checkbox and its check" to { KozmosCheckbox(checked = true, onCheckedChange = {}) },
        "a default Tag and its words" to { KozmosTag(text = "Open") },
        "a filled primary LocationPin and its number" to {
            KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 8, selected = true)
        },
        "a checked Switch and its thumb" to { KozmosSwitch(checked = true, onCheckedChange = {}) },
        "a completed Stepper step and its check" to {
            KozmosStepper(steps = listOf("Search", "Go"), currentStep = 1, modifier = Modifier.width(160.dp))
        },
        "the FloorSelector's selected level and its label" to {
            KozmosFloorSelector(floors = listOf("1"), selectedFloor = "1", onFloorSelect = {})
        },
        "the FloorSelector's result count and its number" to {
            KozmosFloorSelector(
                floors = listOf(KozmosFloorPresentation(id = "1", label = "Level 1", shortLabel = "1", resultCount = 8)),
                selectedFloor = "none",
                onFloorSelect = {},
                showResultCounts = true
            )
        },
        "a ToggleButton on and its label" to { KozmosToggleButton(checked = true, onCheckedChange = {}, label = "Step-free") },
        "a FloatingActionButton and its icon" to { KozmosFloatingActionButton(onClick = {}) },
        "a SplitButton and its label" to { KozmosSplitButton(label = "Share", onMainClick = {}, menuItems = emptyList()) },
        "a theme ManoeuvreCard and its words" to {
            KozmosManoeuvreCard(DirectionType.Straight, "Continue ahead", false, {}, modifier = Modifier.width(180.dp)) {}
        },
    )

    @Test
    fun aProminentFillIsTheThemeFillWithAWhiteMarkInBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for ((name, part) in filled) {
                val drawn = draw(dark, Color(0xFF808080), part)
                val bounds = drawn.boundsOf(themeFill)
                if (bounds == null) {
                    wrong += "${mode(dark)}: $name draws no #135BEC"
                    continue
                }
                val fillPixels = drawn.count(themeFill, 2, bounds.first, bounds.second)
                val marks = drawn.count(white, 12, bounds.first.middleHalf(), bounds.second.middleHalf())
                println("Decision 59 Android, ${mode(dark)}: $name: $fillPixels pixels of #135BEC, $marks white in its middle")
                if (fillPixels < 100) wrong += "${mode(dark)}: $name draws only $fillPixels pixels of #135BEC"
                if (marks < 6) wrong += "${mode(dark)}: $name has no white mark on its fill ($marks pixels)"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /** A selected Radio: its dot is the fill; its ring is a border, theme 600. */
    @Test
    fun aRadiosDotIsTheThemeFillAndItsRingTheme600() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val drawn = draw(dark, null) {
                KozmosRadioGroupItem(value = "a", selectedValue = "a", onOptionSelected = {}, modifier = Modifier.width(48.dp))
            }
            val dot = drawn.count(themeFill, 2)
            val ring = drawn.count(theme600(dark), 2)
            println("Decision 59 Android, ${mode(dark)}: the radio's dot $dot pixels of #135BEC, its ring $ring of ${DrawnPixels.hex(theme600(dark))}")
            if (dot < 50) wrong += "${mode(dark)}: the radio's dot is not #135BEC ($dot pixels)"
            if (ring < 50) wrong += "${mode(dark)}: the radio's ring is not ${DrawnPixels.hex(theme600(dark))} ($ring pixels)"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    private val onTheSurface: List<Pair<String, @Composable () -> Unit>> = listOf(
        "a Link" to { KozmosLink(text = "Open in maps", onClick = {}) },
        "the primary Icon" to { KozmosIcon(name = "home-line", size = KozmosIconSize.Xl, color = KozmosIconColor.Primary) },
        "the active Pagination link" to { KozmosPaginationLink(text = "2", isActive = true, onClick = {}) },
        "a Timeline's dot" to {
            KozmosTimeline { KozmosTimelineItem(isLast = true) { KozmosTimelineTitle(title = "Gate B12") } }
        },
        "a DirectionStep's icon" to {
            KozmosDirectionStep(type = DirectionType.Left, instruction = "Turn left", modifier = Modifier.width(180.dp))
        },
        "a selected RouteOptionCard's edge and icon" to {
            KozmosRouteOptionCard(
                option = KozmosRouteOptionPresentation(
                    id = "quickest", label = "Quickest", durationSeconds = 240.0, durationLabel = "4 min",
                    distanceMetres = 150.0, distanceLabel = "150 m", preference = KozmosRoutePreference.Quickest,
                    selected = true
                ),
                onSelect = {},
                modifier = Modifier.width(180.dp)
            )
        },
        "a selected NavigationItem's label" to { KozmosNavigationItem(label = "Maps", selected = true) },
        "a NavigationItem's focus ring" to { KozmosNavigationItem(label = "Maps", focusVisible = true) },
        "the selected BottomNavigation item" to {
            KozmosBottomNavigation(
                items = listOf(
                    BottomNavigationItem(title = "Home", icon = Icons.Default.Home, route = "home"),
                    BottomNavigationItem(title = "Maps", icon = Icons.Default.Place, route = "maps")
                ),
                currentRoute = "home",
                onNavigate = {}
            )
        },
        "an Itinerary's current step" to {
            KozmosItinerary(
                origin = "Gate B12",
                steps = listOf(
                    KozmosItineraryStep("1", listOf(KozmosInstructionPart("Turn left")), DirectionType.Left, isCurrent = true)
                ),
                destination = "Lounge",
                modifier = Modifier.width(180.dp)
            )
        },
        "the Toast's action" to { KozmosToast(title = "Saved", actionText = "Undo", onAction = {}, onDismiss = {}) },
        "the AI search icon" to { KozmosAISearchButton(onClick = {}) },
        "the Slider" to { KozmosSlider(value = 0.5f, onValueChange = {}, modifier = Modifier.width(160.dp)) },
        "the Listbox's check" to {
            KozmosListbox(
                options = listOf(KozmosListboxOption(value = "a", label = "Gate A")),
                selectedValues = listOf("a"),
                modifier = Modifier.width(180.dp)
            )
        },
        "the OTP field's active cell" to { KozmosOTPInput(value = "1", onValueChange = {}, length = 3) },
        "the CategoryField's edge" to { KozmosCategoryField(label = "Gates", onClear = {}) },
        "a selected CategoryTile's edge" to {
            KozmosCategoryTile(category = KozmosCategoryPresentation(id = "gates", label = "Gates", selected = true), onSelect = {})
        },
    )

    @Test
    fun themeTextIconsAndEdgesOnASurfaceAreTheme600InBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val expected = theme600(dark)
            for ((name, part) in onTheSurface) {
                val drawn = draw(dark, null, part)
                val at600 = drawn.count(expected, 2)
                val at500 = drawn.count(themeFill, 2)
                println("Decision 59 Android, ${mode(dark)}: $name: $at600 pixels of ${DrawnPixels.hex(expected)}, $at500 of #135BEC")
                if (at600 < 6) wrong += "${mode(dark)}: $name draws no ${DrawnPixels.hex(expected)} ($at600 pixels)"
                if (at500 > 0) wrong += "${mode(dark)}: $name still draws $at500 pixels of #135BEC"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }
}
