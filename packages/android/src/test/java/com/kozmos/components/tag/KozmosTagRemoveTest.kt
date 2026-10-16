package com.kozmos.components.tag

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.Density
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * A Tag's remove button, as TalkBack and a finger meet it: a button, named in
 * the product's language ("Remove" in English by default, as React's), with a
 * target of at least 24 by 24 (WCAG 2.2's 2.5.8) while its mark stays 16 and
 * the Tag no taller. Its name was a fixed "Remove" and it had no role.
 */
class KozmosTagRemoveTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun theRemoveButtonIsAButtonNamedRemoveByDefault() {
        var removed = 0
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosTag(text = "Vegan", onRemove = { removed++ }) }
        }
        val remove = tree.named("Remove")
        assertEquals("the remove control is not a button", Role.Button, remove.role)
        remove.click!!.invoke()
        assertEquals(1, removed)
    }

    @Test
    fun theRemoveButtonTakesTheProductsOwnWords() {
        var removed = 0
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosTag(text = "Vegan", onRemove = { removed++ }, removeLabel = "Vegan entfernen")
            }
        }
        tree.named("Vegan entfernen").click!!.invoke()
        assertEquals(1, removed)
        assertTrue(tree.merged.none { it.description == "Remove" })
    }

    @Test
    fun theRemoveTargetIsAtLeast24WhileTheTagStaysItsSize() {
        var plainHeight = 0
        var removableHeight = 0
        var markWidth = 0f
        var markHeight = 0f
        var touchWidth = 0f
        var touchHeight = 0f
        var density: Density? = null
        paparazzi.snapshot {
            val view = LocalView.current
            density = LocalDensity.current
            Column {
                Box(Modifier.onGloballyPositioned { plainHeight = it.size.height }) {
                    KozmosMaterialTheme { KozmosTag(text = "Vegan") }
                }
                Box(
                    Modifier.onGloballyPositioned {
                        removableHeight = it.size.height
                        val remove = (view as ViewRootForTest).semanticsOwner.rootSemanticsNode
                            .descendants()
                            .single { node ->
                                node.config.getOrNull(SemanticsProperties.ContentDescription)
                                    ?.contains("Remove") == true
                            }
                        markWidth = remove.boundsInRoot.width
                        markHeight = remove.boundsInRoot.height
                        touchWidth = remove.touchBoundsInRoot.width
                        touchHeight = remove.touchBoundsInRoot.height
                    }
                ) {
                    KozmosMaterialTheme { KozmosTag(text = "Vegan", onRemove = {}) }
                }
            }
        }
        val px = with(checkNotNull(density)) { 24f * this.density }
        val mark = with(checkNotNull(density)) { 16f * this.density }
        assertEquals("the remove mark is not drawn 16", mark, markWidth, 0.5f)
        assertEquals("the remove mark is not drawn 16", mark, markHeight, 0.5f)
        assertEquals("the remove button makes the Tag taller", plainHeight, removableHeight)
        assertTrue("the remove target is $touchWidth wide, under 24dp", touchWidth >= px - 0.5f)
        assertTrue("the remove target is $touchHeight tall, under 24dp", touchHeight >= px - 0.5f)
    }

    private fun SemanticsNode.descendants(): List<SemanticsNode> =
        children.flatMap { listOf(it) + it.descendants() }
}
