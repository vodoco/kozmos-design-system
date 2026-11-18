package com.kozmos.components.chipinput

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import com.kozmos.components.chip.ChipSize
import com.kozmos.components.chip.KozmosChip
import com.kozmos.components.chip.KozmosChipGroup
import com.kozmos.components.combobox.selectionFieldColors
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * The edits a ChipInput makes to its entries, apart from any view, so each
 * rule is the same wherever it is typed (GAP-222, decision 216): Enter or a
 * comma adds the text, trimmed, as an entry; text with commas or line breaks
 * in it (a paste) adds each part before the last and keeps the last typed;
 * an entry already in the field is not added again, and its text stays, so
 * nothing typed is lost unseen; Backspace in the empty field removes the
 * last entry.
 */
object KozmosChipInputEdit {
    data class Result(
        /** Every entry after the edit. */
        val entries: List<String>,
        /** The text left in the field. */
        val text: String,
        /** The entries the edit added, in order. */
        val added: List<String>,
        /** The entry that was already in the field, if one was typed again. */
        val duplicate: String?
    )

    private val separators = charArrayOf(',', '\n', '\r')

    /** Typed or pasted text: null while it holds no comma or line break. */
    fun typed(text: String, entries: List<String>): Result? {
        if (text.none { it in separators }) return null
        val parts = text.split(*separators)
        return adding(parts.dropLast(1), entries, rest = parts.last().trimStart())
    }

    /** Enter pressed: null when the field holds only spaces, which leaves Enter to the host. */
    fun submitted(text: String, entries: List<String>): Result? {
        val entry = text.trim()
        if (entry.isEmpty()) return null
        return adding(listOf(entry), entries, rest = "")
    }

    /** Backspace in the empty field: null with no entry to remove. */
    fun deletedInEmptyField(entries: List<String>): List<String>? =
        if (entries.isEmpty()) null else entries.dropLast(1)

    private fun adding(candidates: List<String>, entries: List<String>, rest: String): Result {
        val next = entries.toMutableList()
        val added = mutableListOf<String>()
        var duplicate: String? = null
        for (candidate in candidates) {
            val entry = candidate.trim()
            if (entry.isEmpty()) continue
            if (entry in next) duplicate = entry else {
                next += entry
                added += entry
            }
        }
        return Result(next, duplicate ?: rest, added, duplicate)
    }
}

/**
 * A field that takes free text and holds each entry as a removable chip
 * inside it (GAP-222, decision 216), as React's `ChipInput`: keywords,
 * aliases, e-mail addresses. [com.kozmos.components.multiselect.KozmosMultiSelect]
 * picks only from its options; this takes what the visitor types.
 *
 * Enter (the keyboard's Done) or a comma adds the text; Backspace in the
 * empty field removes the last entry; each chip has its own remove, named
 * by [removeLabel]. What is added or removed is said politely, in the
 * product's words: [addedLabel], [removedLabel], and [duplicateLabel] for
 * an entry typed again, which is not added and whose text stays.
 */
@Composable
fun KozmosChipInput(
    values: List<String>,
    onValuesChange: (List<String>) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String = "",
    enabled: Boolean = true,
    readOnly: Boolean = false,
    status: KozmosInputStatus = KozmosInputStatus.Default,
    error: Boolean = false,
    helperText: String? = null,
    errorMessage: String? = null,
    removeLabel: (String) -> String = { "Remove $it" },
    addedLabel: (String) -> String = { "$it added" },
    removedLabel: (String) -> String = { "$it removed" },
    duplicateLabel: (String) -> String = { "$it is already added" }
) {
    var text by rememberSaveable { mutableStateOf("") }
    // What the polite region says; every other message ends in a no-break
    // space, so the same words twice in a row are a change TalkBack reads.
    var said by rememberSaveable { mutableStateOf("") }
    var odd by rememberSaveable { mutableStateOf(false) }
    val say: (String) -> Unit = { words ->
        said = if (odd) words else "$words "
        odd = !odd
    }
    val locked = !enabled || readOnly
    val effectiveStatus = if (error) KozmosInputStatus.Error else status
    val supportingText = errorMessage ?: helperText
    val colors = selectionFieldColors(effectiveStatus, enabled, readOnly)
    val fieldShape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val fieldFocus = remember { FocusRequester() }

    fun apply(result: KozmosChipInputEdit.Result) {
        if (result.entries != values) onValuesChange(result.entries)
        text = result.text
        when {
            result.duplicate != null -> say(duplicateLabel(result.duplicate))
            result.added.isNotEmpty() -> say(result.added.joinToString(", ") { addedLabel(it) })
        }
    }

    fun remove(entry: String) {
        if (locked) return
        onValuesChange(values.filterNot { it == entry })
        say(removedLabel(entry))
    }

    fun removeLast(): Boolean {
        if (locked || text.isNotEmpty()) return false
        val next = KozmosChipInputEdit.deletedInEmptyField(values) ?: return false
        val last = values.last()
        onValuesChange(next)
        say(removedLabel(last))
        return true
    }

    fun submit(): Boolean {
        if (locked) return false
        val result = KozmosChipInputEdit.submitted(text, values) ?: return false
        apply(result)
        return true
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        if (label != null) {
            // Said with the field, which it names, not on its own.
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.label,
                modifier = Modifier.clearAndSetSemantics { }
            )
        }

        // MultiSelect's field, with no clear and no chevron.
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 44.dp)
                .background(colors.background, fieldShape)
                .border(1.dp, colors.border, fieldShape)
                .padding(
                    horizontal = KozmosDimensions.primitivesLayoutSpacing100,
                    vertical = KozmosDimensions.primitivesLayoutSpacing75
                ),
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
        ) {
            if (values.isNotEmpty()) {
                KozmosChipGroup(
                    horizontalSpacing = KozmosDimensions.primitivesLayoutSpacing75,
                    verticalSpacing = KozmosDimensions.primitivesLayoutSpacing75
                ) {
                    values.forEach { entry ->
                        KozmosChip(
                            text = entry,
                            size = ChipSize.Sm,
                            selected = true,
                            enabled = !locked,
                            removeLabel = removeLabel(entry),
                            onRemove = {
                                remove(entry)
                                // Its button goes with the chip: the field keeps focus.
                                fieldFocus.requestFocus()
                            }
                        )
                    }
                }
            }

            BasicTextField(
                value = text,
                onValueChange = { next ->
                    if (locked) return@BasicTextField
                    val result = KozmosChipInputEdit.typed(next, values)
                    if (result != null) apply(result) else text = next
                },
                enabled = enabled,
                readOnly = readOnly,
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyMedium.copy(color = colors.text),
                cursorBrush = SolidColor(KozmosThemeTokens.primitivesColorsTheme600),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { if (!submit()) defaultKeyboardAction(ImeAction.Done) }),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(36.dp)
                    .focusRequester(fieldFocus)
                    .onPreviewKeyEvent { event ->
                        if (event.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                        when (event.key) {
                            Key.Backspace -> removeLast()
                            Key.Enter, Key.NumPadEnter -> submit()
                            else -> false
                        }
                    }
                    .semantics { if (label != null) contentDescription = label },
                decorationBox = { innerTextField ->
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterStart) {
                        if (text.isEmpty() && values.isEmpty()) {
                            Text(text = placeholder, style = MaterialTheme.typography.bodyMedium, color = colors.placeholder)
                        }
                        innerTextField()
                    }
                }
            )
        }

        if (!supportingText.isNullOrBlank()) {
            Text(text = supportingText, style = MaterialTheme.typography.bodyMedium, color = colors.helper)
        }

        // What was added or removed, in a polite live region there from the
        // start, so each change is read, as the web's status is.
        Box(Modifier.size(1.dp).clearAndSetSemantics {
            liveRegion = LiveRegionMode.Polite
            if (said.isNotEmpty()) contentDescription = said
        })
    }
}

