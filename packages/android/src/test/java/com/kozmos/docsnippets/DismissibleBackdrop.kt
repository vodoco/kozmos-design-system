// Backdrop.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.backdrop.KozmosBackdrop

// The scrim fills the space it is given, so it goes under what it dims at
// the screen's root. A tap on it calls onTap: what that closes, and the
// overlay's focus and semantics, are yours.
@Composable
fun DismissibleBackdrop(isOpen: Boolean, onClose: () -> Unit) {
    KozmosBackdrop(visible = isOpen, onTap = onClose)
}
