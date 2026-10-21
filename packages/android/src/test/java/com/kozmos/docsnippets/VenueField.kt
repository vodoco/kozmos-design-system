// FieldWrapper.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.fieldwrapper.KozmosFieldWrapper
import com.kozmos.components.search.KozmosSearch

// The wrapper draws a label, a required mark and helper text around a
// control that has none of its own, here a KozmosSearch. It ties none of them
// to the control: TalkBack reads them as text beside it.
@Composable
fun VenueField(venue: String, onVenueChange: (String) -> Unit) {
    KozmosFieldWrapper(
        label = "Venue",
        required = true,
        helperText = "Search by name or category"
    ) {
        KozmosSearch(value = venue, onValueChange = onVenueChange, placeholder = "Venue")
    }
}
