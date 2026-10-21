// Composes ClientAppBanner.mdx's Compose snippet, docsnippets/AppBanner.kt,
// which check-native-snippet-parity holds to the page word for word.
package com.kozmos.example

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.AppBanner
import com.kozmos.docsnippets.AppBannerSettings
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ClientAppBannerDocSnippetsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    /** Compiling is most of the point; composing it shows the app's banner, which TalkBack reads, with no pane announcing it. */
    @Test
    fun theDocsSnippetComposes() {
        val settings = AppBannerSettings(
            promotionText = "Get the app",
            appName = "Northfield Airport",
            description = "Live gate changes, step-free routes and your boarding pass.",
            appIconUrl = null,
            buttonText = "Open",
            storeUrl = "https://play.google.com/store/apps/details?id=com.example"
        )
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { AppBanner(settings) } }
        assertEquals(1, tree.merged.count { it.texts == listOf("Northfield Airport") })
        assertEquals(emptyList<String>(), tree.merged.mapNotNull { it.paneTitle })
        assertEquals("Dismiss", tree.named("Dismiss").description)
    }
}
