package com.kozmos.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.kozmos.components.card.KozmosCardHeader
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.iconbutton.KozmosIconButtonSize
import com.kozmos.components.iconbutton.KozmosIconButtonVariant
import com.kozmos.components.navbar.KozmosNavbar
import com.kozmos.components.navbar.KozmosNavbarNavigationAlign
import com.kozmos.components.sidebar.KozmosSidebar
import com.kozmos.components.sidebar.KozmosSidebarInset
import com.kozmos.components.sidebar.KozmosSidebarVariant
import org.junit.Test

/**
 * Every call these parts took before decision 134's parameters, by position,
 * by name and with a trailing lambda, beside the new ones. Nothing here runs:
 * the target fails to compile when a new parameter breaks an old call, as it
 * did when `inset` and `navigationAlign` sat before the slot lambdas.
 */
@Suppress("unused")
class KozmosCallFormsTest {
    @Composable
    private fun SidebarForms() {
        KozmosSidebar(Modifier, { Text("Navigation") })
        KozmosSidebar(Modifier) { Text("Navigation") }
        KozmosSidebar { Text("Navigation") }
        KozmosSidebar(Modifier, KozmosSidebarVariant.Rail, { Text("Header") }, { Text("Navigation") })
        KozmosSidebar(Modifier, KozmosSidebarVariant.Rail, { Text("H") }, { Text("N") }, { Text("T") }, { Text("F") })
        KozmosSidebar(Modifier, KozmosSidebarVariant.Rail, { Text("H") }, { Text("N") }, { Text("T") }) { Text("F") }
        KozmosSidebar(navigation = { Text("N") }) { Text("Footer") }
        // The new ones.
        KozmosSidebar(inset = KozmosSidebarInset.Flush) { Text("Navigation") }
        KozmosSidebar(Modifier, KozmosSidebarInset.Flush) { Text("Navigation") }
        KozmosSidebar(variant = KozmosSidebarVariant.Rail, inset = KozmosSidebarInset.Flush, navigation = { Text("N") })
        KozmosSidebar(Modifier, KozmosSidebarVariant.Rail, KozmosSidebarInset.Flush, { Text("H") }, { Text("N") }) { Text("F") }
    }

    @Composable
    private fun NavbarForms() {
        KozmosNavbar("Title")
        KozmosNavbar(Modifier, false, { Text("Logo") })
        KozmosNavbar(Modifier, false, { Text("L") }, { Text("C") }, { Text("N") }, { Text("P") }, { Text("A") }, { Text("U") }, { Text("Acc") })
        KozmosNavbar(Modifier, false, { Text("L") }, { Text("C") }, { Text("N") }, { Text("P") }, { Text("A") }, { Text("U") }) { Text("Acc") }
        KozmosNavbar(logo = { Text("Logo") }) { Text("Account") }
        // The new ones.
        KozmosNavbar(navigationAlign = KozmosNavbarNavigationAlign.End, logo = { Text("Logo") }) { Text("Account") }
        KozmosNavbar(Modifier, true, KozmosNavbarNavigationAlign.Start, { Text("Logo") })
    }

    @Composable
    private fun IconButtonForms() {
        KozmosIconButton(Icons.Default.Info, {}, "Help", Modifier, KozmosIconButtonVariant.Ghost, KozmosIconButtonSize.Default, true, false, null)
        KozmosIconButton(Icons.Default.Info, {}, "Help")
        // The new one.
        KozmosIconButton(Icons.Default.Info, {}, "Help", counter = 3, counterLabel = { "$it left" }, counterSeparator = "、")
    }

    @Composable
    private fun CardHeaderForms() {
        KozmosCardHeader(Modifier) { Text("Title") }
        KozmosCardHeader { Text("Title") }
        // The new one.
        KozmosCardHeader(actions = { Text("Edit") }) { Text("Title") }
    }

    @Test
    fun theFormsCompile() = Unit
}
