package com.kozmos.components.tree

import android.content.res.Configuration
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.LocalSaveableStateRegistry
import androidx.compose.runtime.saveable.SaveableStateRegistry
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalConfiguration
import java.util.Locale
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.dp
import com.kozmos.components.live
import com.kozmos.components.readSettledSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-151 and GAP-107: a tree is one lazy list over its visible rows, so of
 * Pointr Cloud's 13,031 Map Content items only a screenful is composed; which
 * rows are open is the tree's, so a row scrolled away and back stays open;
 * sections are headings whose items sit at the section's depth; meta can sit
 * under the name; TalkBack reads each row's place, "n of m", and a parent's
 * state, Expanded or Collapsed.
 */
class KozmosTreeRowsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun ofThirteenThousandRowsOnlyAScreenfulIsComposed() {
        val items = List(13_031) { TreeNode("item-$it", "Item $it") }
        val tree = paparazzi.readSettledSemantics {
            KozmosMaterialTheme {
                Box(Modifier.size(320.dp, 400.dp)) {
                    KozmosTree(
                        listOf(TreeNode("level", "Level 0", items)),
                        Modifier.height(400.dp),
                        expandedIds = setOf("level")
                    )
                }
            }
        }
        val composed = tree.unmerged.count { node -> node.texts.any { it.startsWith("Item ") } }
        assertTrue("no rows composed", composed > 0)
        assertTrue("$composed of 13,031 rows composed: more than a screenful", composed <= 40)
    }

    @Test fun aRowScrolledAwayAndBackStaysOpen() {
        val data = listOf(TreeNode("b1", "B1", listOf(TreeNode("l0", "L0")))) +
            List(200) { TreeNode("row-$it", "Row $it") }
        paparazzi.live(content = {
            KozmosMaterialTheme { Box(Modifier.size(300.dp, 300.dp)) { KozmosTree(data, Modifier.height(300.dp)) } }
        }) {
            frames(2)
            read().merged.single { "B1" in it.texts && it.click != null }.click!!.invoke()
            frames(3)
            assertTrue("B1 did not open", read().merged.any { "L0" in it.texts })
            val list = read().merged.first { it.scrollBy != null }
            list.scrollBy!!.invoke(0f, 6000f)
            frames(3)
            assertTrue("B1 is still composed", read().merged.none { "B1" in it.texts && it.placed })
            read().merged.first { it.scrollBy != null }.scrollBy!!.invoke(0f, -12000f)
            frames(3)
            assertTrue("B1 closed when it was scrolled away", read().merged.any { "L0" in it.texts })
        }
    }

    @Test fun aSectionIsAHeadingAndItsItemsSitAtItsDepth() {
        val data = listOf(
            TreeNode("poi", "POI", listOf(TreeNode("cafe", "Café")), count = 120, section = true),
            TreeNode("loose", "Loose")
        )
        val tree = paparazzi.readSettledSemantics {
            KozmosMaterialTheme { Box(Modifier.size(300.dp, 300.dp)) { KozmosTree(data, expandedIds = emptySet()) } }
        }
        val heading = tree.merged.single { it.heading }
        assertEquals("the section's name and count", "POI, 120", heading.description)
        assertNull("a section is pressed", heading.click)
        val cafe = tree.unmerged.single { it.texts == listOf("Café") }
        val loose = tree.unmerged.single { it.texts == listOf("Loose") }
        assertEquals("a section's item is indented", loose.bounds.left, cafe.bounds.left, 0.5f)
    }

    @Test fun metaBelowSitsUnderTheWholeName() = meta(KozmosTreeMetaPlacement.Below)

    @Test fun inlineMetaSitsOnTheNamesLine() = meta(KozmosTreeMetaPlacement.Inline)

    /** In a 400dp column, as GAP-107's 'Bean & Leaf Café'. */
    private fun meta(placement: KozmosTreeMetaPlacement) {
        val node = TreeNode("cafe", "Bean & Leaf Café", meta = "Changes Awaiting Publish")
        val tree = paparazzi.readSettledSemantics {
            KozmosMaterialTheme {
                Box(Modifier.width(400.dp).height(200.dp)) {
                    KozmosTree(listOf(node), metaPlacement = placement, expandedIds = emptySet())
                }
            }
        }
        val name = tree.unmerged.single { it.texts == listOf("Bean & Leaf Café") }
        val meta = tree.unmerged.single { it.texts == listOf("Changes Awaiting Publish") }
        assertEquals("$placement: the name wrapped", 1, name.textLayout!!.lineCount)
        assertTrue("$placement: the name was cut", !name.textLayout!!.isLineEllipsized(0))
        if (placement == KozmosTreeMetaPlacement.Below) {
            assertTrue("below: the meta is not under the name", meta.bounds.top >= name.bounds.bottom - 0.5f)
        } else {
            assertTrue("inline: the meta is not on the name's line", meta.bounds.top < name.bounds.bottom)
        }
    }

    @Test fun talkBackReadsEachRowsPlaceAndAParentsState() {
        val data = listOf(
            TreeNode("b1", "B1", listOf(TreeNode("l0", "L0"))),
            TreeNode("b2", "B2", listOf(TreeNode("l1", "L1"))),
            TreeNode("structural", "Structural", listOf(TreeNode("wall", "Wall")), section = true)
        )
        paparazzi.live(content = {
            KozmosMaterialTheme { Box(Modifier.size(300.dp, 400.dp)) { KozmosTree(data, expandedIds = setOf("b1")) } }
        }) {
            frames(2)
            val tree = read()
            assertEquals("Expanded", tree.merged.single { "B1" in it.texts && it.click != null }.stateDescription)
            assertEquals("Collapsed", tree.merged.single { "B2" in it.texts && it.click != null }.stateDescription)
            assertNull(tree.merged.single { "L0" in it.texts && it.click != null }.stateDescription)
            assertEquals("the list does not say how many rows", 4, tree.merged.firstNotNullOf { it.collectionRows })

            val owner = (view as ViewRootForTest).semanticsOwner
            fun SemanticsNode.all(): List<SemanticsNode> = listOf(this) + children.flatMap { it.all() }
            val places = owner.rootSemanticsNode.all().mapNotNull { node ->
                val info = node.config.getOrNull(SemanticsProperties.CollectionItemInfo) ?: return@mapNotNull null
                node.config.getOrNull(SemanticsProperties.Text)?.firstOrNull()?.text?.let { it to info.rowIndex }
            }.toMap()
            assertEquals(mapOf("B1" to 0, "L0" to 1, "B2" to 2, "Wall" to 3), places)
        }
    }

    @Test fun aSectionReadsItsNameAndItsCountAsTheLocaleWritesIt() {
        val data = listOf(
            TreeNode("poi", "POI", listOf(TreeNode("cafe", "Café")), count = 3257, section = true),
            TreeNode("virtual", "Virtual", listOf(TreeNode("zone", "Zone")), section = true)
        )
        val tree = paparazzi.readSettledSemantics {
            val config = Configuration(LocalConfiguration.current).apply { setLocale(Locale.US) }
            CompositionLocalProvider(LocalConfiguration provides config) {
                KozmosMaterialTheme { Box(Modifier.size(300.dp, 300.dp)) { KozmosTree(data, expandedIds = emptySet()) } }
            }
        }
        val headings = tree.merged.filter { it.heading }
        assertEquals(listOf("POI, 3,257", "Virtual"), headings.map { it.description })
    }

    /** As a rotation does: the screen's saved state, then a new composition from it. */
    @Test fun openRowsSurviveARotation() {
        val data = listOf(TreeNode("b1", "B1", listOf(TreeNode("l0", "L0"))), TreeNode("p", "P"))
        var shown by mutableStateOf(true)
        var registry by mutableStateOf(SaveableStateRegistry(null) { true })
        paparazzi.live(content = {
            if (shown) {
                CompositionLocalProvider(LocalSaveableStateRegistry provides registry) {
                    KozmosMaterialTheme { Box(Modifier.size(300.dp, 300.dp)) { KozmosTree(data) } }
                }
            }
        }) {
            frames(2)
            read().merged.single { "B1" in it.texts && it.click != null }.click!!.invoke()
            frames(3)
            assertTrue("B1 did not open", read().merged.any { "L0" in it.texts })
            val saved = registry.performSave()
            shown = false
            frames(3)
            registry = SaveableStateRegistry(saved) { true }
            shown = true
            frames(3)
            assertTrue("B1 closed across the rotation", read().merged.any { "L0" in it.texts })
        }
    }
}
