package com.kozmos.components.card

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosTypography
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-169, decision 134: CardHeader's `actions`, as React's. What acts on the
 * card sits at the header's end, 16 after the title and description, which
 * keep the room before it; the actions are centred on the title's line (the
 * title style's line height), so a 44 icon button makes the header no taller.
 * Right to left they are at the left. Read from the laid-out bounds, in dp, in
 * a 320 card whose title fills the room it is given.
 */
class KozmosCardHeaderActionsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private class Laid(val card: Rect, val text: Rect, val action: Rect, val content: Rect, val titleLine: Float)

    private fun laidOut(
        actions: Boolean,
        padding: KozmosCardPadding = KozmosCardPadding.Default,
        direction: LayoutDirection = LayoutDirection.Ltr
    ): Laid {
        var card = Rect.Zero
        var text = Rect.Zero
        var action = Rect.Zero
        var content = Rect.Zero
        var line = 0f
        var px = 1f
        paparazzi.snapshot {
            px = LocalDensity.current.density
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides false,
                LocalLayoutDirection provides direction
            ) {
                KozmosMaterialTheme(typography = KozmosTypography.typography()) {
                    line = with(LocalDensity.current) { MaterialTheme.typography.titleLarge.lineHeight.toDp().value }
                    Box(Modifier.fillMaxSize()) {
                        KozmosCard(
                            modifier = Modifier.width(320.dp).onGloballyPositioned { card = it.boundsInRoot() },
                            padding = padding
                        ) {
                            val title: @androidx.compose.runtime.Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit = {
                                KozmosCardTitle(
                                    title = "Head office",
                                    modifier = Modifier.fillMaxWidth().onGloballyPositioned { text = it.boundsInRoot() }
                                )
                            }
                            if (actions) {
                                KozmosCardHeader(
                                    actions = { Box(Modifier.size(44.dp).onGloballyPositioned { action = it.boundsInRoot() }) },
                                    content = title
                                )
                            } else {
                                KozmosCardHeader(content = title)
                            }
                            KozmosCardContent {
                                Box(Modifier.fillMaxWidth().height(40.dp).onGloballyPositioned { content = it.boundsInRoot() })
                            }
                        }
                    }
                }
            }
        }
        fun Rect.scaled() = Rect(left / px, top / px, right / px, bottom / px)
        return Laid(card.scaled(), text.scaled(), action.scaled(), content.scaled(), line)
    }

    @Test
    fun theActionsSitAtTheEndCentredOnTheTitlesLine() {
        for ((padding, inset) in listOf(KozmosCardPadding.Default to 24f, KozmosCardPadding.Compact to 16f)) {
            val laid = laidOut(actions = true, padding = padding)
            assertEquals("$padding: at the header's end", laid.card.right - inset, laid.action.right, 0.5f)
            assertEquals(
                "$padding: centred on the title's line",
                laid.card.top + inset + laid.titleLine / 2,
                laid.action.center.y,
                0.5f
            )
            assertEquals("$padding: the title keeps the room before it", laid.action.left - 16f, laid.text.right, 0.5f)
            assertEquals("$padding: the title starts where it did", laid.card.left + inset, laid.text.left, 0.5f)
        }
    }

    @Test
    fun anIconButtonMakesTheHeaderNoTaller() {
        val with = laidOut(actions = true)
        val without = laidOut(actions = false)
        assertEquals("the content's top", without.content.top - without.card.top, with.content.top - with.card.top, 0.5f)
        assertEquals("the title's top", without.text.top - without.card.top, with.text.top - with.card.top, 0.5f)
    }

    @Test
    fun rightToLeftTheActionsAreAtTheLeft() {
        val laid = laidOut(actions = true, direction = LayoutDirection.Rtl)
        assertEquals(laid.card.left + 24f, laid.action.left, 0.5f)
        assertEquals(laid.action.right + 16f, laid.text.left, 0.5f)
    }

    // GAP-035, CLOUD-UI-001: the line follows the title's size, and the subtle
    // strip's own 28 line, as React's CSS does.

    private class Sized(val card: Rect, val title: Rect, val action: Rect?, val content: Rect, val line: Float)

    private fun sized(
        size: KozmosCardTitleSize?,
        tone: KozmosCardHeaderTone = KozmosCardHeaderTone.Default,
        actions: Boolean = true,
        description: Boolean = false
    ): Sized {
        var card = Rect.Zero
        var title = Rect.Zero
        var action: Rect? = null
        var content = Rect.Zero
        var line = 0f
        var px = 1f
        paparazzi.snapshot {
            px = LocalDensity.current.density
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                KozmosMaterialTheme(typography = KozmosTypography.typography()) {
                    val style = when (size ?: if (tone == KozmosCardHeaderTone.Subtle) KozmosCardTitleSize.Sm else KozmosCardTitleSize.Lg) {
                        KozmosCardTitleSize.Lg -> MaterialTheme.typography.titleLarge
                        KozmosCardTitleSize.Md -> MaterialTheme.typography.titleMedium
                        KozmosCardTitleSize.Sm -> MaterialTheme.typography.titleSmall
                    }
                    line = with(LocalDensity.current) { style.lineHeight.toDp().value }
                    Box(Modifier.fillMaxSize()) {
                        KozmosCard(modifier = Modifier.width(320.dp).onGloballyPositioned { card = it.boundsInRoot() }) {
                            val words: @androidx.compose.runtime.Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit = {
                                KozmosCardTitle(
                                    title = "Head office",
                                    size = size,
                                    modifier = Modifier.onGloballyPositioned { title = it.boundsInRoot() }
                                )
                                if (description) KozmosCardDescription("Edit the site's details")
                            }
                            if (actions) {
                                KozmosCardHeader(
                                    actions = { Box(Modifier.size(44.dp).onGloballyPositioned { action = it.boundsInRoot() }) },
                                    tone = tone,
                                    content = words
                                )
                            } else {
                                KozmosCardHeader(tone = tone, content = words)
                            }
                            KozmosCardContent {
                                Box(Modifier.fillMaxWidth().height(40.dp).onGloballyPositioned { content = it.boundsInRoot() })
                            }
                        }
                    }
                }
            }
        }
        fun Rect.scaled() = Rect(left / px, top / px, right / px, bottom / px)
        return Sized(card.scaled(), title.scaled(), action?.scaled(), content.scaled(), line)
    }

    @Test
    fun theActionsAreCentredOnTheLineOfTheTitlesSize() {
        for (size in listOf(null, KozmosCardTitleSize.Lg, KozmosCardTitleSize.Md, KozmosCardTitleSize.Sm)) {
            val laid = sized(size)
            val alone = sized(size, actions = false)
            val action = laid.action!!
            assertEquals("$size: centred on its ${laid.line} line", laid.card.top + 24f + laid.line / 2, action.center.y, 0.5f)
            assertEquals("$size: on the title's own line", laid.title.top + laid.line / 2, action.center.y, 0.5f)
            assertEquals(
                "$size: the action made the header taller",
                alone.content.top - alone.card.top,
                laid.content.top - laid.card.top,
                0.5f
            )
        }
    }

    @Test
    fun theSubtleStripCentresItsActionsOnItsTwentyEightLine() {
        // The strip is 12 + 28 + 12: a 44 action spills into the 12 above and
        // below, centred in the strip, which stays 52, as a lone title's. With
        // a description the strip grows, and the action stays centred in it
        // with the words, as React's strip centres both.
        for (description in listOf(false, true)) {
            for (size in listOf(null, KozmosCardTitleSize.Lg, KozmosCardTitleSize.Md, KozmosCardTitleSize.Sm)) {
                val name = "$size${if (description) " with a description" else ""}"
                val laid = sized(size, tone = KozmosCardHeaderTone.Subtle, description = description)
                val alone = sized(size, tone = KozmosCardHeaderTone.Subtle, actions = false, description = description)
                val action = laid.action!!
                // The strip ends the card's 24 above the content.
                val strip = laid.content.top - 24f - laid.card.top
                assertEquals(
                    "$name: the action made the strip taller",
                    alone.content.top - alone.card.top,
                    laid.content.top - laid.card.top,
                    0.5f
                )
                if (!description && (size == null || size == KozmosCardTitleSize.Sm)) {
                    assertEquals("$name: the strip is 52", 52f, strip, 0.5f)
                }
                if (description) {
                    assertTrue("$name: the strip grows with its words, $strip", strip > 52f)
                }
                assertEquals("$name: centred in the strip", laid.card.top + strip / 2, action.center.y, 0.5f)
                assertEquals("$name: at the strip's end", laid.card.right - 24f, action.right, 0.5f)
            }
        }
    }
}
