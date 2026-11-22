package com.kozmos.components.routelocationfield

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant
import com.kozmos.components.listbox.KozmosListboxOption

// GAP-206: State is location and status. Search, Loading, Empty and Error
// are the search with no place (status Idle, Loading, Empty, Error);
// Resolved is the place chosen, Location Text and Description Text its label
// and description (Show Description). Label Text is label.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17648")
@FigmaVariant("State", "Resolved")
class KozmosRouteLocationFieldConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Destination"

    @FigmaProperty(FigmaType.Text, "Location Text")
    val locationLabel: String = "Main Lobby"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val locationDescription: String = "Ground Floor"

    @FigmaProperty(FigmaType.Boolean, "Show Description")
    val showDescription: Boolean = true

    @Composable
    fun ComponentExample() {
        KozmosRouteLocationField(
            label = label,
            location = KozmosListboxOption(
                value = "main-lobby",
                label = locationLabel,
                description = if (showDescription) locationDescription else null
            ),
            query = "",
            options = emptyList(),
            onQueryChange = {},
            onSelect = {},
            onClear = {}
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17648")
@FigmaVariant("State", "Search")
class KozmosRouteLocationFieldSearchConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Destination"

    @Composable
    fun ComponentExample() {
        KozmosRouteLocationField(
            label = label,
            location = null,
            query = "",
            options = emptyList(),
            onQueryChange = {},
            onSelect = {},
            onClear = {}
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17648")
@FigmaVariant("State", "Loading")
class KozmosRouteLocationFieldLoadingConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Destination"

    @Composable
    fun ComponentExample() {
        KozmosRouteLocationField(
            label = label,
            location = null,
            query = "",
            options = emptyList(),
            onQueryChange = {},
            onSelect = {},
            onClear = {},
            status = KozmosRouteLocationStatus.Loading
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17648")
@FigmaVariant("State", "Empty")
class KozmosRouteLocationFieldEmptyConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Destination"

    @Composable
    fun ComponentExample() {
        KozmosRouteLocationField(
            label = label,
            location = null,
            query = "",
            options = emptyList(),
            onQueryChange = {},
            onSelect = {},
            onClear = {},
            status = KozmosRouteLocationStatus.Empty
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17648")
@FigmaVariant("State", "Error")
class KozmosRouteLocationFieldErrorConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Destination"

    @Composable
    fun ComponentExample() {
        KozmosRouteLocationField(
            label = label,
            location = null,
            query = "",
            options = emptyList(),
            onQueryChange = {},
            onSelect = {},
            onClear = {},
            status = KozmosRouteLocationStatus.Error
        )
    }
}
