package com.kozmos.components.multiselect

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import com.kozmos.components.Press
import com.kozmos.components.edgesOfSquare
import com.kozmos.components.live
import com.kozmos.components.press
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * MultiSelect's clear and chevron are 44dp targets, as React's Combobox
 * draws its clear and chevron (`h-field w-field`, 44 in touch), and as #392
 * makes SwiftUI's MultiSelect's. They were 36dp IconButtons. Each reaches 4dp
 * above and below its 36dp row, into the 6dp over it and the field's
 * padding under it, so the field keeps its height; the chevron also takes
 * 8dp of the field's end padding, so it runs to the field's end, and the
 * clear sits beside it. The glyphs keep their sizes and colours.
 *
 * The field is laid out in a scrolling column, as a form lays it out: in a
 * parent that bounds its height, its search field fills that height
 * (`fillMaxHeight` in a Row of no height of its own), whatever its buttons.
 *
 * Presses 1dp inside each edge of a 44dp square on each control's centre,
 * off its glyph, by a pointer Compose does not widen ([Press.Pointer]), so
 * they reach the control only where its own box does, and by a finger.
 */
class KozmosMultiSelectTargetTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val options = listOf(KozmosListboxOption("a", "Gate A"), KozmosListboxOption("b", "Gate B"))

    private var density = 1f
    private var field = Rect.Zero

    @Composable
    private fun Field(selected: List<String>, rtl: Boolean, onClear: () -> Unit = {}, onOpen: () -> Unit = {}) {
        density = LocalDensity.current.density
        CompositionLocalProvider(LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr) {
            KozmosMaterialTheme {
                Column(Modifier.verticalScroll(rememberScrollState()).padding(24.dp).width(320.dp)) {
                    KozmosMultiSelect(
                        selectedValues = selected,
                        onValueChange = { if (it.isEmpty()) onClear() },
                        searchValue = "",
                        onSearchValueChange = {},
                        options = options,
                        // The field alone: no label, helper or list. The chevron
                        // asks to open it; the clear asks to close it.
                        expanded = false,
                        onExpandedChange = { if (it) onOpen() },
                        modifier = Modifier.onGloballyPositioned { field = it.boundsInRoot() }
                    )
                }
            }
        }
    }

    /** In dp. */
    private fun Rect.inDp() = Rect(left / density, top / density, right / density, bottom / density)

    private fun Rect.size() = "%.1f×%.1f".format(width, height)

    @Test fun theClearAndTheChevronAre44dpAndTheFieldKeepsItsHeight() {
        val measured = mutableMapOf<String, String>()
        val expected = mutableMapOf<String, String>()
        for (rtl in listOf(false, true)) {
            val direction = if (rtl) "right to left" else "left to right"
            for (selected in listOf(emptyList(), listOf("a"))) {
                val case = "$direction, ${if (selected.isEmpty()) "nothing chosen" else "Gate A chosen"}"
                paparazzi.live(content = { Field(selected, rtl) }) {
                    val box = field.inDp()
                    val chevron = read().named("Open options").frame.inDp()
                    measured["$case: the chevron"] = chevron.size()
                    expected["$case: the chevron"] = "44.0×44.0"
                    // The field as it was laid out with 36dp buttons: 48dp, and
                    // 82dp with a row of chips above the search field.
                    measured["$case: the field's height"] = "%.1f".format(box.height)
                    expected["$case: the field's height"] = if (selected.isEmpty()) "48.0" else "82.0"
                    measured["$case: from the chevron's end to the field's"] =
                        "%.1f".format(if (rtl) chevron.left - box.left else box.right - chevron.right)
                    expected["$case: from the chevron's end to the field's"] = "0.0"
                    if (selected.isNotEmpty()) {
                        val clear = read().named("Clear selected options").frame.inDp()
                        measured["$case: the clear"] = clear.size()
                        expected["$case: the clear"] = "44.0×44.0"
                        measured["$case: from the clear to the chevron"] =
                            "%.1f".format(if (rtl) clear.left - chevron.right else chevron.left - clear.right)
                        expected["$case: from the clear to the chevron"] = "0.0"
                    }
                }
            }
        }
        println("MultiSelect Android, the clear and the chevron: $measured")
        assertEquals(expected, measured)
    }

    @Test fun aPressAnywhereInEitherTargetReachesIt() {
        val missed = mutableListOf<String>()
        for (rtl in listOf(false, true)) {
            for (how in Press.values()) {
                val case = "${if (rtl) "right to left" else "left to right"}, $how"
                var clears = 0
                var opens = 0
                paparazzi.live(durationMillis = 6000, content = { Field(listOf("a"), rtl, { clears++ }, { opens++ }) }) {
                    for (name in listOf("Clear selected options", "Open options")) {
                        for ((edge, point) in edgesOfSquare(read().named(name).frame, 44f, density)) {
                            clears = 0
                            opens = 0
                            press(point, how)
                            val reached = when {
                                clears == 1 && opens == 0 -> "Clear selected options"
                                opens == 1 && clears == 0 -> "Open options"
                                else -> "clears=$clears opens=$opens"
                            }
                            if (reached != name) missed += "$case: $name's $edge reached $reached"
                        }
                    }
                }
            }
        }
        println("MultiSelect Android, presses that missed: $missed")
        assertEquals("the presses that missed their control", emptyList<String>(), missed)
    }
}
