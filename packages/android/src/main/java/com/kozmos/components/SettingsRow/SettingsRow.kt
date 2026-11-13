package com.kozmos.components.settingsrow

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp
import com.kozmos.components.fieldwrapper.KozmosMixedReset
import com.kozmos.components.list.KozmosListItem
import com.kozmos.components.tag.KozmosTag
import com.kozmos.components.tag.KozmosTagVariant
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography

/**
 * Where a setting's value comes from (GAP-040, decision 135): the system's,
 * which the site has not changed, or the site's own, which Reset to default
 * gives back to the system's.
 */
enum class KozmosSettingsRowState { Inherited, Overridden }

/**
 * A settings row (GAP-040, decision 135), as React's SettingsRow: a name and
 * a description, one control at the end, the value's state (inherited from
 * the system, or overridden by the site, with Reset to default) and a reason
 * when it is disabled. It is a [KozmosListItem] filled in, for a KozmosList,
 * with its divider.
 *
 * [control] draws the setting's control with the `modifier` and `enabled` it
 * is handed: the modifier names it by [label] and reads [description], the
 * state and the disabled reason with it, and takes focus back on Reset. Give
 * the control no label of its own.
 *
 * ```kotlin
 * KozmosSettingsRow(label = "Analytics", state = KozmosSettingsRowState.Inherited) { modifier, enabled ->
 *     KozmosSwitch(checked = on, onCheckedChange = { on = it }, modifier = modifier, enabled = enabled)
 * }
 * ```
 *
 * @param state Inherited or overridden, drawn as a tag beside the name; null,
 *   the setting has no system value and no tag.
 * @param onReset Offered as Reset to default while the row is overridden and
 *   enabled. Pressed, focus goes to the control first, then this is called:
 *   the product sets the system's value and the inherited state.
 * @param enabled False, the control is disabled and [disabledReason] shown.
 */
@Composable
fun KozmosSettingsRow(
    label: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    state: KozmosSettingsRowState? = null,
    inheritedLabel: String = "Inherited",
    overriddenLabel: String = "Overridden",
    onReset: (() -> Unit)? = null,
    resetLabel: String = "Reset to default",
    enabled: Boolean = true,
    disabledReason: String? = null,
    showDivider: Boolean = true,
    control: @Composable (modifier: Modifier, enabled: Boolean) -> Unit
) {
    val controlFocus = remember { FocusRequester() }
    val stateLabel = when (state) {
        KozmosSettingsRowState.Inherited -> inheritedLabel
        KozmosSettingsRowState.Overridden -> overriddenLabel
        null -> null
    }
    val shownReason = if (!enabled) disabledReason else null
    val showsReset = state == KozmosSettingsRowState.Overridden && onReset != null && enabled
    val spoken = kozmosSettingsRowControlDescription(label, description, stateLabel, shownReason)

    KozmosListItem(
        text = label,
        modifier = modifier,
        showDivider = showDivider,
        description = description,
        titleAddon = stateLabel?.let { words ->
            {
                KozmosTag(
                    text = words,
                    variant = if (state == KozmosSettingsRowState.Overridden) {
                        KozmosTagVariant.Secondary
                    } else {
                        KozmosTagVariant.Outline
                    }
                )
            }
        },
        metaContent = if (shownReason != null || showsReset) {
            {
                Column(verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)) {
                    if (shownReason != null) {
                        Text(
                            text = shownReason,
                            style = TextStyle(
                                fontFamily = KozmosTypography.family,
                                fontSize = 12.sp,
                                lineHeight = 16.sp
                            ),
                            color = KozmosThemeTokens.primitivesColorsForeground400
                        )
                    }
                    if (showsReset) {
                        KozmosMixedReset(label = resetLabel, onClick = {
                            // The reset goes as the row turns inherited: focus
                            // goes to the control, as on the web.
                            runCatching { controlFocus.requestFocus() }
                            onReset?.invoke()
                        })
                    }
                }
            }
        } else {
            null
        },
        trailing = {
            control(
                Modifier
                    .focusRequester(controlFocus)
                    .semantics { contentDescription = spoken },
                enabled
            )
        }
    )
}

/**
 * What TalkBack reads for the control: its name, then the description, the
 * state and the disabled reason, as React's name and aria-describedby.
 */
internal fun kozmosSettingsRowControlDescription(
    label: String,
    description: String?,
    stateLabel: String?,
    reason: String?
): String = listOfNotNull(label, description, stateLabel, reason).joinToString(", ")
