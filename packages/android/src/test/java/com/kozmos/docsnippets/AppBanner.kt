// ClientAppBanner.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project, and composed by
// ClientAppBannerDocSnippetsTest. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalUriHandler
import com.kozmos.components.clientappbanner.KozmosClientAppBanner

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
