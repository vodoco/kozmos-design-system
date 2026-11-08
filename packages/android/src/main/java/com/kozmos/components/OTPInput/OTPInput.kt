package com.kozmos.components.otpinput

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.ClipboardManager
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setText
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * A segmented numeric code field: one text field holds the code, and the
 * cells draw it.
 *
 * Any decimal digit is taken, as its ASCII digit ("٣" is 3), and nothing else,
 * up to [length], so [onValueChange] always receives ASCII, as SwiftUI's does.
 * A paste replaces the code, whatever its length, as React's paste does, and
 * so does more than one character a keyboard inserts at once (its clipboard
 * chip, an SMS code), as SwiftUI's field takes it.
 * Read-only, the field can be focused and read, and takes no edit; disabled,
 * it is dimmed. TalkBack hears one field: named by [label], or [fieldLabel]
 * without one, with the code as its text and [digitCountLabel] as its state.
 *
 * @param digitCountLabel The words TalkBack reads as the field's state for its
 * number of cells, "6 digits" unless the product gives its own.
 * @param fieldLabel The field's name when no [label] is drawn: "Verification
 * code" unless the product gives its own. A [label] names the field instead.
 */
@Composable
fun KozmosOTPInput(
    value: String,
    onValueChange: (String) -> Unit,
    length: Int = 6,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    label: String? = null,
    status: KozmosInputStatus = KozmosInputStatus.Default,
    error: Boolean = false,
    helperText: String? = null,
    errorMessage: String? = null,
    digitCountLabel: (Int) -> String = { if (it == 1) "1 digit" else "$it digits" },
    fieldLabel: String = "Verification code"
) {
    val cellCount = length.coerceAtLeast(1)
    val effectiveStatus = if (error) KozmosInputStatus.Error else status
    val supportingText = errorMessage ?: helperText
    val displayValue = kozmosOtpCode(value, cellCount)
    val trackEvent = LocalKozmosAnalytics.current
    // What an edit is measured against: the code as last drawn, or, since,
    // as the field last passed it on. A host's new `value` resets it once it
    // is drawn.
    val held = remember { KozmosOtpHeldCode(displayValue) }
    // The field's selection (and any composition), kept here so the field's
    // text is always the drawn code and each edit can be read exactly.
    var editor by remember { mutableStateOf(TextFieldValue(displayValue, TextRange(displayValue.length))) }
    // Bumped by every edit, so this composes again after each one: the field
    // is then handed `shown` again, and its editor reset to it.
    var edits by remember { mutableIntStateOf(0) }
    val shown = editor.copy(text = displayValue)
    val generation = edits
    SideEffect {
        held.draw(displayValue)
        // Composed again, the field's editor holds exactly what it was handed.
        held.field = shown
    }
    // A paste reads the clipboard just before it hands the field its edit, so
    // the field knows the edit is a paste, and what was pasted.
    val clipboard = LocalClipboardManager.current
    val paste = remember { KozmosOtpPaste() }
    val watchedClipboard = remember(clipboard) { paste.watching(clipboard) }
    val statusColor = when (effectiveStatus) {
        KozmosInputStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
        KozmosInputStatus.Warning -> KozmosThemeTokens.primitivesColorsEmotionalAlert600
        KozmosInputStatus.Success -> KozmosThemeTokens.primitivesColorsEmotionalSuccess600
        KozmosInputStatus.Default -> null
    }
    val inactiveBorderColor = statusColor ?: KozmosThemeTokens.semanticsBorderInput
    val fieldBackground = if (!enabled || readOnly) {
        KozmosThemeTokens.primitivesColorsBackground100
    } else {
        KozmosThemeTokens.primitivesColorsBackground0
    }
    val textColor = when {
        !enabled -> KozmosThemeTokens.primitivesColorsForeground500
        statusColor != null -> statusColor
        else -> MaterialTheme.colorScheme.onSurface
    }
    val helperColor = when {
        !enabled -> KozmosThemeTokens.primitivesColorsForeground500
        statusColor != null -> statusColor
        else -> KozmosThemeTokens.primitivesColorsForeground400
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        if (label != null) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = statusColor ?: textColor,
                // The field's name, said with the field: not heard before it.
                modifier = Modifier.clearAndSetSemantics {}
            )
        }

        CompositionLocalProvider(LocalClipboardManager provides watchedClipboard) {
            // The code as an edit leaves it, passed on, with analytics told when
            // the edit fills the last empty cell.
            fun enter(code: String) {
                if (!enabled || readOnly) return
                val before = held.code
                held.code = code
                editor = TextFieldValue(code, TextRange(code.length))
                onValueChange(code)
                if (before.length < cellCount && code.length == cellCount) {
                    trackEvent(
                        KozmosAnalyticsEvent(
                            component = "OTPInput",
                            eventName = "otp_code_completed",
                            properties = mapOf("length" to cellCount.toString())
                        )
                    )
                }
            }
            BasicTextField(
                value = shown,
                // The field calls this with what the user typed or pasted, and only
                // then: a code the host passes as `value` is drawn, never handed
                // here. So analytics hears a code completed here, as React's
                // OTPInput does: once, when an edit fills the last empty cell. An
                // edit to a full code is no new completion, a code the host sets is
                // not the user's, and a code a shorter `length` makes full was
                // typed into no cell. Each edit is measured against the code the
                // field last passed on, not only against `value` as last drawn, so
                // two edits before a recomposition, or a host that takes the code
                // a frame or more later, still count one completion.
                // A paste replaces the code, whatever its length, as React's does,
                // and so does more than one character inserted in one edit, as a
                // keyboard's clipboard chip or SMS-code suggestion commits it,
                // with no clipboard read, as SwiftUI's field takes it. Either,
                // with no digit in it, changes nothing.
                // Each edit is read exactly, against what the field's editor
                // held: the code it was handed with its selection, or what the
                // last edit left in it. Text put in over the selection is
                // [kozmosOtpEdit]'s insertion; anything else (Backspace, a
                // deletion) is the edited text, as digits.
                onValueChange = { edited ->
                    edits = generation + 1
                    val before = held.field
                    held.field = edited
                    // What a paste read is its edit's only if the edit put it in.
                    val pasted = paste.take()
                    if (edited.text == before.text) {
                        editor = edited
                        return@BasicTextField
                    }
                    val inserted = kozmosOtpEdit(before, edited)
                    val replacement = inserted?.takeIf {
                        (pasted != null && pasted.isNotEmpty() && it == pasted) || kozmosOtpCharacterCount(it) > 1
                    }
                    val code = kozmosOtpCode(replacement ?: edited.text, cellCount)
                    if (replacement != null && code.isEmpty()) return@BasicTextField
                    enter(code)
                },
                enabled = enabled,
                readOnly = readOnly,
                singleLine = true,
                cursorBrush = SolidColor(KozmosThemeTokens.primitivesColorsTheme600),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics {
                        contentDescription = label ?: fieldLabel
                        stateDescription = digitCountLabel(cellCount)
                        // Set text (TalkBack's, an accessibility service's)
                        // replaces the whole text, so its code is all of it,
                        // whatever the field held: the field's own reads as an
                        // insertion at the cursor.
                        setText { text ->
                            if (!enabled || readOnly) return@setText false
                            edits = generation + 1
                            enter(kozmosOtpCode(text.text, cellCount))
                            true
                        }
                    },
                decorationBox = { innerTextField ->
                    Box(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            repeat(cellCount) { index ->
                                val char = if (index < displayValue.length) displayValue[index] else null
                                val activeIndex = displayValue.length.coerceAtMost(cellCount - 1)
                                val isActive = index == activeIndex && enabled && !readOnly
                                // The active cell's ring is a focus ring: theme/600 (decision 59).
                                val borderColor = if (isActive) {
                                    KozmosThemeTokens.primitivesColorsTheme600
                                } else {
                                    inactiveBorderColor
                                }

                                Box(
                                    modifier = Modifier
                                        .width(44.dp)
                                        .height(50.dp)
                                        .background(fieldBackground, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
                                        .border(
                                            width = if (isActive) 2.dp else 1.dp,
                                            color = borderColor,
                                            shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (char != null) {
                                        Text(
                                            text = char.toString(),
                                            style = MaterialTheme.typography.titleLarge,
                                            textAlign = TextAlign.Center,
                                            color = textColor
                                        )
                                    }
                                }
                            }
                        }

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .alpha(0f)
                        ) {
                            innerTextField()
                        }
                    }
                }
            )
        }

        if (!supportingText.isNullOrBlank()) {
            Text(
                text = supportingText,
                style = MaterialTheme.typography.bodyMedium,
                color = helperColor
            )
        }
    }
}

/**
 * The code an OTP edit is measured against. [code] is what the field last
 * passed on, or the code as drawn once the host's value changes: [draw] runs
 * after each composition, and resets [code] only when the drawn code is new.
 * A host that ignores a write, or takes it later, leaves [code] at what the
 * user entered until its value changes, as React's cells keep it.
 */
private class KozmosOtpHeldCode(private var drawn: String) {
    var code: String = drawn

    /**
     * The text the field holds, which its next edit starts from: what the
     * last edit left in it, or the code as last drawn.
     */
    var field: TextFieldValue = TextFieldValue(drawn, TextRange(drawn.length))

    fun draw(displayValue: String) {
        if (displayValue != drawn) {
            drawn = displayValue
            code = displayValue
        }
    }
}

/**
 * The code in [text]: each decimal digit, in any script, as its ASCII digit
 * ("٣" and "३" are 3), and nothing else, at most [length] of them. SwiftUI's
 * field keeps the same rule.
 */
internal fun kozmosOtpCode(text: String, length: Int): String {
    val code = StringBuilder()
    var index = 0
    while (index < text.length && code.length < length) {
        val codePoint = text.codePointAt(index)
        if (Character.isDigit(codePoint)) code.append('0' + Character.digit(codePoint, 10))
        index += Character.charCount(codePoint)
    }
    return code.toString()
}

/**
 * The text an edit put in over [before]'s selection, or null when [after] is
 * not [before] with its selection replaced (Backspace, a deletion). Exact:
 * the selection says where the edit went, so a code typed or inserted after
 * the same digits is read whole.
 */
internal fun kozmosOtpEdit(before: TextFieldValue, after: TextFieldValue): String? {
    val start = before.selection.min.coerceIn(0, before.text.length)
    val end = before.selection.max.coerceIn(start, before.text.length)
    val head = before.text.substring(0, start)
    val tail = before.text.substring(end)
    val text = after.text
    if (text.length < head.length + tail.length || !text.startsWith(head) || !text.endsWith(tail)) return null
    return text.substring(head.length, text.length - tail.length)
}

/**
 * How many characters [text] holds, a mark or a keycap joined to the one
 * before it: so a digit with a mark is one character, as SwiftUI counts it.
 */
internal fun kozmosOtpCharacterCount(text: String): Int {
    var count = 0
    var index = 0
    while (index < text.length) {
        val codePoint = text.codePointAt(index)
        when (Character.getType(codePoint).toByte()) {
            Character.NON_SPACING_MARK, Character.ENCLOSING_MARK, Character.COMBINING_SPACING_MARK -> {}
            else -> count++
        }
        index += Character.charCount(codePoint)
    }
    return count
}

/**
 * What a paste read from the clipboard, held until the field's next edit,
 * and used only if that edit inserted it: a paste that changed nothing (an
 * empty clipboard, or the same code pasted over itself) hands the field no
 * edit, and the next keystroke is no paste. The clipboard is watched only
 * where a paste reads it: asking whether it holds text, as the toolbar does,
 * records nothing.
 */
private class KozmosOtpPaste {
    private var text: String? = null

    fun take(): String? = text.also { text = null }

    fun watching(clipboard: ClipboardManager): ClipboardManager = object : ClipboardManager {
        override fun setText(annotatedString: AnnotatedString) = clipboard.setText(annotatedString)
        override fun getText(): AnnotatedString? = clipboard.getText().also { text = it?.text }
        override fun hasText(): Boolean = clipboard.hasText()
    }
}
