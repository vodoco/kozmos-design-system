package com.kozmos.components.routelocationfield

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.components.combobox.KozmosCombobox
import com.kozmos.components.combobox.KozmosComboboxLabels
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.listbox.KozmosPickerAction
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

enum class KozmosRouteLocationStatus { Idle, Loading, Ready, Empty, Error }
enum class KozmosRouteLocationFilterMode { Local, Host }

/** Resolved identity is separate from query text. The host owns search, cancellation and focus. */
@Composable
fun KozmosRouteLocationField(
    label: String, location: KozmosListboxOption?, query: String, options: List<KozmosListboxOption>,
    onQueryChange: (String) -> Unit, onSelect: (KozmosListboxOption) -> Unit, onClear: () -> Unit,
    modifier: Modifier = Modifier, onChooseMap: (() -> Unit)? = null,
    status: KozmosRouteLocationStatus = KozmosRouteLocationStatus.Idle, statusText: String? = null,
    placeholder: String = "Search for a place", clearLabel: String = "Clear location",
    openLabel: String = "Open options", closeLabel: String = "Close options",
    mapLabel: String = "Select from the map", emptyText: String = "No locations found", enabled: Boolean = true,
    filterMode: KozmosRouteLocationFilterMode = KozmosRouteLocationFilterMode.Local,
    onEdit: (() -> Unit)? = null, changeLabel: String = "Change",
    onCancelEdit: (() -> Unit)? = null, cancelEditLabel: String = "Cancel",
    currentPosition: KozmosListboxOption? = null, currentPositionLabel: String = "Current position"
) {
    val counts = options.groupingBy { it.value }.eachCount()
    val allowed = status == KozmosRouteLocationStatus.Idle || status == KozmosRouteLocationStatus.Ready
    val suggestions = if (allowed) options.filter { it.value.isNotBlank() && counts[it.value] == 1 } else emptyList()
    val message = statusText ?: when (status) {
        KozmosRouteLocationStatus.Loading -> "Searching locations…"
        KozmosRouteLocationStatus.Error -> "Locations are unavailable"
        KozmosRouteLocationStatus.Empty -> emptyText
        else -> null
    }
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)) {
        if (location != null) {
            Row(Modifier.fillMaxWidth().border(1.dp, KozmosThemeTokens.semanticsBorderSubtle, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)).padding(KozmosDimensions.primitivesLayoutSpacing150),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)) {
                    Text(label, style = MaterialTheme.typography.bodyMedium, color = kozmosMutedForeground())
                    Column {
                        Text(location.label, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = KozmosThemeTokens.primitivesColorsForeground100)
                        if (!location.description.isNullOrEmpty()) Text(location.description, style = MaterialTheme.typography.bodyMedium, color = kozmosMutedForeground())
                    }
                }
                KozmosButton(onEdit ?: onClear,
                    modifier = if (onEdit != null) Modifier.semantics { contentDescription = "$changeLabel $label" } else Modifier,
                    variant = KozmosButtonVariant.Ghost, enabled = enabled) {
                    Text(if (onEdit != null) changeLabel else clearLabel)
                }
            }
        } else {
            KozmosCombobox("", { _, option -> if (enabled && allowed && option != null && !option.disabled) onSelect(option) }, query, onQueryChange, suggestions,
                controlLabels = KozmosComboboxLabels(clearLabel, openLabel, closeLabel),
                filterLocally = filterMode == KozmosRouteLocationFilterMode.Local,
                popupActions = buildList {
                    if (currentPosition != null && currentPosition.value.isNotBlank() && !currentPosition.disabled)
                        add(KozmosPickerAction("current-position", currentPositionLabel) { onSelect(currentPosition) })
                    if (onChooseMap != null) add(KozmosPickerAction("choose-map", mapLabel, onAction = onChooseMap))
                },
                label = label, placeholder = placeholder, enabled = enabled, status = if (status == KozmosRouteLocationStatus.Error) KozmosInputStatus.Error else KozmosInputStatus.Default,
                helperText = message, emptyText = message ?: emptyText, clearable = false)
            if (query.isNotEmpty()) KozmosButton(onClear, modifier = Modifier.fillMaxWidth(), variant = KozmosButtonVariant.Outline, enabled = enabled) { Text(clearLabel) }
            if (onCancelEdit != null) KozmosButton(onCancelEdit, variant = KozmosButtonVariant.Ghost, enabled = enabled) { Text(cancelEditLabel) }
        }
    }
}
