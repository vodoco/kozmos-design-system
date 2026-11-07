package com.kozmos.components.otpinput

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.platform.ClipboardManager
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
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
 * - TalkBack is told how many digits the field takes, in the product's words
 *   (`digitCountLabel`), "6 digits" unless it gives its own;
 * - any decimal digit is taken as its ASCII digit, typed or pasted, so the
 *   host always receives ASCII;
 * - a paste replaces the code, whatever its length, a single digit included,
 *   as React's paste does; a paste with no digit changes nothing;
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

    private fun completions() = events.count { it.eventName == "otp_code_completed" }

    private fun otp(
        code: MutableState<String>,
        readOnly: Boolean = false,
        script: suspend LiveSemantics.() -> Unit
    ) = paparazzi.live(durationMillis = 8000, content = {
        KozmosMaterialTheme {
            CompositionLocalProvider(
                LocalKozmosAnalytics provides { events += it },
                LocalClipboardManager provides clipboard
            ) {
                KozmosOTPInput(value = code.value, onValueChange = { code.value = it }, readOnly = readOnly)
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
