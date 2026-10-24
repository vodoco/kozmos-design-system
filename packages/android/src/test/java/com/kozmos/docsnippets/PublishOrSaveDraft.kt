// SplitButton.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.splitbutton.KozmosSplitButton
import com.kozmos.components.splitbutton.SplitContextMenuItem

// The label is a String, and each menu item a SplitContextMenuItem: its
// label and what it does. There is no disabled state, and TalkBack names the
// menu half "More actions", in fixed English.
@Composable
fun PublishOrSaveDraft(publish: () -> Unit, saveDraft: () -> Unit) {
    KozmosSplitButton(
        label = "Publish",
        onMainClick = publish,
        menuItems = listOf(SplitContextMenuItem(label = "Save draft", onClick = saveDraft))
    )
}
