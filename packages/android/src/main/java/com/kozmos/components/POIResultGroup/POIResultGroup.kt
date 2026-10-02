package com.kozmos.components.poiresultgroup

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.dp
import com.kozmos.components.poiresultcard.*
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.contracts.KozmosPOIResultAction
import com.kozmos.contracts.KozmosTravelTimeBand
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/** Product-ordered branches with independent selection and expansion. Never renumbers or reorders. */
@Composable
fun KozmosPOIResultGroup(
    items: List<KozmosPOIResultListItem>,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    collapsedCount: Int = 1,
    defaultExpanded: Boolean = false,
    expanded: Boolean? = null,
    onExpandedChange: ((Boolean) -> Unit)? = null,
    showMoreLabel: (Int) -> String = { "Show $it more" },
    hideLabel: String = "Hide",
    selectedPoiId: String? = null,
    numbered: Boolean = false,
    featuredLabel: String = "Featured",
    languageNotListedLabel: String = "Language not listed",
    actionsLabel: String = "Actions for this result",
    currentFloorId: String? = null,
    travelTimeBandLabels: Map<KozmosTravelTimeBand, String> = emptyMap(),
    presentationStyle: KozmosPOIResultPresentationStyle = KozmosPOIResultPresentationStyle.Sdk,
    onAction: ((KozmosPOIResultAction, String) -> Unit)? = null
) {
    var internalExpanded by remember { mutableStateOf(defaultExpanded) }
    val open = expanded ?: internalExpanded
    val count = collapsedCount.coerceIn(0, items.size)
    val hidden = items.size - count
    fun toggle(): Boolean {
        if (expanded == null) internalExpanded = !open
        onExpandedChange?.invoke(!open)
        return true
    }
    val hoverSource = remember { MutableInteractionSource() }
    val hovered by hoverSource.collectIsHoveredAsState()
    Surface(modifier = modifier.fillMaxWidth().semantics { if (label != null) contentDescription = label },
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
        color = KozmosThemeTokens.primitivesColorsBackground0,
        border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle)) {
        Column {
            (if (open) items else items.take(count)).forEachIndexed { index, item ->
                key(item.poi.id) {
                    if (index > 0) Divider(color = KozmosThemeTokens.semanticsBorderSubtle)
                    KozmosPOIResultCard(poi = item.poi, result = item.result.selecting(selectedPoiId),
                        onSelect = onSelect, onAction = onAction, numbered = numbered,
                        presentationStyle = presentationStyle, appearance = KozmosPOIResultAppearance.Row,
                        featuredLabel = featuredLabel, languageNotListedLabel = languageNotListedLabel,
                        actionsLabel = actionsLabel, currentFloorId = currentFloorId,
                        travelTimeBandLabels = travelTimeBandLabels)
                }
            }
            if (hidden > 0) {
                Divider(color = KozmosThemeTokens.semanticsBorderSubtle)
                Surface(onClick = { toggle() },
                    modifier = Modifier.fillMaxWidth().hoverable(hoverSource).semantics {
                        if (open) collapse { toggle() } else expand { toggle() }
                    },
                    shape = RoundedCornerShape(0.dp),
                    color = if (hovered) KozmosThemeTokens.semanticsResultHoverSurface else KozmosThemeTokens.semanticsResultSelectedSurface) {
                    Row(Modifier.defaultMinSize(minHeight = 48.dp).padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
                        verticalAlignment = Alignment.CenterVertically) {
                        Text(if (open) hideLabel else showMoreLabel(hidden), color = KozmosThemeTokens.primitivesColorsForeground400,
                            style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f, fill = false))
                        Icon(Icons.Default.ExpandMore, contentDescription = null, modifier = Modifier.size(16.dp).rotate(if (open) 180f else 0f),
                            tint = KozmosThemeTokens.primitivesColorsForeground400)
                    }
                }
            }
        }
    }
}
