package com.kozmos.components.poidetailpanel

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Info
import com.kozmos.components.icon.knownIconVector
import com.kozmos.components.icon.resolveIconVector
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
}
