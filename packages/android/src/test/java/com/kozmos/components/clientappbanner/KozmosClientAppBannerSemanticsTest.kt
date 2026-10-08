package com.kozmos.components.clientappbanner

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * What TalkBack is told about Express's Client App Banner (GAP-127). These
 * mirror ClientAppBanner.test.tsx and the SwiftUI tests: one group that reads
 * the promotion, the name and the description, then the action, then
 * dismiss, and announces nothing as it appears; an icon that says nothing
 * over the name; and, where the words and the action do not fit side by
 * side, the action under the icon and the words. One read of the tree per
 * test.
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

    private fun read(
        direction: LayoutDirection = LayoutDirection.Ltr,
        fontScale: Float = 1f,
        content: @Composable () -> Unit
    ): ReadSemantics =
        paparazzi.readSemantics {
            KozmosMaterialTheme {
                CompositionLocalProvider(
                    LocalLayoutDirection provides direction,
                    LocalDensity provides Density(LocalDensity.current.density, fontScale)
                ) { content() }
            }
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

    /**
     * One group TalkBack reads together, and no pane: a node that gains a
     * pane title sends "pane appeared" with it, and TalkBack speaks it, so a
     * banner titled by the app announced itself as it showed. React's region
     * and SwiftUI's container announce nothing.
     */
    @Test
    fun itIsOneGroupTalkBackReadsTogetherAndNoPaneThatAnnouncesItself() {
        val tree = read { Banner() }
        assertEquals(
            "a pane title is announced as the banner appears",
            emptyList<String>(),
            (tree.merged + tree.unmerged).mapNotNull { it.paneTitle }
        )
        val action = tree.saying("Open").bounds
        val dismiss = tree.named("Dismiss").bounds
        val name = tree.saying("Northfield Airport").bounds
        assertTrue(
            "no traversal group holds the banner's words, action and dismiss",
            tree.unmerged.any { group ->
                group.traversalGroup && listOf(action, dismiss, name).all { group.bounds.contains(it.center) }
            }
        )
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

    /**
     * At 320dp the action goes under the icon and the words and spans them
     * both, from the 16 inside to dismiss's column, so the words keep the
     * width beside the icon: 16 in, the 48 icon and the 12 beside it.
     */
    @Test
    fun atNarrowWidthsTheActionGoesUnderTheIconAndTheWordsAndSpansThem() {
        val tree = read { Banner(width = 320.dp) }
        val name = tree.saying("Northfield Airport").bounds
        val description = tree.saying(words).bounds
        val action = tree.saying("Open").bounds
        val dismiss = tree.named("Dismiss").bounds
        val left = dismiss.right + 4 * density - 320 * density
        assertTrue("at 320dp the action is not under the words", action.top >= description.bottom)
        assertTrue("at 320dp the action is not under the icon", action.top >= dismiss.top - 4 * density + (16 + 48) * density)
        assertEquals("at 320dp the words do not follow the icon", 76f, (name.left - left) / density, 1f)
        assertEquals("at 320dp the action does not start under the icon", 16f, (action.left - left) / density, 1f)
        // Dismiss's 48, the 4 beside it and the 12 before the words.
        assertEquals("at 320dp the action does not end at dismiss's column", 64f, (dismiss.right + 4 * density - action.right) / density, 1f)
    }

    /**
     * The words keep ten of the body text's 16sp, not 160dp: at twice the
     * font size the action waits for about 280dp of words (Android scales
     * 16sp to 28dp there), as the web's 10rem grows with the browser's text.
     * At 480dp a fixed 160dp left the action beside words of about 234dp;
     * counted in the text's size, it goes under them.
     */
    @Test
    fun theWordsWidthTheActionWaitsForGrowsWithTheFontScale() {
        for ((fontScale, stacked) in listOf(1f to false, 2f to true)) {
            val tree = read(fontScale = fontScale) { Banner(width = 480.dp) }
            val description = tree.saying(words).bounds
            val action = tree.saying("Open").bounds
            assertEquals(
                "at 480dp and a font scale of $fontScale the action is ${if (action.top >= description.bottom) "under" else "beside"} " +
                    "words ${description.width / density}dp wide",
                stacked,
                action.top >= description.bottom
            )
        }
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
