// Switch.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.switch.KozmosSwitch

// The switch draws its label beside it, and the whole row toggles.
@Composable
fun AirplaneMode(isOn: Boolean, onChange: (Boolean) -> Unit) {
    KozmosSwitch(checked = isOn, onCheckedChange = onChange, label = "Airplane Mode")
}
