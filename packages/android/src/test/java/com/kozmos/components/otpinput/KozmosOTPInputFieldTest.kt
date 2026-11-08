package com.kozmos.components.otpinput

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.platform.ClipboardManager
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalTextToolbar
import androidx.compose.ui.platform.TextToolbar
import androidx.compose.ui.platform.TextToolbarStatus
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.TextFieldValue
import com.kozmos.components.LiveSemantics
import com.kozmos.components.ReadNode
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Compose's OTPInput field, as SwiftUI's is and as React's cells are:
 *
 * - TalkBack hears one field, named by its label, or by `fieldLabel`
 *   ("Verification code") without one, and is told how many digits it
 *   takes, in the product's words (`digitCountLabel`), "6 digits" unless it
 *   gives its own;
 * - any decimal digit is taken as its ASCII digit, typed or pasted, so the
 *   host always receives ASCII;
 * - a paste replaces the code, whatever its length, a single digit included,
 *   as React's paste does; a paste with no digit changes nothing, and one
 *   that changes nothing leaves the next keystroke typed;
 * - a code a keyboard inserts in one edit (InsertTextAtCursor, as a
 *   clipboard chip or an SMS-code suggestion commits it) replaces the code,
 *   as SwiftUI's field takes it;
 * - read-only, the field is read and not dimmed, and takes no edit, typed or
 *   pasted; disabled, it is dimmed.
 *
 * Pastes are TalkBack's Paste, the field's PasteText action, from a clipboard
 * the test holds; typing is the SetText action, as in
 * [KozmosOTPInputAnalyticsTest].
 */
class KozmosOTPInputFieldTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val events = mutableListOf<KozmosAnalyticsEvent>()

    private val clipboard = object : ClipboardManager {
        var held: AnnotatedString? = null
        override fun setText(annotatedString: AnnotatedString) { held = annotatedString }
        override fun getText(): AnnotatedString? = held
    }

    private val noToolbar = object : TextToolbar {
        override val status = TextToolbarStatus.Hidden
        override fun hide() {}
        override fun showMenu(
            rect: Rect,
            onCopyRequested: (() -> Unit)?,
            onPasteRequested: (() -> Unit)?,
            onCutRequested: (() -> Unit)?,
            onSelectAllRequested: (() -> Unit)?
        ) {}
    }

    private fun completions() = events.count { it.eventName == "otp_code_completed" }

    private fun otp(
        code: MutableState<String>,
        readOnly: Boolean = false,
        onValueChange: ((String) -> Unit)? = null,
        script: suspend LiveSemantics.() -> Unit
    ) = paparazzi.live(durationMillis = 8000, content = {
        KozmosMaterialTheme {
            CompositionLocalProvider(
                LocalKozmosAnalytics provides { events += it },
                LocalClipboardManager provides clipboard,
                // A selection shows the toolbar, which this host cannot draw.
                LocalTextToolbar provides noToolbar
            ) {
                KozmosOTPInput(value = code.value, onValueChange = onValueChange ?: { code.value = it }, readOnly = readOnly)
            }
        }
    }, script = script)

    private fun LiveSemantics.field(): ReadNode = read().merged.single { it.setText != null || it.editableText != null }

    private suspend fun LiveSemantics.enter(text: String) {
        assertTrue("the field took no text", checkNotNull(field().setText) { "the field cannot be typed into" }(text))
        frames(2)
    }

    /** Puts [text] on the clipboard and pastes it into the focused field, as TalkBack's Paste does. */
    private suspend fun LiveSemantics.paste(text: String) {
        clipboard.held = AnnotatedString(text)
        field().requestFocus?.invoke()
        frames(2)
        val paste = checkNotNull(field().paste) { "the field offers no Paste" }
        paste()
        frames(2)
    }

    @Test
    fun theFieldSaysHowManyDigitsInTheProductsWords() {
        val plain = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosOTPInput(value = "", onValueChange = {}) }
        }.merged.single { it.setText != null }
        assertEquals("6 digits", plain.stateDescription)

        val translated = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosOTPInput(value = "", onValueChange = {}, length = 4, digitCountLabel = { "$it Ziffern" })
            }
        }.merged.single { it.setText != null }
        assertEquals("4 Ziffern", translated.stateDescription)
    }

    /**
     * TalkBack hears one field: its name is the drawn [label] (not heard again
     * before it), its text the code, its state the digit count.
     */
    @Test
    fun theFieldIsNamedByItsLabelWithTheCodeAndTheDigitCount() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosOTPInput(value = "123", onValueChange = {}, label = "Code from your email")
            }
        }
        val field = tree.merged.single { it.setText != null }
        assertEquals("Code from your email", field.description)
        assertEquals("123", field.editableText)
        assertEquals("6 digits", field.stateDescription)
        assertEquals(
            "the label is heard beside the field",
            emptyList<String>(),
            tree.merged.filter { it !== field && (it.description == "Code from your email" || "Code from your email" in it.texts) }
                .map { it.words.orEmpty() }
        )
    }

    /**
     * Without a label, the field is named by [fieldLabel]: "Verification code"
     * unless the product gives its own. A label wins over it.
     */
    @Test
    fun withoutALabelTheFieldIsNamedByItsFieldLabel() {
        val plain = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosOTPInput(value = "", onValueChange = {}) }
        }.merged.single { it.setText != null }
        assertEquals("Verification code", plain.description)

        val translated = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosOTPInput(value = "", onValueChange = {}, fieldLabel = "Bestätigungscode") }
        }.merged.single { it.setText != null }
        assertEquals("Bestätigungscode", translated.description)

        val labelled = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosOTPInput(value = "", onValueChange = {}, label = "Code from your email", fieldLabel = "Bestätigungscode")
            }
        }.merged.single { it.setText != null }
        assertEquals("Code from your email", labelled.description)
    }

    @Test
    fun digitsInAnyScriptArriveAsASCII() {
        val code = mutableStateOf("")
        otp(code) {
            enter("١٢٣٤٥٦")
            assertEquals("Arabic-Indic digits typed", "123456", code.value)
            assertEquals(1, completions())
            enter("")
            paste("१२३-४५६")
            assertEquals("Devanagari digits pasted", "123456", code.value)
            assertEquals(2, completions())
        }
    }

    /** A digit joined by a mark or a keycap keeps its value, and the mark is dropped, as on SwiftUI and React. */
    @Test
    fun aDigitWithAMarkOrAKeycapKeepsItsValue() {
        assertEquals("12", kozmosOtpCode("1\u0301\u0662\u0302", 6))
        assertEquals("12", kozmosOtpCode("1\uFE0F\u20E32", 6))
    }

    @Test
    fun aHostsDigitsInAnyScriptAreDrawnAsASCII() {
        val field = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosOTPInput(value = "١٢٣", onValueChange = {}) }
        }.merged.single { it.setText != null }
        assertEquals("123", field.editableText)
    }

    @Test
    fun aPasteReplacesTheCodeWhateverItsLength() {
        val code = mutableStateOf("")
        otp(code) {
            enter("123456")
            paste("7")
            assertEquals("a one-digit paste replaced the full code", "7", code.value)
            paste("abc")
            assertEquals("a paste with no digit changed the code", "7", code.value)
            paste("654-321")
            assertEquals("654321", code.value)
            assertEquals(2, completions())
        }
    }

    /** Inserts [text] at the field's cursor in one edit, as a keyboard's clipboard chip or SMS-code suggestion does. */
    private suspend fun LiveSemantics.insert(text: String) {
        field().requestFocus?.invoke()
        frames(2)
        val insert = checkNotNull(field().insertText) { "the field takes no inserted text" }
        assertTrue("the field took no inserted text", insert(text))
        frames(2)
    }

    /**
     * A whole code a keyboard inserts at once, with no clipboard read, as
     * Gboard's clipboard chip and SMS-code suggestion insert it, replaces the
     * code, as a paste does and as SwiftUI's field takes it: it is not put in
     * at the cursor and cut to the length.
     */
    @Test
    fun aCodeTheKeyboardInsertsReplacesTheCode() {
        val code = mutableStateOf("")
        otp(code) {
            enter("12")
            insert("789012")
            assertEquals("an inserted code was put in after the digits there", "789012", code.value)
            assertEquals(1, completions())
            insert("654321")
            assertEquals("an inserted code left a full code unchanged", "654321", code.value)
            assertEquals("editing a full code is no new completion", 1, completions())
            insert("ab")
            assertEquals("an insertion with no digit changed the code", "654321", code.value)
            enter("")
            insert("1")
            insert("2")
            assertEquals("one character inserted is typed", "12", code.value)
        }
    }

    /**
     * A paste that changes nothing, from an empty clipboard, leaves the next
     * keystroke a keystroke: what the paste read is not used for an edit it
     * did not make.
     */
    @Test
    fun aPasteThatChangesNothingLeavesTheNextKeystrokeTyped() {
        val code = mutableStateOf("")
        otp(code) {
            enter("12")
            paste("")
            assertEquals("12", code.value)
            enter("123")
            assertEquals("the keystroke after an empty paste was lost", "123", code.value)
        }
    }

    /** Selects [start] to [end] in the field, as TalkBack's cursor controls do. */
    private suspend fun LiveSemantics.select(start: Int, end: Int) {
        assertTrue("the field took no selection", checkNotNull(field().setSelection) { "the field takes no selection" }(start, end))
        frames(2)
    }

    /**
     * Set text, as TalkBack or an accessibility service sets it, replaces the
     * whole text, so its code is all of it, though it starts with the digits
     * the field held. An IME's select-all and commit replaces it the same way.
     */
    @Test
    fun setTextIsTheWholeCodeWhateverTheFieldHeld() {
        val code = mutableStateOf("")
        otp(code) {
            enter("12")
            enter("456712")
            assertEquals("set text was read as an insertion", "456712", code.value)
            assertEquals(1, completions())
            enter("12")
            enter("123412")
            assertEquals("set text after the same digits was read as an insertion", "123412", code.value)
            assertEquals(2, completions())
            select(0, 6)
            insert("987654")
            assertEquals("a commit over the whole text", "987654", code.value)
            assertEquals(2, completions())
        }
    }

    /** A code inserted before the digits the field holds is read whole, wherever the cursor was. */
    @Test
    fun aCodeInsertedBeforeTheDigitsIsReadWhole() {
        val code = mutableStateOf("")
        otp(code) {
            enter("12")
            select(0, 0)
            insert("123456")
            assertEquals("123456", code.value)
            assertEquals(1, completions())
        }
    }

    /**
     * A host that keeps its `value` sees the field go back to it after each
     * edit, and the next edit is read against that, not against the text the
     * host turned down.
     */
    @Test
    fun aHostThatKeepsItsValueHearsTheNextEditWhole() {
        val code = mutableStateOf("")
        val received = mutableListOf<String>()
        otp(code, onValueChange = { received += it }) {
            insert("1")
            assertEquals("", read().merged.single { it.setText != null }.editableText)
            insert("123456")
            assertEquals(listOf("1", "123456"), received)
            assertEquals(1, completions())
        }
    }

    /**
     * A paste that leaves the text as it was ("2" pasted over a selected "2")
     * leaves the next keystroke a keystroke, put in at the cursor.
     */
    @Test
    fun aPasteOverTheSameDigitLeavesTheNextKeystrokeTyped() {
        val code = mutableStateOf("")
        otp(code) {
            enter("12")
            select(1, 2)
            paste("2")
            assertEquals("12", code.value)
            insert("2")
            assertEquals("the keystroke after the paste replaced the code", "122", code.value)
        }
    }

    /** Typing, and typing over a selection, edit at the cursor, as before. */
    @Test
    fun typingEditsAtTheCursor() {
        val code = mutableStateOf("")
        otp(code) {
            insert("1")
            insert("2")
            insert("3")
            assertEquals("123", code.value)
            select(1, 2)
            insert("9")
            assertEquals("typing over a selection", "193", code.value)
            assertEquals(0, completions())
        }
    }

    /**
     * An edit is read against the selection it was made over: what went in
     * there, or nothing for a deletion such as Backspace.
     */
    @Test
    fun anEditIsReadAgainstItsSelection() {
        assertEquals("789012", kozmosOtpEdit(TextFieldValue("12", TextRange(2)), TextFieldValue("12789012", TextRange(8))))
        assertEquals("3412", kozmosOtpEdit(TextFieldValue("12", TextRange(2)), TextFieldValue("123412", TextRange(6))))
        assertEquals("123456", kozmosOtpEdit(TextFieldValue("12", TextRange(0)), TextFieldValue("12345612", TextRange(6))))
        assertEquals("9", kozmosOtpEdit(TextFieldValue("123", TextRange(1, 2)), TextFieldValue("193", TextRange(2))))
        assertEquals("a Backspace inserts nothing", null, kozmosOtpEdit(TextFieldValue("123", TextRange(3)), TextFieldValue("12", TextRange(2))))
        assertEquals("deleting a selection inserts nothing", "", kozmosOtpEdit(TextFieldValue("123", TextRange(1, 2)), TextFieldValue("13", TextRange(1))))
    }

    @Test
    fun aReadOnlyFieldIsReadNotDimmedAndTakesNoEdit() {
        val code = mutableStateOf("123")
        otp(code, readOnly = true) {
            val field = field()
            assertTrue("a read-only field is read as disabled", field.enabled)
            assertEquals("123", field.editableText)
            println("OTP read-only: SetText offered ${field.setText != null}, PasteText offered ${field().paste != null}")
            field.setText?.invoke("1234")
            frames(2)
            clipboard.held = AnnotatedString("654321")
            field().requestFocus?.invoke()
            frames(2)
            field().paste?.invoke()
            frames(2)
            assertEquals("a read-only field took an edit", "123", code.value)
            assertEquals(0, completions())
        }
        // The same field, editable, takes both: the edits above were real.
        val editable = mutableStateOf("123")
        otp(editable) {
            enter("1234")
            paste("654321")
            assertEquals("654321", editable.value)
        }
    }

    @Test
    fun aDisabledFieldIsDimmed() {
        val field = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosOTPInput(value = "123", onValueChange = {}, enabled = false) }
        }.merged.single { it.editableText != null }
        assertEquals(false, field.enabled)
        assertNotNull(field.editableText)
    }
}
