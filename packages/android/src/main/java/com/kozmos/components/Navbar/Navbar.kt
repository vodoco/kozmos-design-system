package com.kozmos.components.navbar

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.Divider
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.components.sidebar.KozmosRailWidth
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KozmosNavbar(
    title: String,
    modifier: Modifier = Modifier,
    navigationIcon: @Composable () -> Unit = {},
    actions: @Composable RowScope.() -> Unit = {}
) {
    KozmosNavbar(
        modifier = modifier,
        logo = { Text(title, style = MaterialTheme.typography.titleMedium) },
        context = { navigationIcon() },
        actions = actions
    )
}

/**
 * @param logoInset Sets [logo] in a column as wide as KozmosSidebar's rail, from
 * the bar's edge (GAP-208), over a rail at the screen's start: the logo centred
 * over the rail's items, and what follows past the rail. Right to left, the
 * column mirrors.
 */
@Composable
fun KozmosNavbar(
    modifier: Modifier = Modifier,
    logoInset: Boolean = false,
    logo: @Composable RowScope.() -> Unit = {},
    context: @Composable RowScope.() -> Unit = {},
    navigation: @Composable RowScope.() -> Unit = {},
    primaryAction: @Composable RowScope.() -> Unit = {},
    actions: @Composable RowScope.() -> Unit = {},
    utilities: @Composable RowScope.() -> Unit = {},
    account: @Composable RowScope.() -> Unit = {}
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .background(KozmosThemeTokens.primitivesColorsBackground0)
                // The logo's column starts at the bar's edge.
                .padding(
                    start = if (logoInset) 0.dp else KozmosDimensions.primitivesLayoutSpacing200,
                    end = KozmosDimensions.primitivesLayoutSpacing200
                ),
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (logoInset) {
                Row(
                    modifier = Modifier.width(KozmosRailWidth),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                    content = logo
                )
            } else {
                logo()
            }
            context()
            primaryAction()
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
                content = navigation
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
                verticalAlignment = Alignment.CenterVertically
            ) {
                actions()
                utilities()
                account()
            }
        }
        Divider(color = KozmosThemeTokens.primitivesColorsBackground300)
    }
}
