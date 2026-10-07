package com.kozmos.components.poidetailpanel

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

/**
 * The details card's header as TalkBack is given it.
 *
 * On the web and iOS, favourite and bookmark are icon toggles in the header,
 * before the close button, and the other actions stay in the row under it.
 * Android drew every action, favourite and bookmark included, as a labelled
 * button in that row (found on 2026-09-27, verifying GAP-083). Each case lays
 * the card out as a device does and reads the controls' names, states and
 * bounds.
 */
class KozmosPOIDetailPanelHeaderTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var density = 1f
    private val acted = mutableListOf<Pair<KozmosPOIAction, String>>()

    private val poi = KozmosPOIPresentation(
        id = "harbour-coffee",
        name = "Harbour Coffee Co.",
        floorId = "2",
        floorLabel = "Level 2",
        actions = listOf(
            KozmosPOIAction.Navigate,
            KozmosPOIAction.Favourite,
            KozmosPOIAction.Bookmark,
            KozmosPOIAction.Share
        )
    )

    // Bookmark is "Save" here, not its own name: the toggles are named by
    // the product's labels.
    private val labels = mapOf(
        KozmosPOIAction.Navigate to "Go",
        KozmosPOIAction.Favourite to "Favourite",
        KozmosPOIAction.Bookmark to "Save",
        KozmosPOIAction.Share to "Share"
    )

    private fun read(
        states: Map<KozmosPOIAction, KozmosPOIActionState> =
            mapOf(KozmosPOIAction.Favourite to KozmosPOIActionState(pressed = true)),
        direction: LayoutDirection = LayoutDirection.Ltr,
        place: KozmosPOIPresentation = poi,
        width: Dp = 360.dp
    ): ReadSemantics = paparazzi.readSemantics {
        density = LocalDensity.current.density
        CompositionLocalProvider(LocalLayoutDirection provides direction) {
            KozmosMaterialTheme {
                Box(modifier = Modifier.width(width)) {
                    KozmosPOIDetailPanel(
                        poi = place,
                        actionLabels = labels,
                        onAction = { action, id -> acted += action to id },
                        actionStates = states,
                        onClose = {}
                    )
                }
            }
        }
    }

    /** What TalkBack calls a control: its description, else its text. */
    private val ReadNode.name: String get() = description ?: texts.joinToString(" ")

    /** The controls, in the order TalkBack is given them. */
    private fun ReadSemantics.controls(): List<ReadNode> = merged.filter { it.click != null }

    /** The one control called [name]; fails, listing the controls there are, if not exactly one. */
    private fun ReadSemantics.control(name: String): ReadNode {
        val found = controls().filter { it.name == name }
        assertEquals("controls called \"$name\" among ${controls().map { it.name }}", 1, found.size)
        return found.single()
    }

    private fun dp(px: Float) = px / density

    /**
     * Favourite and save are the header's first buttons, in the order the
     * POI lists them, and close is its last: 44dp squares on one row, 6dp
     * apart — the web's 0.375rem and iOS's HStack spacing. They are icons,
     * named by the product's labels, and a pressed one is selected, so
     * TalkBack says so. Pressing one calls onAction exactly as the row's
     * button did.
     */
    @Test
    fun favouriteAndSaveAreHeaderTogglesBeforeClose() {
        val tree = read()

        assertEquals(
            "the controls in the order TalkBack is given them",
            listOf("Favourite", "Save", "Close details", "Go", "Share"),
            tree.controls().map { it.name }
        )

        val close = tree.control("Close details")
        val favourite = tree.control("Favourite")
        val save = tree.control("Save")
        for (toggle in listOf(favourite, save)) {
            assertEquals("${toggle.name} is not on the close button's row", close.bounds.top, toggle.bounds.top, 0.5f)
            assertEquals("${toggle.name}'s width", 44f, dp(toggle.bounds.width), 0.5f)
            assertEquals("${toggle.name}'s height", 44f, dp(toggle.bounds.height), 0.5f)
            assertEquals("${toggle.name} shows a label, not an icon", emptyList<String>(), toggle.texts)
            // Unset, so TalkBack says "Selected" or "Not selected".
            assertNull("${toggle.name}'s state description", toggle.stateDescription)
        }
        assertEquals("from favourite to save", 6f, dp(save.bounds.left - favourite.bounds.right), 0.5f)
        assertEquals("from save to close", 6f, dp(close.bounds.left - save.bounds.right), 0.5f)

        assertEquals("the pressed favourite is not selected", true, favourite.selected)
        assertEquals("save, not pressed, is selected", false, save.selected)

        favourite.click!!.invoke()
        save.click!!.invoke()
        assertEquals(
            listOf(KozmosPOIAction.Favourite to poi.id, KozmosPOIAction.Bookmark to poi.id),
            acted
        )
    }

    /** Under the header the row keeps the other actions, labelled, and nothing else. */
    @Test
    fun theRowUnderTheHeaderKeepsTheOtherActions() {
        val tree = read()
        val header = tree.control("Close details").bounds

        assertEquals(
            "the controls under the header",
            listOf("Go", "Share"),
            tree.controls().filter { it.bounds.top >= header.bottom }.map { it.name }
        )
        assertEquals(listOf("Go"), tree.control("Go").texts)
        assertEquals(listOf("Share"), tree.control("Share").texts)
    }

    /** Right to left the row runs the other way: close at the left edge, then save, then favourite. */
    @Test
    fun rightToLeftTheTogglesStillComeBeforeClose() {
        val tree = read(direction = LayoutDirection.Rtl)
        val close = tree.control("Close details").bounds
        val favourite = tree.control("Favourite").bounds
        val save = tree.control("Save").bounds

        assertEquals("favourite is not on the close button's row", close.top, favourite.top, 0.5f)
        assertEquals("save is not on the close button's row", close.top, save.top, 0.5f)
        assertEquals("from save to favourite, right to left", 6f, dp(favourite.left - save.right), 0.5f)
        assertEquals("from close to save, right to left", 6f, dp(save.left - close.right), 0.5f)
    }

    /**
     * A toggle the product is busy with, or has turned off, keeps its name
     * and reads as unavailable, as the row's buttons did: the loader takes
     * the icon's place, not the name's.
     */
    @Test
    fun aBusyOrDisabledToggleKeepsItsNameAndReadsAsUnavailable() {
        val tree = read(
            states = mapOf(
                KozmosPOIAction.Favourite to KozmosPOIActionState(loading = true),
                KozmosPOIAction.Bookmark to KozmosPOIActionState(disabled = true)
            )
        )
        val close = tree.control("Close details").bounds
        val favourite = tree.control("Favourite")
        val save = tree.control("Save")

        assertEquals("the busy favourite is not on the close button's row", close.top, favourite.bounds.top, 0.5f)
        assertEquals("the disabled save is not on the close button's row", close.top, save.bounds.top, 0.5f)
        assertEquals("the busy favourite can be pressed", false, favourite.enabled)
        assertEquals("the disabled save can be pressed", false, save.enabled)
        assertEquals(false, favourite.selected)
        assertEquals(false, save.selected)
    }

    /**
     * With no logo the header draws none, as the web and iOS do, and the
     * name starts at the header's edge. At a 312dp card it is 124dp wide:
     * 312 less the header's 16 on each side, the buttons' 144 and the 12
     * between them and the name, the width the web gives it (iOS, spacing
     * 8, gives 128). Android drew the name's initial in a 48dp box instead,
     * which left the name 64dp and broke it mid-word.
     */
    @Test
    fun withNoLogoTheNameTakesItsPlace() {
        val place = poi.copy(
            name = "Il Forno — Neapolitan restaurant and handmade pasta kitchen on the upper concourse"
        )
        val tree = read(place = place, width = 312.dp)
        val card = tree.named(place.name).bounds
        val name = tree.merged.single { it.texts == listOf(place.name) }.bounds

        assertEquals("the name's start, from the card's", 16f, dp(name.left - card.left), 0.5f)
        assertEquals("the name's width", 124f, dp(name.width), 0.5f)
        assertEquals(
            "nodes that draw the name's initial",
            emptyList<String>(),
            tree.merged.filter { it.texts == listOf(place.logoFallbackInitial) }.map { it.texts.single() }
        )
        assertEquals("images in the card", 0, tree.merged.count { it.role == Role.Image })
    }
}
