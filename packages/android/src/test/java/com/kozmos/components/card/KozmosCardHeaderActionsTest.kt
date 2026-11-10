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
}
