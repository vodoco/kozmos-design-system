package com.kozmos.components.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
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
import com.kozmos.components.badge.KozmosBadge
import com.kozmos.components.bottomnavigation.BottomNavigationItem
import com.kozmos.components.bottomnavigation.KozmosBottomNavigation
import com.kozmos.components.categoryfield.KozmosCategoryField
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.categorytile.KozmosCategoryTile
import com.kozmos.components.categorytile.KozmosCategoryTint
import com.kozmos.components.counter.KozmosInkedFill
import com.kozmos.components.chip.KozmosChip
import com.kozmos.components.counter.CounterTone
import com.kozmos.components.counter.KozmosCounter
import com.kozmos.components.checkbox.KozmosCheckbox
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.KozmosDirectionStep
import com.kozmos.components.drawn
import com.kozmos.components.floatingactionbutton.KozmosFloatingActionButton
import com.kozmos.components.floorselector.KozmosFloorSelector
import com.kozmos.components.icon.KozmosIcon
import com.kozmos.components.icon.KozmosIconColor
import com.kozmos.components.icon.KozmosIconSize
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.iconbutton.KozmosIconButtonVariant
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep
import com.kozmos.components.link.KozmosLink
import com.kozmos.components.listbox.KozmosListbox
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.locationpin.KozmosLocationPin
import com.kozmos.components.locationpin.KozmosLocationPinSize
import com.kozmos.components.locationpin.KozmosLocationPinVariant
import com.kozmos.components.manoeuvrecard.KozmosManoeuvreCard
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButton
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonEmphasis
import com.kozmos.components.navigationitem.KozmosNavigationItem
import com.kozmos.components.otpinput.KozmosOTPInput
import com.kozmos.components.pagination.KozmosPaginationLink
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.radio.KozmosRadioGroupItem
import com.kozmos.components.routeoptioncard.KozmosRouteOptionCard
import com.kozmos.components.savelocationcard.KozmosSaveLocationCard
import com.kozmos.components.slider.KozmosSlider
import com.kozmos.components.splitbutton.KozmosSplitButton
import com.kozmos.components.stepper.KozmosStepper
import com.kozmos.components.switch.KozmosSwitch
import com.kozmos.components.tag.KozmosTag
import com.kozmos.components.themeprovider.KozmosMaterialTheme
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
import com.kozmos.tokens.KozmosColors
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
                KozmosMaterialTheme {
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

    /** The box round every pixel drawn in [colour] in the region, as x and y ranges; null if there is none. */
    private fun DrawnPixels.boundsOf(
        colour: Int,
        xs: IntRange = 0 until width,
        ys: IntRange = 0 until height
    ): Pair<IntRange, IntRange>? {
        var left = Int.MAX_VALUE
        var top = Int.MAX_VALUE
        var right = -1
        var bottom = -1
        for (y in ys) for (x in xs) {
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
        "a filled Button and its label" to { KozmosButton(onClick = {}) { Text("Go") } },
        "a default IconButton and its icon" to {
            KozmosIconButton(icon = Icons.Default.Add, onClick = {}, contentDescription = "Add", variant = KozmosIconButtonVariant.Default)
        },
        "a selected Chip and its words" to { KozmosChip(text = "Gates", selected = true) },
        "a default Badge and its words" to { KozmosBadge(text = "Open") },
        "a brand Counter and its number" to { KozmosCounter(text = "8", tone = CounterTone.Brand) },
        "the CategoryField's count pill and its number" to {
            KozmosCategoryField(label = "Gates", onClear = {}, count = 8, modifier = Modifier.width(180.dp))
        },
        "SaveLocationCard's saved disc and its car" to {
            KozmosSaveLocationCard(modifier = Modifier.width(180.dp), isSaved = true)
        },
        "a filled MapControlButton on and its mark" to {
            KozmosMapControlButton(
                label = "Focus",
                onClick = {},
                icon = { Icon(Icons.Default.NearMe, contentDescription = null) },
                emphasis = KozmosMapControlButtonEmphasis.Filled,
                pressed = true
            )
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

    /**
     * On the selected level, itself the theme fill, the FloorSelector's result
     * count inverts (Olcay, 2026-10-07): the theme foreground, white, with its
     * number in the fill. In the fill it had no edge on its own square.
     */
    @Test
    fun onTheSelectedLevelTheResultCountInverts() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val drawn = draw(dark, Color(0xFF808080)) {
                KozmosFloorSelector(
                    floors = listOf(KozmosFloorPresentation(id = "1", label = "Level 1", shortLabel = "1", resultCount = 8)),
                    selectedFloor = "1",
                    onFloorSelect = {},
                    showResultCounts = true
                )
            }
            val square = drawn.boundsOf(themeFill)
            if (square == null) {
                wrong += "${mode(dark)}: the selected level draws no #135BEC"
                continue
            }
            // The marker sits flush in the square's top trailing corner: its
            // two fifths each way, React's 16 of 40.
            val (xs, ys) = square
            val cornerXs = (xs.last - (xs.last - xs.first) * 2 / 5)..xs.last
            val cornerYs = ys.first..(ys.first + (ys.last - ys.first) * 2 / 5)
            val area = (cornerXs.last - cornerXs.first + 1) * (cornerYs.last - cornerYs.first + 1)
            val marker = drawn.count(white, 12, cornerXs, cornerYs)
            println("Decision 59 Android, ${mode(dark)}: the selected level's count corner is $marker of $area pixels white")
            if (marker * 2 < area) {
                wrong += "${mode(dark)}: the count on the selected level is not white ($marker of $area pixels in its corner)"
                continue
            }
            // And its number is the fill: a white number on the white marker
            // would leave the corner as white as this, and say nothing.
            val disc = drawn.boundsOf(white, cornerXs, cornerYs)
            val number = disc?.let { (dx, dy) -> drawn.count(themeFill, 24, dx.middleHalf(), dy.middleHalf()) } ?: 0
            println("Decision 59 Android, ${mode(dark)}: the selected level's count has $number pixels of #135BEC in its middle")
            if (number < 3) {
                wrong += "${mode(dark)}: the count's number on the selected level is not #135BEC ($number pixels in the marker's middle)"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * The largest run of touching pixels in [colour], as its box and its size:
     * a counter's pill is one solid piece, where a word beside it is several
     * small ones.
     */
    private fun DrawnPixels.largestPiece(colour: Int, tolerance: Int, xs: IntRange, ys: IntRange): Pair<Pair<IntRange, IntRange>, Int>? {
        val seen = HashSet<Long>()
        var best: Pair<Pair<IntRange, IntRange>, Int>? = null
        for (y0 in ys) for (x0 in xs) {
            val key = x0.toLong() shl 32 or y0.toLong()
            if (key in seen || !DrawnPixels.matches(argb(x0, y0), colour, tolerance)) continue
            seen += key
            val queue = ArrayDeque(listOf(x0 to y0))
            var size = 0
            var left = x0; var right = x0; var top = y0; var bottom = y0
            while (queue.isNotEmpty()) {
                val (x, y) = queue.removeFirst()
                size++
                left = minOf(left, x); right = maxOf(right, x); top = minOf(top, y); bottom = maxOf(bottom, y)
                for ((nx, ny) in listOf(x + 1 to y, x - 1 to y, x to y + 1, x to y - 1)) {
                    if (nx !in xs || ny !in ys) continue
                    val next = nx.toLong() shl 32 or ny.toLong()
                    if (next in seen || !DrawnPixels.matches(argb(nx, ny), colour, tolerance)) continue
                    seen += next
                    queue.addLast(nx to ny)
                }
            }
            if (best == null || size > best.second) best = ((left..right) to (top..bottom)) to size
        }
        return best
    }

    /**
     * A default Badge's counter inverts on the theme fill, as the FloorSelector's
     * count does on its selected level (Olcay, 2026-10-07): the theme
     * foreground, white, with its number in the fill, in both themes. It was
     * the page's own background and foreground, a dark pill in the dark.
     */
    @Test
    fun aDefaultBadgesCounterInverts() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val drawn = draw(dark, Color(0xFF808080)) { KozmosBadge(text = "Gates", counter = "8", showCounter = true) }
            val badge = drawn.boundsOf(themeFill)
            if (badge == null) {
                wrong += "${mode(dark)}: the badge draws no #135BEC"
                continue
            }
            // The pill: a solid piece, filling most of its box, and nearly half
            // as tall as the badge (20 of 44). A letter of the words is
            // neither: under half its box, and a quarter of the badge tall.
            val pill = drawn.largestPiece(white, 12, badge.first, badge.second)
            val (px, py) = pill?.first ?: (IntRange.EMPTY to IntRange.EMPTY)
            val boxArea = (px.last - px.first + 1) * (py.last - py.first + 1)
            val tall = (py.last - py.first + 1).toFloat() / (badge.second.last - badge.second.first + 1)
            println(
                "Decision 59 Android, ${mode(dark)}: the badge's largest white piece is ${pill?.second} pixels " +
                    "in a $boxArea-pixel box ${"%.2f".format(tall)} of the badge tall"
            )
            if (pill == null || pill.second * 2 < boxArea || tall < 0.38f) {
                wrong += "${mode(dark)}: the badge's counter is no white pill (largest white piece ${pill?.second ?: 0} pixels)"
                continue
            }
            val number = drawn.count(themeFill, 24, px.middleHalf(), py.middleHalf())
            println("Decision 59 Android, ${mode(dark)}: the counter has $number pixels of #135BEC in its middle")
            if (number < 3) wrong += "${mode(dark)}: the counter's number is not #135BEC ($number pixels in its middle)"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * The accent pin is theme variant 1's 500, #4135F1 in both themes since
     * decision 63 (it was #4134F1, 2.99:1 on the dark page), and its number
     * the theme foreground, white, on it in both: foreground/1000 is black in
     * the dark, 3.00:1, where white reads 6.99:1.
     */
    @Test
    fun anAccentPinsNumberIsWhiteInBothThemes() {
        val accent = 0xFF4135F1.toInt()
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val drawn = draw(dark, Color(0xFF808080)) {
                KozmosLocationPin(variant = KozmosLocationPinVariant.Accent, size = KozmosLocationPinSize.Lg, number = 8, selected = true)
            }
            val bounds = drawn.boundsOf(accent)
            if (bounds == null) {
                wrong += "${mode(dark)}: the accent pin draws no #4135F1"
                continue
            }
            val marks = drawn.count(white, 12, bounds.first.middleHalf(), bounds.second.middleHalf())
            println("Decision 59 Android, ${mode(dark)}: the accent pin has $marks white pixels in its middle")
            if (marks < 6) wrong += "${mode(dark)}: the accent pin's number is not white ($marks pixels)"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * Decision 68 (Olcay, 2026-10-08): a featured pin is the accent, #FAB735
     * in both themes by default, whatever its variant, tint or selection, and
     * it never shows its number (decision 55: a featured result's pin shows
     * its logo). Without a logo it shows a star where the number would be, in
     * the accent's ink, black, 11.89:1 on it.
     *
     * The intent changed with decision 68. This test said a featured pin's
     * number was dark on the alert's amber: the fill was alert 500, the same
     * #FAB735 the accent defaults to, so the fill alone cannot tell the two
     * apart, and the star and the missing number do. Against the code before
     * it, it fails in both themes: the numbered pin's mark is the 8, narrower
     * than it is tall, not a star, and the pins with no number draw no mark.
     */
    @Test
    fun aFeaturedPinIsTheAccentWithABlackStarAndNoNumberInBothThemes() {
        val accent = 0xFFFAB735.toInt()
        val black = 0xFF000000.toInt()
        val navy = KozmosCategoryTint(
            KozmosColors.semanticsCategoryAccentNavy,
            KozmosInkedFill(KozmosColors.semanticsCategoryFillNavy, KozmosColors.semanticsCategoryOnfillNavy)
        )
        val pins: List<Pair<String, @Composable () -> Unit>> = listOf(
            "a featured pin numbered 8" to { KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 8, featured = true) },
            "a featured pin with no number" to { KozmosLocationPin(size = KozmosLocationPinSize.Lg, featured = true) },
            "a featured pin with a navy tint" to {
                KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 8, featured = true, tint = navy)
            },
            "a selected featured pin" to {
                KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 8, selected = true, featured = true)
            },
        )
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for ((name, pin) in pins) {
                val drawn = draw(dark, Color(0xFF808080), pin)
                val bounds = drawn.boundsOf(accent)
                if (bounds == null) {
                    wrong += "${mode(dark)}: $name draws no #FAB735"
                    continue
                }
                val (mx, my) = bounds.first.middleHalf() to bounds.second.middleHalf()
                val inked = drawn.count(black, 24, mx, my)
                val pale = drawn.count(white, 24, mx, my)
                val mark = drawn.boundsOf(black, mx, my)
                val (wide, tall) = (mark?.first?.count() ?: 0) to (mark?.second?.count() ?: 0)
                println("Decision 68 Android, ${mode(dark)}: $name has a $wide x $tall black mark ($inked pixels) and $pale white pixels in its middle")
                if (inked < 6) wrong += "${mode(dark)}: $name has no black mark ($inked pixels)"
                // A star is about as wide as it is tall (20 by 19 in its
                // 24 box); a bold 8 is about two-thirds as wide.
                else if (wide < tall * 0.85f) wrong += "${mode(dark)}: $name's mark is $wide x $tall, a number's shape, not a star's"
                if (pale * 100 > inked) wrong += "${mode(dark)}: $name draws $pale white pixels in its middle"
            }
            // The numbered pin draws exactly what the unnumbered one does.
            val numbered = draw(dark, Color(0xFF808080)) { KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 8, featured = true) }
            val plain = draw(dark, Color(0xFF808080)) { KozmosLocationPin(size = KozmosLocationPinSize.Lg, featured = true) }
            var differ = 0
            for (y in 0 until minOf(numbered.height, plain.height)) for (x in 0 until minOf(numbered.width, plain.width)) {
                if (!DrawnPixels.matches(numbered.argb(x, y), plain.argb(x, y), 8)) differ++
            }
            println("Decision 68 Android, ${mode(dark)}: a featured pin numbered 8 differs from one with no number in $differ pixels")
            if (differ > 6) wrong += "${mode(dark)}: a featured pin shows its number ($differ pixels differ from the pin with none)"
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
