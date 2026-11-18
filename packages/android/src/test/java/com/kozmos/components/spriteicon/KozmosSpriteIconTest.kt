package com.kozmos.components.spriteicon

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import java.io.File

/**
 * GAP-150, decisions 86 and 219: SpriteIcon draws one cell of a published
 * MapLibre atlas as published, scaled with its aspect ratio kept, from the
 * @2x atlas on a 2x screen, decorative unless labelled, and keeps an empty
 * box of its size while loading or for a missing cell. Layoutlib's framework
 * reads the JSON and decodes the PNG, so these run under Paparazzi's rule.
 */
class KozmosSpriteIconTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** The atlas cut from Pointr's 10.17.0 light sprite that the stories use. */
    private val fixture = generateSequence(File("").absoluteFile) { it.parentFile }
        .map { File(it, "apps/docs/src/sprite-fixture") }
        .first { it.isDirectory }

    @Test fun itPicksTheAt2xAtlasOnA2xScreen() {
        assertEquals("", KozmosSprite.suffix(1f))
        assertEquals("", KozmosSprite.suffix(1.5f))
        assertEquals("@2x", KozmosSprite.suffix(2f))
        assertEquals("@2x", KozmosSprite.suffix(3f))
    }

    @Test fun aCellKeepsItsAspectRatioInItsBox() {
        assertEquals(24.dp to 24.dp, KozmosSprite.fittedSize(KozmosSpriteCell(0, 0, 90, 90), 24.dp))
        val (width, height) = KozmosSprite.fittedSize(KozmosSpriteCell(0, 0, 90, 110), 20.dp)
        assertEquals(20f, height.value, 0.001f)
        assertEquals(90f * 20f / 110f, width.value, 0.001f)
    }

    @Test fun theCellIsCutFromThePublishedAtlasAsDrawnAndReadOnce() = runBlocking {
        val reads = mutableListOf<String>()
        val read: (String) -> ByteArray = { url ->
            reads += url
            File(fixture, url.substringAfterLast('/')).readBytes()
        }
        assertNotNull(KozmosSprite.atlas("https://cdn.test/a/sprite", "@2x", read))
        val atlas = KozmosSprite.atlas("https://cdn.test/a/sprite", "@2x", read)!!
        assertEquals(listOf("https://cdn.test/a/sprite@2x.json", "https://cdn.test/a/sprite@2x.png"), reads)
        val desk = atlas.cells.getValue("desk")
        val cell = KozmosSprite.crop(atlas.image, desk)!!
        assertEquals(90, cell.width)
        assertEquals(90, cell.height)
        // Drawn as published: the bubble's own blue at its left, not a tint.
        val pixel = cell.getPixel(12, 45)
        assertTrue("opaque", (pixel ushr 24) > 200)
        assertTrue("the desk bubble is blue", (pixel and 0xFF) > ((pixel shr 16) and 0xFF))
        assertNull(atlas.cells["not-in-the-atlas"])
        assertNull(
            "an atlas that cannot be read draws nothing",
            KozmosSprite.atlas("https://cdn.test/missing/sprite", "", { error("404") })
        )
    }

    @Test fun itIsDecorativeUnlessLabelledAndKeepsAnEmptyBoxOfItsSize() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                androidx.compose.foundation.layout.Column {
                    KozmosSpriteIcon(sprite = "https://cdn.test/none/sprite", name = "atm", size = KozmosSpriteIconSize.S20, modifier = Modifier.testTag("plain"))
                    KozmosSpriteIcon(sprite = "https://cdn.test/none/sprite", name = "atm", label = "ATM")
                }
            }
        }
        val named = tree.named("ATM")
        assertEquals(Role.Image, named.role)
        val density = paparazzi.context.resources.displayMetrics.density
        assertEquals("the 24 box", 24f, named.bounds.height / density, 0.5f)
        val plain = tree.unmerged.single { it.tag == "plain" }
        assertNull("decorative: no name", plain.description)
        assertEquals("the 20 box, empty while nothing is drawn", 20f, plain.bounds.width / density, 0.5f)
    }
}
