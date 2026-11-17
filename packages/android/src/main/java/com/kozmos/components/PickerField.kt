package com.kozmos.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import com.kozmos.components.fieldwrapper.KozmosMixedReset
import com.kozmos.components.fieldwrapper.KozmosMixedValue
import com.kozmos.components.fieldwrapper.kozmosUnsaidWhen
import androidx.compose.ui.unit.dp
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

/**
 * The field a picker opens from, drawn by Kozmos as React's pickers are
 * drawn in its FieldWrapper: the label above, a 44-high field with the
 * control radius and the input border on background/0, an icon at its start
 * and, for a date or a time, Figma's chevron at its end; the helper text
 * under it. Status colours the label, the edge and the helper, as
 * KozmosInput's does; focused, the edge is theme/600; disabled or read-only,
 * the field is background/100, and only an enabled, editable one opens.
 *
 * For TalkBack it is one control, a button named by its label, that says the
 * value it shows; the label drawn above is not read a second time.
 *
 * [mixed] (GAP-153, GAP-255): the field stands for several values that
 * differ, and shows none of its own: [mixedLabel] in its place in the
 * placeholder's colour, which TalkBack says once, as the field's state, the
 * drawn words unsaid. [onResetMixed] offers [resetMixedLabel] under the field
 * once it is no longer mixed, never while it is disabled or read-only;
 * pressed, focus goes back to the field. [KozmosMixedValue] has the whole of it.
 */
@Composable
internal fun KozmosPickerField(
    label: String?,
    value: String?,
    icon: ImageVector,
    onOpen: () -> Unit,
    modifier: Modifier = Modifier,
    chevron: Boolean = true,
    status: KozmosInputStatus = KozmosInputStatus.Default,
    helperText: String? = null,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL,
    // The field's own, or the caller's, as a range's one reset hands focus
    // to its start field.
    fieldFocus: FocusRequester = remember { FocusRequester() }
) {
    val statusColor = pickerStatusColor(status)
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val edge = when {
        statusColor != null -> statusColor
        focused && enabled && !readOnly -> KozmosThemeTokens.primitivesColorsTheme600
        else -> KozmosThemeTokens.semanticsBorderInput
    }
    val fill = if (!enabled || readOnly) {
        KozmosThemeTokens.primitivesColorsBackground100
    } else {
        KozmosThemeTokens.primitivesColorsBackground0
    }
    val words = if (enabled) KozmosThemeTokens.primitivesColorsForeground0 else KozmosThemeTokens.primitivesColorsForeground500
    val mark = if (enabled) KozmosThemeTokens.primitivesColorsForeground400 else KozmosThemeTokens.primitivesColorsForeground500

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        if (label != null) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = statusColor ?: if (enabled) KozmosThemeTokens.primitivesColorsForeground100 else KozmosThemeTokens.primitivesColorsForeground500,
                // The field carries this name; heard here too, it is said twice.
                modifier = Modifier.clearAndSetSemantics { }
            )
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
                .background(fill, shape)
                .border(1.dp, edge, shape)
                // Read-only, it shows its value and opens nothing, and is not
                // a disabled button; disabled, it is.
                .focusRequester(fieldFocus)
                .then(
                    if (readOnly && enabled) {
                        Modifier
                    } else {
                        Modifier.clickable(
                            interactionSource = interaction,
                            indication = null,
                            enabled = enabled,
                            role = Role.Button,
                            onClick = onOpen
                        )
                    }
                )
                .semantics(mergeDescendants = true) {
                    if (label != null) contentDescription = label
                    // Mixed, said as its state; the drawn words are not said again.
                    if (mixed) stateDescription = mixedLabel
                }
                .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing150),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = mark, modifier = Modifier.size(18.dp))
            if (mixed) {
                Text(
                    text = mixedLabel,
                    style = MaterialTheme.typography.bodyMedium,
                    // The placeholder's colour, as a mixed Select's words.
                    color = mark,
                    maxLines = 1,
                    modifier = Modifier.weight(1f).kozmosUnsaidWhen(true)
                )
            } else if (value != null) {
                Text(
                    text = value,
                    style = MaterialTheme.typography.bodyMedium,
                    color = words,
                    maxLines = 1,
                    modifier = Modifier.weight(1f)
                )
            } else {
                // No value, no words: the chevron still keeps to the end.
                Spacer(Modifier.weight(1f))
            }
            if (chevron) {
                Icon(Icons.Default.KeyboardArrowDown, contentDescription = null, tint = mark, modifier = Modifier.size(16.dp))
            }
        }
        if (KozmosMixedValue.showsReset(mixed, onResetMixed, enabled, readOnly)) {
            KozmosMixedReset(label = resetMixedLabel, onClick = {
                // Focus goes back to the field, as on the web.
                fieldFocus.requestFocus()
                onResetMixed?.invoke()
            })
        }
        if (!helperText.isNullOrBlank()) {
            Text(
                text = helperText,
                style = MaterialTheme.typography.bodyMedium,
                color = when {
                    // Disabled, the disabled text's colour, never darker than
                    // the words beside it; else the muted colour, as
                    // KozmosFieldWrapper's helper.
                    !enabled -> KozmosThemeTokens.primitivesColorsForeground500
                    statusColor != null -> statusColor
                    else -> KozmosThemeTokens.primitivesColorsForeground400
                }
            )
        }
    }
}

@Composable
internal fun pickerStatusColor(status: KozmosInputStatus): Color? = when (status) {
    KozmosInputStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
    KozmosInputStatus.Warning -> KozmosThemeTokens.primitivesColorsEmotionalAlert600
    KozmosInputStatus.Success -> KozmosThemeTokens.primitivesColorsEmotionalSuccess600
    KozmosInputStatus.Default -> null
}

/** A picker dialog's buttons, in the platform's own words for OK and Cancel. */
@Composable
internal fun PickerConfirmButton(enabled: Boolean = true, onClick: () -> Unit) =
    TextButton(onClick = onClick, enabled = enabled) { Text(stringResource(android.R.string.ok)) }

@Composable
internal fun PickerDismissButton(onClick: () -> Unit) =
    TextButton(onClick = onClick) { Text(stringResource(android.R.string.cancel)) }

/**
 * Material's pickers hold a day as the UTC midnight that starts it, whatever
 * the device's zone: converted in UTC, a date never moves a day.
 */
internal fun LocalDate.toPickerMillis(): Long = atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()

internal fun Long.toPickerDate(): LocalDate = Instant.ofEpochMilli(this).atZone(ZoneOffset.UTC).toLocalDate()

/**
 * What a picker's dialog starts from: the field's value, or, mixed (GAP-255),
 * nothing chosen, so no one feature's value is offered as the field's.
 */
internal fun <T> pickerInitialValue(value: T?, mixed: Boolean): T? = if (mixed) null else value
