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

/**
 * Where [KozmosNavbar]'s navigation sits in the room between the leading slots
 * (logo, context, primary action) and the trailing ones (actions, utilities,
 * account), as React's `navigationAlign` (GAP-196).
 */
enum class KozmosNavbarNavigationAlign {
    /** Right after the leading slots. */
    Start,
    /** Centred in the room, as the bar has always drawn it: the default. */
    Center,
    /** Beside the trailing slots, as Pointr Cloud draws its main sections. */
    End
}

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
    KozmosNavbarLayout(
        modifier, logoInset, KozmosNavbarNavigationAlign.Center,
        logo, context, navigation, primaryAction, actions, utilities, account
    )
}

/**
 * The bar with its navigation placed (GAP-196). An overload of its own, with
 * [navigationAlign] required, so every call the bar took before, by position
 * or with a trailing lambda, still resolves to the one above.
 *
 * @param navigationAlign Where [navigation] sits in the room between the leading
 * slots and the trailing ones: [KozmosNavbarNavigationAlign.Center] centres it,
 * as the bar always has; Start sets it right after the logo, context and
 * primary action; End beside the actions, utilities and account. Start and end
 * follow the layout direction, so End is the left right to left. TalkBack's
 * order is unchanged: only where the items are drawn moves.
 */
@Composable
fun KozmosNavbar(
    modifier: Modifier = Modifier,
    logoInset: Boolean = false,
    navigationAlign: KozmosNavbarNavigationAlign,
    logo: @Composable RowScope.() -> Unit = {},
    context: @Composable RowScope.() -> Unit = {},
    navigation: @Composable RowScope.() -> Unit = {},
    primaryAction: @Composable RowScope.() -> Unit = {},
    actions: @Composable RowScope.() -> Unit = {},
    utilities: @Composable RowScope.() -> Unit = {},
    account: @Composable RowScope.() -> Unit = {}
) {
    KozmosNavbarLayout(
        modifier, logoInset, navigationAlign,
        logo, context, navigation, primaryAction, actions, utilities, account
    )
}

@Composable
private fun KozmosNavbarLayout(
    modifier: Modifier,
    logoInset: Boolean,
    navigationAlign: KozmosNavbarNavigationAlign,
    logo: @Composable RowScope.() -> Unit,
    context: @Composable RowScope.() -> Unit,
    navigation: @Composable RowScope.() -> Unit,
    primaryAction: @Composable RowScope.() -> Unit,
    actions: @Composable RowScope.() -> Unit,
    utilities: @Composable RowScope.() -> Unit,
    account: @Composable RowScope.() -> Unit
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
                // The room the navigation fills, from its start, its middle or
                // to its end: Compose mirrors Start and End right to left.
                horizontalArrangement = when (navigationAlign) {
                    KozmosNavbarNavigationAlign.Start -> Arrangement.Start
                    KozmosNavbarNavigationAlign.Center -> Arrangement.Center
                    KozmosNavbarNavigationAlign.End -> Arrangement.End
                },
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
