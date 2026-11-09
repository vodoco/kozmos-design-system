package com.kozmos.components.menu

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Divider
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.icon.KozmosPointrIcons
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

enum class KozmosMenuContentType {
    Basic,
    Checkbox,
    Radio,
    Submenu
}

/**
 * @param external The item leaves the app (decision 152, as `KozmosLink`'s
 *   `external`): Pointr's new-tab icon, `link-external-01`, at the row's end,
 *   mirrored right to left, and [externalLabel] as the click's label. Where it
 *   goes is still `onItemClick`'s.
 * @param externalLabel The click's label when [external], which TalkBack reads
 *   as "Double-tap to open in your browser": "open in your browser" by
 *   default. Pass the product's own words; empty, TalkBack says its own.
 */
data class KozmosMenuItem(
    val text: String,
    val shortcut: String? = null,
    val checked: Boolean = false,
    val selected: Boolean = false,
    val submenuItems: List<String> = emptyList(),
    val external: Boolean = false,
    val externalLabel: String = "open in your browser"
)

data class KozmosMenuContent(
    val label: String? = null,
    val items: List<KozmosMenuItem>,
    val contentType: KozmosMenuContentType = KozmosMenuContentType.Basic
)

@Composable
fun KozmosMenu(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    items: List<String>,
    onItemClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    KozmosMenu(
        expanded = expanded,
        onDismissRequest = onDismissRequest,
        content = KozmosMenuContent(
            items = items.map { KozmosMenuItem(text = it) }
        ),
        modifier = modifier,
        onItemClick = { item -> onItemClick(item.text) }
    )
}

@Composable
fun KozmosMenu(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    content: KozmosMenuContent,
    modifier: Modifier = Modifier,
    onItemClick: (KozmosMenuItem) -> Unit = {}
) {
    DropdownMenu(
        expanded = expanded,
        onDismissRequest = onDismissRequest,
        modifier = modifier
    ) {
        KozmosMenuItems(content = content, onItemClick = onItemClick, onDismissRequest = onDismissRequest)
    }
}

/**
 * A menu's label and items, as [KozmosMenu] and `KozmosContextMenuArea` both
 * draw them inside a DropdownMenu. Picking an item calls [onItemClick], then
 * [onDismissRequest].
 */
@Composable
internal fun ColumnScope.KozmosMenuItems(
    content: KozmosMenuContent,
    onItemClick: (KozmosMenuItem) -> Unit,
    onDismissRequest: () -> Unit
) {
    content.label?.let { label ->
        DropdownMenuItem(
            text = {
                Text(
                    text = label,
                    color = KozmosThemeTokens.primitivesColorsForeground500
                )
            },
            onClick = {}
        )
        Divider(color = KozmosThemeTokens.semanticsBorderSubtle)
    }

    content.items.forEach { item ->
        val pick = {
            onItemClick(item)
            onDismissRequest()
        }
        DropdownMenuItem(
            text = { Text(item.text) },
            onClick = pick,
            // An external item labels its click, as KozmosLink's does.
            modifier = if (item.external && item.externalLabel.isNotEmpty()) {
                Modifier.semantics {
                    onClick(label = item.externalLabel) {
                        pick()
                        true
                    }
                }
            } else {
                Modifier
            },
            leadingIcon = {
                when (content.contentType) {
                    KozmosMenuContentType.Checkbox ->
                        if (item.checked) {
                            Icon(Icons.Default.Check, contentDescription = null)
                        } else {
                            Spacer(modifier = Modifier.width(24.dp))
                        }
                    KozmosMenuContentType.Radio ->
                        if (item.selected) {
                            Icon(Icons.Default.Check, contentDescription = null)
                        } else {
                            Spacer(modifier = Modifier.width(24.dp))
                        }
                    else -> Unit
                }
            },
            trailingIcon = {
                when {
                    content.contentType == KozmosMenuContentType.Submenu && item.submenuItems.isNotEmpty() ->
                        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null)
                    item.external ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
                        ) {
                            item.shortcut?.let {
                                Text(text = it, color = KozmosThemeTokens.primitivesColorsForeground500)
                            }
                            KozmosMenuNewTabIcon()
                        }
                    item.shortcut != null ->
                        Text(
                            text = item.shortcut,
                            color = KozmosThemeTokens.primitivesColorsForeground500
                        )
                }
            }
        )
    }
}

/**
 * Pointr's new-tab icon, `link-external-01`, at a menu item's end in the
 * item's icon colour, pointing to the row's end: mirrored right to left, as
 * KozmosLink's is.
 */
@Composable
private fun KozmosMenuNewTabIcon() {
    val mirrored = LocalLayoutDirection.current == LayoutDirection.Rtl
    Icon(
        imageVector = KozmosPointrIcons.LinkExternal01,
        contentDescription = null,
        modifier = Modifier.scale(scaleX = if (mirrored) -1f else 1f, scaleY = 1f)
    )
}
