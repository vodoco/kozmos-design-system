package com.kozmos.components.mapattribution

import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.UriHandler
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosMapAttributionTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    @Test fun mapTextEndsAtComponentBottomWithoutAnExtraInset() {
        var bounds = Rect.Zero
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosMapAttribution(
                    credits = listOf(KozmosMapAttributionCredit("a", "Indoor")),
                    modifier = Modifier.width(240.dp).onGloballyPositioned { bounds = it.boundsInRoot() }
                )
            }
        }
        val text = tree.merged.single { "Indoor" in it.texts }
        assertEquals("The shell's 16dp inset must apply to text, not extra padding", bounds.bottom, text.bounds.bottom, 1f)
    }
    @Test fun bundledBrandCanBeReplacedOrHidden() {
        for (mode in 0..2) {
            val tree = paparazzi.readSemantics {
                MaterialTheme {
                    KozmosMapAttribution(
                        credits = listOf(KozmosMapAttributionCredit("a", "Indoor")),
                        brand = if (mode == 1) { { Text("Custom venue") } } else null,
                        showBrand = mode != 2,
                        modifier = Modifier.width(240.dp)
                    )
                }
            }
            assertEquals(mode == 0, "Pointr" in tree.names())
            assertEquals(mode == 1, tree.merged.any { "Custom venue" in it.texts })
            assertTrue(tree.merged.any { "Indoor" in it.texts })
        }
    }
    @Test fun creditsUseTextHeightInsteadOfButtonHeight() {
        var density = 1f
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            MaterialTheme {
                KozmosMapAttribution(
                    credits = listOf(
                        KozmosMapAttributionCredit("a", "Indoor"),
                        KozmosMapAttributionCredit("b", "Outdoor", "https://example.com")
                    ),
                    modifier = Modifier.width(240.dp)
                )
            }
        }
        val link = tree.merged.single { "Outdoor" in it.texts && it.click != null }
        assertTrue("Credits are text, not 48dp buttons", link.bounds.height / density <= 24f)
    }
    @Test fun onlyWebDestinationsBecomeLinks() {
        for (href in listOf("javascript:alert(1)", "file:///private/file", "/relative", "https://")) {
            assertNull(KozmosMapAttributionCredit("x", "Credit", href).destination)
        }
        assertEquals("https://example.com", KozmosMapAttributionCredit("x", "Credit", "https://example.com").destination)
    }
    @Test fun whiteLabelRetainsCreditsAndLinkActionAtLargeTextInBothDirections() {
        for (direction in LayoutDirection.values()) {
          for (appearance in KozmosMapAttributionAppearance.values()) {
            var opened: String? = null
            var density = 1f
            val tree = paparazzi.readSemantics {
                density = LocalDensity.current.density
                CompositionLocalProvider(
                    LocalLayoutDirection provides direction,
                    LocalDensity provides Density(density, 2f),
                    LocalUriHandler provides object : UriHandler {
                        override fun openUri(uri: String) { opened = uri }
                    }
                ) {
                    MaterialTheme {
                        KozmosMapAttribution(
                            credits = listOf(
                                KozmosMapAttributionCredit("owner", "© Example indoor data"),
                                KozmosMapAttributionCredit("provider", "Outdoor contributors", "https://example.com")
                            ),
                            brand = { Text("Hidden brand") },
                            showBrand = false,
                            appearance = appearance,
                            modifier = Modifier.width(240.dp)
                        )
                    }
                }
            }
            assertFalse(tree.merged.any { "Hidden brand" in it.texts })
            assertTrue(tree.merged.any { "© Example indoor data" in it.texts })
            val link = tree.merged.single { "Outdoor contributors" in it.texts && it.click != null }
            assertEquals(1, tree.merged.count { "Outdoor contributors" in it.texts })
            assertTrue(link.click!!.invoke())
            assertEquals("https://example.com", opened)
            assertTrue("Long credits expose native horizontal scrolling", tree.unmerged.any { (it.horizontalScrollMax ?: 0f) > 0 })
            assertTrue("The visible credit row has height", tree.merged.any { it.texts.isNotEmpty() && it.bounds.height > 0 })
            for (node in tree.merged.filter { it.texts.isNotEmpty() && it.bounds.width > 0 }) {
                assertTrue(node.bounds.height > 0)
                assertTrue(node.bounds.left >= 0)
                assertTrue(node.bounds.right / density <= 240.5f)
            }
          }
        }
    }
}
