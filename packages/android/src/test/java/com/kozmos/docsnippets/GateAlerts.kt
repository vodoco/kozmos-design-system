// Switch.mdx's Compose snippet ("A description and a state label"), word for
// word below the package line: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project, and read
// by ControlDescriptionDocSnippetsTest. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.switch.KozmosSwitch

// The state words are drawn beside the track and not read: TalkBack already
// says on or off. The description is read after the label.
@Composable
fun GateAlerts(isOn: Boolean, onChange: (Boolean) -> Unit) {
    KozmosSwitch(
        checked = isOn,
        onCheckedChange = onChange,
        label = "Gate alerts",
        description = "Sends a push when your gate changes",
        showStateLabel = true
    )
}
