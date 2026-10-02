package com.kozmos.components.navigation

import android.text.Spanned
import android.text.style.LocaleSpan
import android.view.accessibility.AccessibilityNodeInfo
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.text.AnnotatedString
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.KozmosDirectionStep
import com.kozmos.contracts.KozmosInstructionPart
import com.kozmos.contracts.KozmosInstructionPartRole
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep
import com.kozmos.components.manoeuvrecard.KozmosManoeuvreCard
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.LocalKozmosSurfaceStyle
import com.kozmos.components.surface.kozmosMutedForeground
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class KozmosInstructionPartsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    @Test fun directionRetainsForeignSpeechRange() {
        val parts = listOf(KozmosInstructionPart("عند 📍 "), KozmosInstructionPart("Lumen Books", lang = "en-GB"),
            KozmosInstructionPart(" على يسارك", role = KozmosInstructionPartRole.Secondary), KozmosInstructionPart(" انعطف يميناً"))
        val sentence = parts.joinToString("") { it.text }
        var actual: AnnotatedString? = null
        paparazzi.snapshot {
            val view = LocalView.current
            Box(Modifier.onGloballyPositioned {
                actual = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.flatten()
                    .flatMap { it.config.getOrNull(SemanticsProperties.Text).orEmpty() }
                    .firstOrNull { it.text == sentence }
            }) {
                MaterialTheme { KozmosDirectionStep(DirectionType.Right, parts) }
            }
        }
        assertNotNull(actual)
        val range = actual!!.spanStyles.firstOrNull { it.item.localeList != null }
        assertNotNull("The English name must carry its speech locale in the accessible text", range)
        assertEquals(sentence.indexOf("Lumen Books"), range!!.start)
        assertEquals("en-GB", range.item.localeList!![0].toLanguageTag())
    }

    @Test fun accessibilityNodesRetainLocaleSpansForAllThreeComponents() {
        val fixtures = listOf(
            listOf(KozmosInstructionPart("عند 📍 "), KozmosInstructionPart("Lumen Books", lang = "en-GB"),
                KozmosInstructionPart(" على يسارك", role = KozmosInstructionPartRole.Secondary), KozmosInstructionPart(" انعطف يميناً")),
            listOf(KozmosInstructionPart("Biegen Sie bei "), KozmosInstructionPart("Lumen Books", lang = "en-GB"),
                KozmosInstructionPart(" auf der linken Seite", role = KozmosInstructionPartRole.Secondary), KozmosInstructionPart(" rechts ab")),
            listOf(KozmosInstructionPart("左側の", role = KozmosInstructionPartRole.Secondary),
                KozmosInstructionPart("Lumen Books", lang = "en-GB"), KozmosInstructionPart("で右折してください"))
        )
        for (parts in fixtures) {
        val sentence = parts.joinToString("") { it.text }
        for (kind in 0..2) {
            var locale: String? = null
            var start = -1
            var end = -1
            var activation = false
            var calls = 0
            var selected = false
            var platformState: CharSequence? = null
            paparazzi.snapshot {
                val view = LocalView.current
                Box(Modifier.onGloballyPositioned {
                    val node = (view as ViewRootForTest).semanticsOwner.rootSemanticsNode.flatten().first {
                        it.config.getOrNull(SemanticsProperties.Text).orEmpty().any { text -> text.text == sentence }
                    }
                    val info = view.accessibilityNodeProvider?.createAccessibilityNodeInfo(node.id)
                    val text = info?.text as? Spanned
                    val span = text?.getSpans(0, text.length, LocaleSpan::class.java)?.firstOrNull()
                    locale = span?.locales?.get(0)?.toLanguageTag()
                    start = if (span == null) -1 else text.getSpanStart(span)
                    end = if (span == null) -1 else text.getSpanEnd(span)
                    selected = node.config.getOrNull(SemanticsProperties.Selected) == true
                    platformState = info?.stateDescription
                    if (kind == 2) {
                        assertTrue(info?.isClickable == true)
                        activation = view.accessibilityNodeProvider.performAction(node.id, AccessibilityNodeInfo.ACTION_CLICK, null)
                    }
                }) {
                    MaterialTheme {
                        when (kind) {
                            0 -> KozmosDirectionStep(DirectionType.Right, parts)
                            1 -> KozmosItinerary("Start", listOf(KozmosItineraryStep("one", parts, DirectionType.Right, true)), "End")
                            else -> KozmosManoeuvreCard(DirectionType.Right, parts, false, { calls += 1 }) {}
                        }
                    }
                }
            }
            assertEquals("Component $kind must preserve the platform LocaleSpan", "en-GB", locale)
            assertEquals(sentence.indexOf("Lumen Books"), start)
            assertEquals(sentence.indexOf("Lumen Books") + "Lumen Books".length, end)
            if (kind == 1) {
                assertTrue(selected)
                // Compose exposes non-tab selection as a spoken state, not isSelected.
                assertEquals("Selected", platformState?.toString())
            }
            if (kind == 2) { assertTrue(activation); assertEquals(1, calls) }
        }
        }
    }

    @Test fun secondaryPartsRespectTheCardsOwnGlassSurface() {
        val parts = listOf(KozmosInstructionPart("Turn right"), KozmosInstructionPart(" on your left", KozmosInstructionPartRole.Secondary, "en"))
        for (surface in KozmosSurfaceStyle.values()) {
            var actual: AnnotatedString? = null
            var expected = androidx.compose.ui.graphics.Color.Unspecified
            paparazzi.snapshot {
                val view = LocalView.current
                expected = kozmosMutedForeground(surface)
                Box(Modifier.onGloballyPositioned {
                    actual = (view as ViewRootForTest).semanticsOwner.rootSemanticsNode.flatten()
                        .flatMap { it.config.getOrNull(SemanticsProperties.Text).orEmpty() }
                        .firstOrNull { it.text == "Turn right on your left" }
                }) {
                    // The card's explicit surface wins over its ancestor's contrary value.
                    CompositionLocalProvider(LocalKozmosSurfaceStyle provides
                        if (surface == KozmosSurfaceStyle.Glass) KozmosSurfaceStyle.Solid else KozmosSurfaceStyle.Glass) {
                        MaterialTheme { KozmosManoeuvreCard(DirectionType.Right, parts, false, {}, surface = surface) {} }
                    }
                }
            }
            val style = actual!!.spanStyles.first { it.start == "Turn right".length }.item
            assertEquals(expected, style.color)
            assertEquals(androidx.compose.ui.text.font.FontWeight.Normal, style.fontWeight)
        }
    }

    @Test fun itineraryCopyKeepsOneCanonicalInstructionAndLegacyCalls() {
        val parts = mutableListOf(KozmosInstructionPart("Lumen Books", lang = "en"))
        val original = KozmosItineraryStep("one", parts, DirectionType.Right)
        parts.clear()
        assertEquals("Lumen Books", original.instruction)
        assertEquals("en", original.copy(isCurrent = true).instructionParts.single().lang)
        val replaced = original.copy(instruction = "Turn left")
        assertEquals("Turn left", replaced.instruction)
        assertEquals(null, replaced.instructionParts.single().lang)
        val (id, instruction, type, current) = original.copy("new", "Go", DirectionType.Straight, true)
        assertEquals("new", id)
        assertEquals("Go", instruction)
        assertEquals(DirectionType.Straight, type)
        assertTrue(current)
        assertEquals(original, original.copy())
        assertEquals(original.hashCode(), original.copy().hashCode())
        assertEquals("本", original.copy(instruction = listOf(KozmosInstructionPart("本", lang = "ja"))).instruction)
    }
}
