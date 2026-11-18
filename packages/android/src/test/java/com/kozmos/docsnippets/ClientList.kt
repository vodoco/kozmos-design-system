// Listbox.mdx's Compose snippet ("Media, trailing words and an active option
// the product moves"), word for word below the package line: compiled here,
// so a renamed or removed parameter fails in this target rather than in a
// reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.listbox.KozmosListbox
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.listbox.KozmosOptionMedia

// Each client by its logo, or its initials, and how many sites it has.
@Composable
fun ClientList() {
    var client by remember { mutableStateOf(listOf("acme")) }
    KozmosListbox(
        options = listOf(
            KozmosListboxOption(
                value = "acme",
                label = "Acme Airport",
                media = KozmosOptionMedia(imageUrl = "https://example.com/acme.png"),
                trailing = "12 sites"
            ),
            KozmosListboxOption(value = "globex", label = "Globex", media = KozmosOptionMedia(), trailing = "3 sites")
        ),
        selectedValues = client,
        onSelectionChange = { values, _ -> client = values },
        embedded = true
    )
}
