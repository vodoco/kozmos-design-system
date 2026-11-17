package com.kozmos.components.dialog

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decisions 195 and 202 on Compose: KozmosDialog's `size = Full`, the window
 * less 16 on each side with the body taking the rest, and its `media`, above
 * the title, inside the padding or bled to the dialog's edges and top corners,
 * decorative unless named, with the close in the dialog's corner over it.
 *
 * Read off the dialog's surface laid out in a 340 by 560 window, as its Dialog
 * window holds it (`KozmosDialogPanel`).
 */
class KozmosDialogFullAndMediaTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val content = KozmosDialogContent(
        title = "Interested in Analytics?",
        description = "See how people move through your buildings."
    )

    private class Read(val density: Float, val tree: com.kozmos.components.ReadSemantics)

    private fun read(size: KozmosDialogSize = KozmosDialogSize.Default, media: KozmosDialogMedia? = null): Read {
        var density = 0f
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Box(Modifier.size(340.dp, 560.dp)) {
                    KozmosDialogPanel(
                        onDismissRequest = {},
                        content = content,
                        modifier = Modifier.testTag("panel"),
                        size = size,
                        media = media
                    )
                }
            }
        }
        return Read(density, tree)
    }

    private fun Read.panel() = tree.unmerged.first { it.tag == "panel" }.frame

    @Test fun fullFillsTheWindowLessSixteenOnEachSide() {
        val read = read(size = KozmosDialogSize.Full)
        val panel = read.panel()
        val d = read.density
        assertEquals("16 from the start", 16f * d, panel.left, 1f)
        assertEquals("16 from the top", 16f * d, panel.top, 1f)
        assertEquals("the window's width less 32", (340f - 32f) * d, panel.width, 1f)
        assertEquals("the window's height less 32", (560f - 32f) * d, panel.height, 1f)
    }

    @Test fun theDefaultSizeIsAsTallAsItsContent() {
        val read = read()
        val panel = read.panel()
        assertTrue("default: as tall as its content, read ${panel.height / read.density}", panel.height < 400f * read.density)
        assertEquals("default: as wide as the window allows", 340f * read.density, panel.width, 1f)
    }

    @Test fun bledMediaReachesTheEdgesAndTopAndTheCloseSitsInTheCornerOverIt() {
        val read = read(
            media = KozmosDialogMedia(label = "Charts rising over a floor plan", bleed = true) {
                Box(Modifier.fillMaxWidth().height(120.dp))
            }
        )
        val panel = read.panel()
        val d = read.density
        val media = read.tree.unmerged.first { it.description == "Charts rising over a floor plan" }
        assertEquals("named media is one image", Role.Image, media.role)
        assertEquals("from the dialog's start edge", panel.left, media.frame.left, 1f)
        assertEquals("to its end edge", panel.right, media.frame.right, 1f)
        assertEquals("from its top edge", panel.top, media.frame.top, 1f)
        assertEquals("as tall as the media", 120f * d, media.frame.height, 1f)
        // The button TalkBack reads, its icon's name merged into it.
        val close = read.tree.merged.first { it.description == "Close dialog" }
        // Its 48 surface 24 in from the end and the top; the 44 target centred in it.
        assertEquals("the close 24 in from the end edge", panel.right - 48f * d, close.frame.center.x, 1.5f)
        assertEquals("and 24 under the top edge, over the media", panel.top + 48f * d, close.frame.center.y, 1.5f)
        assertTrue("its target is 44 at least, read ${close.frame.width / d}", close.frame.width >= 44f * d - 1f)
        assertTrue("one close", read.tree.merged.count { it.description == "Close dialog" } == 1)
        val title = read.tree.unmerged.first { it.texts.contains("Interested in Analytics?") }
        assertEquals("the title 16 under the media", media.frame.bottom + 16f * d, title.frame.top, 1.5f)
    }

    @Test fun mediaInsideThePaddingIsDecorativeUnlessNamed() {
        val read = read(
            media = KozmosDialogMedia {
                Text("Illustration", modifier = Modifier.fillMaxWidth().height(80.dp))
            }
        )
        val panel = read.panel()
        val d = read.density
        assertFalse(
            "unnamed media is hidden: its words are not read (${read.tree.unmerged.filter { it.texts.contains("Illustration") }})",
            read.tree.merged.any { it.texts.contains("Illustration") }
        )
        val title = read.tree.unmerged.first { it.texts.contains("Interested in Analytics?") }
        assertEquals("the title keeps the 24 of padding", panel.left + 24f * d, title.frame.left, 1.5f)
        assertEquals("under the 80 of media and 16, inside the 24", panel.top + (24f + 80f + 16f) * d, title.frame.top, 1.5f)
    }
}
