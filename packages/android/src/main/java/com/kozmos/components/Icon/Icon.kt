package com.kozmos.components.icon

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.BluetoothDisabled
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.FileUpload
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonAddAlt
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Route
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.utils.KozmosNavigationGlyphs

enum class KozmosIconSize(val dp: Dp) {
    Xs(12.dp),
    Sm(16.dp),
    Md(20.dp),
    Lg(24.dp),
    Xl(32.dp)
}

enum class KozmosIconColor {
    Default,
    Muted,
    Primary,
    Destructive
}

@Composable
fun KozmosIcon(
    name: String = "home-line",
    modifier: Modifier = Modifier,
    size: KozmosIconSize = KozmosIconSize.Md,
    color: KozmosIconColor = KozmosIconColor.Default,
    contentDescription: String? = null
) {
    Icon(
        imageVector = resolveIconVector(name),
        contentDescription = contentDescription,
        tint = resolveIconTint(color),
        modifier = modifier.size(size.dp)
    )
}

private fun resolveIconName(name: String): String = when (name) {
    "add" -> "plus"
    "back" -> "arrow-left"
    "close", "x" -> "x-close"
    "delete" -> "trash-01"
    "edit" -> "edit-01"
    "home" -> "home-line"
    "location", "map-pin" -> "marker-pin-01"
    "menu" -> "menu-01"
    "next" -> "arrow-right"
    "notifications" -> "bell-01"
    "search" -> "search-md"
    "settings" -> "settings-01"
    "user" -> "user-01"
    "users" -> "users-01"
    "warning" -> "alert-triangle"
    else -> name
}

internal fun resolveIconVector(rawName: String): ImageVector {
    return when (resolveIconName(rawName)) {
        "activity" -> Icons.AutoMirrored.Filled.ShowChart
        "alert-circle" -> Icons.Default.Info
        "alert-triangle" -> Icons.Default.Warning
        "arrow-left" -> Icons.AutoMirrored.Filled.ArrowBack
        "arrow-right" -> Icons.AutoMirrored.Filled.ArrowForward
        "bell-01" -> Icons.Default.Notifications
        "bluetooth-off" -> Icons.Default.BluetoothDisabled
        "building-01" -> Icons.Default.Business
        "bus" -> Icons.Default.DirectionsBus
        "calendar" -> Icons.Default.CalendarToday
        "check" -> Icons.Default.Check
        "chevron-down" -> Icons.Default.KeyboardArrowDown
        "chevron-left" -> Icons.AutoMirrored.Filled.KeyboardArrowLeft
        "chevron-right" -> Icons.AutoMirrored.Filled.KeyboardArrowRight
        "chevron-up" -> Icons.Default.KeyboardArrowUp
        "clock" -> Icons.Default.AccessTime
        "compass-01" -> Icons.Default.Explore
        "download-01" -> Icons.Default.Download
        "edit-01" -> Icons.Default.Edit
        "home-line" -> Icons.Default.Home
        "info-circle" -> Icons.Default.Info
        "lock-01" -> Icons.Default.Lock
        "map-01" -> Icons.Default.Map
        "marker-pin-01" -> Icons.Default.Place
        "menu-01" -> Icons.Default.Menu
        "minus" -> Icons.Default.Remove
        "navigation-pointer-01" -> KozmosNavigationGlyphs.NavigationPointer01
        "plus" -> Icons.Default.Add
        "qr-code-01" -> Icons.Default.QrCode2
        "route" -> Icons.Default.Route
        "scan" -> Icons.Default.Search
        "search-md" -> Icons.Default.Search
        "settings-01" -> Icons.Default.Settings
        "trash-01" -> Icons.Default.Delete
        "upload-01" -> Icons.Default.Upload
        "user-01" -> Icons.Default.Person
        "users-01" -> Icons.Default.PersonAddAlt
        "wifi" -> Icons.Default.Wifi
        "x-close" -> Icons.Default.Close
        else -> Icons.Default.Info
    }
}

@Composable
private fun resolveIconTint(color: KozmosIconColor): Color = when (color) {
    KozmosIconColor.Default -> LocalContentColor.current
    KozmosIconColor.Muted -> KozmosThemeTokens.primitivesColorsForeground500
    KozmosIconColor.Primary -> KozmosThemeTokens.primitivesColorsTheme500
    KozmosIconColor.Destructive -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
}
