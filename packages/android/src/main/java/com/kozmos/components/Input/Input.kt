package com.kozmos.components.input

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Text
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.Icon
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.AnnotatedString
import com.kozmos.components.fieldwrapper.KozmosMixedReset
import com.kozmos.components.fieldwrapper.KozmosMixedValue
import com.kozmos.components.fieldwrapper.kozmosUnsaidWhen
import kotlinx.coroutines.delay
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

enum class KozmosInputStatus {
    Default,
    Error,
    Warning,
    Success
}

/**
 * A button inside the field's end (GAP-154, decision 137), drawn as
 * PasswordInput's reveal is: as tall as the field, its target.
 */
sealed interface KozmosInputAction {
    /** The button's name. */
    val label: String

    /**
     * Copies the field's value and says so: "Copied" is announced and a check
     * stands in for the copy icon for two seconds. For a read-only value a
     * product shows and never edits, a feature's ID; it copies from a
     * read-only field too.
     */
    data class Copy(
        override val label: String = "Copy",
        val copiedLabel: String = "Copied",
        val onCopy: ((String) -> Unit)? = null
    ) : KozmosInputAction

    /**
     * A pressed button with its own name, as the reveal is: the Featured star
     * at a field's end. [icon] is the product's, drawn at 16 in the button's
     * colour, `Icons.Default.Star`. Pressed, it is drawn
     * as a pressed ToggleButton is, the theme fill under the icon in a shape
     * inside the button (decisions 164 and 165), so pressed is a shape and not
     * a colour alone; TalkBack reads it as a toggle, on or off.
     */
    data class Toggle(
        override val label: String,
        val icon: ImageVector,
        val pressed: Boolean,
        val onPressedChange: (Boolean) -> Unit
    ) : KozmosInputAction
}

/** Decision 164: what a field-end button draws is 4 in from its edges, with the control radius less 4. */
internal val KozmosFieldActionInset = 4.dp

/** How long the copy's check stays, as the web's. */
internal const val KozmosCopiedMillis = 2000L

@Composable
fun KozmosInput(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "",
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    label: String? = null,
    status: KozmosInputStatus = KozmosInputStatus.Default,
    error: Boolean = false,
    helperText: String? = null,
    errorMessage: String? = null,
    /** A copy or toggle button inside the field's end (GAP-154). */
    action: KozmosInputAction? = null,
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL
) {
    // Mixed (GAP-153), the field shows none of its own text; the visitor's
    // typing still reaches the product, which clears `mixed`.
    val shownValue = if (mixed) "" else value
    val fieldFocus = remember { FocusRequester() }
    val effectiveStatus = if (error) KozmosInputStatus.Error else status
    val supportingText = errorMessage ?: helperText
    val fieldShape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val statusColor = when (effectiveStatus) {
        KozmosInputStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
        KozmosInputStatus.Warning -> KozmosThemeTokens.primitivesColorsEmotionalAlert600
        KozmosInputStatus.Success -> KozmosThemeTokens.primitivesColorsEmotionalSuccess600
        KozmosInputStatus.Default -> null
    }
    val borderColor = statusColor ?: KozmosThemeTokens.semanticsBorderInput
    val fieldBackground = if (!enabled || readOnly) {
        KozmosThemeTokens.primitivesColorsBackground100
    } else {
        KozmosThemeTokens.primitivesColorsBackground0
    }
    val textColor = when {
        effectiveStatus == KozmosInputStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
        !enabled -> KozmosThemeTokens.primitivesColorsForeground500
        else -> MaterialTheme.colorScheme.onSurface
    }
    val placeholderColor = when {
        !enabled -> KozmosThemeTokens.primitivesColorsForeground500
        else -> KozmosThemeTokens.primitivesColorsForeground400
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
                color = statusColor ?: textColor
            )
        }

        BasicTextField(
            value = shownValue,
            onValueChange = onValueChange,
            enabled = enabled,
            readOnly = readOnly,
            singleLine = true,
            textStyle = MaterialTheme.typography.bodyMedium.copy(color = textColor),
            cursorBrush = SolidColor(KozmosThemeTokens.primitivesColorsTheme600),
            // Said as its state while mixed, set in one semantics block so the
            // field is the same node as it stops being mixed and keeps focus.
            modifier = Modifier.fillMaxWidth().focusRequester(fieldFocus).semantics {
                if (mixed) stateDescription = mixedLabel
            },
            decorationBox = { innerTextField ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .background(fieldBackground, fieldShape)
                        .border(1.dp, borderColor, fieldShape),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .padding(
                                start = KozmosDimensions.primitivesLayoutSpacing150,
                                end = if (action == null) KozmosDimensions.primitivesLayoutSpacing150 else 0.dp
                            ),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        if (shownValue.isEmpty()) {
                            Text(
                                text = if (mixed) mixedLabel else placeholder,
                                style = MaterialTheme.typography.bodyMedium,
                                color = placeholderColor,
                                // Mixed, the field says it as its state: the
                                // drawn words are not said again.
                                modifier = Modifier.kozmosUnsaidWhen(mixed)
                            )
                        }
                        innerTextField()
                    }
                    if (action != null) {
                        // Only `enabled` disables it: a read-only field's
                        // value is still there to copy.
                        // Mixed (GAP-153), there is no value of its own to copy:
                        // the copy is disabled, never "Copied" over nothing.
                        KozmosInputActionButton(
                            action,
                            shownValue,
                            enabled && !(mixed && action is KozmosInputAction.Copy)
                        )
                    }
                }
            }
        )

        if (KozmosMixedValue.showsReset(mixed, onResetMixed, enabled, readOnly)) {
            KozmosMixedReset(label = resetMixedLabel, onClick = {
                // The reset goes as the field turns mixed again: focus goes
                // back to the field, as on the web.
                fieldFocus.requestFocus()
                onResetMixed?.invoke()
            })
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
 * The button at the field's end: 44 square, as tall as the field, its target;
 * what it draws is inside it, 4 in from its edges (decision 164).
 */
@Composable
private fun KozmosInputActionButton(action: KozmosInputAction, value: String, enabled: Boolean) {
    val fillShape = RoundedCornerShape((KozmosDimensions.semanticsRadiusControl - KozmosFieldActionInset).coerceAtLeast(0.dp))
    when (action) {
        is KozmosInputAction.Copy -> {
            val clipboard = LocalClipboardManager.current
            var copies by remember { mutableIntStateOf(0) }
            var said by remember { mutableStateOf("") }
            LaunchedEffect(copies) {
                if (copies == 0) return@LaunchedEffect
                delay(KozmosCopiedMillis)
                copies = 0
                said = ""
            }
            Box(Modifier.size(44.dp)) {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .clickable(enabled = enabled, role = Role.Button) {
                            clipboard.setText(AnnotatedString(value))
                            // The same words twice are not read twice: a
                            // second copy changes them by a no-break space, as
                            // the web's.
                            said = if (said == action.copiedLabel) "${action.copiedLabel}\u00a0" else action.copiedLabel
                            copies += 1
                            action.onCopy?.invoke(value)
                        }
                        .semantics { contentDescription = action.label },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (copies > 0) Icons.Default.Check else Icons.Default.ContentCopy,
                        contentDescription = null,
                        tint = if (enabled) KozmosThemeTokens.primitivesColorsForeground400 else KozmosThemeTokens.primitivesColorsForeground500,
                        modifier = Modifier.size(16.dp)
                    )
                }
                // What it says once copied, in a polite live region beside
                // the button, there from the start so the change is read, as
                // the web's status.
                Box(Modifier.size(1.dp).clearAndSetSemantics {
                    liveRegion = LiveRegionMode.Polite
                    if (said.isNotEmpty()) contentDescription = said
                })
            }
        }

        is KozmosInputAction.Toggle -> {
            val pressed = action.pressed
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .toggleable(
                        value = pressed,
                        enabled = enabled,
                        // As ToggleButton's: no role, so TalkBack reads it
                        // as a toggle, on or off, with its own name.
                        onValueChange = action.onPressedChange
                    )
                    .semantics { contentDescription = action.label },
                contentAlignment = Alignment.Center
            ) {
                Box(
                    Modifier
                        .matchParentSize()
                        .padding(KozmosFieldActionInset)
                        .alpha(if (!enabled && pressed) 0.5f else 1f)
                        .background(
                            if (pressed) KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle else Color.Transparent,
                            fillShape
                        )
                )
                Icon(
                    imageVector = action.icon,
                    contentDescription = null,
                    tint = when {
                        pressed -> KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
                        !enabled -> KozmosThemeTokens.primitivesColorsForeground500
                        else -> KozmosThemeTokens.primitivesColorsForeground400
                    },
                    modifier = Modifier.size(16.dp).alpha(if (!enabled && pressed) 0.5f else 1f)
                )
            }
        }
    }
}
