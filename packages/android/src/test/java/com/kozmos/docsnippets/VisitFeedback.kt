// Textarea.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.textarea.KozmosTextarea

// An outlined field three to five lines tall (minLines, maxLines). It takes
// no label, name, error or character count: React's aria-label has no
// counterpart here.
@Composable
fun VisitFeedback(feedback: String, onFeedbackChange: (String) -> Unit) {
    KozmosTextarea(
        value = feedback,
        onValueChange = onFeedbackChange,
        placeholder = "Tell us about your visit"
    )
}
