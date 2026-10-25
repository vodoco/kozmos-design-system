package com.kozmos.components.alert

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens

enum class AlertStatus {
    Default, Info, Success, Warning, Error
}

@Composable
fun KozmosAlert(
    modifier: Modifier = Modifier,
    status: AlertStatus = AlertStatus.Default,
    content: @Composable androidx.compose.foundation.layout.RowScope.() -> Unit
) {
    val borderColor = alertBorderColor(status)

    // The icon, title and description inside take the alert's status, as
    // React's inherit its colour and Figma binds them to it.
    CompositionLocalProvider(LocalKozmosAlertStatus provides status) {
        Row(
            modifier = modifier
                .fillMaxWidth()
                .background(KozmosThemeTokens.semanticsSurface0, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
                .border(1.dp, borderColor, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
                .padding(KozmosDimensions.primitivesLayoutSpacing200),
            verticalAlignment = Alignment.Top
        ) {
            content()
        }
    }
}

/** The status of the alert a part is in: [AlertStatus.Default] outside one. */
internal val LocalKozmosAlertStatus = staticCompositionLocalOf { AlertStatus.Default }

/**
 * [status] null, the default, draws the glyph and colour of the alert the
 * icon is in. It drew the default's info glyph in foreground/0 unless given
 * the alert's status again, until 2026-10-20.
 */
@Composable
fun KozmosAlertIcon(
    status: AlertStatus? = null,
    modifier: Modifier = Modifier,
    customIcon: ImageVector? = null
) {
    val status = status ?: LocalKozmosAlertStatus.current
    val icon = when (status) {
        AlertStatus.Default -> Icons.Default.Info
        AlertStatus.Info -> Icons.Default.Info
        AlertStatus.Success -> Icons.Default.CheckCircle
        AlertStatus.Warning -> Icons.Default.Warning
        AlertStatus.Error -> Icons.Default.Warning
    }
    Icon(
        imageVector = customIcon ?: icon,
        contentDescription = null,
        tint = alertForegroundColor(status),
        modifier = modifier.padding(end = KozmosDimensions.primitivesLayoutSpacing150)
    )
}

@Composable
fun KozmosAlertContent(
    modifier: Modifier = Modifier,
    content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit
) {
    Column(modifier = modifier) {
        content()
    }
}

/**
 * [color] unspecified, the default, is the colour of the alert the title is
 * in, as Figma draws it: foreground/0 in a default alert. It was
 * foreground/100 in every alert until 2026-10-20.
 */
@Composable
fun KozmosAlertTitle(
    title: String,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified
) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = color.takeOrElse { alertForegroundColor(LocalKozmosAlertStatus.current) },
        modifier = modifier
    )
}

/**
 * [color] unspecified, the default, is the colour of the alert the
 * description is in, as Figma draws it and React's inherits it:
 * foreground/0 in a default alert. It was foreground/500 in every alert
 * until 2026-10-20.
 */
@Composable
fun KozmosAlertDescription(
    description: String,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified
) {
    Text(
        text = description,
        style = MaterialTheme.typography.bodyMedium,
        color = color.takeOrElse { alertForegroundColor(LocalKozmosAlertStatus.current) },
        modifier = modifier
    )
}

@Composable
@ReadOnlyComposable
internal fun alertForegroundColor(status: AlertStatus): Color = when (status) {
    AlertStatus.Default -> KozmosThemeTokens.primitivesColorsForeground0
    AlertStatus.Info -> KozmosThemeTokens.primitivesColorsTheme600
    AlertStatus.Success -> KozmosThemeTokens.primitivesColorsEmotionalSuccess900
    AlertStatus.Warning -> KozmosThemeTokens.primitivesColorsEmotionalAlert900
    AlertStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
}

@Composable
@ReadOnlyComposable
private fun alertBorderColor(status: AlertStatus): Color = when (status) {
    AlertStatus.Default -> KozmosThemeTokens.primitivesColorsForeground500
    else -> alertForegroundColor(status)
}
