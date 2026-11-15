// SettingsRow.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.list.KozmosList
import com.kozmos.components.settingsrow.KozmosSettingsRow
import com.kozmos.components.settingsrow.KozmosSettingsRowState
import com.kozmos.components.switch.KozmosSwitch

// The switch takes the modifier the row hands it, which names it by the
// row's label and reads the description and the state with it. Changed, the
// setting is overridden; Reset to default gives it back to the system's.
@Composable
fun BannerSetting() {
    var on by remember { mutableStateOf(false) }
    var state by remember { mutableStateOf(KozmosSettingsRowState.Inherited) }
    KozmosList {
        KozmosSettingsRow(
            label = "Show the banner",
            description = "A message above the map.",
            state = state,
            onReset = {
                on = false
                state = KozmosSettingsRowState.Inherited
            },
            showDivider = false
        ) { modifier, enabled ->
            KozmosSwitch(
                checked = on,
                onCheckedChange = {
                    on = it
                    state = KozmosSettingsRowState.Overridden
                },
                modifier = modifier,
                enabled = enabled
            )
        }
    }
}
