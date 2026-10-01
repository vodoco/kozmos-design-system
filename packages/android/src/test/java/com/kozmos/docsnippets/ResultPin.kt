// LocationPin.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.locationpin.KozmosLocationPin

// A result's pin, numbered as its card's tab: quiet at rest, filled when the
// result is selected, and dashed when the place is on another floor.
@Composable
fun ResultPin(
    name: String,
    number: Int,
    isSelected: Boolean,
    isOnAnotherFloor: Boolean
) {
    KozmosLocationPin(
        label = name,
        number = number,
        selected = isSelected,
        offFloor = isOnAnotherFloor
    )
}
