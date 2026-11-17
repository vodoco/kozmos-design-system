// Listbox.mdx's Compose snippet ("Embedded"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.listbox.KozmosListbox
import com.kozmos.components.listbox.KozmosListboxOption

// Inside a dialog: the dialog's box is the list's, so it draws none.
@Composable
fun SwitchClientList() {
    var client by remember { mutableStateOf(listOf("acme")) }
    KozmosListbox(
        options = listOf(
            KozmosListboxOption(value = "acme", label = "Acme"),
            KozmosListboxOption(value = "globex", label = "Globex")
        ),
        selectedValues = client,
        onSelectionChange = { values, _ -> client = values },
        embedded = true
    )
}
