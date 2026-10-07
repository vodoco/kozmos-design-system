package com.kozmos.components.poidetailpanel

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Info
import com.kozmos.components.icon.knownIconVector
import com.kozmos.components.icon.resolveIconVector
import com.kozmos.contracts.KozmosPOIDetailSummaryKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * The details card's decorative icons: which remote addresses it loads, as
 * iOS's `POIDetailIcon.remoteURL` decides, and which icon names draw.
 */
class POIDetailIconTest {
    @Test
    fun onlyHttpsAddressesWithAHostAndNoCredentialsAreLoaded() {
        assertEquals("https://example.com/icon.png", poiDetailIconUrl("https://example.com/icon.png"))
        assertEquals("HTTPS://example.com/icon.png", poiDetailIconUrl("HTTPS://example.com/icon.png"))
        for (url in listOf(
            "http://example.com/icon.png",
            "file:///tmp/icon.png",
            "data:image/png;base64,abc",
            "https://user:pass@example.com/icon.png",
            "https://user@example.com/icon.png",
            "javascript:alert(1)",
            "not a URL",
            "/static/icon.png",
            "https:///icon.png",
            "https://example.com\\icon.png",
            "",
            null
        )) {
            assertNull(url, poiDetailIconUrl(url))
        }
    }

    @Test
    fun anUnknownNameIsNoIconToTheCardAndStillTheStandInToKozmosIcon() {
        assertNull(knownIconVector("not-a-kozmos-icon"))
        assertEquals(Icons.Default.Check, knownIconVector("check"))
        // KozmosIcon itself is unchanged: an unknown name still shows Info.
        assertEquals(Icons.Default.Info, resolveIconVector("not-a-kozmos-icon"))
        assertEquals(Icons.Default.Check, resolveIconVector("check"))
    }

    /**
     * A summary fact's kind draws the Pointr artwork the web's
     * `summaryIcons` draws (POIDetailContent.tsx): Star01 for a rating, the
     * accessibility mark, Feather for dietary and ClockPlus for the crowd,
     * none for a price or a property. None mirrors: Material's Accessible
     * was auto-mirrored and turned round in a right-to-left layout, and its
     * Eco leaf was another glyph than the web's feather.
     */
    @Test
    fun aSummaryKindDrawsThePointrArtworkTheWebDraws() {
        val expected = mapOf(
            KozmosPOIDetailSummaryKind.Rating to "Star01",
            KozmosPOIDetailSummaryKind.Accessibility to "Accessibility",
            KozmosPOIDetailSummaryKind.Dietary to "Feather",
            KozmosPOIDetailSummaryKind.Crowd to "ClockPlus",
            KozmosPOIDetailSummaryKind.Price to null,
            KozmosPOIDetailSummaryKind.Property to null
        )
        assertEquals(KozmosPOIDetailSummaryKind.entries.toSet(), expected.keys)
        for ((kind, name) in expected) {
            val icon = summaryIcon(kind)
            assertEquals("$kind draws ${icon?.name}, not the web's $name", name, icon?.name)
            if (icon != null) assertEquals("$kind mirrors right to left", false, icon.autoMirror)
        }
        // The two the registry names are the registry's own drawing.
        assertEquals(knownIconVector("feather"), summaryIcon(KozmosPOIDetailSummaryKind.Dietary))
        assertEquals(knownIconVector("clock-plus"), summaryIcon(KozmosPOIDetailSummaryKind.Crowd))
    }
}
