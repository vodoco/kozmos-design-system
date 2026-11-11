package com.kozmos.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.kozmos.components.adaptivemapshell.KozmosAdaptiveMapShell
import com.kozmos.components.adaptivemapshell.KozmosDefaultPanelDetents
import com.kozmos.components.adaptivemapshell.KozmosMapPanelPlacement
import com.kozmos.components.drawer.KozmosDrawer
import com.kozmos.components.drawer.KozmosDrawerContent
import com.kozmos.components.drawer.KozmosDrawerPlacement
import com.kozmos.components.drawer.KozmosDrawerSide
import com.kozmos.components.input.KozmosInput
import com.kozmos.components.input.KozmosInputAction
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.tree.KozmosTree
import com.kozmos.components.tree.KozmosTreeDensity
import com.kozmos.components.tree.TreeItem
import com.kozmos.components.tree.TreeNode
import com.kozmos.contracts.KozmosMapCollisionInsets
import com.kozmos.contracts.KozmosMapReadiness
import org.junit.Test

/**
 * Every call Drawer, Tree, Input and AdaptiveMapShell took before decision
 * 134's native parameters (GAP-198, 201, 154, 123), by position, by name and
 * with a trailing lambda, beside the new ones. Nothing here runs: the target
 * fails to compile when a new parameter breaks an old call, as it did when
 * `placement` sat before the Drawer's lambdas and the shell's slots before
 * its detent callback.
 */
@Suppress("unused")
class KozmosNativePropsCallFormsTest {
    @Test fun theFormsCompile() = Unit

    @Composable
    private fun DrawerForms() {
        KozmosDrawer(true, {}, Modifier, KozmosDrawerSide.Right, true, { Text("Drawer") }) { Text("Page") }
        KozmosDrawer(true, {}, Modifier, KozmosDrawerSide.Right, true, { Text("Drawer") }, { Text("Page") })
        KozmosDrawer(true, {}, drawerContent = { Text("Drawer") }) { Text("Page") }
        KozmosDrawer(true, {}, "Title", Modifier, null, null, KozmosDrawerSide.Left, true) { Text("Page") }
        KozmosDrawer(true, {}, "Title", Modifier, null, null, KozmosDrawerSide.Left, true, { Text("Page") })
        KozmosDrawer(true, {}, "Title") { Text("Page") }
        KozmosDrawer(true, {}, KozmosDrawerContent("Title"), Modifier) { Text("Page") }
        KozmosDrawer(true, {}, KozmosDrawerContent("Title", null, null, KozmosDrawerSide.Right, true))
        // The new ones.
        KozmosDrawer(true, {}, placement = KozmosDrawerPlacement.Inline, label = "Panel", drawerContent = { Text("D") }) { Text("Page") }
        KozmosDrawer(true, {}, "Title", placement = KozmosDrawerPlacement.Inline) { Text("Page") }
        KozmosDrawer(true, {}, KozmosDrawerContent("Title", placement = KozmosDrawerPlacement.Inline))
    }

    @Composable
    private fun TreeForms() {
        val data = listOf(TreeNode("a", "A"))
        KozmosTree(data, Modifier, KozmosTreeDensity.Compact)
        KozmosTree(data)
        TreeItem(data[0], 0, KozmosTreeDensity.Default)
        TreeItem(data[0], 0)
        // The new ones.
        KozmosTree(data, Modifier, KozmosTreeDensity.Default, true, androidx.compose.ui.unit.Dp(16f))
        TreeItem(data[0], 0, divided = true)
    }

    @Composable
    private fun InputForms() {
        KozmosInput("v", {}, "Placeholder", Modifier, true, false, "Label", KozmosInputStatus.Default, false, null, null)
        KozmosInput(value = "v", onValueChange = {})
        // The new ones.
        KozmosInput("v", {}, "P", Modifier, true, true, "L", KozmosInputStatus.Default, false, null, null, KozmosInputAction.Copy())
        KozmosInput(value = "v", onValueChange = {}, action = KozmosInputAction.Toggle("Featured", Icons.Default.Star, false) {})
    }

    @Composable
    private fun ShellForms() {
        KozmosAdaptiveMapShell(
            {}, Modifier, "Map", KozmosMapReadiness.Ready, null, null, null, null, null, "Details",
            KozmosMapPanelPlacement.End, KozmosMapCollisionInsets.Zero, null, KozmosSurfaceStyle.Solid,
            KozmosDefaultPanelDetents, null, null, null, false, null, "Map controls", "Map corner controls", { _ -> }
        )
        KozmosAdaptiveMapShell(
            {}, Modifier, "Map", KozmosMapReadiness.Ready, null, null, null, null, null, "Details",
            KozmosMapPanelPlacement.End, KozmosMapCollisionInsets.Zero, null, KozmosSurfaceStyle.Solid,
            KozmosDefaultPanelDetents, null, null, null, false, null, "Map controls", "Map corner controls"
        ) { _ -> }
        KozmosAdaptiveMapShell(map = {}, controlsLabel = "Map controls") { _ -> }
        // The new ones.
        KozmosAdaptiveMapShell(
            map = {},
            status = { Text("Route updated") },
            controlsTopStart = { Text("Exit") },
            controlsTopEnd = { Text("Info") },
            topControlsLabel = "Top",
            controlsPadCamera = true
        ) { _ -> }
    }
}
