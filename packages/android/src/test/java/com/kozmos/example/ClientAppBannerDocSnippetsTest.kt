// The Compose snippet of ClientAppBanner.mdx, character for character below
// its imports, so it compiles with the package and a renamed or removed
// parameter fails here rather than in a reader's project. Change one, change
// the other.
package com.kozmos.example

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalUriHandler
import com.kozmos.components.clientappbanner.KozmosClientAppBanner
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

// The customer's banner, as Pointr Cloud returns it, in the visitor's language.
data class AppBannerSettings(
    val promotionText: String?,
    val appName: String,
    val description: String?,
    val appIconUrl: String?,
    val buttonText: String,
    val storeUrl: String
)

// Shown in the map shell's top bar until the visitor dismisses it.
@Composable
fun AppBanner(settings: AppBannerSettings) {
    var dismissed by rememberSaveable { mutableStateOf(false) }
    val uriHandler = LocalUriHandler.current
    if (!dismissed) {
        KozmosClientAppBanner(
            appName = settings.appName,
            actionLabel = settings.buttonText,
            onAction = { uriHandler.openUri(settings.storeUrl) },
            promotionText = settings.promotionText,
            description = settings.description,
            appIconUrl = settings.appIconUrl,
            onDismiss = { dismissed = true }
        )
    }
}

class ClientAppBannerDocSnippetsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    /** Compiling is most of the point; composing it shows a banner TalkBack reads as the app's pane. */
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
        val tree = paparazzi.readSemantics { MaterialTheme { AppBanner(settings) } }
        assertEquals(listOf("Northfield Airport"), tree.merged.mapNotNull { it.paneTitle })
        assertEquals("Dismiss", tree.named("Dismiss").description)
    }
}
