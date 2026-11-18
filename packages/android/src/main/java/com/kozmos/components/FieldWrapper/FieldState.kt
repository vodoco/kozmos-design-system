package com.kozmos.components.fieldwrapper

import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.stateDescription

/**
 * What a native field says of its state on the field itself (GAP-235,
 * GAP-236), for TalkBack.
 */
object KozmosFieldState {
    /**
     * Said as a read-only field's state: Compose 1.6, which the BOM brings,
     * has no read-only semantics (`isEditable` arrives in 1.7). A product
     * that translates passes its own through each field's `readOnlyLabel`.
     */
    const val READ_ONLY_LABEL = "Read only"
}

/**
 * A field's state, set once in its text field's semantics block (GAP-235,
 * GAP-236): [stateParts] (a mixed field's "Multiple values", OTPInput's digit
 * count) and, read only, [readOnlyLabel], joined into its state description;
 * and while [inError], its [errorMessage] as the field's error, as React's
 * `aria-invalid` and `aria-describedby` put the message on the field.
 */
fun SemanticsPropertyReceiver.kozmosFieldState(
    readOnly: Boolean,
    readOnlyLabel: String,
    inError: Boolean,
    errorMessage: String?,
    stateParts: List<String> = emptyList()
) {
    val said = stateParts + listOfNotNull(readOnlyLabel.takeIf { readOnly && it.isNotBlank() })
    if (said.isNotEmpty()) stateDescription = said.joinToString(", ")
    if (inError) error(errorMessage?.takeIf { it.isNotBlank() } ?: "")
}
