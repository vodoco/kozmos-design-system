package com.kozmos.components.clientappbanner

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

// GAP-206, GAP-127: Promotion Text, App Name Text and Description Text are
// promotionText, appName and description (Show Promotion, Show
// Description); Show Dismiss is onDismiss. Layout is how the width falls,
// not a parameter. Initial Text stands in for the icon until appIconUrl
// loads, and is drawn from appName.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-19192")
class KozmosClientAppBannerConnect {
    @FigmaProperty(FigmaType.Text, "Promotion Text")
    val promotionText: String = "Get the app"

    @FigmaProperty(FigmaType.Boolean, "Show Promotion")
    val showPromotion: Boolean = true

    @FigmaProperty(FigmaType.Text, "App Name Text")
    val appName: String = "Northfield Airport"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Live gate changes, step-free routes and your boarding pass, on your phone."

    @FigmaProperty(FigmaType.Boolean, "Show Description")
    val showDescription: Boolean = true

    @FigmaProperty(FigmaType.Boolean, "Show Dismiss")
    val showDismiss: Boolean = true

    @Composable
    fun ComponentExample() {
        KozmosClientAppBanner(
            appName = appName,
            actionLabel = "Open",
            onAction = {},
            promotionText = if (showPromotion) promotionText else null,
            description = if (showDescription) description else null,
            onDismiss = if (showDismiss) ({}) else null
        )
    }
}
