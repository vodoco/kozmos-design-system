// LocationPin.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.locationpin.KozmosLocationPin

// A result's marker, numbered as its card's tab and filled when the result is
// selected; a second tap opens its details. Only results on the level in view
// get a marker: the level switcher counts the rest.
@Composable
fun ResultPin(
    name: String,
    number: Int,
    isSelected: Boolean,
    onSelect: () -> Unit,
    onOpen: () -> Unit
) {
    KozmosLocationPin(
        label = name,
        number = number,
        selected = isSelected,
        onClick = onSelect,
        onOpen = onOpen
    )
}
