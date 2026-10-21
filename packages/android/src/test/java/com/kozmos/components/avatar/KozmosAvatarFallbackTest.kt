package com.kozmos.components.avatar

import androidx.compose.foundation.Image
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.ColorPainter
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React's Avatar is Radix's: its fallback, the initials, shows until the
 * image has loaded, and again if it fails; SwiftUI's AsyncImage shows them as
 * its placeholder in the same two cases. Compose's showed the initials only
 * when there was no URL: with one, a slow or broken image left an empty grey
 * circle. The initials now stand in until the image has loaded.
 *
 * Coil loads nothing under Paparazzi, so an avatar given a URL here is one
 * whose image never arrives, as a slow or a broken one.
 */
class KozmosAvatarFallbackTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun wordsOf(content: @androidx.compose.runtime.Composable () -> Unit): List<String> =
        paparazzi.readSemantics { KozmosMaterialTheme { content() } }.unmerged.flatMap { it.texts }

    @Test fun anImageThatHasNotLoadedShowsTheInitials() {
        assertEquals(
            "the words an avatar shows while its image has not loaded",
            listOf("OK"),
            wordsOf { KozmosAvatar(imageUrl = "https://example.invalid/olcay.png", fallbackText = "OK") }
        )
    }

    /** Once the image has loaded it takes the initials' place: nothing is drawn or read under it. */
    @Test fun aLoadedImageTakesTheInitialsPlace() {
        assertEquals(
            emptyList<String>(),
            wordsOf {
                KozmosAvatarFace(fallbackText = "OK", loaded = true) {
                    Image(ColorPainter(Color.Red), contentDescription = null, modifier = Modifier.matchParentSize())
                }
            }
        )
    }

    @Test fun withoutAnImageTheInitialsShow() {
        assertEquals(listOf("OK"), wordsOf { KozmosAvatar(imageUrl = null, fallbackText = "OK") })
    }
}
