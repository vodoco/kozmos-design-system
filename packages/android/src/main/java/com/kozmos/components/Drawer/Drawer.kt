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

data class KozmosDrawerContent(
    val title: String,
    val description: String? = null,
    val bodyText: String? = null,
    val side: KozmosDrawerSide = KozmosDrawerSide.Right,
    val showCloseButton: Boolean = true
)

@Composable
fun KozmosDrawer(
    open: Boolean,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    side: KozmosDrawerSide = KozmosDrawerSide.Right,
    showCloseButton: Boolean = true,
    drawerContent: @Composable ColumnScope.() -> Unit,
    content: @Composable () -> Unit
) {
    Box(modifier = modifier.fillMaxSize()) {
        content()

        if (open) {
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
            showCloseButton = showCloseButton
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
        showCloseButton = content.showCloseButton,
        drawerContent = {
            DrawerHeader(
                title = content.title,
                description = content.description,
                showCloseButton = false,
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
