// Button.mdx's Compose snippet ("Disabled"), word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.kozmos.components.button.KozmosButton

// enabled = false takes no press, and TalkBack hears the button as disabled.
// Every variant is drawn from the disabled pair, not at half: its words in
// the disabled foreground, and a filled or ghost variant on the disabled
// fill. A loading button (isLoading = true) takes no press either, but is
// busy, not unavailable: it keeps its own colours, with a spinner.
@Composable
fun SubmitWhenReady(ready: Boolean, submit: () -> Unit) {
    KozmosButton(onClick = submit, enabled = ready) { Text("Submit") }
}
