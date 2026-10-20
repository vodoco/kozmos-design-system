// Badge.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import com.kozmos.components.badge.BadgeVariant
import com.kozmos.components.badge.KozmosBadge
import com.kozmos.components.counter.KozmosCounter

// A badge's count shows only with showCounter, and it is a String.
// KozmosCounter is the same pill on its own.
@Composable
fun BadgeAndCounter() {
    Row {
        KozmosBadge(text = "Badge", variant = BadgeVariant.Outline)
        KozmosBadge(text = "New", variant = BadgeVariant.Secondary, counter = "2", showCounter = true)
        KozmosCounter(text = "2")
    }
}
