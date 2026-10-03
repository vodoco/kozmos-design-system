package com.kozmos.components.wayfindingcard

import com.kozmos.tokens.KozmosShadows
import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.SwapVert
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosWayfindingCard(
    modifier: Modifier = Modifier,
    title: String = "Navigation",
    onClose: (() -> Unit)? = null,
    content: @Composable () -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = KozmosShadows.semanticsElevationFloating),
        colors = CardDefaults.cardColors(containerColor = KozmosThemeTokens.primitivesColorsBackground0)
    ) {
        Column(modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing200)) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.weight(1f)
                )
                if (onClose != null) {
                    IconButton(onClick = onClose) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }
            }
            Spacer(modifier = Modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing100))
            content()
        }
    }
}

/**
 * An origin and a destination, as React's `WayfindingInputRow` lays them
 * out: a rail — a ring where the route starts, a line, a pin where it ends —
 * beside two borderless raised fields, with the swap button floating over
 * them at the end. Until 2026-09-22 Compose drew two outlined Material fields
 * with the swap between them in a row of its own, no rail, and "Swap" as the
 * button's only name.
 */
@Composable
fun KozmosWayfindingInputRow(
    originValue: String,
    onOriginChange: (String) -> Unit,
    destinationValue: String,
    onDestinationChange: (String) -> Unit,
    onSwap: () -> Unit,
    originPlaceholder: String = "Choose starting point...",
    destinationPlaceholder: String = "Choose destination...",
    modifier: Modifier = Modifier,
    originLabel: String = "Origin",
    destinationLabel: String = "Destination",
    swapLabel: String = "Swap origin and destination"
) {
    val trackEvent = LocalKozmosAnalytics.current
    val accent = KozmosThemeTokens.primitivesColorsTheme600
    Row(
        modifier = modifier.fillMaxWidth().height(IntrinsicSize.Min),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxHeight().padding(vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(Modifier.size(10.dp).border(2.dp, accent, CircleShape))
            Box(
                Modifier
                    .width(2.dp)
                    .weight(1f)
                    .background(KozmosThemeTokens.semanticsBorderSubtle, CircleShape)
            )
            Icon(
                imageVector = Icons.Default.Place,
                contentDescription = null,
                tint = accent,
                modifier = Modifier.size(16.dp)
            )
        }
        Box(modifier = Modifier.weight(1f)) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                WayfindingField(originValue, onOriginChange, originPlaceholder, originLabel)
                WayfindingField(destinationValue, onDestinationChange, destinationPlaceholder, destinationLabel)
            }
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 12.dp)
                    .size(48.dp)
                    .shadow(KozmosShadows.semanticsElevationRaised, CircleShape)
                    .background(KozmosThemeTokens.primitivesColorsBackground200, CircleShape)
                    .clickable(role = Role.Button, onClickLabel = swapLabel) {
                        trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(
                            component = "WayfindingInputRow",
                            eventName = "wayfinding_route_swapped"
                        ))
                        onSwap()
                    }
                    .semantics { contentDescription = swapLabel }
            ) {
                Icon(
                    imageVector = Icons.Default.SwapVert,
                    contentDescription = null,
                    tint = KozmosThemeTokens.primitivesColorsForeground0,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

/**
 * One of the row's fields: 40 high, the control radius, 12 in from the start
 * and 68 from the end so the text clears the swap button, the raised shadow
 * and no border. Focus draws React's 1 dp ring in the accent, 2 dp out.
 *
 * The fill is background/50, opaque. React washes the field in muted at half,
 * and the row sits on the card's background/0, where that wash is exactly
 * background/50 in both themes (#F1F2F4, #0C0D0E). Opaque, because a platform
 * shadow is drawn under its view and shows through a translucent fill; CSS
 * draws a box shadow outside the box only.
 */
@Composable
private fun WayfindingField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    label: String
) {
    val radius = KozmosDimensions.semanticsRadiusControl
    val shape = RoundedCornerShape(radius)
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val ring = KozmosThemeTokens.primitivesColorsTheme600
    val textStyle = MaterialTheme.typography.bodyMedium
    val placeholderColor = KozmosThemeTokens.primitivesColorsForeground400
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        singleLine = true,
        textStyle = textStyle.copy(color = KozmosThemeTokens.primitivesColorsForeground0),
        cursorBrush = SolidColor(ring),
        interactionSource = interaction,
        modifier = Modifier
            .fillMaxWidth()
            .height(40.dp)
            .drawWithContent {
                drawContent()
                if (focused) {
                    val out = 2.5.dp.toPx()
                    drawRoundRect(
                        color = ring,
                        topLeft = Offset(-out, -out),
                        size = Size(size.width + 2 * out, size.height + 2 * out),
                        cornerRadius = CornerRadius(radius.toPx() + out),
                        style = Stroke(width = 1.dp.toPx())
                    )
                }
            }
            .shadow(KozmosShadows.semanticsElevationRaised, shape)
            .background(KozmosThemeTokens.primitivesColorsBackground50, shape)
            .semantics { contentDescription = label },
        decorationBox = { inner ->
            Box(
                contentAlignment = Alignment.CenterStart,
                modifier = Modifier.fillMaxSize().padding(start = 12.dp, end = 68.dp)
            ) {
                if (value.isEmpty()) {
                    Text(placeholder, style = textStyle, color = placeholderColor, maxLines = 1)
                }
                inner()
            }
        }
    )
}
