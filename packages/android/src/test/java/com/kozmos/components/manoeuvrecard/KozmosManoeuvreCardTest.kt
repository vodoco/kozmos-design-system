package com.kozmos.components.manoeuvrecard

import android.os.SystemClock
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.Indication
import androidx.compose.foundation.IndicationInstance
import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.focusable
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.drawscope.ContentDrawScope
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.dp
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The manoeuvre card on a 390 phone, as MAP-111 asks for it and TalkBack and
 * a keyboard meet it: the whole instruction (GAP-094), every step of an
 * itinerary taller than the open card's cap (GAP-100), and focus going with
 * the disclosure (the review's T4). Composed in a host that keeps no
 * picture; what is read is what the card gives TalkBack and the keyboard.
 */
class KozmosManoeuvreCardTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    /** US1-DE-Turn: two lines cut it before the turn itself, "rechts ab". */
    private val german = "Biegen Sie bei Marlow Apotheke auf der linken Seite rechts ab"

    /** US1-DE-List: a German itinerary taller than the open card's cap. */
    private val germanSteps = listOf(
        KozmosItineraryStep("1", "Gehen Sie geradeaus am Brunnenhof vorbei", DirectionType.Straight),
        KozmosItineraryStep("2", "Nehmen Sie die Rolltreppe beim Brunnenhof nach oben zu Ebene 1", DirectionType.EscalatorUp),
        KozmosItineraryStep("3", "Biegen Sie bei Marlow Apotheke auf der linken Seite rechts ab", DirectionType.Right, isCurrent = true),
        KozmosItineraryStep("4", "Gehen Sie durch den Verbindungsgang zum Terminal B", DirectionType.Transition),
        KozmosItineraryStep("5", "Biegen Sie hinter dem Informationsschalter links ab", DirectionType.Left),
        KozmosItineraryStep("6", "Nehmen Sie den Aufzug nach unten zur Ankunftsebene", DirectionType.LiftDown),
        KozmosItineraryStep("7", "Gehen Sie geradeaus bis zum Ausgang der Gepäckausgabe", DirectionType.Straight),
        KozmosItineraryStep("8", "Biegen Sie an der Wechselstube rechts ab", DirectionType.Right),
        KozmosItineraryStep("9", "Sie haben Ihr Ziel erreicht", DirectionType.Destination)
    )

    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    /** Every node of the composition's unmerged semantics, as laid out in [view]. */
    private fun nodes(view: View): List<SemanticsNode> =
        (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.flatten()

    /** How the closed card lays out its instruction, 358dp wide: a 390 phone less the map's 16 a side. */
    private fun instructionLayout(card: @Composable () -> Unit): TextLayoutResult {
        var layout: TextLayoutResult? = null
        paparazzi.snapshot {
            val view = LocalView.current
            Box(
                Modifier
                    .width(358.dp)
                    .onGloballyPositioned {
                        val text = nodes(view).first { node ->
                            node.config.getOrNull(SemanticsProperties.Text)?.any { it.text == german } == true
                        }
                        val results = mutableListOf<TextLayoutResult>()
                        text.config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
                        layout = results.single()
                    }
            ) {
                MaterialTheme { card() }
            }
        }
        return checkNotNull(layout) { "the card was never laid out" }
    }

    // GAP-094, the whole instruction

    @Test
    fun theClosedCardShowsTheWholeInstruction() {
        val layout = instructionLayout {
            KozmosManoeuvreCard(type = DirectionType.Right, instruction = german, expanded = false, onToggle = {}) {}
        }
        assertFalse("the instruction is cut at line ${layout.lineCount}, before 'rechts ab'", layout.isLineEllipsized(layout.lineCount - 1))
        assertFalse("the instruction overflows what the card shows", layout.hasVisualOverflow)
        assertTrue("the German turn takes ${layout.lineCount} lines at 358dp: two would not cut it, so this proves nothing", layout.lineCount >= 3)
    }

    // GAP-100, every step reachable

    /**
     * Open, the German itinerary is taller than the card's 320dp cap, so it
     * scrolls — and TalkBack still reaches every step. Compose tells
     * TalkBack only about what is on screen; what is below the cap TalkBack
     * reaches by scrolling the list, which it does itself as it moves past
     * the last step it can see. So every step is its own node, the list
     * offers TalkBack a vertical scroll with room to go, and TalkBack's
     * scroll brings the destination into view.
     */
    @Test
    fun talkBackReachesEveryStepOfAnItineraryTallerThanTheCap() {
        val names = mutableListOf<String>()
        var scrollable: SemanticsNode? = null
        var destinationShownAfterScrolling = false
        var destinationBelowTheCap = false
        val view = ComposeView(paparazzi.context).apply {
            setContent {
                val host = LocalView.current
                MaterialTheme {
                    Box(Modifier.width(358.dp)) {
                        KozmosManoeuvreCard(
                            type = DirectionType.Right,
                            instruction = german,
                            expanded = true,
                            onToggle = {},
                            collapseLabel = "Wegbeschreibung ausblenden"
                        ) {
                            KozmosItinerary(
                                origin = "Haupteingang",
                                steps = germanSteps,
                                destination = "Flughafen-Shuttles",
                                originLabel = "Von",
                                destinationLabel = "Nach",
                                label = "Wegbeschreibung"
                            )
                        }
                    }
                }
                LaunchedEffect(Unit) {
                    repeat(3) { withFrameNanos { } }
                    val owner = (host as ViewRootForTest).semanticsOwner
                    names += owner.rootSemanticsNode.flatten().mapNotNull {
                        it.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString()
                    }
                    val list = owner.unmergedRootSemanticsNode.flatten().firstOrNull {
                        it.config.getOrNull(SemanticsProperties.VerticalScrollAxisRange) != null
                    } ?: return@LaunchedEffect
                    scrollable = list
                    fun destination(): Rect = owner.rootSemanticsNode.flatten().first {
                        it.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString() == "Nach, Flughafen-Shuttles"
                    }.boundsInRoot
                    destinationBelowTheCap = destination().height < 1f
                    // TalkBack's scroll forward: the list's own scroll action, a page at a time.
                    repeat(4) {
                        list.config[SemanticsActions.ScrollBy].action?.invoke(0f, list.size.height.toFloat())
                        repeat(2) { withFrameNanos { } }
                    }
                    val shown = destination()
                    destinationShownAfterScrolling = shown.height > 1f && shown.bottom <= list.boundsInRoot.bottom + 1f
                }
            }
        }
        paparazzi.gif(view, "reach", start = 0L, end = 1000L, fps = 20)

        for (step in germanSteps) {
            assertTrue("TalkBack has no node for '${step.instruction}' among $names", step.instruction in names)
        }
        assertTrue("TalkBack has no origin among $names", "Von, Haupteingang" in names)
        assertTrue("TalkBack has no destination among $names", "Nach, Flughafen-Shuttles" in names)
        assertTrue("TalkBack has no way to close the card among $names", "Wegbeschreibung ausblenden" in names)
        val list = checkNotNull(scrollable) { "the itinerary taller than the cap offers TalkBack no vertical scroll" }
        val range = checkNotNull(list.config.getOrNull(SemanticsProperties.VerticalScrollAxisRange))
        assertTrue("the itinerary has no room to scroll: it fits under the cap, so this proves nothing", range.maxValue() > 40f)
        assertTrue("the destination is not below the cap before scrolling: this proves nothing", destinationBelowTheCap)
        assertTrue("TalkBack's scroll does not bring the destination into view", destinationShownAfterScrolling)
    }

    // T4, focus through the disclosure

    /** The name TalkBack is given for the node that has input focus, or null when none does. */
    private fun focusedName(view: View): String? =
        (view as ViewRootForTest).semanticsOwner.rootSemanticsNode.flatten()
            .firstOrNull { it.config.getOrNull(SemanticsProperties.Focused) == true }
            ?.let { it.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString() ?: "(unnamed)" }

    private fun View.press(code: Int) {
        val now = SystemClock.uptimeMillis()
        dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, code, 0))
        dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, code, 0))
    }

    /**
     * An indication that draws nothing. Material's ripple is a
     * RippleDrawable that the host's renderer cannot draw once a key presses
     * a button (a native "fatal error", measured); what is tested is where
     * focus goes, which the indication only paints.
     */
    @Suppress("DEPRECATION")
    private object UnpaintedIndication : Indication {
        @Composable
        override fun rememberUpdatedInstance(interactionSource: InteractionSource): IndicationInstance =
            remember {
                object : IndicationInstance {
                    override fun ContentDrawScope.drawIndication() = drawContent()
                }
            }
    }

    private val instructionName = manoeuvreDescription(german, "40 m · Ebene 1")
    private val hide = "Wegbeschreibung ausblenden"
    private val nextStep = "Nächster Schritt"

    private suspend fun settle() = repeat(4) { withFrameNanos { } }

    /**
     * A product's navigation screen: it owns [expanded] and has a control of
     * its own after the card. [script] runs in the host once it is laid out.
     */
    private fun drive(expanded: MutableState<Boolean>, script: suspend View.() -> Unit) {
        val view = ComposeView(paparazzi.context).apply {
            setContent {
                val host = LocalView.current
                MaterialTheme {
                    CompositionLocalProvider(LocalIndication provides UnpaintedIndication) {
                        Column(Modifier.width(358.dp)) {
                            KozmosManoeuvreCard(
                                type = DirectionType.Right,
                                instruction = german,
                                detail = "40 m · Ebene 1",
                                expanded = expanded.value,
                                onToggle = { expanded.value = !expanded.value },
                                collapseLabel = hide
                            ) {
                                KozmosItinerary(origin = "Haupteingang", steps = germanSteps.take(3), destination = "Flughafen-Shuttles")
                            }
                            Box(Modifier.size(48.dp).semantics { contentDescription = nextStep }.focusable())
                        }
                    }
                }
                LaunchedEffect(Unit) {
                    settle()
                    host.requestFocus()
                    host.script()
                }
            }
        }
        paparazzi.gif(view, "drive", start = 0L, end = 3000L, fps = 20)
    }

    /** The node TalkBack is given the name [name] for. */
    private fun View.node(name: String): SemanticsNode =
        (this as ViewRootForTest).semanticsOwner.rootSemanticsNode.flatten()
            .first { it.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString() == name }

    /** What an accessibility service's click does: the node's own click action. */
    private fun View.serviceClick(name: String) {
        node(name).config[SemanticsActions.OnClick].action?.invoke()
    }

    /** A finger's tap in the middle of the node named [name]. */
    private fun View.tap(name: String) {
        val at = node(name).boundsInRoot.center
        val down = SystemClock.uptimeMillis()
        dispatchTouchEvent(MotionEvent.obtain(down, down, MotionEvent.ACTION_DOWN, at.x, at.y, 0))
        dispatchTouchEvent(MotionEvent.obtain(down, down + 50, MotionEvent.ACTION_UP, at.x, at.y, 0))
    }

    /**
     * From a keyboard, three times over: Tab onto the instruction, Enter
     * opens the card and focus goes to Hide — not nowhere, with the
     * instruction it was on gone — and Enter there closes it and focus comes
     * back to the instruction. Closed, the silent grab bar is never a stop:
     * Tab goes from the instruction to the product's next control.
     */
    @Test
    fun keyboardFocusGoesWithTheDisclosure() {
        val expanded = mutableStateOf(false)
        val seen = mutableListOf<String?>()
        drive(expanded) {
            press(KeyEvent.KEYCODE_TAB)
            settle()
            seen += focusedName(this)
            repeat(3) {
                press(KeyEvent.KEYCODE_ENTER)
                settle()
                seen += focusedName(this)
                press(KeyEvent.KEYCODE_ENTER)
                settle()
                seen += focusedName(this)
            }
            press(KeyEvent.KEYCODE_TAB)
            settle()
            seen += focusedName(this)
        }
        assertEquals(
            "where focus was after Tab, then each Enter, then Tab",
            listOf(instructionName, hide, instructionName, hide, instructionName, hide, instructionName, nextStep),
            seen
        )
    }

    /**
     * TalkBack and Switch Access act on the node their own focus is on, and
     * give it no input focus: the card moves input focus from the part they
     * pressed to the part in its place, and Compose tells them so
     * (TYPE_VIEW_FOCUSED). A finger's tap moves no focus at all.
     */
    @Test
    fun anAccessibilityServicesClickTakesFocusWithTheDisclosureAndATapDoesNot() {
        val expanded = mutableStateOf(false)
        val seen = mutableListOf<String?>()
        drive(expanded) {
            serviceClick(instructionName)
            settle()
            seen += focusedName(this)
            serviceClick(hide)
            settle()
            seen += focusedName(this)
            // A visitor who only touches the screen: nothing has focus.
            clearFocus()
            settle()
            tap(instructionName)
            settle()
            seen += if (expanded.value) "opened: ${focusedName(this)}" else "tap did not open"
        }
        assertEquals(listOf(hide, instructionName, "opened: null"), seen)
    }

    /**
     * The product opening or closing the card moves focus only if it was on
     * the part that changed: from its own control it stays there; on the
     * instruction as the card opens, it goes to Hide; on Hide as the card
     * closes, it comes back to the instruction.
     */
    @Test
    fun theProductsOwnChangesMoveFocusOnlyFromThePartThatChanged() {
        val expanded = mutableStateOf(false)
        val seen = mutableListOf<String?>()
        drive(expanded) {
            press(KeyEvent.KEYCODE_TAB) // the instruction
            press(KeyEvent.KEYCODE_TAB) // the product's control
            settle()
            seen += focusedName(this)
            expanded.value = true
            settle()
            seen += focusedName(this)
            expanded.value = false
            settle()
            seen += focusedName(this)
            press(KeyEvent.KEYCODE_TAB) // round to the instruction
            settle()
            if (focusedName(this) != instructionName) press(KeyEvent.KEYCODE_TAB)
            settle()
            seen += focusedName(this)
            expanded.value = true
            settle()
            seen += focusedName(this)
            expanded.value = false
            settle()
            seen += focusedName(this)
        }
        assertEquals(listOf(nextStep, nextStep, nextStep, instructionName, hide, instructionName), seen)
    }

    // GAP-094, the limit a product can still ask for

    @Test
    fun aProductCanStillCutTheInstruction() {
        val two = instructionLayout {
            KozmosManoeuvreCard(type = DirectionType.Right, instruction = german, expanded = false, onToggle = {}, instructionLines = 2) {}
        }
        assertEquals(2, two.lineCount)
        assertTrue("cut at two lines, the instruction ends in no ellipsis", two.isLineEllipsized(1))
        val none = instructionLayout {
            KozmosManoeuvreCard(type = DirectionType.Right, instruction = german, expanded = false, onToggle = {}, instructionLines = 0) {}
        }
        assertFalse("a limit of 0 cuts the instruction", none.isLineEllipsized(none.lineCount - 1))
        assertTrue(none.lineCount >= 3)
    }

    @Test
    fun theInstructionIsCutAtWholeLinesOrNotAtAll() {
        assertEquals(null, manoeuvreInstructionLineLimit(null))
        assertEquals(null, manoeuvreInstructionLineLimit(0))
        assertEquals(null, manoeuvreInstructionLineLimit(-2))
        assertEquals(1, manoeuvreInstructionLineLimit(1))
        assertEquals(3, manoeuvreInstructionLineLimit(3))
    }

    @Test
    fun focusGoesFromThePartThatChangedToThePartInItsPlace() {
        assertEquals(ManoeuvreCardPart.Bar, manoeuvreCardFocusAfter(true, ManoeuvreCardPart.Instruction))
        assertEquals(ManoeuvreCardPart.Instruction, manoeuvreCardFocusAfter(false, ManoeuvreCardPart.Bar))
        assertEquals(ManoeuvreCardPart.Instruction, manoeuvreCardFocusAfter(false, ManoeuvreCardPart.Itinerary))
        for (expanded in listOf(true, false)) assertEquals(null, manoeuvreCardFocusAfter(expanded, null))
        assertEquals(null, manoeuvreCardFocusAfter(true, ManoeuvreCardPart.Bar))
        assertEquals(null, manoeuvreCardFocusAfter(false, ManoeuvreCardPart.Instruction))
    }
}
