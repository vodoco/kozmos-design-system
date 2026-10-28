package com.kozmos.components.navbar

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant
import com.kozmos.components.button.KozmosButton

// NavigationAlign=Center only: Compose centres the navigation and has no
// navigationAlign yet (GAP-196 is web and Figma first), so a Start or End
// instance shows no Compose snippet rather than a centred one.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=752-6765")
@FigmaVariant("NavigationAlign", "Center")
class KozmosNavbarConnect {
    @FigmaProperty(FigmaType.Enum, "Content")
    val content: String = Figma.mapping(
        "Basic" to "basic",
        "Actions" to "actions",
        "Contextual" to "contextual"
    )

    @Composable
    fun ComponentExample() {
        KozmosNavbar(
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
