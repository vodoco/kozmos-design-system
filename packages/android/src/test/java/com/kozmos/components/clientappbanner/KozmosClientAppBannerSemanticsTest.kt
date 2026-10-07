package com.kozmos.components.clientappbanner

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * What TalkBack is told about Express's Client App Banner (GAP-127). These
 * mirror ClientAppBanner.test.tsx and the SwiftUI tests: a pane named by the
 * app that reads the promotion, the name and the description, then the
 * action, then dismiss; an icon that says nothing over the name; and, where
 * the words and the action do not fit side by side, the action under the
 * words. One read of the tree per test.
 */
class KozmosClientAppBannerSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val words = "Live gate changes, step-free routes and your boarding pass."

    @Composable
    private fun Banner(
        width: Dp = 358.dp,
        promotion: String? = "Get the app",
        description: String? = words,
        actionLabel: String = "Open",
        dismissLabel: String = "Dismiss",
        onAction: () -> Unit = {},
        onDismiss: (() -> Unit)? = {}
    ) {
        Box(Modifier.requiredWidth(width)) {
            KozmosClientAppBanner(
                appName = "Northfield Airport",
                actionLabel = actionLabel,
                onAction = onAction,
                promotionText = promotion,
                description = description,
                onDismiss = onDismiss,
                dismissLabel = dismissLabel
            )
        }
    }

    private fun read(direction: LayoutDirection = LayoutDirection.Ltr, content: @Composable () -> Unit): ReadSemantics =
        paparazzi.readSemantics {
            MaterialTheme { CompositionLocalProvider(LocalLayoutDirection provides direction) { content() } }
        }

    private val density get() = paparazzi.context.resources.displayMetrics.density

    /** What a node says: its description, or its words. */
    private fun ReadNode.says(): String? = description ?: texts.takeIf { it.isNotEmpty() }?.joinToString()

    /**
     * What TalkBack reads, in order: the nodes that say something, by their
     * traversal index first and then by place, top to bottom, as TalkBack
     * reads a group. By place alone, dismiss — at the top end, above the
     * words — would be read first.
     */
    private fun ReadSemantics.read(): List<String> =
        merged.filter { it.says() != null }
            .sortedWith(compareBy<ReadNode>({ it.traversalIndex }, { it.bounds.top }))
            .mapNotNull { it.says() }

    private fun ReadSemantics.saying(words: String): ReadNode = merged.single { it.says() == words }

    @Test
    fun itIsAPaneNamedByTheAppThatTalkBackReadsAsOneGroup() {
        val tree = read { Banner() }
        val panes = tree.merged.filter { it.paneTitle != null }
        assertEquals(listOf("Northfield Airport"), panes.map { it.paneTitle })
        assertTrue("the banner's pane is not a traversal group", panes.single().traversalGroup)
    }

    @Test
    fun itReadsItsFieldsThenTheActionThenDismissAndNeverTheIconsInitial() {
        // Dismiss sits at the top end, above the words: read by place, it
        // would come first. Its traversal index puts it last.
        val tree = read { Banner() }
        assertEquals(listOf("Get the app", "Northfield Airport", words, "Open", "Dismiss"), tree.read())
        assertTrue("the icon's initial is read", tree.merged.none { it.says() == "N" })
    }

    @Test
    fun theActionIsNamedByItsWordsAndBothButtonsAskTheProduct() {
        var actions = 0
        var dismissals = 0
        val tree = read {
            Banner(actionLabel = "Öffnen", dismissLabel = "Schließen", onAction = { actions++ }, onDismiss = { dismissals++ })
        }
        val action = tree.saying("Öffnen")
        val dismiss = tree.named("Schließen")
        assertEquals(Role.Button, action.role)
        assertEquals(Role.Button, dismiss.role)
        // Label in name: the button's name is its words, and nothing else.
        assertNull(action.description)
        action.click!!.invoke()
        assertEquals(1, actions)
        assertEquals(0, dismissals)
        dismiss.click!!.invoke()
        assertEquals(1, dismissals)
        assertEquals(1, actions)
    }

    @Test
    fun thereIsNoDismissButtonWhenTheProductCannotDismissIt() {
        val tree = read { Banner(promotion = null, description = null, onDismiss = null) }
        assertEquals(listOf("Northfield Airport", "Open"), tree.read())
        assertEquals(1, tree.merged.count { it.role == Role.Button })
    }

    /**
     * Dismiss is Compose's 48 square. The action is KozmosButton, drawn 44
     * tall in a 48dp target (KozmosButtonSizeTest): what TalkBack is given is
     * the drawn 44.
     */
    @Test
    fun everyTargetKeepsCompose48() {
        val tree = read { Banner() }
        val dismiss = tree.named("Dismiss").bounds
        assertEquals(48f, dismiss.width / density, 0.5f)
        assertEquals(48f, dismiss.height / density, 0.5f)
        val action = tree.saying("Open").bounds
        assertTrue("the action is drawn ${action.height / density}dp tall", action.height / density >= 44f - 0.5f)
    }

    @Test
    fun atNarrowWidthsTheActionGoesUnderTheWordsAsWideAsThey() {
        val tree = read { Banner(width = 320.dp) }
        val name = tree.saying("Northfield Airport").bounds
        val description = tree.saying(words).bounds
        val action = tree.saying("Open").bounds
        assertTrue("at 320dp the action is not under the words", action.top >= description.bottom)
        assertEquals("at 320dp the action does not start with the words", name.left, action.left, 1f)
        assertTrue("at 320dp the action is ${action.width / density}dp wide", action.width / density > 150f)
    }

    @Test
    fun atWideWidthsTheActionStaysBesideTheWords() {
        val tree = read { Banner(width = 560.dp) }
        val name = tree.saying("Northfield Airport").bounds
        val description = tree.saying(words).bounds
        val action = tree.saying("Open").bounds
        assertTrue("at 560dp the action is not beside the words", action.top < description.bottom)
        assertTrue("at 560dp the action is not after the words", action.left > name.right)
    }

    @Test
    fun rightToLeftMirrorsIt() {
        val tree = read(LayoutDirection.Rtl) { Banner(width = 560.dp) }
        val name = tree.saying("Northfield Airport").bounds
        val action = tree.saying("Open").bounds
        val dismiss = tree.named("Dismiss").bounds
        assertTrue("right to left, the words are not at the right", name.left > action.right)
        assertTrue("right to left, dismiss is not at the left", action.left > dismiss.right)
        assertEquals(listOf("Get the app", "Northfield Airport", words, "Open", "Dismiss"), tree.read())
        assertFalse(tree.merged.any { it.says() == "N" })
    }
}
