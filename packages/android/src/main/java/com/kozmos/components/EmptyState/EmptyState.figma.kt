package com.kozmos.components.emptystate

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=347-5316")
@FigmaVariant("Content", "Basic")
class KozmosEmptyStateBasicConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "No results found"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Try adjusting your filters or search terms."

    // GAP-165: what to try, under the description.
    @FigmaProperty(FigmaType.Boolean, "List")
    val showList: Boolean = false

    @FigmaProperty(FigmaType.Text, "List Item 1 Text")
    val item1: String = "Check the building and level"

    @FigmaProperty(FigmaType.Text, "List Item 2 Text")
    val item2: String = "Clear the type filters"

    @FigmaProperty(FigmaType.Text, "List Item 3 Text")
    val item3: String = "Search by another name or an ID"

    @Composable
    fun ComponentExample() {
        KozmosEmptyState(
            title = title,
            description = description,
            list = if (showList) listOf(item1, item2, item3) else emptyList()
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=347-5316")
@FigmaVariant("Content", "Icon")
class KozmosEmptyStateIconConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "No results found"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Try adjusting your filters or search terms."

    // GAP-165: what to try, under the description.
    @FigmaProperty(FigmaType.Boolean, "List")
    val showList: Boolean = false

    @FigmaProperty(FigmaType.Text, "List Item 1 Text")
    val item1: String = "Check the building and level"

    @FigmaProperty(FigmaType.Text, "List Item 2 Text")
    val item2: String = "Clear the type filters"

    @FigmaProperty(FigmaType.Text, "List Item 3 Text")
    val item3: String = "Search by another name or an ID"

    @Composable
    fun ComponentExample() {
        KozmosEmptyState(
            title = title,
            description = description,
            list = if (showList) listOf(item1, item2, item3) else emptyList(),
            icon = {
                Icon(Icons.Default.Search, contentDescription = null)
            }
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=347-5316")
@FigmaVariant("Content", "Action")
class KozmosEmptyStateActionConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "No results found"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Try adjusting your filters or search terms."

    // GAP-165: what to try, under the description.
    @FigmaProperty(FigmaType.Boolean, "List")
    val showList: Boolean = false

    @FigmaProperty(FigmaType.Text, "List Item 1 Text")
    val item1: String = "Check the building and level"

    @FigmaProperty(FigmaType.Text, "List Item 2 Text")
    val item2: String = "Clear the type filters"

    @FigmaProperty(FigmaType.Text, "List Item 3 Text")
    val item3: String = "Search by another name or an ID"

    @Composable
    fun ComponentExample() {
        KozmosEmptyState(
            title = title,
            description = description,
            list = if (showList) listOf(item1, item2, item3) else emptyList(),
            icon = {
                Icon(Icons.Default.Search, contentDescription = null)
            },
            action = {
                KozmosButton(
                    onClick = {},
                    variant = KozmosButtonVariant.Outline
                ) {
                    Text("Clear filters")
                }
            }
        )
    }
}
