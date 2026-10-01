package com.kozmos.compat

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.dp
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.manoeuvrecard.KozmosManoeuvreCard
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.LocalKozmosSurfaceStyle
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * A ManoeuvreCard call written against 0.5.0 — the release of #129,
 * `4e87dfbd` — still compiles, and still puts every value where it went.
 *
 * `instructionLines` (GAP-094) was added after `surface`, before the
 * trailing `itinerary`, so that the lambda stays last. A call that passed
 * 0.5.0's twelve parameters by position then sent the itinerary to
 * `instructionLines` and failed to compile. An overload with 0.5.0's
 * parameters keeps that call. #164's ReleasedParameterOrderTest keeps the
 * other released calls; this is the manoeuvre card's case, for it to take in
 * when the two meet.
 *
 * Every call below compiles: none is ambiguous between the two.
 */
class ManoeuvreCardReleasedOrderTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    /** One node as TalkBack is told about it: its name, its text, its click's name, its tag, its size. */
    private data class Read(
        val description: String?,
        val texts: List<String>,
        val clickLabel: String?,
        val tag: String?,
        val heightPx: Float,
        val scrolls: Boolean
    )

    /** What the composition gives TalkBack, once laid out, and what its itinerary read. */
    private class Tree(val merged: List<Read>, val unmerged: List<Read>, val density: Float) {
        fun named(description: String): Read = merged.singleOrNull { it.description == description }
            ?: error("expected one node named \"$description\", found ${merged.mapNotNull { it.description }}")
    }

    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    private fun SemanticsNode.read() = Read(
        description = config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString(),
        texts = config.getOrNull(SemanticsProperties.Text)?.map { it.text }.orEmpty(),
        clickLabel = config.getOrNull(SemanticsActions.OnClick)?.label,
        tag = config.getOrNull(SemanticsProperties.TestTag),
        heightPx = boundsInRoot.height,
        scrolls = config.getOrNull(SemanticsProperties.VerticalScrollAxisRange) != null
    )

    private fun read(content: @Composable () -> Unit): Tree {
        var tree: Tree? = null
        paparazzi.snapshot {
            val view = LocalView.current
            val density = LocalDensity.current.density
            Box(
                Modifier.width(358.dp).onGloballyPositioned {
                    val owner = (view as ViewRootForTest).semanticsOwner
                    tree = Tree(
                        merged = owner.rootSemanticsNode.flatten().map { it.read() },
                        unmerged = owner.unmergedRootSemanticsNode.flatten().map { it.read() },
                        density = density
                    )
                }
            ) {
                MaterialTheme { content() }
            }
        }
        return checkNotNull(tree) { "the card was never laid out" }
    }

    /**
     * 0.5.0's twelve parameters, by position, the itinerary in the
     * parentheses: every value lands where it did — the modifier's tag, the
     * instruction and detail in the name TalkBack hears, the three labels,
     * the cap, the surface the itinerary is told it is on, the itinerary.
     */
    @Test
    fun theReleasedPositionalCallStillCompilesAndPutsEachValueWhereItWent() {
        val toggled = mutableListOf<String>()
        // The surface the card tells what it holds: null outside a card.
        val surfaces = mutableListOf<KozmosSurfaceStyle?>()
        val closed = read {
            KozmosManoeuvreCard(
                DirectionType.Right,
                "Biegen Sie rechts ab",
                false,
                { toggled += "closed" },
                Modifier.testTag("released"),
                "40 m · Ebene 1",
                "Wegbeschreibung zeigen",
                "Wegbeschreibung ausblenden",
                "Aktuelles Manöver",
                240.dp,
                KozmosSurfaceStyle.Glass,
                { Text("Haupteingang") }
            )
        }
        assertTrue("the modifier is not the card's", closed.unmerged.any { it.tag == "released" })
        closed.named("Aktuelles Manöver")
        val row = closed.named("Biegen Sie rechts ab, 40 m · Ebene 1")
        assertEquals("Wegbeschreibung zeigen", row.clickLabel)
        assertTrue("the closed card draws its itinerary", closed.unmerged.none { "Haupteingang" in it.texts })

        val open = read {
            KozmosManoeuvreCard(
                DirectionType.Right,
                "Biegen Sie rechts ab",
                true,
                { toggled += "open" },
                Modifier,
                "40 m · Ebene 1",
                "Wegbeschreibung zeigen",
                "Wegbeschreibung ausblenden",
                "Aktuelles Manöver",
                240.dp,
                KozmosSurfaceStyle.Glass,
                {
                    surfaces.add(LocalKozmosSurfaceStyle.current)
                    Column {
                        Text("Haupteingang")
                        Box(Modifier.height(1000.dp))
                    }
                }
            )
        }
        val hide = open.named("Wegbeschreibung ausblenden")
        assertEquals("Wegbeschreibung ausblenden", hide.clickLabel)
        assertTrue("the open card does not draw its itinerary", open.unmerged.any { "Haupteingang" in it.texts })
        assertEquals("the itinerary is not told it is on glass", listOf(KozmosSurfaceStyle.Glass), surfaces.distinct())
        val list = open.unmerged.single { it.scrolls }
        assertEquals("the itinerary is not capped at 240", 240f, list.heightPx / open.density, 1f)
        assertEquals(emptyList<String>(), toggled)
    }

    /**
     * 0.5.0's trailing-lambda forms: the required parameters alone, and all
     * eleven before the itinerary by position.
     */
    @Test
    fun theReleasedTrailingLambdaFormsStillCompile() {
        val tree = read {
            Column {
                KozmosManoeuvreCard(DirectionType.Left, "Links abbiegen", false, {}) { Text("A") }
                KozmosManoeuvreCard(
                    DirectionType.Straight,
                    "Geradeaus",
                    false,
                    {},
                    Modifier,
                    null,
                    "Zeigen",
                    "Ausblenden",
                    "Manöver",
                    320.dp,
                    KozmosSurfaceStyle.Solid
                ) { Text("B") }
            }
        }
        tree.named("Links abbiegen")
        assertEquals("Zeigen", tree.named("Geradeaus").clickLabel)
    }

    /**
     * By name, 0.5.0's words and the new one: `instructionLines` is reached
     * by name, in the call's parentheses or with the itinerary by name.
     */
    @Test
    fun theNamedFormsCompileWithAndWithoutTheNewParameter() {
        val tree = read {
            Column {
                KozmosManoeuvreCard(
                    type = DirectionType.Right,
                    instruction = "Rechts abbiegen",
                    expanded = false,
                    onToggle = {},
                    manoeuvreLabel = "Erstes Manöver"
                ) { Text("A") }
                KozmosManoeuvreCard(
                    type = DirectionType.Right,
                    instruction = "Rechts abbiegen, dann geradeaus",
                    expanded = false,
                    onToggle = {},
                    instructionLines = 2,
                    manoeuvreLabel = "Zweites Manöver"
                ) { Text("B") }
                KozmosManoeuvreCard(
                    type = DirectionType.Left,
                    instruction = "Links abbiegen",
                    expanded = false,
                    onToggle = {},
                    manoeuvreLabel = "Drittes Manöver",
                    instructionLines = 1,
                    itinerary = { Text("C") }
                )
            }
        }
        tree.named("Erstes Manöver")
        tree.named("Zweites Manöver")
        tree.named("Drittes Manöver")
    }

    /** The new parameter by position too: twelfth, after the surface, before the itinerary. */
    @Test
    fun theNewParameterIsReachedByPosition() {
        val tree = read {
            Column {
                KozmosManoeuvreCard(
                    DirectionType.Right,
                    "Rechts abbiegen",
                    false,
                    {},
                    Modifier,
                    null,
                    "Zeigen",
                    "Ausblenden",
                    "Viertes Manöver",
                    320.dp,
                    KozmosSurfaceStyle.Solid,
                    2
                ) { Text("D") }
                KozmosManoeuvreCard(
                    DirectionType.Right,
                    "Rechts abbiegen",
                    false,
                    {},
                    Modifier,
                    null,
                    "Zeigen",
                    "Ausblenden",
                    "Fünftes Manöver",
                    320.dp,
                    KozmosSurfaceStyle.Solid,
                    2,
                    { Text("E") }
                )
            }
        }
        tree.named("Viertes Manöver")
        tree.named("Fünftes Manöver")
    }
}
