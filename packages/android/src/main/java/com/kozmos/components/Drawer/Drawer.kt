package com.kozmos.components.drawer

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.DrawerState
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosShadows
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

enum class KozmosDrawerSide {
    Left,
    Right,
    Top,
    Bottom
}

/** Where a drawer is drawn (GAP-198), as React's `placement`. */
enum class KozmosDrawerPlacement {
    /** Over the whole box from its edge, over a scrim that closes it: the drawer as it always was. */
    Fixed,

    /**
     * In place, over the box it is given, with no scrim: a panel beside the
     * page, so a header above the box stays usable and the page keeps its
     * touches. A left or right one floats there (decisions 139 and 148).
     */
    Inline
}

/** A floating inline drawer's widest, and its distance from every edge of its region. */
internal val KozmosDrawerInlineMaxWidth = 420.dp
internal val KozmosDrawerInlineEdge = KozmosDimensions.primitivesLayoutSpacing200

data class KozmosDrawerContent(
    val title: String,
    val description: String? = null,
    val bodyText: String? = null,
    val side: KozmosDrawerSide = KozmosDrawerSide.Right,
    val showCloseButton: Boolean = true,
    val placement: KozmosDrawerPlacement = KozmosDrawerPlacement.Fixed
)

@Composable
fun KozmosDrawer(
    open: Boolean,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    side: KozmosDrawerSide = KozmosDrawerSide.Right,
    showCloseButton: Boolean = true,
    /** [KozmosDrawerPlacement.Inline]: a panel in this box, with no scrim (GAP-198). */
    placement: KozmosDrawerPlacement = KozmosDrawerPlacement.Fixed,
    /** The inline panel's name, its pane title: what a screen reader calls it. */
    label: String? = null,
    drawerContent: @Composable ColumnScope.() -> Unit,
    content: @Composable () -> Unit
) {
    Box(modifier = modifier.fillMaxSize()) {
        content()

        if (open && placement == KozmosDrawerPlacement.Inline) {
            InlineDrawer(side, showCloseButton, label, onDismissRequest, drawerContent)
        } else if (open) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(KozmosThemeTokens.semanticsOverlayScrim)
                    .clickable(onClick = onDismissRequest)
            )

            Surface(
                modifier = drawerSurfaceModifier(side),
                shape = drawerShape(side),
                color = KozmosThemeTokens.semanticsSurface0,
                border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle),
                shadowElevation = 20.dp
            ) {
                Column(
                    modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing300),
                    verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing300),
                    content = {
                        drawerContent()
                    }
                )
            }

            if (showCloseButton) {
                IconButton(
                    modifier = closeButtonModifier(side),
                    onClick = onDismissRequest
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close drawer",
                        tint = KozmosThemeTokens.primitivesColorsForeground400
                    )
                }
            }
        }
    }
}

@Composable
fun KozmosDrawer(
    open: Boolean,
    onDismissRequest: () -> Unit,
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    bodyText: String? = null,
    side: KozmosDrawerSide = KozmosDrawerSide.Right,
    showCloseButton: Boolean = true,
    placement: KozmosDrawerPlacement = KozmosDrawerPlacement.Fixed,
    content: @Composable () -> Unit
) {
    KozmosDrawer(
        open = open,
        onDismissRequest = onDismissRequest,
        content = KozmosDrawerContent(
            title = title,
            description = description,
            bodyText = bodyText,
            side = side,
            showCloseButton = showCloseButton,
            placement = placement
        ),
        modifier = modifier,
        screenContent = content
    )
}

@Composable
fun KozmosDrawer(
    open: Boolean,
    onDismissRequest: () -> Unit,
    content: KozmosDrawerContent,
    modifier: Modifier = Modifier,
    screenContent: @Composable () -> Unit = {}
) {
    KozmosDrawer(
        open = open,
        onDismissRequest = onDismissRequest,
        modifier = modifier,
        side = content.side,
        // Inline, the close is the header's own, in its row: the panel's
        // title never runs under it.
        showCloseButton = content.showCloseButton && content.placement == KozmosDrawerPlacement.Fixed,
        placement = content.placement,
        label = content.title,
        drawerContent = {
            DrawerHeader(
                title = content.title,
                description = content.description,
                showCloseButton = content.showCloseButton && content.placement == KozmosDrawerPlacement.Inline,
                onDismissRequest = onDismissRequest
            )

            content.bodyText?.let { bodyText ->
                Text(
                    text = bodyText,
                    color = KozmosThemeTokens.primitivesColorsForeground100
                )
            }
        },
        content = screenContent
    )
}

@Composable
fun DrawerHeader(
    title: String,
    description: String? = null,
    showCloseButton: Boolean = true,
    onDismissRequest: (() -> Unit)? = null
) {
    Row(verticalAlignment = Alignment.Top) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                color = KozmosThemeTokens.primitivesColorsForeground100
            )

            description?.let {
                Spacer(modifier = Modifier.defaultMinSize(minHeight = KozmosDimensions.primitivesLayoutSpacing100))
                Text(
                    text = it,
                    color = KozmosThemeTokens.primitivesColorsForeground400
                )
            }
        }

        if (showCloseButton && onDismissRequest != null) {
            IconButton(
                modifier = Modifier.defaultMinSize(minWidth = 44.dp, minHeight = 44.dp),
                onClick = onDismissRequest
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Close drawer",
                    tint = KozmosThemeTokens.primitivesColorsForeground400
                )
            }
        }
    }
}

@Composable
fun KozmosDrawer(
    drawerContent: @Composable ColumnScope.() -> Unit,
    modifier: Modifier = Modifier,
    drawerState: DrawerState = rememberDrawerState(initialValue = DrawerValue.Closed),
    content: @Composable () -> Unit
) {
    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                modifier = Modifier.padding(end = KozmosDimensions.primitivesLayoutSpacing700)
            ) {
                drawerContent()
            }
        },
        modifier = modifier,
        content = content
    )
}

/**
 * Inline (GAP-198): a panel in its box, not a modal, so there is no scrim and
 * nothing outside it closes it. A left or right one floats (decisions 139 and
 * 148): 16 from every edge of its region, 420 wide or the region less 16 each
 * side, as tall as its content up to the region less 16 above and below, and
 * then it scrolls, with the container's corners and its border all the way
 * round. A top or bottom one stays at its edge, across the region.
 */
@Composable
private fun androidx.compose.foundation.layout.BoxScope.InlineDrawer(
    side: KozmosDrawerSide,
    showCloseButton: Boolean,
    label: String?,
    onDismissRequest: () -> Unit,
    drawerContent: @Composable ColumnScope.() -> Unit
) {
    val floats = side == KozmosDrawerSide.Left || side == KozmosDrawerSide.Right
    val shape = if (floats) RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer) else drawerShape(side)
    Surface(
        modifier = inlineDrawerModifier(side)
            .shadow(KozmosShadows.semanticsElevationOverlay, shape)
            // A panel beside the page, named by its title, its parts read in
            // turn: a pane, as a sheet is, with no modal state.
            .semantics {
                isTraversalGroup = true
                if (label != null) paneTitle = label
            },
        shape = shape,
        color = KozmosThemeTokens.semanticsSurface0,
        border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle)
    ) {
        Box {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .padding(KozmosDimensions.primitivesLayoutSpacing300),
                verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing300),
                content = drawerContent
            )
            if (showCloseButton) {
                IconButton(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(KozmosDimensions.primitivesLayoutSpacing200)
                        .size(44.dp),
                    onClick = onDismissRequest
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close drawer",
                        tint = KozmosThemeTokens.primitivesColorsForeground400
                    )
                }
            }
        }
    }
}

private fun androidx.compose.foundation.layout.BoxScope.inlineDrawerModifier(side: KozmosDrawerSide): Modifier =
    when (side) {
        // Logical, as the fixed drawer's sides are here: Left is the start.
        KozmosDrawerSide.Left, KozmosDrawerSide.Right -> Modifier
            .align(if (side == KozmosDrawerSide.Left) Alignment.TopStart else Alignment.TopEnd)
            .padding(KozmosDrawerInlineEdge)
            // Capped, then filled: a cap after the fill cannot undo it.
            .widthIn(max = KozmosDrawerInlineMaxWidth)
            .fillMaxWidth()
            .wrapContentHeight(Alignment.Top)

        KozmosDrawerSide.Top -> Modifier
            .align(Alignment.TopCenter)
            .fillMaxWidth()
            .heightIn(max = 360.dp)

        KozmosDrawerSide.Bottom -> Modifier
            .align(Alignment.BottomCenter)
            .fillMaxWidth()
            .heightIn(max = 360.dp)
    }

private fun androidx.compose.foundation.layout.BoxScope.drawerSurfaceModifier(side: KozmosDrawerSide): Modifier =
    when (side) {
        KozmosDrawerSide.Left -> Modifier
            .fillMaxHeight()
            .fillMaxWidth(0.88f)
            .widthIn(max = 384.dp)
            .align(Alignment.CenterStart)
            .shadow(KozmosShadows.semanticsElevationOverlay, drawerShape(side))

        KozmosDrawerSide.Right -> Modifier
            .fillMaxHeight()
            .fillMaxWidth(0.88f)
            .widthIn(max = 384.dp)
            .align(Alignment.CenterEnd)
            .shadow(KozmosShadows.semanticsElevationOverlay, drawerShape(side))

        KozmosDrawerSide.Top -> Modifier
            .fillMaxWidth()
            .heightIn(max = 360.dp)
            .align(Alignment.TopCenter)
            .shadow(KozmosShadows.semanticsElevationOverlay, drawerShape(side))

        KozmosDrawerSide.Bottom -> Modifier
            .fillMaxWidth()
            .heightIn(max = 360.dp)
            .align(Alignment.BottomCenter)
            .shadow(KozmosShadows.semanticsElevationOverlay, drawerShape(side))
    }

private fun androidx.compose.foundation.layout.BoxScope.closeButtonModifier(side: KozmosDrawerSide): Modifier =
    when (side) {
        KozmosDrawerSide.Left -> Modifier.align(Alignment.TopStart)
        KozmosDrawerSide.Right -> Modifier.align(Alignment.TopEnd)
        KozmosDrawerSide.Top -> Modifier.align(Alignment.TopEnd)
        KozmosDrawerSide.Bottom -> Modifier.align(Alignment.BottomEnd)
    }
        .padding(KozmosDimensions.primitivesLayoutSpacing200)
        .size(44.dp)

private fun drawerShape(side: KozmosDrawerSide): RoundedCornerShape =
    when (side) {
        KozmosDrawerSide.Left -> RoundedCornerShape(
            topEnd = KozmosDimensions.semanticsRadiusControl,
            bottomEnd = KozmosDimensions.semanticsRadiusControl
        )

        KozmosDrawerSide.Right -> RoundedCornerShape(
            topStart = KozmosDimensions.semanticsRadiusControl,
            bottomStart = KozmosDimensions.semanticsRadiusControl
        )

        KozmosDrawerSide.Top -> RoundedCornerShape(
            bottomStart = KozmosDimensions.semanticsRadiusControl,
            bottomEnd = KozmosDimensions.semanticsRadiusControl
        )

        KozmosDrawerSide.Bottom -> RoundedCornerShape(
            topStart = KozmosDimensions.semanticsRadiusControl,
            topEnd = KozmosDimensions.semanticsRadiusControl
        )
    }
