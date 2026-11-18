package com.kozmos.components.pageheader

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.components.KozmosEmotion
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.tag.KozmosTag
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * PageHeader's title addon (decision 210, owner, 17 Nov): a node beside the
 * title, such as a status Tag, outside the heading, so the heading is the
 * title alone; on the title's line, 8 after the title, before the info
 * button and centred on the line; and under the title, at its start, where
 * the line has no room for it.
 */
class KozmosPageHeaderTitleAddonTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var density = 1f

    private fun read(width: Int = 800, content: @Composable () -> Unit): ReadSemantics =
        paparazzi.readSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Column(Modifier.requiredWidth(width.dp)) { content() }
            }
        }

    private fun ReadSemantics.frame(words: String): Rect =
        unmerged.first { it.texts.contains(words) || it.description == words }.frame.let {
            Rect(it.left / density, it.top / density, it.right / density, it.bottom / density)
        }

    private fun ReadSemantics.tagged(tag: String): Rect =
        unmerged.single { it.tag == tag }.frame.let {
            Rect(it.left / density, it.top / density, it.right / density, it.bottom / density)
        }

    @Composable
    private fun Header(title: String) {
        KozmosPageHeader(
            title = title,
            titleAddon = { KozmosTag(text = "Changes Awaiting Publish", emotion = KozmosEmotion.Alert, modifier = Modifier.testTag("addon")) },
            info = { Box(Modifier.size(28.dp).semantics { contentDescription = "About this page" }) }
        )
    }

    @Test
    fun theHeadingIsTheTitleAloneAndTheAddonIsReadAfterIt() {
        val tree = read { Header("Map Content") }
        val headings = tree.unmerged.filter { it.heading }
        assertEquals("one heading, the title's words alone", listOf(listOf("Map Content")), headings.map { it.texts })
        assertFalse("the addon is not a heading", tree.saying("Changes Awaiting Publish").heading)
        val order = tree.merged.mapNotNull { it.words }
        assertTrue(
            "the title, then the addon, then the info button: $order",
            order.indexOf("Map Content") < order.indexOf("Changes Awaiting Publish") &&
                order.indexOf("Changes Awaiting Publish") < order.indexOf("About this page")
        )
    }

    @Test
    fun theAddonSitsEightAfterTheTitleBeforeTheInfoAndCentredOnTheLine() {
        val tree = read { Header("Map Content") }
        val title = tree.frame("Map Content")
        val addon = tree.tagged("addon")
        val info = tree.frame("About this page")
        assertEquals("8 after the title", 8f, addon.left - title.right, 0.5f)
        assertEquals("the info 8 after the addon", 8f, info.left - addon.right, 0.5f)
        assertEquals("centred on the title's 32 line", title.top + 16f, (addon.top + addon.bottom) / 2, 0.5f)
    }

    @Test
    fun withNoRoomTheAddonWrapsUnderTheTitleAtItsStart() {
        val tree = read(width = 260) { Header("Map Content and Layers") }
        val title = tree.frame("Map Content and Layers")
        val addon = tree.tagged("addon")
        assertTrue("the addon is under the title: title ends ${title.bottom}, addon starts ${addon.top}", addon.top >= title.bottom)
        assertEquals("at the title's start", title.left, addon.left, 0.5f)
        assertTrue("on screen: ends ${addon.right}", addon.right <= 260f)
    }
}
