package com.kozmos.components.codeblock

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ClipboardManager
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.AnnotatedString
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
 * GAP-216, decision 225: a read-only block of code, MAP-619's merged unit's
 * JSON: the mono family on the muted surface, wrapped or scrolling sideways,
 * an optional copy in the product's words, no colouring. TalkBack finds a
 * group named by its label, as a named region, holding the code and the copy.
 */
class KozmosCodeBlockTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val json = "{\n  \"mergedUnit\": { \"fid\": \"f-1209\" }\n}"
    private val long = "\"levels\": [1, 2, 3], ".repeat(8)

    private class Clipboard : ClipboardManager {
        var kept: AnnotatedString? = null
        override fun getText() = kept
        override fun setText(annotatedString: AnnotatedString) { kept = annotatedString }
    }

    @Test fun itIsAGroupNamedByItsLabelHoldingTheCode() {
        val tree = paparazzi.readSettledSemantics {
            KozmosMaterialTheme { KozmosCodeBlock(code = json, label = "mergedUnit JSON") }
        }
        val region = tree.unmerged.filter { it.paneTitle == "mergedUnit JSON" }
        assertEquals("no group named by the label", 1, region.size)
        assertTrue("its children are not walked together", region.single().traversalGroup)
        assertTrue("the code is not read as written", tree.merged.any { it.texts == listOf(json) })
        assertTrue("a copy is drawn unasked", tree.merged.none { it.role == Role.Button })
    }

    @Test fun theCopyIsAButtonInTheProductsWords() {
        val tree = paparazzi.readSettledSemantics {
            KozmosMaterialTheme { KozmosCodeBlock(code = json, label = "JSON", copyable = true, copyLabel = "Copy JSON") }
        }
        val copy = tree.named("Copy JSON")
        assertEquals(Role.Button, copy.role)
        assertTrue(copy.enabled)
    }

    @Test fun wrapBreaksALongLine() {
        val tree = paparazzi.readSettledSemantics {
            KozmosMaterialTheme { Box(Modifier.width(240.dp)) { KozmosCodeBlock(code = long, label = "JSON") } }
        }
        val text = tree.unmerged.single { it.texts == listOf(long) }
        assertTrue("a wrapped long line did not break", (text.textLayout?.lineCount ?: 0) > 1)
        assertTrue("a wrapped block scrolls", tree.unmerged.none { (it.horizontalScrollMax ?: 0f) > 0f })
    }

    @Test fun withWrapOffTheLineStaysWholeAndScrolls() {
        val tree = paparazzi.readSettledSemantics {
            KozmosMaterialTheme { Box(Modifier.width(240.dp)) { KozmosCodeBlock(code = long, label = "JSON", wrap = false) } }
        }
        val text = tree.unmerged.single { it.texts == listOf(long) }
        assertEquals("with wrap off the line broke", 1, text.textLayout?.lineCount)
        assertTrue("it does not scroll sideways", tree.unmerged.any { (it.horizontalScrollMax ?: 0f) > 0f })
    }

    private val tall = (0 until 40).joinToString("\n") { "  { \"fid\": \"f-$it\" }," }

    /**
     * With maxHeight a long value never pushes the page: the block is no
     * taller than it, and the code scrolls inside it (wrapped, so the only
     * scroller is the one down).
     */
    @Test fun maxHeightCapsALongValueAndScrollsInside() {
        var density = 1f
        val tree = paparazzi.readSettledSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Box(Modifier.width(320.dp)) { KozmosCodeBlock(code = tall, label = "JSON", maxHeight = 120.dp) }
            }
        }
        val region = tree.unmerged.single { it.paneTitle == "JSON" }
        assertEquals("the block is not capped at 120", 120f, region.frame.height / density, 1f)
        assertTrue("nothing scrolls inside it", tree.unmerged.any { it.scrollBy != null })
    }

    /** Unset, the block is as tall as its code and nothing scrolls. */
    @Test fun withoutMaxHeightTheBlockIsAsTallAsItsCode() {
        var density = 1f
        val tree = paparazzi.readSettledSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Box(Modifier.width(320.dp)) { KozmosCodeBlock(code = tall, label = "JSON") }
            }
        }
        val region = tree.unmerged.single { it.paneTitle == "JSON" }
        assertTrue("unset, the block is capped: ${region.frame}", region.frame.height / density > 600f)
        assertTrue("unset, it scrolls", tree.unmerged.none { it.scrollBy != null })
    }

    /** Pressed in a live composition, as Input's copy is (KozmosInputActionTest). */
    @Test fun copyCopiesTheCodeAndSaysSo() {
        val clipboard = Clipboard()
        var copied: String? = null
        paparazzi.live(content = {
            CompositionLocalProvider(LocalClipboardManager provides clipboard) {
                KozmosMaterialTheme {
                    KozmosCodeBlock(code = json, label = "JSON", copyable = true, copiedLabel = "JSON copied",
                        onCopy = { copied = it })
                }
            }
        }) {
            frames(2)
            val polite = { read().merged.single { it.liveRegion == LiveRegionMode.Polite } }
            assertNull("it says something before a copy", polite().description)
            assertTrue(read().named("Copy").click!!.invoke())
            frames(3)
            assertEquals(json, clipboard.kept?.text)
            assertEquals(json, copied)
            assertEquals("the live region does not say it copied", "JSON copied", polite().description)
        }
    }
}
