// FloatingActionButton.mdx's Compose snippet, word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.floatingactionbutton.KozmosFloatingActionButton

// A plus by default: icon is an ImageVector. The part takes no name: TalkBack
// calls it "Action", in English, whatever it does, and a contentDescription
// you add is read before that word, not instead of it. It sits where you put
// it: there is no fixed placement.
@Composable
fun AddPlaceButton(addPlace: () -> Unit) {
    KozmosFloatingActionButton(onClick = addPlace)
}
