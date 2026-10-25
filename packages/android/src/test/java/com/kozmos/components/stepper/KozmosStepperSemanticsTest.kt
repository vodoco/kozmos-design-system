package com.kozmos.components.stepper

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React's stepper marks its current step `aria-current="step"`, so a screen
 * reader hears which step the visitor is on. Compose's said nothing of it:
 * TalkBack walked each step's number and name as separate words, the current
 * one like any other. Each step is now one node, its number and name
 * together, and the current step is selected, which TalkBack says in the
 * visitor's own language, as the breadcrumb's current page and the
 * navigation item's current destination are.
 */
class KozmosStepperSemanticsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val steps = listOf("Search", "Route", "Go")

    @Test fun eachStepIsOneNodeAndOnlyTheCurrentOneIsSelected() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { KozmosStepper(steps = steps, currentStep = 1) } }
        val read = tree.merged.filter { it.texts.isNotEmpty() }
        assertEquals(
            "what TalkBack walks: each node's words and whether it is selected",
            listOf(listOf("Search") to null, listOf("2", "Route") to true, listOf("3", "Go") to null),
            read.map { it.texts to it.selected }
        )
    }

    @Test fun whenEveryStepIsDoneNoneIsSelected() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { KozmosStepper(steps = steps, currentStep = 3) } }
        assertEquals(emptyList<Boolean>(), tree.merged.mapNotNull { it.selected })
    }
}
