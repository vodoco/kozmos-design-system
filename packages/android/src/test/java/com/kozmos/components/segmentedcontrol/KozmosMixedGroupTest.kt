package com.kozmos.components.segmentedcontrol

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.Role
import com.kozmos.components.LiveSemantics
import com.kozmos.components.ReadSemantics
import com.kozmos.components.live
import com.kozmos.components.radio.KozmosRadioGroup
import com.kozmos.components.radio.KozmosRadioGroupItem
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decisions 188 and 191: a RadioGroup or SegmentedControl of a
 * multi-selection whose features chose different options has no option
 * selected, and says "Multiple values" under its options, once; a choice
 * ends it, and "Reset to multiple values" takes it back and hands focus to
 * the options. As React's do.
 */
class KozmosMixedGroupTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val labels = listOf("Hours", "Closed", "Always open")

    private fun ReadSemantics.options() = merged.filter { it.role == Role.RadioButton }
    private fun ReadSemantics.chosen() = options().filter { it.selected == true }.map { it.texts.joinToString() }
    private fun ReadSemantics.mixedSaid() = merged.sumOf { node ->
        (node.texts + listOfNotNull(node.stateDescription, node.description)).count { it == "Multiple values" }
    }
    private fun LiveSemantics.reset() = read().merged.singleOrNull { "Reset to multiple values" in it.texts }

    private enum class Kind { RadioGroup, SegmentedControl }

    @androidx.compose.runtime.Composable
    private fun Part(
        kind: Kind,
        selected: Int,
        onSelected: (Int) -> Unit,
        mixed: Boolean,
        onResetMixed: (() -> Unit)? = null,
        enabled: Boolean = true
    ) {
        KozmosMaterialTheme {
            when (kind) {
                Kind.RadioGroup -> KozmosRadioGroup(mixed = mixed, onResetMixed = onResetMixed, enabled = enabled) {
                    labels.forEachIndexed { index, label ->
                        KozmosRadioGroupItem(
                            value = "$index",
                            selectedValue = "$selected",
                            onOptionSelected = { onSelected(it.toInt()) },
                            label = label,
                            enabled = enabled
                        )
                    }
                }
                Kind.SegmentedControl -> KozmosSegmentedControl(
                    options = labels,
                    selectedIndex = selected,
                    onOptionSelected = onSelected,
                    size = SegmentedControlSize.Sm,
                    enabled = enabled,
                    mixed = mixed,
                    onResetMixed = onResetMixed
                )
            }
        }
    }

    @Test fun aMixedGroupSelectsNothingAndSaysMultipleValuesOnce() {
        for (kind in Kind.values()) {
            val tree = paparazzi.readSemantics { Part(kind, selected = 1, onSelected = {}, mixed = true, onResetMixed = {}) }
            assertEquals("$kind: three options", 3, tree.options().size)
            assertEquals("$kind: nothing selected while mixed", emptyList<String>(), tree.chosen())
            assertEquals("$kind: said once", 1, tree.mixedSaid())
            // Under the options, read after them.
            val line = tree.merged.single { "Multiple values" in it.texts }
            assertTrue("$kind: the line is under the options", tree.options().all { it.bounds.bottom <= line.bounds.top })
            assertNull("$kind: no reset while mixed", tree.merged.singleOrNull { "Reset to multiple values" in it.texts })
        }
    }

    @Test fun aChoiceEndsItAndTheResetBringsItBackWithFocusOnTheOptions() {
        for (kind in Kind.values()) {
            var picked = -1
            paparazzi.live(content = {
                var edit by remember { mutableStateOf<Int?>(null) }
                Part(
                    kind,
                    selected = edit ?: 0,
                    onSelected = { picked = it; edit = it },
                    mixed = edit == null,
                    onResetMixed = { edit = null }
                )
            }) {
                frames(2)
                assertEquals("$kind: nothing selected", emptyList<String>(), read().chosen())
                assertNull("$kind: no reset while mixed", reset())

                read().options().single { it.texts == listOf("Closed") }.click!!.invoke()
                frames(3)
                assertEquals("$kind: the choice is reported", 1, picked)
                assertEquals("$kind: the choice shows", listOf("Closed"), read().chosen())
                assertEquals("$kind: no longer said as mixed", 0, read().mixedSaid())
                val reset = checkNotNull(reset()) { "$kind: the reset is offered once chosen" }
                assertEquals(Role.Button, reset.role)

                reset.click!!.invoke()
                frames(3)
                assertEquals("$kind: nothing selected again", emptyList<String>(), read().chosen())
                assertEquals("$kind: said once again", 1, read().mixedSaid())
                assertNull("$kind: the reset goes", reset())
                val focused = read().options().filter { it.focused == true }.map { it.texts.joinToString() }
                assertEquals("$kind: focus is back on the chosen option", listOf("Closed"), focused)
            }
        }
    }

    @Test fun noResetWhileDisabled() {
        for (kind in Kind.values()) {
            val tree = paparazzi.readSemantics {
                Part(kind, selected = 0, onSelected = {}, mixed = false, onResetMixed = {}, enabled = false)
            }
            assertNull("$kind: no reset while disabled", tree.merged.singleOrNull { "Reset to multiple values" in it.texts })
        }
    }

    @Test fun withoutMixedTheGroupIsWhatItWas() {
        for (kind in Kind.values()) {
            val tree = paparazzi.readSemantics { Part(kind, selected = 1, onSelected = {}, mixed = false) }
            assertEquals("$kind: its choice selected", listOf("Closed"), tree.chosen())
            assertEquals("$kind: nothing said of mixed", 0, tree.mixedSaid())
            assertNull("$kind: no reset", tree.merged.singleOrNull { "Reset to multiple values" in it.texts })
        }
    }

    @Test fun takesTheProductsWords() {
        val mixed = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosSegmentedControl(options = labels, selectedIndex = 0, onOptionSelected = {}, mixed = true, mixedLabel = "Mehrere Werte")
            }
        }
        assertTrue(mixed.merged.any { "Mehrere Werte" in it.texts })
        val edited = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosRadioGroup(onResetMixed = {}, resetMixedLabel = "Auf mehrere Werte zurücksetzen") {
                    KozmosRadioGroupItem(value = "a", selectedValue = "a", onOptionSelected = {}, label = "A")
                }
            }
        }
        assertTrue(edited.merged.any { "Auf mehrere Werte zurücksetzen" in it.texts && it.role == Role.Button })
    }
}
