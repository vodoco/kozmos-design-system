package com.kozmos.components.navbar

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.button.KozmosButton

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=752-6765")
class KozmosNavbarConnect {
    @FigmaProperty(FigmaType.Enum, "Content")
    val content: String = Figma.mapping(
        "Basic" to "basic",
        "Actions" to "actions",
        "Contextual" to "contextual"
    )

    @FigmaProperty(FigmaType.Enum, "LogoInset")
    val logoInset: Boolean = Figma.mapping(
        "False" to false,
        "True" to true
    )

    // GAP-196: where the navigation sits, Center by default.
    @FigmaProperty(FigmaType.Enum, "NavigationAlign")
    val navigationAlign: KozmosNavbarNavigationAlign = Figma.mapping(
        "Start" to KozmosNavbarNavigationAlign.Start,
        "Center" to KozmosNavbarNavigationAlign.Center,
        "End" to KozmosNavbarNavigationAlign.End
    )

    @Composable
    fun ComponentExample() {
        KozmosNavbar(
            logoInset = logoInset,
            navigationAlign = navigationAlign,
            logo = {
                Text("Logo")
            },
            context = {
                if (content == "contextual") {
                    Text("Context")
                }
            },
            navigation = {
                if (content == "contextual") {
                    Text("Navigation")
                }
            },
            primaryAction = {
                if (content == "contextual") {
                    KozmosButton(onClick = {}) {
                        Text("Primary action")
                    }
                }
            },
            actions = {
                if (content == "actions" || content == "contextual") {
                    Text("Actions")
                }
            },
            utilities = {
                if (content == "contextual") {
                    Text("Utility")
                }
            },
            account = {
                if (content == "contextual") {
                    Text("Account")
                }
            }
        )
    }
}
